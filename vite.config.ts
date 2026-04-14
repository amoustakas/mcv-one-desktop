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
