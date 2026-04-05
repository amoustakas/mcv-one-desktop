import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  configFile: false,  // prevent merging with vite.config.ts
  plugins: [],
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/__tests__/**', 'src/lib/**/types.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
