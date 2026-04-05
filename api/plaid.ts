import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Plaid API — link tokens, accounts, transactions, balances, identity, institutions
// Uses Plaid REST API directly
// ---------------------------------------------------------------------------

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

const PLAID_BASE: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

async function plaidFetch(path: string, body: Record<string, unknown>) {
  const baseUrl = PLAID_BASE[PLAID_ENV] || PLAID_BASE.sandbox;
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      ...body,
    }),
  });
  const data = await res.json();
  if (data.error_code) throw new Error(`${data.error_code}: ${data.error_message}`);
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    return res.status(500).json({ error: 'PLAID_CLIENT_ID and PLAID_SECRET not configured' });
  }

  const { action } = req.body;

  try {
    switch (action) {
      // ── Link Token (for Plaid Link initialization) ──
      case 'create-link-token': {
        const { client_user_id } = req.body;
        return res.json(await plaidFetch('/link/token/create', {
          user: { client_user_id: client_user_id || userId },
          client_name: 'MCV One',
          products: ['transactions', 'auth', 'identity'],
          country_codes: ['US', 'CA'],
          language: 'en',
        }));
      }

      // ── Exchange public token for access token ──
      case 'exchange-token': {
        const { public_token } = req.body;
        if (!public_token) return res.status(400).json({ error: 'public_token required' });
        return res.json(await plaidFetch('/item/public_token/exchange', { public_token }));
      }

      // ── Accounts ──
      case 'get-accounts': {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token required' });
        return res.json(await plaidFetch('/accounts/get', { access_token }));
      }

      // ── Balances ──
      case 'get-balances': {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token required' });
        return res.json(await plaidFetch('/accounts/balance/get', { access_token }));
      }

      // ── Transactions (Sync — recommended) ──
      case 'sync-transactions': {
        const { access_token, cursor } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token required' });
        return res.json(await plaidFetch('/transactions/sync', {
          access_token, cursor: cursor || undefined, count: 100,
        }));
      }

      // ── Transactions (date range) ──
      case 'get-transactions': {
        const { access_token, start_date, end_date, count = 100 } = req.body;
        if (!access_token || !start_date || !end_date) {
          return res.status(400).json({ error: 'access_token, start_date, and end_date required' });
        }
        return res.json(await plaidFetch('/transactions/get', {
          access_token, start_date, end_date,
          options: { count, offset: 0 },
        }));
      }

      // ── Identity ──
      case 'get-identity': {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token required' });
        return res.json(await plaidFetch('/identity/get', { access_token }));
      }

      // ── Auth (account + routing numbers) ──
      case 'get-auth': {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token required' });
        return res.json(await plaidFetch('/auth/get', { access_token }));
      }

      // ── Item Info ──
      case 'get-item': {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token required' });
        return res.json(await plaidFetch('/item/get', { access_token }));
      }

      // ── Institutions ──
      case 'search-institutions': {
        const { query, products, count = 10 } = req.body;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await plaidFetch('/institutions/search', {
          query, products: products || ['transactions'],
          country_codes: ['US', 'CA'], options: { include_optional_metadata: true },
        }));
      }
      case 'get-institution': {
        const { institution_id } = req.body;
        if (!institution_id) return res.status(400).json({ error: 'institution_id required' });
        return res.json(await plaidFetch('/institutions/get_by_id', {
          institution_id, country_codes: ['US', 'CA'],
          options: { include_optional_metadata: true },
        }));
      }

      // ── Liabilities (loans, credit cards) ──
      case 'get-liabilities': {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token required' });
        return res.json(await plaidFetch('/liabilities/get', { access_token }));
      }

      // ── Investments ──
      case 'get-holdings': {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token required' });
        return res.json(await plaidFetch('/investments/holdings/get', { access_token }));
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
