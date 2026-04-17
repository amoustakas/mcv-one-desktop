import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the monorepo root .env.local so the wizard picks up secrets the
// Desktop app already uses (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY,
// SUPABASE_SERVICE_KEY, ...). Without this, Next only reads env files
// sitting next to next.config.ts, which we don't want duplicated.
const rootEnvPath = resolve(__dirname, '../../.env.local');
if (existsSync(rootEnvPath)) {
  for (const line of readFileSync(rootEnvPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const config: NextConfig = {
  // Workspace SDK ships as .ts source — let Next transpile it.
  transpilePackages: ['@mcv/onboarding-sdk'],
  outputFileTracingRoot: __dirname,
  eslint: { ignoreDuringBuilds: true },
};

export default config;
