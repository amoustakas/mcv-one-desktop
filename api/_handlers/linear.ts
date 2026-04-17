import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
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


// ---------------------------------------------------------------------------
// Linear API — issues, projects, teams, cycles, labels, comments (GraphQL)
// ---------------------------------------------------------------------------

const LINEAR_API = 'https://api.linear.app/graphql';

async function linearQuery(query: string, variables: Record<string, unknown>, token: string) {
  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try {
    const result = await getProviderToken(userId, 'linear');
    token = result.token;
  } catch {
    return res.status(500).json({ error: 'Linear not connected. Add in Settings > Integrations or set LINEAR_API_KEY.' });
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Teams ──
      case 'list-teams':
        return res.json(await linearQuery(`query { teams { nodes { id name key description } } }`, {}, token));

      // ── Issues ──
      case 'list-issues': {
        const { teamId, limit = 25, status } = { ...(req.query as Record<string, string>), ...(req.body || {}) };
        const filter = teamId ? `filter: { team: { id: { eq: "${teamId}" } }${status ? `, state: { name: { eq: "${status}" } }` : ''} }` : '';
        return res.json(await linearQuery(`query { issues(first: ${limit} ${filter} orderBy: updatedAt) {
          nodes { id identifier title description priority priorityLabel state { id name color } assignee { id name } labels { nodes { id name color } } createdAt updatedAt }
        } }`, {}, token));
      }

      case 'get-issue': {
        const { id } = { ...(req.query as Record<string, string>), ...(req.body || {}) };
        if (!id) return res.status(400).json({ error: 'id required (UUID or shorthand like PROJ-123)' });
        return res.json(await linearQuery(`query($id: String!) { issue(id: $id) {
          id identifier title description priority priorityLabel state { id name color } assignee { id name email } labels { nodes { id name color } } project { id name } cycle { id name number } comments { nodes { id body user { name } createdAt } } createdAt updatedAt completedAt
        } }`, { id }, token));
      }

      case 'create-issue': {
        const { title, description, teamId, stateId, assigneeId, priority, labelIds } = req.body;
        if (!title || !teamId) return res.status(400).json({ error: 'title and teamId required' });
        const input: Record<string, unknown> = { title, teamId };
        if (description) input.description = description;
        if (stateId) input.stateId = stateId;
        if (assigneeId) input.assigneeId = assigneeId;
        if (priority !== undefined) input.priority = priority;
        if (labelIds) input.labelIds = labelIds;
        return res.json(await linearQuery(`mutation($input: IssueCreateInput!) { issueCreate(input: $input) {
          success issue { id identifier title state { name } }
        } }`, { input }, token));
      }

      case 'update-issue': {
        const { id, title, description, stateId, assigneeId, priority } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const input: Record<string, unknown> = {};
        if (title) input.title = title;
        if (description) input.description = description;
        if (stateId) input.stateId = stateId;
        if (assigneeId) input.assigneeId = assigneeId;
        if (priority !== undefined) input.priority = priority;
        return res.json(await linearQuery(`mutation($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) {
          success issue { id identifier title state { name } }
        } }`, { id, input }, token));
      }

      case 'delete-issue': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await linearQuery(`mutation($id: String!) { issueDelete(id: $id) { success } }`, { id }, token));
      }

      case 'archive-issue': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await linearQuery(`mutation($id: String!) { issueArchive(id: $id) { success } }`, { id }, token));
      }

      // ── Projects ──
      case 'list-projects': {
        const { limit = 25 } = req.query;
        return res.json(await linearQuery(`query { projects(first: ${limit} orderBy: updatedAt) {
          nodes { id name description state startDate targetDate progress teams { nodes { id name } } lead { id name } }
        } }`, {}, token));
      }

      case 'create-project': {
        const { name, teamIds, description } = req.body;
        if (!name || !teamIds) return res.status(400).json({ error: 'name and teamIds required' });
        const input: Record<string, unknown> = { name, teamIds: Array.isArray(teamIds) ? teamIds : [teamIds] };
        if (description) input.description = description;
        return res.json(await linearQuery(`mutation($input: ProjectCreateInput!) { projectCreate(input: $input) {
          success project { id name }
        } }`, { input }, token));
      }

      case 'update-project': {
        const { id, name, state, description } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const input: Record<string, unknown> = {};
        if (name) input.name = name;
        if (state) input.state = state;
        if (description) input.description = description;
        return res.json(await linearQuery(`mutation($id: String!, $input: ProjectUpdateInput!) { projectUpdate(id: $id, input: $input) {
          success
        } }`, { id, input }, token));
      }

      // ── Cycles (Sprints) ──
      case 'list-cycles': {
        const { teamId } = req.query;
        const filter = teamId ? `filter: { team: { id: { eq: "${teamId}" } } }` : '';
        return res.json(await linearQuery(`query { cycles(first: 10 ${filter} orderBy: createdAt) {
          nodes { id name number startsAt endsAt progress completedScopeHistory scopeHistory team { id name } }
        } }`, {}, token));
      }

      case 'create-cycle': {
        const { teamId, name, startsAt, endsAt } = req.body;
        if (!teamId || !name || !startsAt || !endsAt) return res.status(400).json({ error: 'teamId, name, startsAt, endsAt required' });
        return res.json(await linearQuery(`mutation($input: CycleCreateInput!) { cycleCreate(input: $input) {
          success cycle { id name number startsAt endsAt }
        } }`, { input: { teamId, name, startsAt, endsAt } }, token));
      }

      // ── Labels ──
      case 'list-labels':
        return res.json(await linearQuery(`query { issueLabels(first: 100) { nodes { id name color description } } }`, {}, token));

      case 'create-label': {
        const { name, color, teamId } = req.body;
        if (!name || !teamId) return res.status(400).json({ error: 'name and teamId required' });
        const input: Record<string, unknown> = { name, teamId };
        if (color) input.color = color;
        return res.json(await linearQuery(`mutation($input: IssueLabelCreateInput!) { issueLabelCreate(input: $input) {
          success issueLabel { id name color }
        } }`, { input }, token));
      }

      // ── Workflow States ──
      case 'list-states': {
        const { teamId } = req.query;
        const filter = teamId ? `(filter: { team: { id: { eq: "${teamId}" } } })` : '';
        return res.json(await linearQuery(`query { workflowStates${filter} { nodes { id name color type position team { id name } } } }`, {}, token));
      }

      case 'bulk-update-issues': {
        const { issueIds, stateId, assigneeId, priority, labelIds } = req.body;
        if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) return res.status(400).json({ error: 'issueIds array required' });
        const input: Record<string, unknown> = {};
        if (stateId) input.stateId = stateId;
        if (assigneeId) input.assigneeId = assigneeId;
        if (priority !== undefined) input.priority = priority;
        if (labelIds) input.labelIds = labelIds;
        // Execute updates sequentially using Promise.all
        const results = await Promise.all(
          issueIds.map((id: string) =>
            linearQuery(`mutation($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) {
              success issue { id identifier title state { name } }
            } }`, { id, input }, token)
          )
        );
        return res.json({ results });
      }

      case 'create-issue-relation': {
        const { issueId, relatedIssueId, type } = req.body;
        if (!issueId || !relatedIssueId || !type) return res.status(400).json({ error: 'issueId, relatedIssueId, type required (blocks, is_blocked_by, relates_to, duplicate)' });
        return res.json(await linearQuery(`mutation($input: IssueRelationCreateInput!) { issueRelationCreate(input: $input) {
          success issueRelation { id type issue { identifier } relatedIssue { identifier } }
        } }`, { input: { issueId, relatedIssueId, type } }, token));
      }

      // ── Comments ──
      case 'create-comment': {
        const { issueId, body: commentBody } = req.body;
        if (!issueId || !commentBody) return res.status(400).json({ error: 'issueId and body required' });
        return res.json(await linearQuery(`mutation($input: CommentCreateInput!) { commentCreate(input: $input) {
          success comment { id body user { name } createdAt }
        } }`, { input: { issueId, body: commentBody } }, token));
      }

      // ── Users (Members) ──
      case 'list-users':
        return res.json(await linearQuery(`query { users(first: 100) { nodes { id name email displayName active admin } } }`, {}, token));

      case 'me':
        return res.json(await linearQuery(`query { viewer { id name email displayName active admin organization { id name } } }`, {}, token));

      // ── Overview ──
      case 'overview': {
        const data = await linearQuery(`query {
          viewer { name email organization { name } }
          teams { nodes { id name key } }
          issues(first: 5 orderBy: updatedAt) { nodes { identifier title state { name } assignee { name } updatedAt } }
          projects(first: 5 orderBy: updatedAt) { nodes { name state progress } }
        }`, {}, token);
        return res.json(data);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
