import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { workflow } from 'workflow/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // /api/* proxy target. Default: local server on 3100 (server/local.ts
  // loads every api/*.ts handler via registerApiRoutes). Override with
  // VITE_API_PROXY_TARGET=https://mcv-one-desktop.vercel.app to hit the
  // deployed Vercel functions instead (useful if local deps are broken).
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3100'
  return {
    plugins: [react(), workflow()],
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    optimizeDeps: {
      // @mcv/voice-sdk's optional-peer SDKs — keep Vite's dep-scanner from
      // trying to pre-bundle packages we don't install. Combined with the
      // /* @vite-ignore */ comments on the dynamic imports themselves, dev
      // mode no longer barfs with "Failed to resolve import ...".
      exclude: [
        '@elevenlabs/elevenlabs-js',
        '@deepgram/sdk',
        '@vapi-ai/server-sdk',
        'openai/realtime/ws',
        'openai/realtime/websocket',
      ],
    },
    build: {
      // @mcv/voice-sdk provider adapters dynamic-import these SDKs as
      // optional peers — a host app only installs the providers it needs.
      // Mark them external so Rolldown doesn't fail to resolve at bundle
      // time; unavailable providers throw a friendly runtime error via
      // their try/catch fallback ("X not installed; <provider> unavailable").
      rollupOptions: {
        external: [
          '@elevenlabs/elevenlabs-js',
          '@deepgram/sdk',
          '@vapi-ai/server-sdk',
          'openai/realtime/ws',
          'openai/realtime/websocket',
        ],
      },
    },
    server: {
      proxy: {
        '/local/browser/stream': {
          target: 'ws://localhost:3100',
          ws: true,
        },
        '/local': {
          target: 'http://localhost:3100',
          changeOrigin: true,
        },
        // /api/* is served by server/local.ts (which dynamically loads the
        // api/*.ts Vercel handlers as Express routes). Fallback to the
        // deployed Vercel URL via VITE_API_PROXY_TARGET if the local server
        // isn't running (e.g. running `npm run dev` without `:local`).
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
