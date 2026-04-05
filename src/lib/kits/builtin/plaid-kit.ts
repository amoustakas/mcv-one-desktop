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
};
