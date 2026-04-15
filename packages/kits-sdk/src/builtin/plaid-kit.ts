import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function plaidApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch('/api/plaid', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Plaid ${res.status}`); }
  return res.json();
}

const createLinkToken: KitToolHandler = async (_input, ctx) => {
  const data = await plaidApi('create-link-token', {}, ctx);
  return { success: true, data, displayMarkdown: `Link token created: \`${data.link_token?.slice(0, 20)}...\`\nExpires: ${data.expiration}` };
};

const getAccounts: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('get-accounts', { access_token: input.access_token }, ctx);
  const accounts = data.accounts ?? [];
  const lines = accounts.map((a: { name: string; type: string; subtype: string; balances: { current: number; currency: string } }) =>
    `- **${a.name}** (${a.type}/${a.subtype}) — $${a.balances?.current?.toFixed(2) ?? 'N/A'} ${a.balances?.currency || 'USD'}`);
  return { success: true, data: accounts, displayMarkdown: `## Bank Accounts (${accounts.length})\n\n${lines.join('\n')}` };
};

const getBalances: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('get-balances', { access_token: input.access_token }, ctx);
  const accounts = data.accounts ?? [];
  const lines = accounts.map((a: { name: string; balances: { current: number; available: number } }) =>
    `- **${a.name}** — Current: $${a.balances?.current?.toFixed(2) ?? 'N/A'} | Available: $${a.balances?.available?.toFixed(2) ?? 'N/A'}`);
  return { success: true, data: accounts, displayMarkdown: `## Balances\n\n${lines.join('\n')}` };
};

const syncTransactions: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('sync-transactions', { access_token: input.access_token, cursor: input.cursor }, ctx);
  const added = data.added ?? [];
  const lines = added.slice(0, 20).map((t: { name: string; amount: number; date: string; category: string[] }) =>
    `- ${t.date} — **${t.name}** — $${t.amount.toFixed(2)} — ${t.category?.join(', ') || 'uncategorized'}`);
  return { success: true, data, displayMarkdown: `## Transactions (${added.length} new)\n\n${lines.join('\n')}${added.length > 20 ? `\n\n*...and ${added.length - 20} more*` : ''}` };
};

const getIdentity: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('get-identity', { access_token: input.access_token }, ctx);
  return { success: true, data, displayMarkdown: `## Account Identity\n\n\`\`\`json\n${JSON.stringify(data.accounts?.[0]?.owners, null, 2)}\n\`\`\`` };
};

const searchInstitutions: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('search-institutions', { query: input.query, count: input.limit ?? 5 }, ctx);
  const insts = data.institutions ?? [];
  const lines = insts.map((i: { name: string; institution_id: string; products: string[] }) =>
    `- **${i.name}** (\`${i.institution_id}\`) — ${i.products?.join(', ') || 'N/A'}`);
  return { success: true, data: insts, displayMarkdown: `## Institutions: "${input.query}"\n\n${lines.join('\n')}` };
};

const getHoldings: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('get-holdings', { access_token: input.access_token }, ctx);
  const holdings = data.holdings ?? [];
  const lines = holdings.slice(0, 20).map((h: { security_id: string; quantity: number; institution_value: number }) =>
    `- Security \`${h.security_id}\` — ${h.quantity} shares — $${h.institution_value?.toFixed(2) ?? 'N/A'}`);
  return { success: true, data: holdings, displayMarkdown: `## Investment Holdings (${holdings.length})\n\n${lines.join('\n')}` };
};

const listItems: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('list-items', { venture_id: input.venture_id || ctx.ventureId }, ctx);
  const items = data.items ?? [];
  if (items.length === 0) return { success: true, data: [], displayMarkdown: 'No linked Plaid items.' };
  const lines = items.map((i: { id: string; institution_name: string | null; accounts: Array<Record<string, unknown>>; status: string }) =>
    `- **${i.institution_name || 'Unknown'}** \`${i.id.slice(0, 8)}\` — ${i.accounts.length} account${i.accounts.length === 1 ? '' : 's'} · ${i.status}`);
  return { success: true, data: items, displayMarkdown: `## Linked Plaid Items (${items.length})\n\n${lines.join('\n')}` };
};

const authorizeTransfer: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('transfer-authorize', {
    plaid_item_id: input.plaid_item_id,
    account_id: input.account_id,
    type: input.type,
    amount_cents: input.amount_cents,
    description: input.description,
    user: input.user,
  }, ctx);
  const a = data.authorization;
  const ok = a?.decision === 'approved';
  return {
    success: ok,
    data,
    displayMarkdown: `**Transfer ${ok ? 'approved' : 'rejected'}**\n- Authorization: \`${a?.id}\`\n- Amount: $${(Number(input.amount_cents) / 100).toFixed(2)} ${input.type}\n- Decision: \`${a?.decision}\`${a?.decision_rationale ? '\n- Reason: ' + a.decision_rationale.description : ''}`,
  };
};

const createTransfer: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('transfer-create', {
    plaid_item_id: input.plaid_item_id,
    authorization_id: input.authorization_id,
    account_id: input.account_id,
    description: input.description,
  }, ctx);
  const t = data.transfer;
  return {
    success: true,
    data: t,
    displayMarkdown: `**Transfer created**\n- ID: \`${t?.id}\`\n- Status: \`${t?.status}\`\n- Amount: $${t?.amount}\n- Expected settlement: ${t?.expected_settlement_date || 'TBD'}`,
  };
};

const getTransfer: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('transfer-get', { transfer_id: input.transfer_id }, ctx);
  const t = data.transfer;
  return {
    success: true,
    data: t,
    displayMarkdown: `**Transfer \`${t?.id}\`**\n- Status: \`${t?.status}\`\n- Amount: $${t?.amount}${t?.failure_reason ? '\n- Failure: ' + t.failure_reason.description : ''}`,
  };
};

const listTransfers: KitToolHandler = async (input, ctx) => {
  const data = await plaidApi('list-transfers', { venture_id: input.venture_id || ctx.ventureId, limit: input.limit || 50 }, ctx);
  const transfers = data.transfers ?? [];
  if (transfers.length === 0) return { success: true, data: [], displayMarkdown: 'No ACH transfers yet.' };
  const lines = transfers.slice(0, 20).map((t: { type: string; amount_cents: number; status: string; created_at: string; description: string | null }) =>
    `- ${t.created_at.slice(0, 10)} · ${t.type} · $${(t.amount_cents / 100).toFixed(2)} · \`${t.status}\`${t.description ? ` — ${t.description}` : ''}`);
  return { success: true, data: transfers, displayMarkdown: `## ACH Transfers (${transfers.length})\n\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'plaid-finance',
  name: 'Plaid Financial Data',
  version: '1.0.0',
  description: 'Plaid banking data — accounts, balances, transactions, identity, investments, and institution search.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use plaid tools for bank account data, transaction history, balance checks, and financial identity verification. Most tools require an access_token from a linked bank.',
  tools: [
    { name: 'plaid_create_link_token', description: 'Create a Plaid Link token to start bank account linking.', input_schema: { type: 'object', properties: {} } },
    { name: 'plaid_get_accounts', description: 'List linked bank accounts.', input_schema: { type: 'object', properties: { access_token: { type: 'string' } }, required: ['access_token'] } },
    { name: 'plaid_get_balances', description: 'Get current balances for all linked accounts.', input_schema: { type: 'object', properties: { access_token: { type: 'string' } }, required: ['access_token'] } },
    { name: 'plaid_sync_transactions', description: 'Sync latest transactions (incremental).', input_schema: { type: 'object', properties: { access_token: { type: 'string' }, cursor: { type: 'string', description: 'Pagination cursor from previous sync' } }, required: ['access_token'] } },
    { name: 'plaid_get_identity', description: 'Get account holder identity (name, address, email, phone).', input_schema: { type: 'object', properties: { access_token: { type: 'string' } }, required: ['access_token'] } },
    { name: 'plaid_search_institutions', description: 'Search for banks/financial institutions by name.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'plaid_get_holdings', description: 'Get investment holdings (stocks, ETFs, etc.).', input_schema: { type: 'object', properties: { access_token: { type: 'string' } }, required: ['access_token'] } },
    { name: 'plaid_list_items', description: 'List persisted Plaid items (linked banks) for the current user, optionally filtered by venture.', input_schema: { type: 'object', properties: { venture_id: { type: 'string' } } } },
    { name: 'plaid_authorize_transfer', description: 'Authorize an ACH transfer (debit = pull from user bank; credit = push to user bank). REQUIRED before transfer_create. Returns an authorization_id.', input_schema: { type: 'object', properties: { plaid_item_id: { type: 'string', description: 'UUID from plaid_list_items' }, account_id: { type: 'string', description: 'Plaid account_id within the item' }, type: { type: 'string', enum: ['debit', 'credit'] }, amount_cents: { type: 'number', description: 'Integer cents, e.g. 12500 = $125.00' }, description: { type: 'string', description: 'Max 15 chars' }, user: { type: 'object', description: 'Identity verification (legal_name required)' } }, required: ['plaid_item_id', 'account_id', 'type', 'amount_cents'] } },
    { name: 'plaid_create_transfer', description: 'Execute a previously authorized ACH transfer. Pass the authorization_id from plaid_authorize_transfer.', input_schema: { type: 'object', properties: { plaid_item_id: { type: 'string' }, authorization_id: { type: 'string' }, account_id: { type: 'string' }, description: { type: 'string' } }, required: ['plaid_item_id', 'authorization_id', 'account_id'] } },
    { name: 'plaid_get_transfer', description: 'Get the current status of a Plaid transfer.', input_schema: { type: 'object', properties: { transfer_id: { type: 'string' } }, required: ['transfer_id'] } },
    { name: 'plaid_list_transfers', description: 'List recent ACH transfers from the audit log.', input_schema: { type: 'object', properties: { venture_id: { type: 'string' }, limit: { type: 'number' } } } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  plaid_create_link_token: createLinkToken,
  plaid_get_accounts: getAccounts,
  plaid_get_balances: getBalances,
  plaid_sync_transactions: syncTransactions,
  plaid_get_identity: getIdentity,
  plaid_search_institutions: searchInstitutions,
  plaid_get_holdings: getHoldings,
  plaid_list_items: listItems,
  plaid_authorize_transfer: authorizeTransfer,
  plaid_create_transfer: createTransfer,
  plaid_get_transfer: getTransfer,
  plaid_list_transfers: listTransfers,
};
