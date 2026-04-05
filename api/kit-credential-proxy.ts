import { requireAuth } from "./_auth";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Kit Credential Proxy
// ---------------------------------------------------------------------------
// Zero-trust credential proxy. Kit code never sees raw API keys.
// Kits send { service, action, params } and this endpoint injects
// credentials from env vars, makes the request, and returns results.

// Service configurations — maps service names to their API patterns
const serviceConfigs: Record<string, {
  baseUrl: string;
  authHeader: (token: string) => Record<string, string>;
  envKey: string;
}> = {
  github: {
    baseUrl: 'https://api.github.com',
    authHeader: (token) => ({
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }),
    envKey: 'GITHUB_TOKEN',
  },
  notion: {
    baseUrl: 'https://api.notion.com',
    authHeader: (token) => ({
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
    }),
    envKey: 'NOTION_TOKEN',
  },
  google: {
    baseUrl: 'https://www.googleapis.com',
    authHeader: (token) => ({
      Authorization: `Bearer ${token}`,
    }),
    envKey: 'GOOGLE_API_KEY',
  },
  n8n: {
    baseUrl: process.env.N8N_BASE_URL || 'https://n8n.mcv.one',
    authHeader: (token) => ({
      'X-N8N-API-KEY': token,
    }),
    envKey: 'N8N_API_KEY',
  },
  cloudflare: {
    baseUrl: 'https://api.cloudflare.com/client/v4',
    authHeader: (token) => ({
      Authorization: `Bearer ${token}`,
    }),
    envKey: 'CLOUDFLARE_API_TOKEN',
  },
};

// Allowed API paths per service (prevent arbitrary URL access)
const allowedPaths: Record<string, RegExp[]> = {
  github: [
    /^\/repos\//,
    /^\/users\//,
    /^\/orgs\//,
    /^\/search\//,
  ],
  notion: [
    /^\/v1\/pages/,
    /^\/v1\/databases/,
    /^\/v1\/blocks/,
    /^\/v1\/search/,
  ],
  google: [
    /^\/drive\//,
    /^\/calendar\//,
  ],
  n8n: [
    /^\/api\/v1\/workflows/,
    /^\/api\/v1\/executions/,
    /^\/webhook\//,
  ],
  cloudflare: [
    /^\/accounts\//,
    /^\/zones/,
  ],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { service, path, method, body } = req.body;

  if (!service || !path) {
    return res.status(400).json({ error: 'service and path are required' });
  }

  // Validate service exists
  const config = serviceConfigs[service];
  if (!config) {
    return res.status(400).json({ error: `Unknown service: ${service}` });
  }

  // Validate path is allowed
  const patterns = allowedPaths[service];
  if (patterns && !patterns.some((p) => p.test(path))) {
    return res.status(403).json({ error: `Path not allowed for service ${service}: ${path}` });
  }

  // Get credential from env
  const token = process.env[config.envKey];
  if (!token) {
    return res.status(500).json({ error: `${config.envKey} not configured` });
  }

  try {
    const url = `${config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      ...config.authHeader(token),
      'Content-Type': 'application/json',
    };

    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => null);

    return res.status(response.status).json({
      ok: response.ok,
      status: response.status,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    return res.status(500).json({ error: message });
  }
}
