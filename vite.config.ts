import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { workflow } from 'workflow/vite'

export default defineConfig({
  plugins: [react(), workflow()],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    proxy: {
      // Proxy local server API in dev mode
      '/local': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
})
