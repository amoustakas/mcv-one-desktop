import type { VercelRequest, VercelResponse } from '@vercel/node';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}


const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const TEAM_SLUG = 'mcv';

async function vercelFetch(path: string) {
  const url = `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM_SLUG}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!VERCEL_TOKEN) return res.status(500).json({ error: 'VERCEL_TOKEN not configured' });

  const action = req.query.action as string;

  try {
    switch (action) {
      case 'projects': {
        const data = await vercelFetch('/v9/projects?limit=20');
        return res.json({
          projects: data.projects.map((p: Record<string, unknown>) => ({
            id: p.id,
            name: p.name,
            framework: p.framework,
            url: `https://${(p.targets as Record<string, Record<string, string>>)?.production?.url || p.name + '.vercel.app'}`,
            updatedAt: p.updatedAt,
          })),
        });
      }

      case 'deployments': {
        const project = req.query.project as string;
        const path = project
          ? `/v6/deployments?projectId=${project}&limit=10`
          : '/v6/deployments?limit=10';
        const data = await vercelFetch(path);
        return res.json({
          deployments: data.deployments.map((d: Record<string, unknown>) => ({
            uid: d.uid,
            name: d.name,
            url: `https://${d.url}`,
            state: d.state,
            created: d.created,
            ready: d.ready,
            target: d.target,
          })),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
