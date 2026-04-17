// api/creator.ts
// Vercel serverless function — Creator Economy API
// Actions: royalties, escrow, transaction intelligence

import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
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

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { createClient } = await import('@supabase/supabase-js');
  const _supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const action    = (req.method === 'GET' ? req.query.action    : req.body?.action)    as string;
  const ventureId = (req.method === 'GET' ? req.query.ventureId : req.body?.ventureId) as string ?? '';

  if (!ventureId) {
    return res.status(400).json({ error: 'ventureId is required' });
  }

  try {
    switch (action) {

      // ── ROYALTIES ────────────────────────────────────────────────────────

      case 'list-agreements': {
        const { data, error } = await _supabase
          .from('royalty_agreements')
          .select('*, royalty_splits(*)')
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.json({ data });
      }

      case 'create-agreement': {
        const input = req.body ?? {};
        if (!input.productId || !input.creatorId || !input.royaltyType || !input.splits) {
          return res.status(400).json({ error: 'productId, creatorId, royaltyType, splits are required' });
        }

        const totalPct = (input.splits as Array<{ percentage: number }>)
          .reduce((sum: number, s: { percentage: number }) => sum + s.percentage, 0);
        if (Math.abs(totalPct - 100) > 0.001) {
          return res.status(400).json({ error: `Splits must sum to 100%. Got ${totalPct.toFixed(4)}%` });
        }

        const { data: agreement, error: agErr } = await _supabase
          .from('royalty_agreements')
          .insert({
            venture_id: ventureId,
            product_id: input.productId,
            creator_id: input.creatorId,
            royalty_type: input.royaltyType,
            resale_royalty_percent: input.resaleRoyalty ?? 0,
            minimum_payout: input.minimumPayout ?? 0,
            payout_frequency: input.payoutFrequency ?? 'monthly',
            transparency_level: input.transparencyLevel ?? 'participants_only',
            status: 'active',
          })
          .select()
          .single();

        if (agErr || !agreement) throw agErr ?? new Error('Failed to create agreement');

        const splitRows = (input.splits as Array<Record<string, unknown>>).map((s) => ({
          agreement_id: agreement.id,
          recipient_id: s.recipientId,
          recipient_type: s.recipientType,
          percentage: s.percentage,
          description: s.description ?? null,
        }));

        const { data: splits, error: splitsErr } = await _supabase
          .from('royalty_splits')
          .insert(splitRows)
          .select();

        if (splitsErr) throw splitsErr;
        return res.status(201).json({ data: { ...agreement, royalty_splits: splits } });
      }

      case 'update-agreement': {
        const input = req.body ?? {};
        const id = input.id as string;
        if (!id) return res.status(400).json({ error: 'id is required' });

        // Top-level patch only — splits modification is intentionally out of
        // scope here because (a) the dialog and DB use different shapes and
        // (b) replacing splits has financial implications that warrant a
        // dedicated workflow. The dialog passes splits through but the
        // server ignores them; UI shows a toast indicating splits are
        // managed separately.
        const patch: Record<string, unknown> = {};
        if (input.product_name !== undefined) patch.product_name = input.product_name;
        if (input.minimum_guarantee !== undefined) patch.minimum_payout = input.minimum_guarantee;
        if (input.payout_frequency !== undefined) patch.payout_frequency = input.payout_frequency;
        if (input.transparency_level !== undefined) patch.transparency_level = input.transparency_level;
        if (input.status !== undefined) patch.status = input.status;
        if (input.effective_date !== undefined) patch.effective_date = input.effective_date;
        if (input.termination_date !== undefined) patch.termination_date = input.termination_date;
        if (input.recoupable !== undefined) patch.recoupable = input.recoupable;
        if (input.auto_renew !== undefined) patch.auto_renew = input.auto_renew;
        if (input.tags !== undefined) patch.tags = input.tags;
        // Resale royalty stored as percent on the row.
        if (input.rate !== undefined) patch.resale_royalty_percent = input.rate;
        else if (input.percent !== undefined) patch.resale_royalty_percent = input.percent;

        const { data, error } = await _supabase
          .from('royalty_agreements')
          .update(patch)
          .eq('id', id)
          .eq('venture_id', ventureId)
          .select('*, royalty_splits(*)')
          .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Agreement not found' });
        return res.json({ data });
      }

      case 'distribute-royalties': {
        const { productId, transactionAmount, isResale, transactionId } = req.body ?? {};
        if (!productId || transactionAmount == null || !transactionId) {
          return res.status(400).json({ error: 'productId, transactionAmount, transactionId are required' });
        }

        // Look up agreement + calculate
        const { data: agreement } = await _supabase
          .from('royalty_agreements')
          .select('*, royalty_splits(*)')
          .eq('product_id', productId)
          .eq('venture_id', ventureId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!agreement) return res.status(404).json({ error: 'No active royalty agreement found for this product' });

        const splits = (agreement.royalty_splits as Array<Record<string, unknown>>) ?? [];
        const effectiveAmount = isResale
          ? transactionAmount * (Number(agreement.resale_royalty_percent) / 100)
          : transactionAmount;

        const calculated = splits.map((s: Record<string, unknown>) => ({
          recipientId: s.recipient_id,
          recipientType: s.recipient_type,
          percentage: Number(s.percentage),
          amount: Math.round(effectiveAmount * (Number(s.percentage) / 100) * 1_000_000) / 1_000_000,
        }));

        const totalAmount = calculated.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);

        const { data: dist, error: distErr } = await _supabase
          .from('royalty_distributions')
          .insert({
            agreement_id: agreement.id,
            transaction_id: transactionId,
            total_amount: totalAmount,
            splits: calculated,
            status: 'distributed',
          })
          .select()
          .single();

        if (distErr) throw distErr;
        return res.status(201).json({ data: dist });
      }

      case 'get-earnings': {
        const { creatorId } = req.query;
        if (!creatorId) return res.status(400).json({ error: 'creatorId is required' });

        const { data: agreements } = await _supabase
          .from('royalty_agreements')
          .select('id')
          .eq('creator_id', creatorId as string)
          .eq('venture_id', ventureId);

        if (!agreements || agreements.length === 0) {
          return res.json({ data: { totalEarned: 0, pendingPayout: 0, distributions: [] } });
        }

        const agreementIds = agreements.map((a: { id: string }) => a.id);
        const { data: distributions } = await _supabase
          .from('royalty_distributions')
          .select('*')
          .in('agreement_id', agreementIds)
          .order('created_at', { ascending: false });

        const totalEarned = (distributions ?? [])
          .filter((d: { status: string }) => d.status === 'distributed')
          .reduce((sum: number, d: { total_amount: number }) => sum + Number(d.total_amount), 0);

        const pendingPayout = (distributions ?? [])
          .filter((d: { status: string }) => d.status === 'pending' || d.status === 'processing')
          .reduce((sum: number, d: { total_amount: number }) => sum + Number(d.total_amount), 0);

        return res.json({ data: { totalEarned, pendingPayout, distributions: distributions ?? [] } });
      }

      // ── ESCROW ───────────────────────────────────────────────────────────

      case 'create-escrow': {
        const input = req.body ?? {};
        if (!input.buyerId || !input.sellerId || !input.amount) {
          return res.status(400).json({ error: 'buyerId, sellerId, amount are required' });
        }

        const { data: agreement, error: agErr } = await _supabase
          .from('escrow_agreements')
          .insert({
            venture_id: ventureId,
            buyer_id: input.buyerId,
            seller_id: input.sellerId,
            amount: input.amount,
            currency: input.currency ?? 'USD',
            status: 'pending_funding',
            release_condition: input.releaseCondition ?? 'buyer_confirms',
            expires_at: input.expiresAt ?? null,
            metadata: input.metadata ?? {},
          })
          .select()
          .single();

        if (agErr || !agreement) throw agErr ?? new Error('Failed to create escrow');

        // Insert milestones if provided
        let milestones: unknown[] = [];
        if (Array.isArray(input.milestones) && input.milestones.length > 0) {
          const { data: ms, error: msErr } = await _supabase
            .from('escrow_milestones')
            .insert((input.milestones as Array<Record<string, unknown>>).map((m) => ({
              agreement_id: agreement.id,
              name: m.name,
              description: m.description ?? null,
              amount: m.amount,
              due_date: m.dueDate ?? null,
              status: 'pending',
            })))
            .select();
          if (msErr) throw msErr;
          milestones = ms ?? [];
        }

        return res.status(201).json({ data: { ...agreement, escrow_milestones: milestones } });
      }

      case 'fund-escrow': {
        const { agreementId } = req.body ?? {};
        if (!agreementId) return res.status(400).json({ error: 'agreementId is required' });

        const { error } = await _supabase
          .from('escrow_agreements')
          .update({ status: 'funded', escrow_account_id: '1095' })
          .eq('id', agreementId)
          .eq('venture_id', ventureId)
          .eq('status', 'pending_funding');

        if (error) throw error;
        const { data } = await _supabase
          .from('escrow_agreements')
          .select('*, escrow_milestones(*)')
          .eq('id', agreementId)
          .single();
        return res.json({ data });
      }

      case 'submit-milestone': {
        const { agreementId, milestoneId, evidence } = req.body ?? {};
        if (!agreementId || !milestoneId) {
          return res.status(400).json({ error: 'agreementId and milestoneId are required' });
        }

        const { error } = await _supabase
          .from('escrow_milestones')
          .update({
            status: 'submitted',
            evidence: evidence ?? [],
            submitted_at: new Date().toISOString(),
          })
          .eq('id', milestoneId)
          .eq('agreement_id', agreementId);

        if (error) throw error;
        await _supabase
          .from('escrow_agreements')
          .update({ status: 'in_progress' })
          .eq('id', agreementId)
          .eq('status', 'funded');

        const { data } = await _supabase
          .from('escrow_agreements')
          .select('*, escrow_milestones(*)')
          .eq('id', agreementId)
          .single();
        return res.json({ data });
      }

      case 'approve-milestone': {
        const { agreementId, milestoneId } = req.body ?? {};
        if (!agreementId || !milestoneId) {
          return res.status(400).json({ error: 'agreementId and milestoneId are required' });
        }

        await _supabase
          .from('escrow_milestones')
          .update({ status: 'approved', approved_at: new Date().toISOString() })
          .eq('id', milestoneId)
          .eq('agreement_id', agreementId);

        const { data } = await _supabase
          .from('escrow_agreements')
          .select('*, escrow_milestones(*)')
          .eq('id', agreementId)
          .single();
        return res.json({ data });
      }

      case 'update-escrow': {
        const input = req.body ?? {};
        const id = input.id as string;
        if (!id) return res.status(400).json({ error: 'id is required' });

        // Like update-agreement: top-level fields only (amount, expires_at,
        // metadata). Per-milestone edits go through submit/approve/dispute
        // milestone actions where status transitions are auditable.
        const patch: Record<string, unknown> = {};
        if (input.amount !== undefined) patch.amount = input.amount;
        if (input.currency !== undefined) patch.currency = input.currency;
        if (input.expires_at !== undefined) patch.expires_at = input.expires_at;
        if (input.completion_date !== undefined) patch.completion_date = input.completion_date;
        if (input.release_condition !== undefined) patch.release_condition = input.release_condition;
        if (input.notes !== undefined || input.metadata !== undefined) {
          // Merge into existing metadata so we don't clobber sibling keys.
          const { data: existing } = await _supabase
            .from('escrow_agreements')
            .select('metadata')
            .eq('id', id)
            .single();
          const prev = (existing?.metadata as Record<string, unknown>) ?? {};
          patch.metadata = {
            ...prev,
            ...(input.metadata as Record<string, unknown> | undefined),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
          };
        }

        const { data, error } = await _supabase
          .from('escrow_agreements')
          .update(patch)
          .eq('id', id)
          .eq('venture_id', ventureId)
          .select('*, escrow_milestones(*)')
          .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Escrow not found' });
        return res.json({ data });
      }

      case 'dispute-milestone': {
        const { agreementId, milestoneId, reason } = req.body ?? {};
        if (!agreementId || !milestoneId) {
          return res.status(400).json({ error: 'agreementId and milestoneId are required' });
        }

        // Flip milestone to disputed and stash the reason in metadata.
        // Also flip agreement status to disputed so reporting/queries can
        // surface it without joining milestones.
        const { data: existingMs } = await _supabase
          .from('escrow_milestones')
          .select('metadata')
          .eq('id', milestoneId)
          .eq('agreement_id', agreementId)
          .single();
        const prevMs = (existingMs?.metadata as Record<string, unknown>) ?? {};

        const { error: msErr } = await _supabase
          .from('escrow_milestones')
          .update({
            status: 'disputed',
            metadata: { ...prevMs, dispute_reason: reason ?? null, disputed_at: new Date().toISOString() },
          })
          .eq('id', milestoneId)
          .eq('agreement_id', agreementId);

        if (msErr) throw msErr;

        await _supabase
          .from('escrow_agreements')
          .update({ status: 'disputed' })
          .eq('id', agreementId)
          .eq('venture_id', ventureId);

        const { data } = await _supabase
          .from('escrow_agreements')
          .select('*, escrow_milestones(*)')
          .eq('id', agreementId)
          .single();
        return res.json({ data });
      }

      case 'release-escrow': {
        const { agreementId } = req.body ?? {};
        if (!agreementId) return res.status(400).json({ error: 'agreementId is required' });

        const { error } = await _supabase
          .from('escrow_agreements')
          .update({ status: 'released' })
          .eq('id', agreementId)
          .eq('venture_id', ventureId);

        if (error) throw error;
        const { data } = await _supabase
          .from('escrow_agreements')
          .select('*, escrow_milestones(*)')
          .eq('id', agreementId)
          .single();
        return res.json({ data });
      }

      // ── TRANSACTIONS ─────────────────────────────────────────────────────

      case 'list-transactions': {
        const { limit: lRaw, offset: oRaw, type, status } = req.query;
        const limit  = Math.min(Number(lRaw) || 50, 200);
        const offset = Number(oRaw) || 0;

        let query = _supabase
          .from('transaction_records')
          .select('*', { count: 'exact' })
          .eq('venture_id', ventureId)
          .order('timestamp', { ascending: false })
          .range(offset, offset + limit - 1);

        if (type)   query = query.eq('type', type as string);
        if (status) query = query.eq('status', status as string);

        const { data, error, count } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset, total: count ?? 0 } });
      }

      case 'search-transactions': {
        const body = req.body ?? {};
        const limit  = Math.min(Number(body.limit) || 50, 200);
        const offset = Number(body.offset) || 0;

        let query = _supabase
          .from('transaction_records')
          .select('*', { count: 'exact' })
          .eq('venture_id', ventureId)
          .order('timestamp', { ascending: false })
          .range(offset, offset + limit - 1);

        if (body.type)       query = query.eq('type', body.type);
        if (body.status)     query = query.eq('status', body.status);
        if (body.rail)       query = query.eq('rail', body.rail);
        if (body.dateFrom)   query = query.gte('timestamp', body.dateFrom);
        if (body.dateTo)     query = query.lte('timestamp', body.dateTo);
        if (body.amountMin)  query = query.gte('amount', body.amountMin);
        if (body.amountMax)  query = query.lte('amount', body.amountMax);
        if (body.customerId) query = query.or(`payer_id.eq.${body.customerId},payee_id.eq.${body.customerId}`);
        if (body.query)      query = query.or(`transaction_number.ilike.%${body.query}%,access_url.ilike.%${body.query}%`);

        const { data, error, count } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset, total: count ?? 0 } });
      }

      case 'get-transaction': {
        const txId = (req.query.id ?? req.body?.id) as string;
        if (!txId) return res.status(400).json({ error: 'id is required' });

        const { data, error } = await _supabase
          .from('transaction_records')
          .select('*')
          .eq('id', txId)
          .eq('venture_id', ventureId)
          .single();

        if (error) throw error;
        return res.json({ data });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[creator api]', message);
    return res.status(500).json({ error: message });
  }
}
