import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from './_oauth-helper.js';
import { emitPaymentEvent } from './_payment-events.js';

const _supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

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
      // Accepts optional { venture_id, institution_id, institution_name } to
      // persist the item row in plaid_items (encrypted access_token).
      case 'exchange-token': {
        const { public_token, venture_id, institution_id, institution_name, persist = true } = req.body;
        if (!public_token) return res.status(400).json({ error: 'public_token required' });
        const exchange = await plaidFetch('/item/public_token/exchange', { public_token });

        if (persist && exchange.access_token) {
          try {
            // Also pull accounts to store the account list alongside.
            const accountsRes = await plaidFetch('/accounts/get', { access_token: exchange.access_token });
            const encrypted = encryptToken(exchange.access_token);
            await _supabase.from('plaid_items').upsert({
              user_id: userId,
              venture_id: venture_id || null,
              item_id: exchange.item_id,
              institution_id: institution_id || null,
              institution_name: institution_name || null,
              access_token_encrypted: encrypted,
              accounts: accountsRes.accounts || [],
              status: 'active',
            }, { onConflict: 'item_id' });
          } catch {
            // Non-fatal — client still receives the access_token so it can
            // retry persistence via a separate call if needed.
          }
        }

        return res.json(exchange);
      }

      // ── List persisted Plaid items for the current user ──
      case 'list-items': {
        const { venture_id } = req.body;
        let q = _supabase.from('plaid_items')
          .select('id, item_id, institution_name, accounts, status, venture_id, created_at, last_sync_at')
          .eq('user_id', userId);
        if (venture_id) q = q.eq('venture_id', venture_id);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ items: data || [] });
      }

      // ── Remove a linked item (revoke) ──
      case 'remove-item': {
        const { plaid_item_id } = req.body;
        if (!plaid_item_id) return res.status(400).json({ error: 'plaid_item_id required' });
        const { data: row } = await _supabase.from('plaid_items')
          .select('access_token_encrypted').eq('id', plaid_item_id).eq('user_id', userId).maybeSingle();
        if (row?.access_token_encrypted) {
          try { await plaidFetch('/item/remove', { access_token: decryptToken(row.access_token_encrypted) }); } catch { /* best-effort */ }
        }
        await _supabase.from('plaid_items').update({ status: 'revoked' }).eq('id', plaid_item_id).eq('user_id', userId);
        return res.json({ success: true });
      }

      // ── ACH Transfer: authorize (required before create) ──
      // Body: { plaid_item_id, account_id, type: 'debit'|'credit', amount_cents, description, user: { legal_name, email_address?, ... } }
      case 'transfer-authorize': {
        const { plaid_item_id, account_id, type, amount_cents, description, user } = req.body;
        if (!plaid_item_id || !account_id || !type || !amount_cents) {
          return res.status(400).json({ error: 'plaid_item_id, account_id, type, amount_cents required' });
        }
        const { data: item } = await _supabase.from('plaid_items')
          .select('access_token_encrypted, venture_id')
          .eq('id', plaid_item_id).eq('user_id', userId).maybeSingle();
        if (!item) return res.status(404).json({ error: 'plaid item not found' });

        const access_token = decryptToken(item.access_token_encrypted);
        const amountStr = (amount_cents / 100).toFixed(2);
        const authRes = await plaidFetch('/transfer/authorization/create', {
          access_token, account_id, type, network: 'ach',
          amount: amountStr,
          ach_class: 'ppd',
          user: user || { legal_name: 'MCV User' },
        });

        // Persist authorization
        await _supabase.from('plaid_transfers').insert({
          user_id: userId,
          venture_id: item.venture_id,
          plaid_item_id,
          authorization_id: authRes.authorization?.id,
          account_id,
          type,
          amount_cents,
          description: description || null,
          user_info: user || null,
          status: authRes.authorization?.decision === 'approved' ? 'pending' : 'failed',
          failure_reason: authRes.authorization?.decision_rationale?.description || null,
          authorized_at: authRes.authorization?.created ? new Date(authRes.authorization.created).toISOString() : null,
        });

        return res.json(authRes);
      }

      // ── ACH Transfer: create (after authorization approved) ──
      case 'transfer-create': {
        const { plaid_item_id, authorization_id, account_id, description } = req.body;
        if (!plaid_item_id || !authorization_id || !account_id) {
          return res.status(400).json({ error: 'plaid_item_id, authorization_id, account_id required' });
        }
        const { data: item } = await _supabase.from('plaid_items')
          .select('access_token_encrypted').eq('id', plaid_item_id).eq('user_id', userId).maybeSingle();
        if (!item) return res.status(404).json({ error: 'plaid item not found' });

        const access_token = decryptToken(item.access_token_encrypted);
        const transferRes = await plaidFetch('/transfer/create', {
          access_token, account_id, authorization_id,
          description: (description || 'MCV transfer').slice(0, 15),
        });

        await _supabase.from('plaid_transfers').update({
          transfer_id: transferRes.transfer?.id,
          status: mapPlaidStatus(transferRes.transfer?.status),
        }).eq('authorization_id', authorization_id).eq('user_id', userId);

        // Emit unified audit event (best-effort, uses venture from the
        // updated plaid_transfers row).
        const { data: xferRow } = await _supabase.from('plaid_transfers')
          .select('venture_id, type, amount_cents, currency')
          .eq('authorization_id', authorization_id).eq('user_id', userId)
          .maybeSingle();
        await emitPaymentEvent({
          event_type: 'transfer.created',
          processor: 'plaid',
          venture_id: xferRow?.venture_id ?? null,
          actor: userId,
          external_id: transferRes.transfer?.id,
          amount_cents: xferRow?.amount_cents ?? null,
          currency: (xferRow?.currency ?? 'USD').toUpperCase(),
          status: transferRes.transfer?.status ?? null,
          payload: { authorization_id, account_id, type: xferRow?.type },
        });

        return res.json(transferRes);
      }

      // ── ACH Transfer: status ──
      case 'transfer-get': {
        const { transfer_id } = req.body;
        if (!transfer_id) return res.status(400).json({ error: 'transfer_id required' });
        const transferRes = await plaidFetch('/transfer/get', { transfer_id });
        await _supabase.from('plaid_transfers').update({
          status: mapPlaidStatus(transferRes.transfer?.status),
          failure_reason: transferRes.transfer?.failure_reason?.description || null,
        }).eq('transfer_id', transfer_id).eq('user_id', userId);
        return res.json(transferRes);
      }

      // ── List local transfers (from our audit table) ──
      case 'list-transfers': {
        const { venture_id, limit = 50 } = req.body;
        let q = _supabase.from('plaid_transfers')
          .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
        if (venture_id) q = q.eq('venture_id', venture_id);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ transfers: data || [] });
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
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}

function mapPlaidStatus(plaidStatus?: string): string {
  switch (plaidStatus) {
    case 'pending': return 'pending';
    case 'posted': return 'posted';
    case 'settled': return 'settled';
    case 'cancelled': return 'cancelled';
    case 'failed': return 'failed';
    case 'returned': return 'returned';
    default: return 'pending';
  }
}
