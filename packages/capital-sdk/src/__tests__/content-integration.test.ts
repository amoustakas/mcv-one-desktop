// Content integration service tests — mock Supabase, no real DB required.

import { describe, it, expect } from 'vitest';
import { createContentIntegrationService } from '../content-integration';

function makeStubSupabase(canned: Record<string, unknown>) {
  const calls: Array<{ table: string; op: string; payload: unknown }> = [];

  const makeBuilder = (table: string) => {
    const filters: Array<{ col: string; val: unknown }> = [];
    let insertPayload: unknown = undefined;
    let updatePayload: unknown = undefined;

    const runQuery = async () => {
      const op = insertPayload ? 'insert' : updatePayload ? 'update' : 'select';
      calls.push({ table, op, payload: insertPayload ?? updatePayload ?? filters });
      const cannedKey = `${table}.${op}`;
      const data = canned[cannedKey];
      if (!data) return { data: null, error: { message: `no canned data for ${cannedKey}` } };
      return { data, error: null };
    };

    const chain: Record<string, unknown> = {
      insert(payload: unknown) { insertPayload = payload; return chain; },
      update(payload: unknown) { updatePayload = payload; return chain; },
      delete() { insertPayload = { __delete: true }; return chain; },
      select() { return chain; },
      eq(col: string, val: unknown) { filters.push({ col, val }); return chain; },
      order() { return chain; },
      limit() { return chain; },
      single() { return runQuery(); },
      maybeSingle() { return runQuery(); },
      then(onFulfilled: (r: unknown) => unknown) { return runQuery().then(onFulfilled); },
    };
    return chain;
  };

  return {
    from(table: string) { return makeBuilder(table); },
    _calls: calls,
  };
}

describe('ContentIntegrationService', () => {
  it('createRoundContent inserts to content + links via junction', async () => {
    const sb = makeStubSupabase({
      'content.insert': {
        id: 'content-1', venture_id: 'v1', content_type: 'capital_round_description',
        title: 'Hello', body_markdown: 'body', status: 'draft', visibility: 'private',
        categories: [], tags: [], seo: {}, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      },
      'capital_round_content.insert': {
        round_id: 'round-1', content_id: 'content-1', role: 'description',
        is_primary: true, ordinal: 0, created_at: '2026-01-01T00:00:00Z',
      },
    });
    const svc = createContentIntegrationService({ supabase: sb as never });
    const entry = await svc.createRoundContent({
      ventureId: 'v1',
      roundId: 'round-1',
      role: 'description',
      contentType: 'capital_round_description',
      title: 'Hello',
      bodyMarkdown: 'body',
      isPrimary: true,
    });
    expect(entry.contentId).toBe('content-1');
    expect(entry.roundId).toBe('round-1');
    expect(entry.role).toBe('description');
    expect(entry.content.title).toBe('Hello');
    expect(entry.content.contentType).toBe('capital_round_description');
    const tables = sb._calls.map((c) => c.table);
    expect(tables).toContain('content');
    expect(tables).toContain('capital_round_content');
  });

  it('createRoundContent auto-publishes when publishImmediately set', async () => {
    const sb = makeStubSupabase({
      'content.insert': { id: 'c1', venture_id: 'v1', content_type: 'capital_investor_update', title: 't', status: 'draft', visibility: 'internal', published_at: '2026-04-15T00:00:00Z', categories: [], tags: [], seo: {}, created_at: 'x', updated_at: 'x' },
      'capital_round_content.insert': { round_id: 'r1', content_id: 'c1', role: 'update', is_primary: false, ordinal: 0, created_at: 'x' },
    });
    const svc = createContentIntegrationService({ supabase: sb as never });
    await svc.createRoundContent({
      ventureId: 'v1', roundId: 'r1', role: 'update',
      contentType: 'capital_investor_update', title: 't',
      publishImmediately: true,
    });
    const contentInsert = sb._calls.find((c) => c.table === 'content' && c.op === 'insert');
    expect(contentInsert).toBeDefined();
    const payload = contentInsert!.payload as Record<string, unknown>;
    expect(payload.published_at).toBeTruthy();
    expect(payload.visibility).toBe('internal');
  });

  it('createRoundContent adds capital role tags automatically', async () => {
    const sb = makeStubSupabase({
      'content.insert': { id: 'c1', venture_id: 'v1', content_type: 'capital_investor_update', title: 't', status: 'draft', visibility: 'private', categories: [], tags: [], seo: {}, created_at: 'x', updated_at: 'x' },
      'capital_round_content.insert': { round_id: 'r1', content_id: 'c1', role: 'update', is_primary: false, ordinal: 0, created_at: 'x' },
    });
    const svc = createContentIntegrationService({ supabase: sb as never });
    await svc.createRoundContent({
      ventureId: 'v1', roundId: 'r1', role: 'update',
      contentType: 'capital_investor_update', title: 't',
      tags: ['milestone'],
    });
    const contentInsert = sb._calls.find((c) => c.table === 'content' && c.op === 'insert');
    const tags = (contentInsert!.payload as { tags: string[] }).tags;
    expect(tags).toContain('capital');
    expect(tags).toContain('capital:update');
    expect(tags).toContain('milestone');
  });

  it('returns null/empty when no supabase client supplied', async () => {
    const svc = createContentIntegrationService({ supabase: null });
    expect(await svc.getRoundDescription('any')).toBeNull();
    expect(await svc.listRoundContent('any')).toEqual([]);
    expect(await svc.listRoundUpdates('any')).toEqual([]);
  });

  it('publishUpdate sets visibility + published_at + status=approved', async () => {
    const sb = makeStubSupabase({
      'content.update': {
        id: 'c1', venture_id: 'v1', content_type: 'capital_investor_update', title: 't',
        status: 'approved', visibility: 'public', published_at: '2026-04-15T12:00:00Z',
        categories: [], tags: [], seo: {}, created_at: 'x', updated_at: 'y',
      },
    });
    const svc = createContentIntegrationService({ supabase: sb as never });
    const content = await svc.publishUpdate('c1', 'public');
    expect(content.visibility).toBe('public');
    expect(content.status).toBe('approved');
    expect(content.publishedAt).toBeTruthy();
    const updateCall = sb._calls.find((c) => c.op === 'update');
    const payload = updateCall!.payload as Record<string, unknown>;
    expect(payload.visibility).toBe('public');
    expect(payload.status).toBe('approved');
    expect(payload.published_at).toBeTruthy();
  });
});
