#!/usr/bin/env node
// Patch every api/_handlers/*.ts file to emit request_in / request_out / error
// via pino structured logging. Idempotent: skips files already patched.
//
// Strategy: add a logger import + request_logger invocation at the top of each
// default export's body, with res.on('finish') for request_out. This is a
// non-wrapping pattern — no try/catch injection, no return-path rewriting —
// so handler logic stays untouched.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, relative, sep } from 'node:path';

const cwd = process.cwd();

// Skip list — owned by Antigravity session or by I2.2 subagent
// (factory.ts not present; health.ts patched if tracked).
const SKIP = new Set([
  'api/_handlers/factory.ts',
  // helper files — not HTTP handlers
  'api/_handlers/_auth.ts',
  'api/_handlers/_embeddings.ts',
  'api/_handlers/_google-helpers.ts',
  'api/_handlers/_oauth-helper.ts',
  'api/_handlers/_payment-events.ts',
  'api/_handlers/_rag-index.ts',
  'api/_handlers/_supabase.ts',
]);

function listHandlers() {
  const out = execFileSync('git', ['ls-files', 'api/_handlers/*.ts', 'api/_handlers/**/*.ts'], {
    cwd,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .map((l) => l.trim().replace(/\\/g, '/'))
    .filter(Boolean)
    .filter((f) => !SKIP.has(f))
    .filter((f) => !f.split('/').pop().startsWith('_')); // skip any underscore helpers
}

function relativeLoggerImport(handlerPath) {
  const fromDir = dirname(handlerPath);
  const toFile = 'src/lib/server/logger';
  let rel = relative(fromDir, toFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

const ALREADY_PATCHED = /from ['"][^'"]*src\/lib\/server\/logger['"]/;

function patchSource(src, importPath) {
  if (ALREADY_PATCHED.test(src)) return { changed: false, src, reason: 'already-patched' };

  const defaultExportIdx = src.indexOf('export default');
  if (defaultExportIdx === -1) return { changed: false, src, reason: 'no-default-export' };

  const tail = src.slice(defaultExportIdx);
  const funcMatch = tail.match(
    /^export default\s+(async\s+)?function\b[^{]*\(([^)]*)\)\s*(?::[^{]+)?\s*\{/m,
  );
  const arrowMatch = tail.match(
    /^export default\s+(async\s+)?\(([^)]*)\)\s*(?::[^{]+)?\s*=>\s*\{/m,
  );

  let sigMatch = funcMatch ?? arrowMatch;
  if (!sigMatch) return { changed: false, src, reason: 'unsupported-export-shape' };

  const paramList = sigMatch[2];
  const firstParam = paramList.split(',')[0]?.trim();
  if (!firstParam) return { changed: false, src, reason: 'no-params' };

  const actualReqName = firstParam.split(':')[0].trim();
  if (actualReqName.startsWith('{') || actualReqName.startsWith('[')) {
    return { changed: false, src, reason: 'destructured-params' };
  }

  const openBraceLocalIdx = sigMatch.index + sigMatch[0].length - 1;
  const openBraceGlobalIdx = defaultExportIdx + openBraceLocalIdx;

  const injection = [
    '',
    `  const { log: __log, correlationId: __correlationId } = requestLogger(${actualReqName} as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });`,
    `  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }`,
    `  const __start = Date.now();`,
    `  __log.info({ event: 'request_in' });`,
    `  res.on('finish', () => {`,
    `    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });`,
    `  });`,
    `  res.on('close', () => {`,
    `    if (!res.writableEnded) {`,
    `      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });`,
    `    }`,
    `  });`,
  ].join('\n');

  let newSrc =
    src.slice(0, openBraceGlobalIdx + 1) +
    injection +
    src.slice(openBraceGlobalIdx + 1);

  const importRegex = /^import[^\n]*from\s*['"][^'"]+['"];?\s*$/gm;
  let lastImportEnd = 0;
  let m;
  while ((m = importRegex.exec(newSrc)) !== null) {
    lastImportEnd = m.index + m[0].length;
  }

  const importLine = `import { requestLogger } from '${importPath}';`;
  if (lastImportEnd > 0) {
    newSrc = newSrc.slice(0, lastImportEnd) + '\n' + importLine + newSrc.slice(lastImportEnd);
  } else {
    newSrc = importLine + '\n' + newSrc;
  }

  return { changed: true, src: newSrc, reason: 'patched' };
}

const files = listHandlers();
const results = { patched: [], skipped: [], unchanged: [] };
for (const f of files) {
  const abs = f.replace(/\//g, sep);
  let src;
  try {
    src = readFileSync(abs, 'utf8');
  } catch (err) {
    results.skipped.push({ file: f, reason: 'read-failed: ' + err.message });
    continue;
  }
  const importPath = relativeLoggerImport(f);
  const { changed, src: out, reason } = patchSource(src, importPath);
  if (changed) {
    writeFileSync(abs, out);
    results.patched.push(f);
  } else if (reason === 'already-patched') {
    results.unchanged.push({ file: f, reason });
  } else {
    results.skipped.push({ file: f, reason });
  }
}

console.log(JSON.stringify({
  patched_count: results.patched.length,
  skipped_count: results.skipped.length,
  unchanged_count: results.unchanged.length,
  skipped: results.skipped,
  unchanged: results.unchanged,
}, null, 2));
