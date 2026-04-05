import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function ledgerApi(
  action: string,
  params: Record<string, unknown>,
  ctx: KitExecutionContext,
) {
  const query = new URLSearchParams({ action, ventureId: ctx.ventureId });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  }
  const res = await ctx.fetch(`/api/ledger?${query.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error || `Ledger API ${res.status}`);
  }
  return res.json();
}

const listAccounts: KitToolHandler = async (input, ctx) => {
  const data = await ledgerApi('list-accounts', { type: input.type ?? '' }, ctx);
  const accounts: Array<{ code: string; name: string; type: string; currency: string }> =
    data.accounts ?? [];
  if (accounts.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No accounts found.' };
  }
  const header = '| Code | Name | Type | Currency |\n|------|------|------|----------|\n';
  const rows = accounts
    .map((a) => `| ${a.code} | ${a.name} | ${a.type} | ${a.currency} |`)
    .join('\n');
  const typeLabel = input.type ? ` (type: ${input.type})` : '';
  return {
    success: true,
    data: accounts,
    displayMarkdown: `## Chart of Accounts${typeLabel} (${accounts.length})\n\n\`\`\`\n${header}${rows}\n\`\`\``,
  };
};

const trialBalance: KitToolHandler = async (_input, ctx) => {
  const data = await ledgerApi('trial-balance', {}, ctx);
  const rows: Array<{ code: string; name: string; debit: number; credit: number }> =
    data.rows ?? [];
  if (rows.length === 0) {
    return { success: true, data: [], displayMarkdown: 'Trial balance is empty.' };
  }

  const pad = (s: string, n: number) => s.padEnd(n);
  const fmtAmt = (n: number) => (n > 0 ? `$${n.toFixed(2)}` : '');

  const colCode = 6;
  const colName = 36;
  const colAmt = 14;

  const divider = `${'-'.repeat(colCode + 2)}+${'-'.repeat(colName + 2)}+${'-'.repeat(colAmt + 2)}+${'-'.repeat(colAmt + 2)}`;
  const header =
    `${pad('Code', colCode)}  | ${pad('Account Name', colName)}  | ${pad('Debit', colAmt)}  | ${pad('Credit', colAmt)}`;

  const lines = rows.map(
    (r) =>
      `${pad(r.code, colCode)}  | ${pad(r.name, colName)}  | ${pad(fmtAmt(r.debit), colAmt)}  | ${pad(fmtAmt(r.credit), colAmt)}`,
  );

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const totalsLine = `${pad('', colCode)}  | ${pad('TOTALS', colName)}  | ${pad(`$${totalDebit.toFixed(2)}`, colAmt)}  | ${pad(`$${totalCredit.toFixed(2)}`, colAmt)}`;
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const table = [header, divider, ...lines, divider, totalsLine].join('\n');
  const balanceNote = balanced ? '_Ledger is balanced._' : `_WARNING: Out of balance by $${Math.abs(totalDebit - totalCredit).toFixed(2)}_`;

  return {
    success: true,
    data: { rows, totalDebit, totalCredit, balanced },
    displayMarkdown: `## Trial Balance\n\n\`\`\`\n${table}\n\`\`\`\n\n${balanceNote}`,
  };
};

const listEntries: KitToolHandler = async (input, ctx) => {
  const data = await ledgerApi('list-entries', { limit: input.limit ?? '20' }, ctx);
  const entries: Array<{
    id: string;
    date: string;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    currency: string;
  }> = data.entries ?? [];
  if (entries.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No journal entries found.' };
  }
  const lines = entries.map(
    (e) =>
      `- **${e.date}** — ${e.description} | DR: \`${e.debitAccount}\` / CR: \`${e.creditAccount}\` — $${e.amount.toFixed(2)} ${e.currency}`,
  );
  return {
    success: true,
    data: entries,
    displayMarkdown: `## Journal Entries (${entries.length})\n\n${lines.join('\n')}`,
  };
};

const creditBalance: KitToolHandler = async (input, ctx) => {
  if (!input.ownerId) {
    return { success: false, error: 'ownerId is required for ledger_credit_balance' };
  }
  const data = await ledgerApi(
    'credit-balance',
    { ownerId: input.ownerId, currency: input.currency ?? 'USD' },
    ctx,
  );
  const balance: number = data.balance ?? 0;
  const currency: string = data.currency ?? (input.currency as string) ?? 'USD';
  return {
    success: true,
    data,
    displayMarkdown: `## Credit Balance\n\n**Owner:** \`${input.ownerId}\`\n**Balance:** $${balance.toFixed(2)} ${currency}`,
  };
};

export const manifest: KitManifest = {
  id: 'ledger-finance',
  name: 'Universal Ledger',
  version: '1.0.0',
  description:
    'Double-entry accounting ledger — chart of accounts, trial balance, journal entries, and credit balance enquiries.',
  author: 'MCV',
  capabilities: ['network', 'supabase'],
  runtime: 'inline',
  ventureScope: '*',
  instructions:
    'Use ledger tools when the user asks about accounts, accounting balances, journal entries, debits/credits, financial statements, or a user\'s credit balance. Prefer ledger_trial_balance for a full financial snapshot.',
  tools: [
    {
      name: 'ledger_list_accounts',
      description:
        'List the chart of accounts for the current venture. Optionally filter by account type (asset, liability, equity, revenue, expense).',
      input_schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Filter by account type: asset | liability | equity | revenue | expense',
          },
        },
      },
    },
    {
      name: 'ledger_trial_balance',
      description:
        'Get the trial balance for the current venture showing debit and credit totals for every account, plus grand totals.',
      input_schema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'ledger_list_entries',
      description: 'List recent double-entry journal entries for the current venture.',
      input_schema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of entries to return (default 20)',
          },
        },
      },
    },
    {
      name: 'ledger_credit_balance',
      description: "Check a specific user's platform credit balance.",
      input_schema: {
        type: 'object',
        properties: {
          ownerId: {
            type: 'string',
            description: 'The user or entity ID whose credit balance to retrieve',
          },
          currency: {
            type: 'string',
            description: 'Currency code (default USD)',
          },
        },
        required: ['ownerId'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  ledger_list_accounts: listAccounts,
  ledger_trial_balance: trialBalance,
  ledger_list_entries: listEntries,
  ledger_credit_balance: creditBalance,
};
