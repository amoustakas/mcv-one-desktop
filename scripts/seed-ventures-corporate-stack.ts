// scripts/seed-ventures-corporate-stack.ts
// Idempotent seed for jurisdictions + accounts + brand_kits across every venture.
// Run: pnpm tsx scripts/seed-ventures-corporate-stack.ts
// Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');

const supabase = createClient(url, key, { auth: { persistSession: false } });

interface JurisdictionSeed {
  venture_id: string;
  jurisdiction_code: string;
  regulatory_frameworks: string[];
  tax_structure: string;
}
interface AccountSeed {
  venture_id: string;
  account_type: 'bank' | 'treasury' | 'merchant' | 'tax' | 'crypto';
  provider: string;
  currency: string;
  account_ref?: string;
}
interface BrandKitSeed {
  venture_id: string;
  primary_domain: string;
  color_primary: string;
  color_accent: string;
  brand_kit_version: string;
}

const jurisdictions: JurisdictionSeed[] = [
  { venture_id: 'futurestate', jurisdiction_code: 'US-DE', regulatory_frameworks: ['Reg D 506(c)'], tax_structure: 'C-Corp' },
  { venture_id: 'futurestate', jurisdiction_code: 'CA-ON', regulatory_frameworks: ['NI 45-106'],   tax_structure: 'CCPC' },
  { venture_id: 'betedge',     jurisdiction_code: 'CA-ON', regulatory_frameworks: ['AGCO Ontario iGaming'], tax_structure: 'CCPC' },
  { venture_id: 'mcvgg',       jurisdiction_code: 'Global', regulatory_frameworks: ['Token Sale'], tax_structure: 'TBD' },
  { venture_id: 'warforge',    jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
  { venture_id: 'mcv-tech',    jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
  { venture_id: 'mcv-dev',     jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
  { venture_id: 'mcv-cx',      jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
  { venture_id: 'mcv-inc',     jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
];

const accounts: AccountSeed[] = [
  { venture_id: 'futurestate', account_type: 'bank',     provider: 'Mercury', currency: 'USD' },
  { venture_id: 'futurestate', account_type: 'bank',     provider: 'Wise',    currency: 'CAD' },
  { venture_id: 'futurestate', account_type: 'treasury', provider: 'USDC',    currency: 'USDC' },
  { venture_id: 'futurestate', account_type: 'merchant', provider: 'Stripe',  currency: 'USD' },
  { venture_id: 'betedge',     account_type: 'bank',     provider: 'Mercury', currency: 'CAD' },
  { venture_id: 'mcvgg',       account_type: 'treasury', provider: 'USDC',    currency: 'USDC' },
];

const brandKits: BrandKitSeed[] = [
  { venture_id: 'futurestate', primary_domain: 'futurestate.ai', color_primary: '#00F5FF', color_accent: '#8B5CF6', brand_kit_version: 'v2.1' },
  { venture_id: 'betedge',     primary_domain: 'betedge.ai',     color_primary: '#8B5CF6', color_accent: '#00F5FF', brand_kit_version: 'v1.0' },
  { venture_id: 'mcvgg',       primary_domain: 'mcv.gg',         color_primary: '#F472B6', color_accent: '#00F5FF', brand_kit_version: 'v1.0' },
  { venture_id: 'mcv-tech',    primary_domain: 'mcv.tech',       color_primary: '#6EE7B7', color_accent: '#00F5FF', brand_kit_version: 'v0.1' },
  { venture_id: 'mcv-dev',     primary_domain: 'mcv.dev',        color_primary: '#6EE7B7', color_accent: '#00F5FF', brand_kit_version: 'v0.1' },
  { venture_id: 'mcv-cx',      primary_domain: 'mcv.cx',         color_primary: '#F472B6', color_accent: '#00F5FF', brand_kit_version: 'v0.1' },
  { venture_id: 'mcv-inc',     primary_domain: 'mcv.inc',        color_primary: '#00F5FF', color_accent: '#8B5CF6', brand_kit_version: 'sovereign' },
];

async function main() {
  const { error: je } = await supabase.from('venture_jurisdictions').upsert(jurisdictions, { onConflict: 'venture_id,jurisdiction_code' });
  if (je) throw je;

  for (const a of accounts) {
    const existing = await supabase.from('venture_accounts')
      .select('id').eq('venture_id', a.venture_id).eq('account_type', a.account_type).eq('provider', a.provider).maybeSingle();
    if (!existing.data) {
      const { error } = await supabase.from('venture_accounts').insert(a);
      if (error) throw error;
    }
  }

  const { error: be } = await supabase.from('venture_brand_kits').upsert(brandKits, { onConflict: 'venture_id' });
  if (be) throw be;

  console.log('✅ Corporate Stack seed complete');
  console.log(`   ${jurisdictions.length} jurisdictions`);
  console.log(`   ${accounts.length} accounts (if new)`);
  console.log(`   ${brandKits.length} brand kits`);
}

main().catch((e) => { console.error(e); process.exit(1); });
