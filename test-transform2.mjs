import { workflowTransformPlugin } from './node_modules/@workflow/rollup/dist/index.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const plugin = workflowTransformPlugin({ exclude: [] });

const filePath = resolve(process.cwd(), 'src/lib/ledger/__tests__/chart-of-accounts.test.ts');
const code = readFileSync(filePath, 'utf-8');

console.log('Calling transform...');
const result = await plugin.transform.call({}, code, filePath);
console.log('Result:', result === null ? 'null (workflow correctly skipped this file)' : 'TRANSFORMED (unexpected!)');
