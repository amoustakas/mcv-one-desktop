import { createServer } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const root = process.cwd();

const server = await createServer({
  root,
  server: { port: 0 },
  optimizeDeps: { disabled: true },
  appType: 'custom',
});

await server.pluginContainer.buildStart({});

const filePath = resolve(root, 'src/lib/ledger/__tests__/chart-of-accounts.test.ts');
const code = readFileSync(filePath, 'utf-8');

const result = await server.pluginContainer.transform(code, filePath);

console.log('Transform result:', result === null ? 'null (no-op)' : 'TRANSFORMED');
if (result) {
  console.log('First 500 chars of transformed code:');
  console.log(result.code.slice(0, 500));
}
await server.close();
process.exit(0);
