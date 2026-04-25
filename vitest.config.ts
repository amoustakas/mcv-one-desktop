import { defineConfig, mergeConfig } from 'vitest/config';
import { createNodeVitestConfig } from '@mcv/vitest-config';
import path from 'path';

// vmForks pool is required to work around a Windows + Node.js v24 + Vitest v4 issue
// where the Vite module runner loads @vitest/runner via a different file URL
// (due to drive-letter case normalization), causing the module-level `runner`
// variable to be undefined when describe() calls initSuite().
// vmForks uses VM context isolation which avoids this path resolution issue.

export default mergeConfig(
  createNodeVitestConfig({
    pool: 'vmForks',
    include: [
      'src/**/__tests__/**/*.test.ts',
      'packages/**/src/**/__tests__/**/*.test.ts',
      'scripts/**/__tests__/**/*.test.ts',
      // VIL Session 2: pick up server/vision-broker/__tests__ and any
      // future server-side daemon test directories that follow the
      // co-located __tests__ convention.
      'server/**/__tests__/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/__tests__/**', 'src/lib/**/types.ts'],
    },
  }),
  defineConfig({
    plugins: [],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
);
