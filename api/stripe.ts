import { getProviderToken } from './_oauth-helper';
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
        const { amount, currency = 'usd', customer, description } = req.body;
        if (!amount) return res.status(400).json({ error: 'amount required' });
        return res.json(await stripeFetch('/payment_intents', token, {
          method: 'POST', body: { amount, currency, customer, description, 'payment_method_types[]': 'card' },
        }));
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
        return res.json(await stripeFetch('/refunds', token, {
          method: 'POST', body: { charge, amount, reason },
        }));
      }

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
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
