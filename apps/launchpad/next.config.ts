import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  // Transpile the workspace SDK (ships as .ts source, no build step)
  transpilePackages: ['@mcv/capital-sdk'],
  // Pin file-tracing root so Next.js doesn't climb to a higher-level lockfile
  outputFileTracingRoot: __dirname,
  eslint: {
    // Next.js App Router legitimately requires metadata exports alongside
    // components, which trips react-refresh/only-export-components.
    // Lint runs in monorepo CI; skipping here to keep build clean.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Permit iframe embedding for widget routes
  },
  async headers() {
    return [
      {
        source: '/widget/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default config;
