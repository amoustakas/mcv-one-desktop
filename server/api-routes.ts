/**
 * Local API route mounter.
 *
 * Vercel serves everything under /api/<name>.ts as a serverless function in
 * production. In local dev (Vite + Express), those routes don't exist unless
 * we explicitly mount them. This module walks the repo's api/ directory,
 * dynamically imports each TypeScript handler, and registers it as an
 * Express route under /api/<name>.
 *
 * Handlers follow the Vercel pattern:
 *   export default async function handler(req: VercelRequest, res: VercelResponse)
 *
 * VercelRequest is structurally compatible with express.Request + a few
 * extras (req.cookies, req.query as parsed object). VercelResponse is
 * structurally compatible with express.Response. In practice the handlers
 * just need .json(), .status(), .headers, .body, .query — all of which
 * Express provides.
 */

import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const API_DIR = path.resolve(process.cwd(), 'api');

export async function registerApiRoutes(app: Express) {
  if (!fs.existsSync(API_DIR)) {
    console.warn('[api-routes] api/ directory not found — skipping');
    return;
  }

  const files = walkApiDir(API_DIR);
  let registered = 0;
  const errors: Array<{ route: string; error: string }> = [];

  for (const file of files) {
    const routePath = apiRouteFromFile(file);
    try {
      const moduleUrl = pathToFileURL(file).href;
      const mod = await import(/* @vite-ignore */ moduleUrl);
      const handler = mod.default;
      if (typeof handler !== 'function') {
        errors.push({ route: routePath, error: 'no default export function' });
        continue;
      }

      // Mount for both GET and POST — Vercel handlers typically branch on method internally
      const wrapped = (req: Request, res: Response) => {
        // Vercel adds req.cookies (parsed); Express doesn't by default
        if (!(req as unknown as { cookies?: unknown }).cookies) {
          (req as unknown as { cookies: Record<string, string> }).cookies = parseCookies(req.headers.cookie);
        }
        return Promise.resolve(handler(req, res)).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[api-routes] ${routePath} threw:`, msg);
          if (!res.headersSent) res.status(500).json({ error: msg });
        });
      };

      app.all(routePath, wrapped);
      registered++;
    } catch (e) {
      errors.push({ route: routePath, error: e instanceof Error ? e.message : String(e) });
    }
  }

  console.log(`[api-routes] mounted ${registered} routes`);
  if (errors.length) {
    console.warn(`[api-routes] ${errors.length} route(s) failed to load:`);
    for (const e of errors) console.warn(`  - ${e.route}: ${e.error}`);
  }

}

function walkApiDir(dir: string, base = dir): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
      out.push(...walkApiDir(full, base));
    } else if (entry.name.endsWith('.ts') && !entry.name.startsWith('_') && !entry.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

function apiRouteFromFile(file: string): string {
  const rel = path.relative(API_DIR, file).replace(/\\/g, '/');
  return '/api/' + rel.replace(/\.ts$/, '');
}

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(v.join('='));
  }
  return out;
}
