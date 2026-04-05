import { getProviderToken } from './_oauth-helper';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Google Tag Manager API v2 — accounts, containers, workspaces, tags, triggers,
// variables, versions, built-in variables, folders, environments
// ---------------------------------------------------------------------------

const GTM_API = 'https://www.googleapis.com/tagmanager/v2';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const t = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function gtmFetch(path: string, token: string) {
  const res = await fetch(`${GTM_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `GTM ${res.status}`); }
  return res.json();
}

async function gtmPost(path: string, token: string, body: unknown, method = 'POST') {
  const res = await fetch(`${GTM_API}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `GTM ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try { token = (await getProviderToken(userId, 'google')).token; }
  catch { return res.status(500).json({ error: 'Google not connected.' }); }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Accounts ──
      case 'list-accounts':
        return res.json(await gtmFetch('/accounts', token));

      // ── Containers ──
      case 'list-containers': {
        const { accountId } = req.query;
        if (!accountId) return res.status(400).json({ error: 'accountId required' });
        return res.json(await gtmFetch(`/accounts/${accountId}/containers`, token));
      }

      case 'get-container': {
        const { path: containerPath } = req.query;
        if (!containerPath) return res.status(400).json({ error: 'path required (e.g. accounts/123/containers/456)' });
        return res.json(await gtmFetch(`/${containerPath}`, token));
      }

      // ── Workspaces ──
      case 'list-workspaces': {
        const { containerPath } = req.query;
        if (!containerPath) return res.status(400).json({ error: 'containerPath required' });
        return res.json(await gtmFetch(`/${containerPath}/workspaces`, token));
      }

      // ── Tags ──
      case 'list-tags': {
        const { workspacePath } = req.query;
        if (!workspacePath) return res.status(400).json({ error: 'workspacePath required' });
        return res.json(await gtmFetch(`/${workspacePath}/tags`, token));
      }

      case 'get-tag': {
        const { tagPath } = req.query;
        if (!tagPath) return res.status(400).json({ error: 'tagPath required' });
        return res.json(await gtmFetch(`/${tagPath}`, token));
      }

      case 'create-tag': {
        const { workspacePath, name, type, parameter, firingTriggerId } = req.body;
        if (!workspacePath || !name || !type) return res.status(400).json({ error: 'workspacePath, name, type required' });
        return res.json(await gtmPost(`/${workspacePath}/tags`, token, {
          name, type, parameter, firingTriggerId: firingTriggerId ? [firingTriggerId] : undefined,
        }));
      }

      case 'update-tag': {
        const { tagPath, name, parameter, firingTriggerId, paused } = req.body;
        if (!tagPath) return res.status(400).json({ error: 'tagPath required' });
        const body: Record<string, unknown> = {};
        if (name) body.name = name;
        if (parameter) body.parameter = parameter;
        if (firingTriggerId) body.firingTriggerId = [firingTriggerId];
        if (paused !== undefined) body.paused = paused;
        return res.json(await gtmPost(`/${tagPath}`, token, body, 'PUT'));
      }

      case 'delete-tag': {
        const { tagPath } = req.body;
        if (!tagPath) return res.status(400).json({ error: 'tagPath required' });
        const r = await fetch(`${GTM_API}/${tagPath}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        return res.json({ deleted: r.ok });
      }

      // ── Triggers ──
      case 'list-triggers': {
        const { workspacePath } = req.query;
        if (!workspacePath) return res.status(400).json({ error: 'workspacePath required' });
        return res.json(await gtmFetch(`/${workspacePath}/triggers`, token));
      }

      case 'create-trigger': {
        const { workspacePath, name, type, customEventFilter, filter } = req.body;
        if (!workspacePath || !name || !type) return res.status(400).json({ error: 'workspacePath, name, type required' });
        return res.json(await gtmPost(`/${workspacePath}/triggers`, token, { name, type, customEventFilter, filter }));
      }

      // ── Variables ──
      case 'list-variables': {
        const { workspacePath } = req.query;
        if (!workspacePath) return res.status(400).json({ error: 'workspacePath required' });
        return res.json(await gtmFetch(`/${workspacePath}/variables`, token));
      }

      case 'create-variable': {
        const { workspacePath, name, type, parameter } = req.body;
        if (!workspacePath || !name || !type) return res.status(400).json({ error: 'workspacePath, name, type required' });
        return res.json(await gtmPost(`/${workspacePath}/variables`, token, { name, type, parameter }));
      }

      // ── Built-in Variables ──
      case 'list-builtin-variables': {
        const { workspacePath } = req.query;
        if (!workspacePath) return res.status(400).json({ error: 'workspacePath required' });
        return res.json(await gtmFetch(`/${workspacePath}/built_in_variables`, token));
      }

      // ── Versions ──
      case 'list-versions': {
        const { containerPath } = req.query;
        if (!containerPath) return res.status(400).json({ error: 'containerPath required' });
        return res.json(await gtmFetch(`/${containerPath}/version_headers`, token));
      }

      case 'get-version': {
        const { versionPath } = req.query;
        if (!versionPath) return res.status(400).json({ error: 'versionPath required' });
        return res.json(await gtmFetch(`/${versionPath}`, token));
      }

      case 'create-version': {
        const { workspacePath, name, notes } = req.body;
        if (!workspacePath) return res.status(400).json({ error: 'workspacePath required' });
        return res.json(await gtmPost(`/${workspacePath}:create_version`, token, { name, notes }));
      }

      case 'publish-version': {
        const { versionPath } = req.body;
        if (!versionPath) return res.status(400).json({ error: 'versionPath required' });
        return res.json(await gtmPost(`/${versionPath}:publish`, token, {}));
      }

      // ── Environments ──
      case 'list-environments': {
        const { containerPath } = req.query;
        if (!containerPath) return res.status(400).json({ error: 'containerPath required' });
        return res.json(await gtmFetch(`/${containerPath}/environments`, token));
      }

      // ── Folders ──
      case 'list-folders': {
        const { workspacePath } = req.query;
        if (!workspacePath) return res.status(400).json({ error: 'workspacePath required' });
        return res.json(await gtmFetch(`/${workspacePath}/folders`, token));
      }

      // ── Overview ──
      case 'overview': {
        const accounts = await gtmFetch('/accounts', token);
        const accts = accounts.account ?? [];
        return res.json({
          accounts: accts.length,
          account_names: accts.map((a: { name: string; accountId: string }) => ({ name: a.name, id: a.accountId })),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
