import type { NextConfig } from 'next';

const config: NextConfig = {
  // Transpile the workspace SDK (ships as .ts source, no build step)
  transpilePackages: ['@mcv/capital-sdk'],
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
