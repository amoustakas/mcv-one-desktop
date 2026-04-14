// api/ledger.ts
// Vercel serverless function — Ledger API
// Actions: list-accounts, get-trial-balance, create-entry, post-entry, list-entries, provision-accounts

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

// ─────────────────────────────────────────────────────────────────────────────
// Default Chart of Accounts — inlined to avoid import.meta.env issues in Node
// Matches src/lib/ledger/chart-of-accounts.ts exactly
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CHART_OF_ACCOUNTS = [
  // ── ASSETS (1xxx) ──────────────────────────────────────
  { code: '1010', name: 'Cash - Stripe Balance',            type: 'asset',     subtype: 'cash',              currency: 'USD',  isSystem: true  },
  { code: '1011', name: 'Cash - Bank (Primary)',             type: 'asset',     subtype: 'bank',              currency: 'USD',  isSystem: true  },
  { code: '1012', name: 'Cash - Bank (Secondary)',           type: 'asset',     subtype: 'bank',              currency: 'USD',  isSystem: false },
  { code: '1013', name: 'Cash - PayPal Balance',             type: 'asset',     subtype: 'cash',              currency: 'USD',  isSystem: false },
  { code: '1014', name: 'Cash - Square Balance',             type: 'asset',     subtype: 'cash',              currency: 'USD',  isSystem: false },
  { code: '1020', name: 'Accounts Receivable',               type: 'asset',     subtype: 'receivable',        currency: 'USD',  isSystem: true  },
  { code: '1025', name: 'Accounts Receivable - Invoiced',    type: 'asset',     subtype: 'receivable',        currency: 'USD',  isSystem: true  },
  { code: '1030', name: 'Inventory - Physical Goods',        type: 'asset',     subtype: 'inventory',         currency: 'USD',  isSystem: false },
  { code: '1040', name: 'Prepaid Expenses',                  type: 'asset',     subtype: 'prepaid',           currency: 'USD',  isSystem: false },
  { code: '1050', name: 'Crypto - USDC Wallet',              type: 'asset',     subtype: 'crypto_wallet',     currency: 'USDC', isSystem: true  },
  { code: '1051', name: 'Crypto - SOL Wallet',               type: 'asset',     subtype: 'crypto_wallet',     currency: 'SOL',  isSystem: true  },
  { code: '1052', name: 'Crypto - EDGE Wallet',              type: 'asset',     subtype: 'crypto_wallet',     currency: 'EDGE', isSystem: true  },
  { code: '1055', name: 'Crypto - Exchange (Coinbase)',       type: 'asset',     subtype: 'exchange',          currency: 'USD',  isSystem: false },
  { code: '1060', name: 'Platform Credits Receivable',        type: 'asset',     subtype: 'receivable',        currency: 'USD',  isSystem: true  },
  { code: '1070', name: 'Loans Receivable - Short Term',      type: 'asset',     subtype: 'receivable',        currency: 'USD',  isSystem: true  },
  { code: '1071', name: 'Loans Receivable - Long Term',       type: 'asset',     subtype: 'receivable',        currency: 'USD',  isSystem: false },
  { code: '1095', name: 'Escrow Holding',                     type: 'asset',     subtype: 'cash',              currency: 'USD',  isSystem: true  },

  // ── LIABILITIES (2xxx) ─────────────────────────────────
  { code: '2010', name: 'Accounts Payable',                  type: 'liability', subtype: 'payable',           currency: 'USD',  isSystem: true  },
  { code: '2020', name: 'Credits Payable',                   type: 'liability', subtype: 'credit_payable',    currency: 'USD',  isSystem: true  },
  { code: '2030', name: 'Unearned Revenue',                  type: 'liability', subtype: 'unearned_revenue',  currency: 'USD',  isSystem: true  },
  { code: '2040', name: 'Loans Payable - Short Term',        type: 'liability', subtype: 'loan',              currency: 'USD',  isSystem: false },
  { code: '2050', name: 'Platform Fees Payable',             type: 'liability', subtype: 'payable',           currency: 'USD',  isSystem: true  },
  { code: '2060', name: 'Tax Payable - Sales Tax',           type: 'liability', subtype: 'tax_payable',       currency: 'USD',  isSystem: true  },
  { code: '2070', name: 'Refunds Payable',                   type: 'liability', subtype: 'payable',           currency: 'USD',  isSystem: true  },
  { code: '2080', name: 'Customer Deposits',                 type: 'liability', subtype: 'payable',           currency: 'USD',  isSystem: false },

  // ── EQUITY (3xxx) ──────────────────────────────────────
  { code: '3010', name: "Owner's Equity",                    type: 'equity',    subtype: 'equity',            currency: 'USD',  isSystem: true  },
  { code: '3020', name: 'Retained Earnings',                 type: 'equity',    subtype: 'retained_earnings', currency: 'USD',  isSystem: true  },
  { code: '3030', name: 'Token Treasury',                    type: 'equity',    subtype: 'treasury',          currency: 'EDGE', isSystem: true  },

  // ── REVENUE (4xxx) ─────────────────────────────────────
  { code: '4010', name: 'Revenue - Subscriptions',           type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4020', name: 'Revenue - One-Time Sales',          type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4030', name: 'Revenue - Digital Products',        type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4040', name: 'Revenue - Physical Goods',          type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4050', name: 'Revenue - Platform Fees',           type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4060', name: 'Revenue - Transaction Fees',        type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4070', name: 'Revenue - Credit Sales',            type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4080', name: 'Revenue - Interest (Loans)',        type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4090', name: 'Revenue - Yield Distributions',     type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4100', name: 'Revenue - Marketplace Commissions', type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4110', name: 'Revenue - Services',                type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4120', name: 'Revenue - Metered Usage',           type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },
  { code: '4130', name: 'Revenue - Royalties',               type: 'revenue',   subtype: 'revenue',           currency: 'USD',  isSystem: true  },

  // ── EXPENSES (5xxx) ────────────────────────────────────
  { code: '5010', name: 'COGS - Physical Goods',             type: 'expense',   subtype: 'cogs',              currency: 'USD',  isSystem: true  },
  { code: '5020', name: 'COGS - Digital Delivery',           type: 'expense',   subtype: 'cogs',              currency: 'USD',  isSystem: true  },
  { code: '5030', name: 'Payment Processing Fees',           type: 'expense',   subtype: 'operating_expense', currency: 'USD',  isSystem: true  },
  { code: '5040', name: 'Refunds & Chargebacks',             type: 'expense',   subtype: 'operating_expense', currency: 'USD',  isSystem: true  },
  { code: '5050', name: 'Credit Grants (Promotional)',        type: 'expense',   subtype: 'operating_expense', currency: 'USD',  isSystem: true  },
  { code: '5060', name: 'Loan Write-offs',                   type: 'expense',   subtype: 'operating_expense', currency: 'USD',  isSystem: true  },
  { code: '5070', name: 'Infrastructure Costs',              type: 'expense',   subtype: 'operating_expense', currency: 'USD',  isSystem: false },
  { code: '5080', name: 'Third-Party Service Fees',          type: 'expense',   subtype: 'operating_expense', currency: 'USD',  isSystem: false },
  { code: '5090', name: 'FX Gains/Losses',                   type: 'expense',   subtype: 'other',             currency: 'USD',  isSystem: true  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const ventureId = ((req.method === 'GET' ? req.query.ventureId : req.body?.ventureId) as string) ?? '';

  if (!ventureId) {
    return res.status(400).json({ error: 'ventureId is required' });
  }

  try {
    switch (action) {
      // ── list-accounts ────────────────────────────────────────────────────
      case 'list-accounts': {
        const { type } = req.query;
        let query = supabase
          .from('ledger_accounts')
          .select()
          .eq('venture_id', ventureId)
          .order('code');
        if (type) query = query.eq('type', type as string);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data });
      }

      // ── get-trial-balance ────────────────────────────────────────────────
      case 'get-trial-balance': {
        const asOfDate = req.query.asOfDate as string | undefined;

        let linesQuery = supabase
          .from('journal_entry_lines')
          .select(`
            account_id,
            debit_amount,
            credit_amount,
            journal_entries!inner(venture_id, status, entry_date)
          `)
          .eq('journal_entries.venture_id', ventureId)
          .eq('journal_entries.status', 'posted');

        if (asOfDate) {
          linesQuery = linesQuery.lte('journal_entries.entry_date', asOfDate);
        }

        const { data: lines, error: linesErr } = await linesQuery;
        if (linesErr) throw linesErr;

        // Aggregate by account in JS (PostgREST doesn't support GROUP BY)
        const totals = new Map<string, { debits: number; credits: number }>();
        for (const row of lines ?? []) {
          const existing = totals.get(row.account_id) ?? { debits: 0, credits: 0 };
          existing.debits += Number(row.debit_amount);
          existing.credits += Number(row.credit_amount);
          totals.set(row.account_id, existing);
        }

        const accountIds = Array.from(totals.keys());
        if (accountIds.length === 0) return res.json({ data: [] });

        const { data: accounts, error: acctErr } = await supabase
          .from('ledger_accounts')
          .select('id, code, name, type, currency')
          .in('id', accountIds);
        if (acctErr) throw acctErr;

        const trialBalance = (accounts ?? []).map((acc) => {
          const t = totals.get(acc.id)!;
          const net = t.debits - t.credits;
          const isDebitNormal = acc.type === 'asset' || acc.type === 'expense';
          return {
            accountId: acc.id,
            accountCode: acc.code,
            accountName: acc.name,
            accountType: acc.type,
            debitBalance: isDebitNormal ? Math.max(net, 0) : Math.max(-net, 0),
            creditBalance: isDebitNormal ? Math.max(-net, 0) : Math.max(net, 0),
            currency: acc.currency,
          };
        }).sort((a, b) => a.accountCode.localeCompare(b.accountCode));

        return res.json({ data: trialBalance });
      }

      // ── create-entry ─────────────────────────────────────────────────────
      case 'create-entry': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { entryDate, description, sourceType, sourceId, lines } = req.body;

        if (!entryDate) return res.status(400).json({ error: 'entryDate is required' });
        if (!description) return res.status(400).json({ error: 'description is required' });
        if (!Array.isArray(lines) || lines.length < 2) {
          return res.status(400).json({ error: 'lines must be an array with at least 2 entries' });
        }

        // Insert the journal entry header
        const { data: entry, error: entryErr } = await supabase
          .from('journal_entries')
          .insert({
            venture_id: ventureId,
            entry_number: 'TEMP',
            entry_date: entryDate,
            description,
            source_type: sourceType ?? 'manual',
            source_id: sourceId ?? null,
          })
          .select()
          .single();
        if (entryErr) throw entryErr;

        // Insert lines
        const lineRows = (lines as Record<string, unknown>[]).map((l, i) => ({
          entry_id: entry.id,
          account_id: l.accountId,
          line_number: i + 1,
          debit_amount: l.debitAmount ?? 0,
          credit_amount: l.creditAmount ?? 0,
          currency: l.currency ?? 'USD',
          exchange_rate: l.exchangeRate ?? 1,
        }));
        const { error: linesErr } = await supabase
          .from('journal_entry_lines')
          .insert(lineRows);
        if (linesErr) throw linesErr;

        return res.json({ data: entry });
      }

      // ── post-entry ───────────────────────────────────────────────────────
      case 'post-entry': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { entryId } = req.body;
        if (!entryId) return res.status(400).json({ error: 'entryId is required' });

        const { data, error } = await supabase
          .from('journal_entries')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            posted_by: userId,
          })
          .eq('id', entryId)
          .eq('venture_id', ventureId)
          .eq('status', 'draft')
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      // ── list-entries ─────────────────────────────────────────────────────
      case 'list-entries': {
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const offset = Number(req.query.offset) || 0;
        const status = req.query.status as string | undefined;

        let query = supabase
          .from('journal_entries')
          .select('*, journal_entry_lines(*)')
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset } });
      }

      // ── provision-accounts ───────────────────────────────────────────────
      case 'provision-accounts': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

        const rows = DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
          venture_id: ventureId,
          code: a.code,
          name: a.name,
          type: a.type,
          subtype: a.subtype,
          currency: a.currency,
          is_system: a.isSystem,
          metadata: {},
        }));

        const { error } = await supabase
          .from('ledger_accounts')
          .insert(rows);
        if (error) throw error;

        return res.json({ data: { provisioned: rows.length } });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
