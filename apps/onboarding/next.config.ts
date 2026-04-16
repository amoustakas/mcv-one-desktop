import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  // Workspace SDK ships as .ts source — let Next transpile it.
  transpilePackages: ['@mcv/onboarding-sdk'],
  outputFileTracingRoot: __dirname,
  eslint: { ignoreDuringBuilds: true },
};

export default config;
