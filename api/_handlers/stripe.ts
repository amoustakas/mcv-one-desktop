import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { emitPaymentEvent } from './_payment-events.js';

import { requestLogger } from '../../src/lib/server/logger';
const _supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

interface VentureConnectAccount {
  stripe_account_id: string;
  application_fee_bps: number;
  charges_enabled: boolean;
}

async function getVentureConnectAccount(venture_id: string): Promise<VentureConnectAccount | null> {
  const { data } = await _supabase
    .from('venture_stripe_accounts')
    .select('stripe_account_id, application_fee_bps, charges_enabled')
    .eq('venture_id', venture_id)
    .maybeSingle();
  return data;
}

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


// ---------------------------------------------------------------------------
// Stripe API — customers, payments, subscriptions, invoices, balance, payouts
// Uses Stripe REST API directly (no SDK dependency needed)
// ---------------------------------------------------------------------------

const STRIPE_API = 'https://api.stripe.com/v1';

async function stripeFetch(path: string, token: string, options?: { method?: string; body?: Record<string, unknown> }) {
  const method = options?.method || 'GET';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  let bodyStr: string | undefined;
  if (options?.body) {
    bodyStr = new URLSearchParams(
      Object.entries(options.body).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== null) acc[k] = String(v);
        return acc;
      }, {}),
    ).toString();
  }

  const res = await fetch(`${STRIPE_API}${path}`, { method, headers, body: bodyStr });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `Stripe ${res.status}` } }));
    throw new Error(err.error?.message || `Stripe API ${res.status}`);
  }
  return res.json();
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

  let token: string;
  try {
    const result = await getProviderToken(userId, 'stripe');
    token = result.token;
  } catch {
    return res.status(500).json({ error: 'Stripe not connected. Add in Settings > Integrations or set STRIPE_SECRET_KEY.' });
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Customers ──
      case 'list-customers': {
        const { limit = '20', email } = req.query;
        let path = `/customers?limit=${limit}`;
        if (email) path += `&email=${encodeURIComponent(email as string)}`;
        return res.json(await stripeFetch(path, token));
      }
      case 'get-customer': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await stripeFetch(`/customers/${id}`, token));
      }
      case 'create-customer': {
        const { email, name, description, metadata } = req.body;
        return res.json(await stripeFetch('/customers', token, {
          method: 'POST', body: { email, name, description, ...(metadata || {}) },
        }));
      }

      // ── Payments ──
      case 'list-payments': {
        const { limit = '20', customer } = req.query;
        let path = `/payment_intents?limit=${limit}`;
        if (customer) path += `&customer=${customer}`;
        return res.json(await stripeFetch(path, token));
      }
      case 'get-payment': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await stripeFetch(`/payment_intents/${id}`, token));
      }
      case 'create-payment': {
        const { amount, currency = 'usd', customer, description, venture_id, metadata } = req.body;
        if (!amount) return res.status(400).json({ error: 'amount required' });

        const body: Record<string, unknown> = {
          amount, currency, customer, description,
          'payment_method_types[]': 'card',
        };

        // Pass-through metadata (accepts either nested or flat)
        if (metadata && typeof metadata === 'object') {
          for (const [k, v] of Object.entries(metadata)) {
            body[`metadata[${k}]`] = v;
          }
        }
        if (venture_id) body['metadata[venture_id]'] = venture_id;

        // ── Stripe Connect marketplace routing ──
        // If the venture has a connected account ready to accept charges,
        // route this as a DESTINATION CHARGE: platform is source of record,
        // venture receives the balance minus the platform fee.
        if (venture_id) {
          const vsa = await getVentureConnectAccount(venture_id);
          if (vsa && vsa.charges_enabled) {
            const applicationFee = Math.floor((amount * vsa.application_fee_bps) / 10000);
            body['transfer_data[destination]'] = vsa.stripe_account_id;
            if (applicationFee > 0) body['application_fee_amount'] = applicationFee;
          }
        }

        const piResult = await stripeFetch('/payment_intents', token, {
          method: 'POST', body,
        });
        await emitPaymentEvent({
          event_type: 'charge.created',
          processor: 'stripe',
          venture_id: venture_id ?? null,
          actor: userId,
          external_id: piResult?.id ?? null,
          amount_cents: amount,
          currency: (currency as string).toUpperCase(),
          status: piResult?.status ?? null,
          payload: { destination: body['transfer_data[destination]'], application_fee_amount: body['application_fee_amount'] },
        });
        return res.json(piResult);
      }

      // ── Subscriptions ──
      case 'list-subscriptions': {
        const { limit = '20', customer, status } = req.query;
        let path = `/subscriptions?limit=${limit}`;
        if (customer) path += `&customer=${customer}`;
        if (status) path += `&status=${status}`;
        return res.json(await stripeFetch(path, token));
      }
      case 'get-subscription': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await stripeFetch(`/subscriptions/${id}`, token));
      }
      case 'cancel-subscription': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await stripeFetch(`/subscriptions/${id}`, token, { method: 'DELETE' }));
      }

      // ── Invoices ──
      case 'list-invoices': {
        const { limit = '20', customer, status } = req.query;
        let path = `/invoices?limit=${limit}`;
        if (customer) path += `&customer=${customer}`;
        if (status) path += `&status=${status}`;
        return res.json(await stripeFetch(path, token));
      }
      case 'get-invoice': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await stripeFetch(`/invoices/${id}`, token));
      }

      // ── Balance & Payouts ──
      case 'get-balance':
        return res.json(await stripeFetch('/balance', token));

      case 'list-payouts': {
        const { limit = '20' } = req.query;
        return res.json(await stripeFetch(`/payouts?limit=${limit}`, token));
      }

      // ── Products & Prices ──
      case 'list-products': {
        const { limit = '20', active } = req.query;
        let path = `/products?limit=${limit}`;
        if (active !== undefined) path += `&active=${active}`;
        return res.json(await stripeFetch(path, token));
      }
      case 'list-prices': {
        const { limit = '20', product } = req.query;
        let path = `/prices?limit=${limit}`;
        if (product) path += `&product=${product}`;
        return res.json(await stripeFetch(path, token));
      }

      // ── Charges & Refunds ──
      case 'list-charges': {
        const { limit = '20', customer } = req.query;
        let path = `/charges?limit=${limit}`;
        if (customer) path += `&customer=${customer}`;
        return res.json(await stripeFetch(path, token));
      }
      case 'create-refund': {
        const { charge, amount, reason } = req.body;
        if (!charge) return res.status(400).json({ error: 'charge required' });
        const refundResult = await stripeFetch('/refunds', token, {
          method: 'POST', body: { charge, amount, reason },
        });
        await emitPaymentEvent({
          event_type: 'refund.created',
          processor: 'stripe',
          actor: userId,
          external_id: refundResult?.id ?? null,
          amount_cents: refundResult?.amount ?? amount ?? null,
          currency: (refundResult?.currency ?? 'USD').toUpperCase(),
          status: refundResult?.status ?? null,
          payload: { charge, reason },
        });
        return res.json(refundResult);
      }

      // ── Customer CRUD ──
      case 'update-customer': {
        const { id, email, name: custName, description: custDesc, metadata: custMeta } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const body: Record<string, unknown> = {};
        if (email) body.email = email;
        if (custName) body.name = custName;
        if (custDesc) body.description = custDesc;
        if (custMeta) Object.assign(body, custMeta);
        return res.json(await stripeFetch(`/customers/${id}`, token, { method: 'POST', body }));
      }

      case 'delete-customer': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await stripeFetch(`/customers/${id}`, token, { method: 'DELETE' }));
      }

      // ── Product CRUD ──
      case 'create-product': {
        const { name: prodName, description: prodDesc, metadata: prodMeta } = req.body;
        if (!prodName) return res.status(400).json({ error: 'name required' });
        return res.json(await stripeFetch('/products', token, { method: 'POST', body: { name: prodName, description: prodDesc, ...prodMeta } }));
      }

      case 'update-product': {
        const { id, name: upName, description: upDesc, active } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const body: Record<string, unknown> = {};
        if (upName) body.name = upName;
        if (upDesc) body.description = upDesc;
        if (active !== undefined) body.active = active;
        return res.json(await stripeFetch(`/products/${id}`, token, { method: 'POST', body }));
      }

      case 'delete-product': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await stripeFetch(`/products/${id}`, token, { method: 'DELETE' }));
      }

      // ── Price CRUD ──
      case 'create-price': {
        const { product: priceProduct, unit_amount, currency = 'usd', recurring } = req.body;
        if (!priceProduct || !unit_amount) return res.status(400).json({ error: 'product and unit_amount required' });
        const body: Record<string, unknown> = { product: priceProduct, unit_amount, currency };
        if (recurring) body['recurring[interval]'] = recurring;
        return res.json(await stripeFetch('/prices', token, { method: 'POST', body }));
      }

      // ── Subscription CRUD ──
      case 'create-subscription': {
        const { customer: subCust, price: subPrice, trial_period_days } = req.body;
        if (!subCust || !subPrice) return res.status(400).json({ error: 'customer and price required' });
        const body: Record<string, unknown> = { customer: subCust, 'items[0][price]': subPrice };
        if (trial_period_days) body.trial_period_days = trial_period_days;
        return res.json(await stripeFetch('/subscriptions', token, { method: 'POST', body }));
      }

      case 'update-subscription': {
        const { id, price: newPrice, proration_behavior = 'create_prorations' } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const body: Record<string, unknown> = { proration_behavior };
        if (newPrice) body['items[0][price]'] = newPrice;
        return res.json(await stripeFetch(`/subscriptions/${id}`, token, { method: 'POST', body }));
      }

      // ── Refund from PaymentIntent ──
      case 'refund-payment': {
        const { payment_intent, amount: refAmount, reason: refReason } = req.body;
        if (!payment_intent) return res.status(400).json({ error: 'payment_intent required' });
        const body: Record<string, unknown> = { payment_intent };
        if (refAmount) body.amount = refAmount;
        if (refReason) body.reason = refReason;
        return res.json(await stripeFetch('/refunds', token, { method: 'POST', body }));
      }

      // ── Coupons ──
      case 'create-coupon': {
        const { percent_off, duration = 'once', name: couponName, max_redemptions } = req.body;
        if (!percent_off) return res.status(400).json({ error: 'percent_off required' });
        return res.json(await stripeFetch('/coupons', token, { method: 'POST', body: { percent_off, duration, name: couponName, max_redemptions } }));
      }

      case 'list-coupons':
        return res.json(await stripeFetch('/coupons?limit=20', token));

      // ── Disputes ──
      case 'list-disputes': {
        const { limit = '10' } = req.query;
        return res.json(await stripeFetch(`/disputes?limit=${limit}`, token));
      }

      // ── Checkout Sessions ──
      case 'create-checkout-session': {
        const { customer: csCust, mode = 'payment', line_items, success_url, cancel_url } = req.body;
        if (!line_items || !success_url) return res.status(400).json({ error: 'line_items and success_url required' });
        return res.json(await stripeFetch('/checkout/sessions', token, {
          method: 'POST', body: { customer: csCust, mode, success_url, cancel_url, ...line_items },
        }));
      }

      // ── Billing Portal ──
      case 'create-portal-session': {
        const { customer: portalCust, return_url } = req.body;
        if (!portalCust || !return_url) return res.status(400).json({ error: 'customer and return_url required' });
        return res.json(await stripeFetch('/billing_portal/sessions', token, {
          method: 'POST', body: { customer: portalCust, return_url },
        }));
      }

      // ── Webhooks ──
      case 'list-webhook-endpoints':
        return res.json(await stripeFetch('/webhook_endpoints?limit=20', token));

      // ── Account ──
      case 'get-account':
        return res.json(await stripeFetch('/account', token));

      // ── Overview (dashboard summary) ──
      case 'overview': {
        const [balance, customers, payments, subs] = await Promise.all([
          stripeFetch('/balance', token),
          stripeFetch('/customers?limit=5', token),
          stripeFetch('/payment_intents?limit=5', token),
          stripeFetch('/subscriptions?limit=5&status=active', token),
        ]);
        return res.json({
          balance: balance.available,
          pending: balance.pending,
          recent_customers: customers.data?.length ?? 0,
          recent_payments: payments.data?.length ?? 0,
          active_subscriptions: subs.data?.length ?? 0,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
