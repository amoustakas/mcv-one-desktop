import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Sentry API — issues, events, projects, releases, performance, alerts
// ---------------------------------------------------------------------------

const SENTRY_API = 'https://sentry.io/api/0';
const AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN || '';
const ORG_SLUG = process.env.SENTRY_ORG_SLUG || '';

async function sentryFetch(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${SENTRY_API}${path}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Sentry ${res.status}`); }
  return res.json();
}

async function sentryPut(path: string, body: unknown) {
  const res = await fetch(`${SENTRY_API}${path}`, {
    method: 'PUT', headers: { Authorization: `Bearer ${AUTH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Sentry ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!AUTH_TOKEN || !ORG_SLUG) return res.status(500).json({ error: 'SENTRY_AUTH_TOKEN and SENTRY_ORG_SLUG not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'list-projects':
        return res.json(await sentryFetch(`/organizations/${ORG_SLUG}/projects/`));

      case 'list-issues': {
        const { project, query = 'is:unresolved', sort = 'date', limit = '25' } = req.query;
        const params: Record<string, string> = { query: query as string, sort: sort as string, limit: limit as string };
        const path = project ? `/projects/${ORG_SLUG}/${project}/issues/` : `/organizations/${ORG_SLUG}/issues/`;
        return res.json(await sentryFetch(path, params));
      }

      case 'get-issue': {
        const { issueId } = req.query;
        if (!issueId) return res.status(400).json({ error: 'issueId required' });
        return res.json(await sentryFetch(`/issues/${issueId}/`));
      }

      case 'issue-events': {
        const { issueId, limit = '10' } = req.query;
        if (!issueId) return res.status(400).json({ error: 'issueId required' });
        return res.json(await sentryFetch(`/issues/${issueId}/events/`, { limit: limit as string }));
      }

      case 'resolve-issue': {
        const { issueId } = req.body;
        if (!issueId) return res.status(400).json({ error: 'issueId required' });
        return res.json(await sentryPut(`/issues/${issueId}/`, { status: 'resolved' }));
      }

      case 'list-releases': {
        const { project } = req.query;
        const path = project
          ? `/projects/${ORG_SLUG}/${project}/releases/`
          : `/organizations/${ORG_SLUG}/releases/`;
        return res.json(await sentryFetch(path, { per_page: '10' }));
      }

      case 'get-release': {
        const { version } = req.query;
        if (!version) return res.status(400).json({ error: 'version required' });
        return res.json(await sentryFetch(`/organizations/${ORG_SLUG}/releases/${encodeURIComponent(version as string)}/`));
      }

      case 'list-alerts': {
        const { project } = req.query;
        if (!project) return res.status(400).json({ error: 'project required' });
        return res.json(await sentryFetch(`/projects/${ORG_SLUG}/${project}/rules/`));
      }

      case 'project-stats': {
        const { project, stat = 'received', resolution = '1d' } = req.query;
        if (!project) return res.status(400).json({ error: 'project required' });
        return res.json(await sentryFetch(`/projects/${ORG_SLUG}/${project}/stats/`, {
          stat: stat as string, resolution: resolution as string,
        }));
      }

      case 'org-stats':
        return res.json(await sentryFetch(`/organizations/${ORG_SLUG}/stats_v2/`, {
          field: 'sum(quantity)', groupBy: 'outcome', category: 'error', interval: '1d',
          start: new Date(Date.now() - 30 * 86400000).toISOString(),
          end: new Date().toISOString(),
        }));

      case 'overview': {
        const [projects, issues] = await Promise.all([
          sentryFetch(`/organizations/${ORG_SLUG}/projects/`),
          sentryFetch(`/organizations/${ORG_SLUG}/issues/`, { query: 'is:unresolved', limit: '5', sort: 'date' }),
        ]);
        return res.json({
          project_count: Array.isArray(projects) ? projects.length : 0,
          unresolved_issues: Array.isArray(issues) ? issues.length : 0,
          top_issues: (Array.isArray(issues) ? issues : []).slice(0, 5).map((i: { title: string; count: string; lastSeen: string }) => ({
            title: i.title, count: i.count, lastSeen: i.lastSeen,
          })),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
