import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

function interpolate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      // =============================================================
      // Core venture CRUD
      // =============================================================
      case 'list': {
        const { data, error } = await supabase.from('ventures').select('*').order('tier', { ascending: true }).order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ ventures: data });
      }
      case 'get': {
        const { data, error } = await supabase.from('ventures').select('*').eq('id', req.body.id).single();
        if (error) throw error;
        return res.json({ venture: data });
      }
      case 'create': {
        const v = req.body.venture;
        const id = v.id || v.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        const { data, error } = await supabase.from('ventures').insert({ ...v, id }).select().single();
        if (error) throw error;
        return res.json({ venture: data });
      }
      case 'update': {
        const { id, ...updates } = req.body.venture;
        const { data, error } = await supabase.from('ventures')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return res.json({ venture: data });
      }
      case 'delete': {
        await supabase.from('ventures').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }

      // =============================================================
      // Assets — Tier 1/2/3 related assets graph
      // =============================================================
      case 'list-assets': {
        const venture_id = (req.body?.venture_id || req.query.venture_id) as string;
        if (!venture_id) return res.status(400).json({ error: 'venture_id required' });
        const { data, error } = await supabase.from('venture_assets')
          .select('*').eq('venture_id', venture_id)
          .order('tier', { ascending: true })
          .order('confirmed', { ascending: false });
        if (error) throw error;
        return res.json({ assets: data || [] });
      }
      case 'create-asset': {
        const asset = req.body.asset;
        if (!asset?.venture_id || !asset?.kind || !asset?.name) {
          return res.status(400).json({ error: 'asset.venture_id, kind, name required' });
        }
        const { data, error } = await supabase.from('venture_assets')
          .insert({ ...asset, created_by: userId }).select().single();
        if (error) throw error;
        return res.json({ asset: data });
      }
      case 'confirm-asset': {
        const { id, confirmed } = req.body;
        const { data, error } = await supabase.from('venture_assets')
          .update({ confirmed: confirmed !== false }).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ asset: data });
      }
      case 'remove-asset': {
        await supabase.from('venture_assets').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }

      // =============================================================
      // Domains — stored in ventures.custom_domains jsonb
      // =============================================================
      case 'list-domains': {
        const venture_id = (req.body?.venture_id || req.query.venture_id) as string;
        const { data, error } = await supabase.from('ventures')
          .select('custom_domains').eq('id', venture_id).single();
        if (error) throw error;
        return res.json({ domains: data?.custom_domains || [] });
      }
      case 'add-domain': {
        const { venture_id, domain } = req.body;
        if (!venture_id || !domain?.host) return res.status(400).json({ error: 'venture_id + domain.host required' });
        const { data: current, error: selErr } = await supabase.from('ventures')
          .select('custom_domains').eq('id', venture_id).single();
        if (selErr) throw selErr;
        const existing = (current?.custom_domains as Array<{host: string}> | null) || [];
        if (existing.some(d => d.host === domain.host)) {
          return res.status(409).json({ error: 'domain already added', domains: existing });
        }
        const updated = [...existing, { status: 'pending', ...domain }];
        const { data, error } = await supabase.from('ventures')
          .update({ custom_domains: updated, updated_at: new Date().toISOString() })
          .eq('id', venture_id).select('custom_domains').single();
        if (error) throw error;
        return res.json({ domains: data?.custom_domains || [] });
      }
      case 'verify-domain': {
        const { venture_id, host, status, verified_at, vercel_id } = req.body;
        const { data: current } = await supabase.from('ventures')
          .select('custom_domains').eq('id', venture_id).single();
        const list = (current?.custom_domains as Array<Record<string, unknown>> | null) || [];
        const next = list.map(d => d.host === host ? { ...d, status, verified_at, vercel_id } : d);
        const { data, error } = await supabase.from('ventures')
          .update({ custom_domains: next }).eq('id', venture_id).select('custom_domains').single();
        if (error) throw error;
        return res.json({ domains: data?.custom_domains || [] });
      }
      case 'remove-domain': {
        const { venture_id, host } = req.body;
        const { data: current } = await supabase.from('ventures')
          .select('custom_domains').eq('id', venture_id).single();
        const list = (current?.custom_domains as Array<{host: string}> | null) || [];
        const next = list.filter(d => d.host !== host);
        const { data, error } = await supabase.from('ventures')
          .update({ custom_domains: next }).eq('id', venture_id).select('custom_domains').single();
        if (error) throw error;
        return res.json({ domains: data?.custom_domains || [] });
      }

      // =============================================================
      // Quests — reads venture_quests matview (source of truth = Epic tree)
      // =============================================================
      case 'list-quests': {
        const venture_id = (req.body?.venture_id || req.query.venture_id) as string;
        const status = (req.body?.status || req.query.status) as string | undefined;
        let q = supabase.from('venture_quests').select('*').eq('venture_id', venture_id);
        if (status) q = q.eq('effective_status', status);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ quests: data || [] });
      }
      case 'refresh-quests': {
        const { error } = await supabase.rpc('refresh_venture_quests');
        if (error) throw error;
        return res.json({ refreshed: true });
      }

      // =============================================================
      // Docs — apply a department's templates to a venture
      // =============================================================
      case 'apply-doc-template': {
        const { venture_id, department, extra_vars } = req.body as {
          venture_id: string; department: string; extra_vars?: Record<string, string>;
        };
        if (!venture_id || !department) return res.status(400).json({ error: 'venture_id + department required' });
        const [{ data: venture, error: vErr }, { data: templates, error: tErr }] = await Promise.all([
          supabase.from('ventures').select('id, name').eq('id', venture_id).single(),
          supabase.from('doc_templates').select('*').eq('department', department).eq('is_active', true),
        ]);
        if (vErr) throw vErr;
        if (tErr) throw tErr;
        if (!templates?.length) return res.status(404).json({ error: `no active templates in department ${department}` });

        const vars: Record<string, string> = {
          venture: venture?.name || venture_id,
          date: new Date().toISOString().slice(0, 10),
          ...(extra_vars || {}),
        };

        const rows = templates.map(t => ({
          venture_id,
          template_id: t.id,
          department,
          title: t.title,
          body_markdown: interpolate(t.body_markdown, vars),
          variables: vars,
          owner: userId,
        }));
        const { data, error } = await supabase.from('venture_docs').insert(rows).select();
        if (error) throw error;

        // Auto-generate a per-department Epic with one Story per doc — so progress
        // through the department's paperwork shows up in the Quests tab and rolls
        // up into venture XP. Idempotent on (venture_id, department) via tag check.
        const deptTag = `dept:${department}`;
        const { data: existingEpics } = await supabase
          .from('epics').select('id')
          .eq('venture_id', venture_id)
          .contains('tags', [deptTag])
          .limit(1);

        let epicId: string | null = existingEpics && existingEpics.length > 0 ? existingEpics[0].id as string : null;
        if (!epicId) {
          const { data: newEpic, error: epErr } = await supabase.from('epics').insert({
            title: `${venture?.name || venture_id} · ${department.charAt(0).toUpperCase() + department.slice(1)} Department`,
            summary: `Progression through ${department} docs for ${venture?.name || venture_id}.`,
            venture_id,
            suite: 'departments',
            status: 'in-progress',
            priority: 'medium',
            priority_order: 200,
            tags: ['department', deptTag, 'auto-generated'],
            created_by: userId,
            xp: (data?.length ?? 0) * 40,
          }).select('id').single();
          if (!epErr) epicId = newEpic?.id as string;
        }

        if (epicId && data?.length) {
          const storyRows = data.map((d: { id: string; title: string }, i: number) => ({
            epic_id: epicId,
            title: `Complete ${d.title}`,
            status: 'todo' as const,
            priority_order: (i + 1) * 10,
            xp: 40,
            artifacts: [{ kind: 'venture-doc', doc_id: d.id }],
          }));
          await supabase.from('stories').insert(storyRows).then(() => null).catch(() => null);
        }

        await supabase.rpc('refresh_venture_quests').then(() => null).catch(() => null);

        return res.json({ docs: data || [], count: data?.length ?? 0, epic_id: epicId });
      }
      case 'update-doc': {
        const { id, title, body_markdown, status, meta } = req.body as {
          id: string; title?: string; body_markdown?: string; status?: string; meta?: Record<string, unknown>;
        };
        if (!id) return res.status(400).json({ error: 'id required' });
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (title !== undefined) patch.title = title;
        if (body_markdown !== undefined) patch.body_markdown = body_markdown;
        if (status !== undefined) patch.status = status;
        if (meta !== undefined) patch.meta = meta;
        if (status === 'approved') patch.approved_at = new Date().toISOString();
        if (status === 'executed') patch.executed_at = new Date().toISOString();
        const { data, error } = await supabase.from('venture_docs')
          .update(patch).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ doc: data });
      }

      case 'list-docs': {
        const venture_id = (req.body?.venture_id || req.query.venture_id) as string;
        const department = (req.body?.department || req.query.department) as string | undefined;
        let q = supabase.from('venture_docs').select('*').eq('venture_id', venture_id).order('department').order('created_at', { ascending: false });
        if (department) q = q.eq('department', department);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ docs: data || [] });
      }

      // =============================================================
      // Clerk hybrid tenancy — root org default, child orgs on demand
      // =============================================================
      case 'provision-org': {
        const { venture_id, mirror_members } = req.body as { venture_id: string; mirror_members?: boolean };
        if (!venture_id) return res.status(400).json({ error: 'venture_id required' });

        const { data: venture, error: vErr } = await supabase
          .from('ventures').select('id, name, clerk_org_id, color, icon, doc_namespace, white_label')
          .eq('id', venture_id).single();
        if (vErr) throw vErr;
        if (!venture) return res.status(404).json({ error: 'venture not found' });
        if (venture.clerk_org_id) {
          return res.json({ venture, note: 'already provisioned', clerk_org_id: venture.clerk_org_id });
        }

        const secretKey = process.env.CLERK_SECRET_KEY;
        if (!secretKey) return res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });

        const { createClerkClient } = await import('@clerk/backend');
        const clerk = createClerkClient({ secretKey });

        const org = await clerk.organizations.createOrganization({
          name: venture.name,
          slug: venture.id,
          createdBy: userId,
          publicMetadata: {
            venture_id: venture.id,
            icon: venture.icon,
            color: venture.color,
            doc_namespace: venture.doc_namespace,
          },
        });

        if (mirror_members) {
          const { data: team } = await supabase
            .from('team_members').select('clerk_user_id, venture_assignments')
            .contains('venture_assignments', [venture_id]);
          for (const m of team || []) {
            if (m.clerk_user_id && m.clerk_user_id !== userId) {
              try {
                await clerk.organizations.createOrganizationMembership({
                  organizationId: org.id,
                  userId: m.clerk_user_id,
                  role: 'org:member',
                });
              } catch (e) {
                console.error(`failed to mirror member ${m.clerk_user_id}:`, e);
              }
            }
          }
        }

        const { data: updated, error: upErr } = await supabase
          .from('ventures').update({ clerk_org_id: org.id, updated_at: new Date().toISOString() })
          .eq('id', venture_id).select().single();
        if (upErr) throw upErr;

        await supabase.from('activities').insert({
          type: 'org_provisioned',
          venture_id,
          meta: { clerk_org_id: org.id, actor: userId, mirrored: mirror_members || false },
        }).then(() => null).catch(() => null);

        return res.json({ venture: updated, clerk_org_id: org.id });
      }

      case 'unlink-org': {
        const { venture_id } = req.body;
        if (!venture_id) return res.status(400).json({ error: 'venture_id required' });
        const { data, error } = await supabase
          .from('ventures').update({ clerk_org_id: null }).eq('id', venture_id).select().single();
        if (error) throw error;
        return res.json({ venture: data });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
