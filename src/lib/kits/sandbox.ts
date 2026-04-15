// Thin shim — canonical implementation lives in @mcv/kits-sdk/sandbox.
//
// We register the app-specific Worker factory at module load. The worker
// asset URL uses Vite's `new URL(..., import.meta.url)` syntax so it must
// resolve against THIS file's location, not the SDK's. That's why the
// configureSandbox call lives here.

import { configureSandbox } from '@mcv/kits-sdk/sandbox';

configureSandbox({
  workerFactory: () =>
    new Worker(
      new URL('../../workers/kit-executor.worker.ts', import.meta.url),
      { type: 'module' },
    ),
});

export * from '@mcv/kits-sdk/sandbox';
