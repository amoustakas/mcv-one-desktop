// api/v1/index.ts
// Versioned Public API Gateway — /api/v1
//
// Auth: API key in Authorization header ("Bearer mcv_live_..." or "Bearer mcv_test_...")
// NOT Clerk JWT — this endpoint is for external partners and venture frontends.
//
// Routing: query-based since Vercel uses single-file serverless functions.
// Pattern:  GET  /api/v1?resource=products&action=list&ventureId=...
//           POST /api/v1  body: { resource, action, ventureId, ...params }
//
// Response envelope: { data, meta: { requestId, rateLimitRemaining, rateLimitLimit, rateLimitReset } }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateApiKey } from '../../../src/lib/platform/api-keys';
import { checkRateLimit } from '../../../src/lib/platform/rate-limiter';
import {
  listWebhooks,
  registerWebhook,
  removeWebhook,
} from '../../../src/lib/platform/webhooks';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function randomRequestId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'req_';
  for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function ok(
  res: VercelResponse,
  data: unknown,
  meta: Record<string, unknown>,
) {
  return res.status(200).json({ data, meta });
}

function err(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function getParam(req: VercelRequest, key: string): string | undefined {
  const val = req.method === 'GET' ? req.query[key] : (req.body?.[key] ?? req.query[key]);
  return val !== undefined ? String(val) : undefined;
}

function getBody(req: VercelRequest): Record<string, unknown> {
  return req.method !== 'GET' && req.body && typeof req.body === 'object'
    ? (req.body as Record<string, unknown>)
    : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = randomRequestId();

  // ── CORS (partners call from their own frontends) ──────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── 1. Extract API key ─────────────────────────────────────────────────────
  const authHeader = req.headers.authorization ?? '';
  const apiKeyPlaintext = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!apiKeyPlaintext) {
    return err(res, 401, 'Missing Authorization header. Use: Bearer mcv_live_...');
  }

  // ── 2. Validate API key ────────────────────────────────────────────────────
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const apiKey = await validateApiKey(supabase, apiKeyPlaintext);
  if (!apiKey) {
    return err(res, 401, 'Invalid or expired API key.');
  }

  // ── 3. Rate limiting ───────────────────────────────────────────────────────
  const rateLimit = checkRateLimit(apiKey.id, apiKey.rateLimitTier);
  res.setHeader('X-RateLimit-Limit', String(rateLimit.limit));
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  res.setHeader('X-RateLimit-Reset', rateLimit.resetAt);

  if (!rateLimit.allowed) {
    return err(res, 429, `Rate limit exceeded. Resets at ${rateLimit.resetAt}.`);
  }

  // ── 4. Extract resource + action ──────────────────────────────────────────
  const resource = getParam(req, 'resource');
  const action = getParam(req, 'action');

  if (!resource || !action) {
    return err(res, 400, 'resource and action query params are required.');
  }

  // ventureId must match the key's venture
  const requestedVentureId = getParam(req, 'ventureId') ?? apiKey.ventureId;
  if (requestedVentureId !== apiKey.ventureId) {
    return err(res, 403, 'ventureId does not match API key scope.');
  }

  const ventureId = apiKey.ventureId;
  const body = getBody(req);

  const meta = {
    requestId,
    rateLimitRemaining: rateLimit.remaining,
    rateLimitLimit: rateLimit.limit,
    rateLimitReset: rateLimit.resetAt,
  };

  try {
    // ── 5. Route to resource handler ─────────────────────────────────────────
    switch (resource) {

      // ════════════════════════════════════════════════════════════════════════
      // PRODUCTS
      // ════════════════════════════════════════════════════════════════════════
      case 'products': {
        switch (action) {
          case 'list': {
            const { type, status, limit: lRaw, offset: oRaw } = req.query;
            const limit = Math.min(Number(lRaw) || 50, 200);
            const offset = Number(oRaw) || 0;

            let query = supabase
              .from('products')
              .select('*')
              .eq('venture_id', ventureId)
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1);

            if (type) query = query.eq('type', type as string);
            if (status) query = query.eq('status', status as string);

            const { data, error } = await query;
            if (error) throw error;
            return ok(res, data, { ...meta, limit, offset });
          }

          case 'get': {
            const productId = getParam(req, 'productId');
            if (!productId) return err(res, 400, 'productId is required');
            const { data, error } = await supabase
              .from('products')
              .select('*')
              .eq('id', productId)
              .eq('venture_id', ventureId)
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'create': {
            const { name, type, description, pricing, config, metadata } = body;
            if (!name || !type) return err(res, 400, 'name and type are required');
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('products')
              .insert({
                venture_id: ventureId,
                name,
                type,
                description: description ?? null,
                status: 'draft',
                pricing: pricing ?? {},
                config: config ?? {},
                metadata: metadata ?? {},
                created_at: now,
                updated_at: now,
              })
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'update': {
            const productId = getParam(req, 'productId') ?? (body.productId as string);
            if (!productId) return err(res, 400, 'productId is required');
            const { name, description, status, pricing, config, metadata } = body;
            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (name !== undefined) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (status !== undefined) updates.status = status;
            if (pricing !== undefined) updates.pricing = pricing;
            if (config !== undefined) updates.config = config;
            if (metadata !== undefined) updates.metadata = metadata;

            const { data, error } = await supabase
              .from('products')
              .update(updates)
              .eq('id', productId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'archive': {
            const productId = getParam(req, 'productId') ?? (body.productId as string);
            if (!productId) return err(res, 400, 'productId is required');
            const { data, error } = await supabase
              .from('products')
              .update({ status: 'archived', updated_at: new Date().toISOString() })
              .eq('id', productId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          default:
            return err(res, 400, `Unknown action "${action}" for resource "products"`);
        }
      }

      // ════════════════════════════════════════════════════════════════════════
      // SUBSCRIPTIONS
      // ════════════════════════════════════════════════════════════════════════
      case 'subscriptions': {
        switch (action) {
          case 'list': {
            const { customerId, status: s, limit: lRaw, offset: oRaw } = req.query;
            const limit = Math.min(Number(lRaw) || 50, 200);
            const offset = Number(oRaw) || 0;
            let query = supabase
              .from('subscriptions')
              .select('*')
              .eq('venture_id', ventureId)
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1);
            if (customerId) query = query.eq('customer_id', customerId as string);
            if (s) query = query.eq('status', s as string);
            const { data, error } = await query;
            if (error) throw error;
            return ok(res, data, { ...meta, limit, offset });
          }

          case 'get': {
            const subscriptionId = getParam(req, 'subscriptionId');
            if (!subscriptionId) return err(res, 400, 'subscriptionId is required');
            const { data, error } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('id', subscriptionId)
              .eq('venture_id', ventureId)
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'create': {
            const { customerId, productId, planId, startAt, trialDays, metadata } = body;
            if (!customerId || !productId) return err(res, 400, 'customerId and productId are required');
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('subscriptions')
              .insert({
                venture_id: ventureId,
                customer_id: customerId,
                product_id: productId,
                plan_id: planId ?? null,
                status: trialDays ? 'trialing' : 'active',
                start_at: startAt ?? now,
                trial_ends_at: trialDays
                  ? new Date(Date.now() + Number(trialDays) * 86400000).toISOString()
                  : null,
                metadata: metadata ?? {},
                created_at: now,
                updated_at: now,
              })
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'cancel': {
            const subscriptionId = getParam(req, 'subscriptionId') ?? (body.subscriptionId as string);
            if (!subscriptionId) return err(res, 400, 'subscriptionId is required');
            const { cancelAt, immediate } = body;
            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (immediate) {
              updates.status = 'canceled';
              updates.canceled_at = new Date().toISOString();
            } else {
              updates.cancel_at = cancelAt ?? null;
            }
            const { data, error } = await supabase
              .from('subscriptions')
              .update(updates)
              .eq('id', subscriptionId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'pause': {
            const subscriptionId = getParam(req, 'subscriptionId') ?? (body.subscriptionId as string);
            if (!subscriptionId) return err(res, 400, 'subscriptionId is required');
            const { data, error } = await supabase
              .from('subscriptions')
              .update({ status: 'paused', updated_at: new Date().toISOString() })
              .eq('id', subscriptionId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'resume': {
            const subscriptionId = getParam(req, 'subscriptionId') ?? (body.subscriptionId as string);
            if (!subscriptionId) return err(res, 400, 'subscriptionId is required');
            const { data, error } = await supabase
              .from('subscriptions')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .eq('id', subscriptionId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'usage': {
            const subscriptionId = getParam(req, 'subscriptionId');
            if (!subscriptionId) return err(res, 400, 'subscriptionId is required');
            const { data, error } = await supabase
              .from('usage_records')
              .select('*')
              .eq('subscription_id', subscriptionId)
              .order('timestamp', { ascending: false })
              .limit(100);
            if (error) throw error;
            return ok(res, data, meta);
          }

          default:
            return err(res, 400, `Unknown action "${action}" for resource "subscriptions"`);
        }
      }

      // ════════════════════════════════════════════════════════════════════════
      // INVOICES
      // ════════════════════════════════════════════════════════════════════════
      case 'invoices': {
        switch (action) {
          case 'list': {
            const { customerId, status: s, limit: lRaw, offset: oRaw } = req.query;
            const limit = Math.min(Number(lRaw) || 50, 200);
            const offset = Number(oRaw) || 0;
            let query = supabase
              .from('invoices')
              .select('*')
              .eq('venture_id', ventureId)
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1);
            if (customerId) query = query.eq('customer_id', customerId as string);
            if (s) query = query.eq('status', s as string);
            const { data, error } = await query;
            if (error) throw error;
            return ok(res, data, { ...meta, limit, offset });
          }

          case 'get': {
            const invoiceId = getParam(req, 'invoiceId');
            if (!invoiceId) return err(res, 400, 'invoiceId is required');
            const { data, error } = await supabase
              .from('invoices')
              .select('*, invoice_line_items(*)')
              .eq('id', invoiceId)
              .eq('venture_id', ventureId)
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'create': {
            const { customerId, lineItems, dueAt, currency, notes, metadata } = body;
            if (!customerId) return err(res, 400, 'customerId is required');
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('invoices')
              .insert({
                venture_id: ventureId,
                customer_id: customerId,
                status: 'draft',
                line_items: lineItems ?? [],
                currency: currency ?? 'USD',
                subtotal: 0,
                tax: 0,
                total: 0,
                amount_paid: 0,
                amount_due: 0,
                due_at: dueAt ?? null,
                notes: notes ?? null,
                metadata: metadata ?? {},
                created_at: now,
                updated_at: now,
              })
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'send': {
            const invoiceId = getParam(req, 'invoiceId') ?? (body.invoiceId as string);
            if (!invoiceId) return err(res, 400, 'invoiceId is required');
            const { data, error } = await supabase
              .from('invoices')
              .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .eq('id', invoiceId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'pay': {
            const invoiceId = getParam(req, 'invoiceId') ?? (body.invoiceId as string);
            if (!invoiceId) return err(res, 400, 'invoiceId is required');
            const { amount } = body;
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('invoices')
              .update({
                status: 'paid',
                amount_paid: amount ?? 0,
                amount_due: 0,
                paid_at: now,
                updated_at: now,
              })
              .eq('id', invoiceId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'void': {
            const invoiceId = getParam(req, 'invoiceId') ?? (body.invoiceId as string);
            if (!invoiceId) return err(res, 400, 'invoiceId is required');
            const { data, error } = await supabase
              .from('invoices')
              .update({ status: 'voided', updated_at: new Date().toISOString() })
              .eq('id', invoiceId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          default:
            return err(res, 400, `Unknown action "${action}" for resource "invoices"`);
        }
      }

      // ════════════════════════════════════════════════════════════════════════
      // PAYMENTS
      // ════════════════════════════════════════════════════════════════════════
      case 'payments': {
        switch (action) {
          case 'create': {
            const { amount, currency, method, customerId, description, metadata } = body;
            if (!amount) return err(res, 400, 'amount is required');
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('payment_records')
              .insert({
                venture_id: ventureId,
                amount: Number(amount),
                currency: currency ?? 'USD',
                method: method ?? null,
                customer_id: customerId ?? null,
                description: description ?? '',
                status: 'pending',
                metadata: metadata ?? {},
                created_at: now,
                updated_at: now,
              })
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'get': {
            const paymentId = getParam(req, 'paymentId');
            if (!paymentId) return err(res, 400, 'paymentId is required');
            const { data, error } = await supabase
              .from('payment_records')
              .select('*')
              .eq('id', paymentId)
              .eq('venture_id', ventureId)
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'estimate': {
            const amount = Number(getParam(req, 'amount') ?? body.amount ?? 0);
            const currency = getParam(req, 'currency') ?? (body.currency as string) ?? 'USD';
            const method = getParam(req, 'method') ?? (body.method as string) ?? 'card';

            // Simple fee estimation (mirrors payments-router.ts logic)
            const FEES: Record<string, { percent: number; fixed: number }> = {
              card:             { percent: 0.029,  fixed: 0.30 },
              ach:              { percent: 0.008,  fixed: 0.30 },
              sepa:             { percent: 0.008,  fixed: 0.25 },
              platform_credit:  { percent: 0,      fixed: 0    },
              usdc:             { percent: 0.001,  fixed: 0    },
            };
            const fee = FEES[method] ?? FEES.card;
            const totalFee = amount * fee.percent + fee.fixed;

            return ok(res, {
              amount,
              currency,
              method,
              feeEstimate: {
                percentageFee: amount * fee.percent,
                fixedFee: fee.fixed,
                totalFee,
                currency,
              },
              net: amount - totalFee,
            }, meta);
          }

          case 'refund': {
            const paymentId = getParam(req, 'paymentId') ?? (body.paymentId as string);
            if (!paymentId) return err(res, 400, 'paymentId is required');
            const { amount, reason } = body;
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('payment_records')
              .update({
                status: 'refunded',
                refunded_amount: amount ?? null,
                refund_reason: reason ?? null,
                updated_at: now,
              })
              .eq('id', paymentId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          default:
            return err(res, 400, `Unknown action "${action}" for resource "payments"`);
        }
      }

      // ════════════════════════════════════════════════════════════════════════
      // CREDITS
      // ════════════════════════════════════════════════════════════════════════
      case 'credits': {
        switch (action) {
          case 'balance': {
            const ownerId = getParam(req, 'ownerId') ?? (body.ownerId as string);
            if (!ownerId) return err(res, 400, 'ownerId is required');
            const { data, error } = await supabase
              .from('credit_accounts')
              .select('*')
              .eq('venture_id', ventureId)
              .eq('owner_id', ownerId)
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'grant': {
            const { ownerId, ownerType, amount, currency, reason, expiresAt } = body;
            if (!ownerId || !amount) return err(res, 400, 'ownerId and amount are required');
            const now = new Date().toISOString();
            // Upsert credit account or create grant record
            const { data, error } = await supabase
              .from('credit_grants')
              .insert({
                venture_id: ventureId,
                owner_id: ownerId,
                owner_type: ownerType ?? 'user',
                amount: Number(amount),
                currency: currency ?? 'USD',
                reason: reason ?? 'manual_grant',
                expires_at: expiresAt ?? null,
                created_at: now,
              })
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'consume': {
            const { ownerId, amount, reference } = body;
            if (!ownerId || !amount) return err(res, 400, 'ownerId and amount are required');
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('credit_consumptions')
              .insert({
                venture_id: ventureId,
                owner_id: ownerId,
                amount: Number(amount),
                reference: reference ?? null,
                created_at: now,
              })
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'transfer': {
            const { fromOwnerId, toOwnerId, amount, note } = body;
            if (!fromOwnerId || !toOwnerId || !amount) {
              return err(res, 400, 'fromOwnerId, toOwnerId, and amount are required');
            }
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('credit_transfers')
              .insert({
                venture_id: ventureId,
                from_owner_id: fromOwnerId,
                to_owner_id: toOwnerId,
                amount: Number(amount),
                note: note ?? null,
                created_at: now,
              })
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          default:
            return err(res, 400, `Unknown action "${action}" for resource "credits"`);
        }
      }

      // ════════════════════════════════════════════════════════════════════════
      // LOANS
      // ════════════════════════════════════════════════════════════════════════
      case 'loans': {
        switch (action) {
          case 'list': {
            const { customerId, status: s, limit: lRaw, offset: oRaw } = req.query;
            const limit = Math.min(Number(lRaw) || 50, 200);
            const offset = Number(oRaw) || 0;
            let query = supabase
              .from('loans')
              .select('*')
              .eq('venture_id', ventureId)
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1);
            if (customerId) query = query.eq('customer_id', customerId as string);
            if (s) query = query.eq('status', s as string);
            const { data, error } = await query;
            if (error) throw error;
            return ok(res, data, { ...meta, limit, offset });
          }

          case 'get': {
            const loanId = getParam(req, 'loanId');
            if (!loanId) return err(res, 400, 'loanId is required');
            const { data, error } = await supabase
              .from('loans')
              .select('*')
              .eq('id', loanId)
              .eq('venture_id', ventureId)
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'create': {
            const { customerId, principal, currency, interestRate, termMonths, interestType, metadata } = body;
            if (!customerId || !principal) return err(res, 400, 'customerId and principal are required');
            const now = new Date().toISOString();
            const { data, error } = await supabase
              .from('loans')
              .insert({
                venture_id: ventureId,
                customer_id: customerId,
                principal: Number(principal),
                currency: currency ?? 'USD',
                interest_rate: Number(interestRate ?? 0),
                term_months: Number(termMonths ?? 12),
                interest_type: interestType ?? 'simple',
                status: 'application',
                amount_repaid: 0,
                metadata: metadata ?? {},
                created_at: now,
                updated_at: now,
              })
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'disburse': {
            const loanId = getParam(req, 'loanId') ?? (body.loanId as string);
            if (!loanId) return err(res, 400, 'loanId is required');
            const { data, error } = await supabase
              .from('loans')
              .update({ status: 'disbursed', disbursed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .eq('id', loanId)
              .eq('venture_id', ventureId)
              .select()
              .single();
            if (error) throw error;
            return ok(res, data, meta);
          }

          case 'repay': {
            const loanId = getParam(req, 'loanId') ?? (body.loanId as string);
            if (!loanId) return err(res, 400, 'loanId is required');
            const { amount, note } = body;
            const now = new Date().toISOString();
            const { data: repayment, error: repErr } = await supabase
              .from('loan_repayments')
              .insert({
                loan_id: loanId,
                amount: Number(amount ?? 0),
                note: note ?? null,
                paid_at: now,
                created_at: now,
              })
              .select()
              .single();
            if (repErr) throw repErr;
            return ok(res, repayment, meta);
          }

          case 'schedule': {
            const loanId = getParam(req, 'loanId');
            if (!loanId) return err(res, 400, 'loanId is required');
            const { data, error } = await supabase
              .from('loan_repayments')
              .select('*')
              .eq('loan_id', loanId)
              .order('paid_at', { ascending: false });
            if (error) throw error;
            return ok(res, data, meta);
          }

          default:
            return err(res, 400, `Unknown action "${action}" for resource "loans"`);
        }
      }

      // ════════════════════════════════════════════════════════════════════════
      // LEDGER
      // ════════════════════════════════════════════════════════════════════════
      case 'ledger': {
        switch (action) {
          case 'accounts': {
            const { type: t, limit: lRaw, offset: oRaw } = req.query;
            const limit = Math.min(Number(lRaw) || 100, 500);
            const offset = Number(oRaw) || 0;
            let query = supabase
              .from('ledger_accounts')
              .select('*')
              .eq('venture_id', ventureId)
              .order('code', { ascending: true })
              .range(offset, offset + limit - 1);
            if (t) query = query.eq('type', t as string);
            const { data, error } = await query;
            if (error) throw error;
            return ok(res, data, { ...meta, limit, offset });
          }

          case 'entries': {
            const { accountId, status: s, limit: lRaw, offset: oRaw } = req.query;
            const limit = Math.min(Number(lRaw) || 50, 200);
            const offset = Number(oRaw) || 0;
            let query = supabase
              .from('journal_entries')
              .select('*, journal_entry_lines(*)')
              .eq('venture_id', ventureId)
              .order('date', { ascending: false })
              .range(offset, offset + limit - 1);
            if (accountId) {
              // Filter by account involvement via lines (simplified)
              query = query.contains('account_ids', [accountId]);
            }
            if (s) query = query.eq('status', s as string);
            const { data, error } = await query;
            if (error) throw error;
            return ok(res, data, { ...meta, limit, offset });
          }

          case 'trial-balance': {
            const asOf = getParam(req, 'asOf') ?? new Date().toISOString().split('T')[0];
            const { data: accounts, error: accErr } = await supabase
              .from('ledger_accounts')
              .select('id, code, name, type, subtype, currency, current_balance')
              .eq('venture_id', ventureId)
              .order('code', { ascending: true });
            if (accErr) throw accErr;

            const rows = (accounts ?? []).map((a) => ({
              accountId: a.id,
              accountCode: a.code,
              accountName: a.name,
              accountType: a.type,
              debit: ['asset', 'expense'].includes(a.type) ? a.current_balance : 0,
              credit: ['liability', 'equity', 'revenue'].includes(a.type) ? a.current_balance : 0,
              currency: a.currency,
            }));

            const totalDebits = rows.reduce((s, r) => s + r.debit, 0);
            const totalCredits = rows.reduce((s, r) => s + r.credit, 0);

            return ok(res, {
              asOf,
              rows,
              totalDebits,
              totalCredits,
              balanced: Math.abs(totalDebits - totalCredits) < 0.01,
            }, meta);
          }

          default:
            return err(res, 400, `Unknown action "${action}" for resource "ledger"`);
        }
      }

      // ════════════════════════════════════════════════════════════════════════
      // FINANCE REPORTS
      // ════════════════════════════════════════════════════════════════════════
      case 'finance': {
        // Delegate to internal finance API (server-to-server call)
        const financeUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3100'}/api/finance`;
        const params = new URLSearchParams({
          action,
          ventureId,
          ...(req.query as Record<string, string>),
        });

        // We proxy with service key since we've already auth'd via API key
        const resp = await fetch(`${financeUrl}?${params.toString()}`, {
          headers: {
            // Pass a synthetic Clerk-compatible header for internal routing
            // The internal finance API requires Clerk auth — use service key bypass
            'x-mcv-internal': process.env.SUPABASE_SERVICE_KEY ?? '',
          },
        });

        if (!resp.ok) {
          const e = await resp.json().catch(() => ({})) as { error?: string };
          throw new Error(e.error ?? `Finance API ${resp.status}`);
        }

        const result = await resp.json() as { data: unknown };
        return ok(res, result.data, meta);
      }

      // ════════════════════════════════════════════════════════════════════════
      // WEBHOOKS (self-service management)
      // ════════════════════════════════════════════════════════════════════════
      case 'webhooks': {
        switch (action) {
          case 'list': {
            const endpoints = await listWebhooks(supabase, ventureId);
            return ok(res, endpoints, meta);
          }

          case 'create': {
            const { url, events, secret } = body;
            if (!url || !secret) return err(res, 400, 'url and secret are required');
            const endpoint = await registerWebhook(
              supabase,
              ventureId,
              url as string,
              (events as string[]) ?? ['*'],
              secret as string,
            );
            // Never return the secret back
            const { secret: _s, ...safeEndpoint } = endpoint;
            void _s;
            return ok(res, safeEndpoint, meta);
          }

          case 'delete': {
            const endpointId = getParam(req, 'endpointId') ?? (body.endpointId as string);
            if (!endpointId) return err(res, 400, 'endpointId is required');
            await removeWebhook(supabase, endpointId, ventureId);
            return ok(res, { deleted: true, endpointId }, meta);
          }

          default:
            return err(res, 400, `Unknown action "${action}" for resource "webhooks"`);
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // CAPITAL — third-party read access to rounds / commitments /
      // distributions, scoped to the API key's venture. Write actions
      // require `capital:write` permission (not yet exposed externally).
      // Epic 6 Story 2 — white-label API tier.
      // ═══════════════════════════════════════════════════════════════════
      case 'capital': {
        if (!apiKey.permissions.includes('capital:read') && !apiKey.permissions.includes('capital:write')) {
          return err(res, 403, 'API key missing capital:read or capital:write permission.');
        }
        const { createCapitalEngine } = await import('@mcv/capital-sdk');
        const engine = createCapitalEngine({ supabase });

        switch (action) {
          case 'list-rounds': {
            const rounds = await engine.rounds.listRounds(ventureId, {
              status: (body.status as never) ?? (getParam(req, 'status') as never),
              limit: Number(body.limit ?? getParam(req, 'limit') ?? 50),
            });
            return ok(res, { rounds }, meta);
          }
          case 'list-public-rounds': {
            // Public = is_public=true AND status IN (open,closing). Also
            // filtered by venture scope — partners only see their own rounds.
            const rounds = await engine.rounds.listPublicRounds({ ventureId });
            return ok(res, { rounds }, meta);
          }
          case 'get-round': {
            const id = getParam(req, 'id') ?? (body.id as string);
            if (!id) return err(res, 400, 'id is required');
            const round = await engine.rounds.getRound(id);
            if (!round) return err(res, 404, 'Round not found');
            if (round.ventureId !== ventureId) return err(res, 403, 'Round outside API key scope');
            return ok(res, { round }, meta);
          }
          case 'list-commitments': {
            const commitments = await engine.commitments.listCommitments(ventureId, {
              roundId: getParam(req, 'roundId') ?? (body.roundId as string | undefined),
              status: (body.status as never) ?? (getParam(req, 'status') as never),
              limit: Number(body.limit ?? getParam(req, 'limit') ?? 100),
            });
            return ok(res, { commitments }, meta);
          }
          case 'list-distributions': {
            const distributions = await engine.distributions.listDistributions(ventureId, {
              roundId: getParam(req, 'roundId') ?? (body.roundId as string | undefined),
              status: (body.status as never) ?? (getParam(req, 'status') as never),
              limit: Number(body.limit ?? getParam(req, 'limit') ?? 50),
            });
            return ok(res, { distributions }, meta);
          }
          case 'verify-accreditation-vc': {
            // Public verification endpoint — any holder of the VC can verify
            // via a partner API key. Requires only capital:read.
            const vc = body.vc ?? (() => { const s = getParam(req, 'vc'); return s ? JSON.parse(s) : null; })();
            if (!vc) return err(res, 400, 'vc body param is required');
            const { verifyAccreditationCredential } = await import('../../../src/lib/capital/vc-issuer');
            const result = verifyAccreditationCredential(vc as never);
            return ok(res, result, meta);
          }

          // ── Write actions (require capital:write scope) ───────────────
          case 'create-round':
          case 'update-round-status':
          case 'create-commitment':
          case 'update-commitment-status':
          case 'record-payment':
          case 'issue-accreditation-vc': {
            if (!apiKey.permissions.includes('capital:write')) {
              return err(res, 403, `Action "${action}" requires capital:write permission.`);
            }
            switch (action) {
              case 'create-round': {
                const input = (body.round ?? {}) as Record<string, unknown>;
                // Enforce venture scoping — key can only create rounds in its own venture.
                if (input.ventureId && input.ventureId !== ventureId) {
                  return err(res, 403, 'round.ventureId outside API key scope');
                }
                const round = await engine.rounds.createRound({ ...input, ventureId } as never);
                return ok(res, { round }, meta);
              }
              case 'update-round-status': {
                const id = (body.id as string) ?? getParam(req, 'id');
                const status = (body.status as string) ?? getParam(req, 'status');
                if (!id || !status) return err(res, 400, 'id and status required');
                const existing = await engine.rounds.getRound(id);
                if (!existing || existing.ventureId !== ventureId) return err(res, 403, 'Round outside scope');
                const round = await engine.rounds.updateStatus(id, status as never, 'api-key');
                return ok(res, { round }, meta);
              }
              case 'create-commitment': {
                const input = (body.commitment ?? {}) as Record<string, unknown>;
                if (input.ventureId && input.ventureId !== ventureId) {
                  return err(res, 403, 'commitment.ventureId outside API key scope');
                }
                const commitment = await engine.commitments.createCommitment({ ...input, ventureId } as never);
                return ok(res, { commitment }, meta);
              }
              case 'update-commitment-status': {
                const id = (body.id as string) ?? getParam(req, 'id');
                const status = (body.status as string) ?? getParam(req, 'status');
                if (!id || !status) return err(res, 400, 'id and status required');
                const commitment = await engine.commitments.updateStatus(id, status as never, 'api-key');
                return ok(res, { commitment }, meta);
              }
              case 'record-payment': {
                const id = (body.id as string) ?? getParam(req, 'id');
                const paymentMethod = (body.paymentMethod as string) ?? getParam(req, 'paymentMethod');
                const ref = (body.reference as string) ?? getParam(req, 'reference');
                if (!id || !paymentMethod || !ref) return err(res, 400, 'id, paymentMethod, reference required');
                const commitment = await engine.commitments.recordPayment(id, paymentMethod as never, ref);
                return ok(res, { commitment }, meta);
              }
              case 'issue-accreditation-vc': {
                const { issueAccreditationCredential } = await import('../../../src/lib/capital/vc-issuer');
                const vc = issueAccreditationCredential({
                  clerkUserId: body.clerkUserId as string,
                  accreditationStatus: body.accreditationStatus as never,
                  jurisdiction: (body.jurisdiction as never) ?? 'US',
                  verificationMethod: (body.verificationMethod as string) ?? 'partner-attested',
                  exemptions: body.exemptions as string[] | undefined,
                  validityDays: body.validityDays as number | undefined,
                });
                return ok(res, { vc }, meta);
              }
            }
            return err(res, 500, 'unreachable');
          }
          default:
            return err(res, 400, `Unknown action "${action}" for resource "capital". Read: list-rounds, list-public-rounds, get-round, list-commitments, list-distributions, verify-accreditation-vc. Write: create-round, update-round-status, create-commitment, update-commitment-status, record-payment, issue-accreditation-vc`);
        }
      }

      default:
        return err(res, 404, `Unknown resource "${resource}". Valid: products, subscriptions, invoices, payments, credits, loans, ledger, finance, webhooks, capital`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return err(res, 500, msg);
  }
}
