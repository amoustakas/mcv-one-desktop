// api/payments-router.ts
// Vercel serverless function — Payments Router API
// Actions: estimate-route, create-payment, list-payments, get-payment, get-savings
//
// NOTE: The actual routing + processing logic runs client-side (paymentRouter singleton).
// This API is the CRUD layer: recording payment intents, listing them, and aggregating savings.

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
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const ventureId = ((req.method === 'GET' ? req.query.ventureId : req.body?.ventureId) as string) ?? '';

  try {
    switch (action) {

      // ── estimate-route ──────────────────────────────────────────────────────
      // GET /api/payments-router?action=estimate-route&amount=&currency=&customerCountry=&ventureId=
      // Returns a lightweight routing estimate without persisting anything.
      // The real routing logic runs client-side; this endpoint exists for server-side
      // callers (webhooks, n8n) that need a routing decision without browser context.
      case 'estimate-route': {
        const amount = Number(req.query.amount ?? 0);
        const currency = (req.query.currency as string) || 'USD';
        const customerCountry = (req.query.customerCountry as string) || 'US';
        const paymentMethod = (req.query.paymentMethod as string) || null;
        const vid = (req.query.ventureId as string) || ventureId;

        if (!amount || amount <= 0) {
          return res.status(400).json({ error: 'amount must be a positive number' });
        }

        // Build a synthetic routing decision using the processor fee tables.
        // Three processors: stripe (card), platform_credits, solana.
        const STRIPE_PERCENT = 0.029;
        const STRIPE_FIXED   = 0.30;
        const stripeFee      = amount * STRIPE_PERCENT + STRIPE_FIXED;

        // Platform credits: 0% fee
        const creditsFee = 0;

        // Solana: ~0.000005 SOL ≈ $0.001 flat (stub; real rate from oracle in production)
        const solanaFee = 0.001;

        const rails = [
          { id: 'platform_credits', name: 'Platform Credits', fee: creditsFee,  speed: 'instant',   score: 0.95 },
          { id: 'solana',           name: 'Solana (USDC)',     fee: solanaFee,   speed: '~400ms',    score: 0.82 },
          { id: 'stripe',           name: 'Stripe (card)',     fee: stripeFee,   speed: '2-3 days',  score: 0.65 },
        ].filter(r => {
          // If a specific payment method is requested, restrict to its processor
          if (!paymentMethod) return true;
          if (paymentMethod === 'platform_credit') return r.id === 'platform_credits';
          if (paymentMethod === 'usdc' || paymentMethod === 'sol') return r.id === 'solana';
          if (['card', 'ach', 'sepa'].includes(paymentMethod)) return r.id === 'stripe';
          return true;
        });

        if (rails.length === 0) {
          return res.status(422).json({ error: `No eligible processor for method: ${paymentMethod}` });
        }

        const primary = rails[0];
        const savingsVsDefault = Math.max(0, stripeFee - primary.fee);

        const decision = {
          primaryRail:         primary.id,
          fallbackRails:       rails.slice(1).map(r => r.id),
          estimatedFee: {
            fixedFee:      primary.id === 'stripe' ? STRIPE_FIXED : 0,
            percentageFee: primary.id === 'stripe' ? STRIPE_PERCENT : 0,
            totalFee:      primary.fee,
            currency,
          },
          estimatedSettlement: primary.speed,
          reasoning: `Selected ${primary.name} (score ${primary.score}) for ${currency} ${amount.toFixed(2)} from ${customerCountry}.`,
          savingsVsDefault,
          allRails: rails.map(r => ({
            id:    r.id,
            name:  r.name,
            fee:   r.fee,
            speed: r.speed,
            score: r.score,
          })),
          ventureId: vid,
        };

        return res.json({ data: decision });
      }

      // ── create-payment ──────────────────────────────────────────────────────
      // POST /api/payments-router { action, ventureId, paymentResult, routingDecision }
      // Records a payment_intent row after the client-side router processes it.
      case 'create-payment': {
        const paymentResult   = req.body?.paymentResult;
        const routingDecision = req.body?.routingDecision;

        if (!ventureId) return res.status(400).json({ error: 'ventureId is required' });
        if (!paymentResult) return res.status(400).json({ error: 'paymentResult is required' });

        const now = new Date().toISOString();
        const record = {
          id:                   paymentResult.paymentId || `pi_${Date.now()}`,
          venture_id:           ventureId,
          user_id:              userId,
          processor_id:         paymentResult.processorId ?? null,
          processor_payment_id: paymentResult.processorPaymentId ?? null,
          status:               paymentResult.status ?? 'pending',
          amount:               paymentResult.amount ?? 0,
          currency:             paymentResult.currency ?? 'USD',
          fee_total:            paymentResult.fee?.totalFee ?? 0,
          fee_fixed:            paymentResult.fee?.fixedFee ?? 0,
          fee_percentage:       paymentResult.fee?.percentageFee ?? 0,
          primary_rail:         routingDecision?.primaryRail ?? null,
          fallback_rails:       routingDecision?.fallbackRails ?? [],
          savings_vs_default:   routingDecision?.savingsVsDefault ?? 0,
          routing_reasoning:    routingDecision?.reasoning ?? null,
          error:                paymentResult.error ?? null,
          created_at:           now,
          updated_at:           now,
        };

        const { data, error } = await supabase
          .from('payment_intents')
          .insert(record)
          .select()
          .single();

        if (error) {
          console.error('[payments-router] insert error:', error.message);
          // Return success=true anyway — recording is best-effort, client already processed payment
          return res.json({ data: record, warning: 'Payment processed but record persistence failed' });
        }

        return res.json({ data });
      }

      // ── list-payments ────────────────────────────────────────────────────────
      // GET /api/payments-router?action=list-payments&ventureId=&limit=&offset=
      case 'list-payments': {
        if (!ventureId) return res.status(400).json({ error: 'ventureId is required' });

        const limit  = Math.min(Number(req.query.limit  ?? 20), 100);
        const offset = Number(req.query.offset ?? 0);

        const { data, error, count } = await supabase
          .from('payment_intents')
          .select('*', { count: 'exact' })
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return res.json({ data: data ?? [], total: count ?? 0, limit, offset });
      }

      // ── get-payment ──────────────────────────────────────────────────────────
      // GET /api/payments-router?action=get-payment&id=&ventureId=
      case 'get-payment': {
        const id = req.query.id as string;
        if (!id) return res.status(400).json({ error: 'id is required' });
        if (!ventureId) return res.status(400).json({ error: 'ventureId is required' });

        const { data, error } = await supabase
          .from('payment_intents')
          .select('*')
          .eq('id', id)
          .eq('venture_id', ventureId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return res.status(404).json({ error: 'Payment not found' });
          throw error;
        }

        return res.json({ data });
      }

      // ── get-savings ──────────────────────────────────────────────────────────
      // GET /api/payments-router?action=get-savings&ventureId=
      // Aggregates savings_vs_default for the last 30 days.
      case 'get-savings': {
        if (!ventureId) return res.status(400).json({ error: 'ventureId is required' });

        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('payment_intents')
          .select('savings_vs_default, primary_rail, amount, currency, created_at')
          .eq('venture_id', ventureId)
          .eq('status', 'succeeded')
          .gte('created_at', since)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = data ?? [];
        const totalSavings    = rows.reduce((s, r) => s + (Number(r.savings_vs_default) || 0), 0);
        const totalVolume     = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        const paymentCount    = rows.length;

        // Rail breakdown
        const railCounts: Record<string, number> = {};
        for (const r of rows) {
          const rail = (r.primary_rail as string) || 'unknown';
          railCounts[rail] = (railCounts[rail] ?? 0) + 1;
        }

        return res.json({
          data: {
            totalSavings30d:  Math.round(totalSavings * 100) / 100,
            totalVolume30d:   Math.round(totalVolume  * 100) / 100,
            paymentCount30d:  paymentCount,
            railBreakdown:    railCounts,
            since,
          },
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[payments-router]', message);
    return res.status(500).json({ error: message });
  }
}
