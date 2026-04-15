import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

const EP = '/api/stripe-connect';

const createAccount: KitToolHandler = async (input, ctx) => {
  const data = await postJson(EP, {
    action: 'create-account',
    venture_id: (input.venture_id as string) || ctx.ventureId,
    email: input.email,
    country: input.country || 'US',
    business_name: input.business_name,
  }, ctx);
  const a = data.account;
  return {
    success: true,
    data: a,
    displayMarkdown: `**Stripe Connect Express account ${data.created ? 'created' : 'exists'}**\n- Venture: \`${a.venture_id}\`\n- Account: \`${a.stripe_account_id}\`\n- Country: ${a.country}\n- Charges: ${a.charges_enabled ? '✅' : '❌'} · Payouts: ${a.payouts_enabled ? '✅' : '❌'}`,
  };
};

const onboardingLink: KitToolHandler = async (input, ctx) => {
  const data = await postJson(EP, {
    action: 'onboarding-link',
    venture_id: (input.venture_id as string) || ctx.ventureId,
  }, ctx);
  return {
    success: true,
    data,
    displayMarkdown: `**Stripe onboarding link** (expires shortly):\n\n[Open onboarding →](${data.url})\n\nThe venture owner signs in to Stripe, completes KYC/banking, and returns to MCV. Run \`stripe_connect_status\` after.`,
  };
};

const accountStatus: KitToolHandler = async (input, ctx) => {
  const data = await postJson(EP, {
    action: 'account-status',
    venture_id: (input.venture_id as string) || ctx.ventureId,
  }, ctx);
  const a = data.account;
  const req = (a.requirements_currently_due as string[]) || [];
  let md = `**Account status**\n- Charges enabled: ${a.charges_enabled ? '✅' : '❌'}\n- Payouts enabled: ${a.payouts_enabled ? '✅' : '❌'}\n- Details submitted: ${a.details_submitted ? '✅' : '❌'}\n`;
  if (req.length) md += `- Currently due: ${req.map((r: string) => '`' + r + '`').join(', ')}\n`;
  return { success: true, data: a, displayMarkdown: md };
};

const dashboardLink: KitToolHandler = async (input, ctx) => {
  const data = await postJson(EP, {
    action: 'dashboard-link',
    venture_id: (input.venture_id as string) || ctx.ventureId,
  }, ctx);
  return { success: true, data, displayMarkdown: `**Stripe Express dashboard:**\n\n[Open dashboard →](${data.url})` };
};

const listAccounts: KitToolHandler = async (_input, ctx) => {
  const data = await postJson(EP, { action: 'list-accounts' }, ctx);
  const accounts = (data.accounts || []) as Array<Record<string, unknown>>;
  if (accounts.length === 0) return { success: true, data: [], displayMarkdown: 'No Stripe Connect accounts yet.' };
  let md = `## Connect Accounts (${accounts.length})\n\n`;
  for (const a of accounts) {
    md += `- **${a.venture_id}** · \`${a.stripe_account_id}\` · charges ${a.charges_enabled ? '✅' : '❌'} · payouts ${a.payouts_enabled ? '✅' : '❌'} · fee ${(a.application_fee_bps as number) / 100}%\n`;
  }
  return { success: true, data: accounts, displayMarkdown: md };
};

const triggerPayout: KitToolHandler = async (input, ctx) => {
  const data = await postJson(EP, {
    action: 'payout',
    venture_id: (input.venture_id as string) || ctx.ventureId,
    amount: input.amount,
    currency: input.currency || 'usd',
  }, ctx);
  const p = data.payout;
  return {
    success: true,
    data: p,
    displayMarkdown: `**Payout initiated**\n- ID: \`${p.id}\`\n- Amount: ${p.amount} ${p.currency.toUpperCase()}\n- Status: \`${p.status}\`\n- Arrival: ${p.arrival_date ? new Date(p.arrival_date * 1000).toISOString().slice(0, 10) : 'pending'}`,
  };
};

const updateFee: KitToolHandler = async (input, ctx) => {
  const data = await postJson(EP, {
    action: 'update-fee',
    venture_id: input.venture_id as string,
    application_fee_bps: input.application_fee_bps as number,
  }, ctx);
  return { success: true, data: data.account, displayMarkdown: `Platform fee for \`${input.venture_id}\` set to ${(input.application_fee_bps as number) / 100}%.` };
};

export const manifest: KitManifest = {
  id: 'stripe-connect',
  name: 'Stripe Connect',
  version: '1.0.0',
  description: 'Onboard ventures to Stripe Connect Express, manage platform fees, and trigger payouts to connected accounts. Used for multi-venture marketplace payments.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools to onboard a venture to Stripe Connect (Express accounts). Typical flow: create_account → onboarding_link (sends to venture owner) → status (check capabilities). Platform fee defaults to 10% (1000 bps). Payouts require payouts_enabled=true.',
  tools: [
    {
      name: 'stripe_connect_create_account',
      description: 'Create a Stripe Express account for a venture. Idempotent — returns existing account if one exists for this venture.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string', description: 'Venture slug (e.g., futurestate, mcv)' },
          email: { type: 'string', description: 'Venture owner email (for Stripe notifications)' },
          country: { type: 'string', description: '2-letter country code. Defaults to US.' },
          business_name: { type: 'string' },
        },
        required: ['venture_id'],
      },
    },
    {
      name: 'stripe_connect_onboarding_link',
      description: 'Generate a one-time Stripe-hosted onboarding URL. Send this to the venture owner so they can complete KYC + banking.',
      input_schema: {
        type: 'object',
        properties: { venture_id: { type: 'string' } },
        required: ['venture_id'],
      },
    },
    {
      name: 'stripe_connect_status',
      description: 'Fetch fresh capability + requirements status from Stripe and sync to DB. Returns charges_enabled, payouts_enabled, requirements currently due.',
      input_schema: {
        type: 'object',
        properties: { venture_id: { type: 'string' } },
        required: ['venture_id'],
      },
    },
    {
      name: 'stripe_connect_dashboard_link',
      description: 'Generate a magic-link URL into the Stripe Express dashboard for this venture.',
      input_schema: {
        type: 'object',
        properties: { venture_id: { type: 'string' } },
        required: ['venture_id'],
      },
    },
    {
      name: 'stripe_connect_list_accounts',
      description: 'List all ventures with Stripe Connect accounts and their capability status.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'stripe_connect_payout',
      description: 'Trigger a manual payout from a venture\'s Stripe balance to its linked bank account. Requires payouts_enabled=true.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          amount: { type: 'number', description: 'Amount in major units (e.g., 250.00 for $250)' },
          currency: { type: 'string', description: 'ISO currency. Defaults to usd.' },
        },
        required: ['venture_id', 'amount'],
      },
    },
    {
      name: 'stripe_connect_update_fee',
      description: 'Update the platform fee (in basis points, 0-10000) charged on transactions for this venture. Default is 1000 (10%).',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          application_fee_bps: { type: 'number', description: '0-10000. 1000 = 10%.' },
        },
        required: ['venture_id', 'application_fee_bps'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  stripe_connect_create_account: createAccount,
  stripe_connect_onboarding_link: onboardingLink,
  stripe_connect_status: accountStatus,
  stripe_connect_dashboard_link: dashboardLink,
  stripe_connect_list_accounts: listAccounts,
  stripe_connect_payout: triggerPayout,
  stripe_connect_update_fee: updateFee,
};
