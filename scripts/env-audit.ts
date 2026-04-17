#!/usr/bin/env tsx
/**
 * env-audit.ts — prod env var whitelist gate
 *
 * Usage:
 *   npm run env:audit              — diff .env.example against REQUIRED_FOR_PROD
 *   npm run env:audit:prod         — same + cross-check Vercel prod env (needs VERCEL_TOKEN)
 *
 * Exit 0 = all required keys present.
 * Exit 1 = one or more required keys are missing (build should fail).
 *
 * Keys are checked against .env.example (documentation gate) and optionally
 * against the live Vercel production environment (runtime gate).
 *
 * Server-only vs client-exposed distinction:
 *   VITE_* keys are bundled into the frontend — treat them as publicly visible.
 *   Non-VITE_ keys are server-only (api/ endpoints, Vercel Functions).
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

// ── Whitelist ──────────────────────────────────────────────────────────────

/**
 * Hard fail if ANY of these are missing from .env.example OR from Vercel prod env
 * (when --check-vercel is passed).
 *
 * Rationale for each:
 *   Auth         — Clerk secrets gate every authenticated request
 *   Supabase     — DB is unavailable without these; service key gates all server ops
 *   AI           — Core chat is dead without Claude; Gemini backs long-context flows
 *   Payments     — Money at stake: Stripe processes charges, Plaid reads bank accounts
 *   Solana       — On-chain ops (SPL token minting, Solana Pay) need an RPC
 *   Observability — Sentry DSN required for crash reporting in prod
 *   Cron         — All scheduled jobs auth via CRON_SECRET; missing = open cron endpoint
 *   Internal     — Triangle service-to-service calls blocked without shared secret
 *   Deployment   — VERCEL_TOKEN required for --check-vercel flag itself
 *   Encryption   — OAuth token store is plaintext without OAUTH_ENCRYPTION_KEY
 */
const REQUIRED_FOR_PROD: string[] = [
  // Auth (Clerk)
  'VITE_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',

  // Database (Supabase)
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY', // server-side service role key (named SUPABASE_SERVICE_KEY in this repo)

  // AI
  'ANTHROPIC_API_KEY', // Claude (server-side; no VITE_ prefix in this repo)
  'GOOGLE_AI_KEY', // Gemini (server-side)

  // Payments (money at stake)
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PLAID_CLIENT_ID',
  'PLAID_SECRET',

  // Blockchain
  'SOLANA_RPC_URL',

  // Observability
  'SENTRY_DSN',

  // Cron jobs (auth gate for /api/compliance-cron etc.)
  'CRON_SECRET',

  // Triangle internal service auth
  'INTERNAL_SERVICE_SECRET',

  // OAuth token encryption (AES-256-GCM)
  'OAUTH_ENCRYPTION_KEY',

  // Deployment (needed for --check-vercel, documented as mandatory infra)
  'VERCEL_TOKEN',
];

/**
 * Warn (but don't fail) if these are undocumented. Missing at runtime is
 * gracefully degraded — features that need them gate themselves.
 */
const NICE_TO_HAVE: string[] = [
  'DEEPGRAM_API_KEY',
  'ELEVENLABS_API_KEY',
  'VAPI_API_KEY',
  'N8N_BASE_URL',
  'N8N_API_KEY',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'SENDGRID_API_KEY',
  'RESEND_API_KEY',
  'OPENAI_API_KEY',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG_SLUG',
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse .env.example and return the set of documented key names.
 * Skips comment lines (# ...) and blank lines.
 * Accepts both `KEY=` and `KEY=value` forms.
 */
function parseEnvExample(filePath: string): Set<string> {
  const content = readFileSync(filePath, 'utf8');
  const keys = new Set<string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    // Match lines like: KEY=  or  KEY=value  or  KEY=value  # comment
    const match = trimmed.match(/^([A-Z][A-Z0-9_]*)=/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

/**
 * Query Vercel production env vars via the CLI.
 * Returns null if VERCEL_TOKEN is unset or the CLI call fails.
 *
 * Uses execFileSync (not execSync/exec) to avoid shell injection.
 * The token value comes exclusively from process.env — never user input.
 *
 * `vercel env ls` output format (varies by CLI version):
 *   KEY_NAME    Value Type    Environments    Created
 *   KEY_NAME    Encrypted     production      ...
 * We extract the first whitespace-delimited token per line that matches
 * a valid env var pattern.
 */
function fetchVercelEnvKeys(): Set<string> | null {
  const token = process.env['VERCEL_TOKEN'];
  if (!token) return null;

  try {
    const out = execFileSync(
      'vercel',
      ['env', 'ls', `--token=${token}`, '--environment=production'],
      { encoding: 'utf8', timeout: 15_000, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const keys = new Set<string>();
    for (const line of out.split('\n')) {
      const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s+/);
      if (m) keys.add(m[1]);
    }
    return keys;
  } catch {
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const envExamplePath = resolve(process.cwd(), '.env.example');
  const checkVercel = process.argv.includes('--check-vercel');

  const errors: string[] = [];
  const warnings: string[] = [];

  // ── 1. .env.example gate (documentation completeness) ─────────────────

  let exampleKeys: Set<string>;
  try {
    exampleKeys = parseEnvExample(envExamplePath);
  } catch (err) {
    console.error(`❌ Cannot read .env.example at ${envExamplePath}`);
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  console.log(`\n📋 Parsed ${exampleKeys.size} keys from .env.example\n`);

  for (const key of REQUIRED_FOR_PROD) {
    if (!exampleKeys.has(key)) {
      errors.push(`Missing from .env.example: ${key}`);
    }
  }

  for (const key of NICE_TO_HAVE) {
    if (!exampleKeys.has(key)) {
      warnings.push(`Not documented in .env.example: ${key}`);
    }
  }

  // ── 2. Vercel prod env gate (runtime completeness — optional) ──────────

  if (checkVercel) {
    console.log('🔍 Querying Vercel production environment...\n');
    const vercelKeys = fetchVercelEnvKeys();

    if (!vercelKeys) {
      warnings.push(
        'Could not query Vercel prod env (VERCEL_TOKEN unset or vercel CLI unavailable)',
      );
    } else {
      console.log(`  Found ${vercelKeys.size} keys in Vercel prod env\n`);
      for (const key of REQUIRED_FOR_PROD) {
        if (!vercelKeys.has(key)) {
          errors.push(`Missing from Vercel prod env: ${key}`);
        }
      }
    }
  }

  // ── 3. Report ──────────────────────────────────────────────────────────

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings (non-blocking):');
    for (const w of warnings) {
      console.warn(`   - ${w}`);
    }
    console.warn('');
  }

  if (errors.length > 0) {
    console.error('❌ Env audit FAILED — missing required keys:');
    for (const e of errors) {
      console.error(`   - ${e}`);
    }
    console.error(
      '\nFix: add each missing key to .env.example with a blank value,' +
        ' or remove it from REQUIRED_FOR_PROD if it is optional.\n',
    );
    process.exit(1);
  }

  console.log('✅ Env audit passed — all required keys are documented.\n');
}

main();
