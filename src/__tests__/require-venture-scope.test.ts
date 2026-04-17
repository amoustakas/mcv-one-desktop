// src/__tests__/require-venture-scope.test.ts
// Contract tests for the Marathon #5 I3.4 Clerk venture-scope RBAC helper.
//
// Covers:
//   • requireVentureScope throws no_auth when req.auth missing + no token
//   • Throws no_scope when JWT claims lack venture_scope
//   • Throws scope_mismatch when claim != requested venture
//   • Bypasses check when role === 'mcv_admin'
//   • Returns {userId, orgId, role} on success
//   • Reads org_metadata.venture_id as a fallback source
//   • withVentureScope HOC returns 401 on no_auth, 403 on scope errors
//   • withVentureScope passes through to the inner handler on success
//   • withVentureScope skips scope check when extractor returns null

import { describe, it, expect, beforeEach } from 'vitest';
import {
  requireVentureScope,
  withVentureScope,
  VentureScopeError,
} from '../lib/server/require-venture-scope';

// ─── Mocks ────────────────────────────────────────────────────────────────────

type MockReq = {
  auth?: { userId?: string; orgId?: string; sessionClaims?: Record<string, unknown> };
  headers: Record<string, string | undefined>;
  cookies: Record<string, string | undefined>;
  body?: unknown;
  query?: Record<string, unknown>;
};

function makeReq(partial: Partial<MockReq> = {}): MockReq {
  return {
    headers: {},
    cookies: {},
    body: {},
    query: {},
    ...partial,
  };
}

function makeRes() {
  const res = {
    _status: 200,
    _body: null as unknown,
    _headers: {} as Record<string, string>,
    status(code: number) { res._status = code; return res; },
    setHeader(k: string, v: string) { res._headers[k] = v; return res; },
    json(body: unknown) { res._body = body; return res; },
    send(body: unknown) { res._body = body; return res; },
  };
  return res;
}

// ─── requireVentureScope ──────────────────────────────────────────────────────

describe('requireVentureScope', () => {
  beforeEach(() => {
    // Clear Clerk secret so hydrateAuth takes the dev-header / no-token branch.
    delete process.env.CLERK_SECRET_KEY;
  });

  it('throws no_auth when req.auth is missing and no token is provided', async () => {
    const req = makeReq();
    await expect(requireVentureScope(req as never, 'futurestate')).rejects.toBeInstanceOf(VentureScopeError);
    try {
      await requireVentureScope(req as never, 'futurestate');
      expect.fail('expected throw');
    } catch (err) {
      expect((err as VentureScopeError).code).toBe('no_auth');
    }
  });

  it('throws no_scope when auth is present but venture_scope claim is missing', async () => {
    const req = makeReq({
      auth: {
        userId: 'user_123',
        orgId: 'org_456',
        sessionClaims: { sub: 'user_123', role: 'operator' },
      },
    });
    try {
      await requireVentureScope(req as never, 'futurestate');
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(VentureScopeError);
      expect((err as VentureScopeError).code).toBe('no_scope');
    }
  });

  it('throws scope_mismatch when claim venture_scope != requested venture_id', async () => {
    const req = makeReq({
      auth: {
        userId: 'user_123',
        orgId: 'org_456',
        sessionClaims: { sub: 'user_123', role: 'operator', venture_scope: 'betedge' },
      },
    });
    try {
      await requireVentureScope(req as never, 'futurestate');
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(VentureScopeError);
      const scopeErr = err as VentureScopeError;
      expect(scopeErr.code).toBe('scope_mismatch');
      expect(scopeErr.details).toEqual({ expected: 'futurestate', actual: 'betedge' });
    }
  });

  it('bypasses the scope check when role === mcv_admin (ecosystem-wide access)', async () => {
    const req = makeReq({
      auth: {
        userId: 'user_admin',
        orgId: 'org_mcv',
        sessionClaims: { sub: 'user_admin', role: 'mcv_admin' },
      },
    });
    const result = await requireVentureScope(req as never, 'any-venture-id');
    expect(result.userId).toBe('user_admin');
    expect(result.orgId).toBe('org_mcv');
    expect(result.role).toBe('mcv_admin');
  });

  it('returns {userId, orgId, role} when scope matches', async () => {
    const req = makeReq({
      auth: {
        userId: 'user_123',
        orgId: 'org_456',
        sessionClaims: { sub: 'user_123', role: 'operator', venture_scope: 'futurestate' },
      },
    });
    const result = await requireVentureScope(req as never, 'futurestate');
    expect(result).toEqual({ userId: 'user_123', orgId: 'org_456', role: 'operator' });
  });

  it('falls back to org_metadata.venture_id when top-level venture_scope is absent', async () => {
    const req = makeReq({
      auth: {
        userId: 'user_123',
        orgId: 'org_456',
        sessionClaims: {
          sub: 'user_123',
          role: 'operator',
          org_metadata: { venture_id: 'warforge' },
        },
      },
    });
    const result = await requireVentureScope(req as never, 'warforge');
    expect(result.userId).toBe('user_123');
    expect(result.role).toBe('operator');
  });

  it('defaults role to "user" when no role claim is present', async () => {
    const req = makeReq({
      auth: {
        userId: 'user_no_role',
        orgId: 'org_456',
        sessionClaims: { sub: 'user_no_role', venture_scope: 'futurestate' },
      },
    });
    const result = await requireVentureScope(req as never, 'futurestate');
    expect(result.role).toBe('user');
  });
});

// ─── withVentureScope HOC ─────────────────────────────────────────────────────

describe('withVentureScope HOC', () => {
  beforeEach(() => {
    delete process.env.CLERK_SECRET_KEY;
  });

  it('returns 401 with code=no_auth when req.auth is missing', async () => {
    const handler = async () => { throw new Error('handler should not be called'); };
    const wrapped = withVentureScope<never, never>((_req) => 'futurestate')(handler);
    const req = makeReq({ body: { venture_id: 'futurestate' } });
    const res = makeRes();
    await wrapped(req as never, res as never);
    expect(res._status).toBe(401);
    expect((res._body as { code?: string }).code).toBe('no_auth');
  });

  it('returns 403 with code=scope_mismatch when claim != requested venture', async () => {
    const handler = async () => { throw new Error('handler should not be called'); };
    const wrapped = withVentureScope<never, never>((req) => (req as unknown as { body: { venture_id: string } }).body.venture_id)(handler);
    const req = makeReq({
      auth: {
        userId: 'user_123',
        orgId: 'org_456',
        sessionClaims: { sub: 'user_123', role: 'operator', venture_scope: 'betedge' },
      },
      body: { venture_id: 'futurestate' },
    });
    const res = makeRes();
    await wrapped(req as never, res as never);
    expect(res._status).toBe(403);
    const body = res._body as { code?: string; details?: unknown };
    expect(body.code).toBe('scope_mismatch');
    expect(body.details).toEqual({ expected: 'futurestate', actual: 'betedge' });
  });

  it('returns 403 with code=no_scope when claim lacks venture_scope', async () => {
    const handler = async () => { throw new Error('handler should not be called'); };
    const wrapped = withVentureScope<never, never>(() => 'futurestate')(handler);
    const req = makeReq({
      auth: {
        userId: 'user_123',
        orgId: 'org_456',
        sessionClaims: { sub: 'user_123', role: 'operator' },
      },
    });
    const res = makeRes();
    await wrapped(req as never, res as never);
    expect(res._status).toBe(403);
    expect((res._body as { code?: string }).code).toBe('no_scope');
  });

  it('invokes the inner handler when scope matches', async () => {
    let handlerCalled = false;
    const handler = async (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) => {
      handlerCalled = true;
      res.status(200).json({ ok: true });
    };
    const wrapped = withVentureScope<never, never>(() => 'futurestate')(handler as never);
    const req = makeReq({
      auth: {
        userId: 'user_123',
        orgId: 'org_456',
        sessionClaims: { sub: 'user_123', role: 'operator', venture_scope: 'futurestate' },
      },
    });
    const res = makeRes();
    await wrapped(req as never, res as never);
    expect(handlerCalled).toBe(true);
    expect(res._status).toBe(200);
    expect(res._body).toEqual({ ok: true });
  });

  it('invokes the inner handler when role === mcv_admin regardless of venture_scope', async () => {
    let handlerCalled = false;
    const handler = async (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) => {
      handlerCalled = true;
      res.status(200).json({ ok: true });
    };
    const wrapped = withVentureScope<never, never>(() => 'any-venture')(handler as never);
    const req = makeReq({
      auth: {
        userId: 'user_admin',
        orgId: 'org_mcv',
        sessionClaims: { sub: 'user_admin', role: 'mcv_admin' },
      },
    });
    const res = makeRes();
    await wrapped(req as never, res as never);
    expect(handlerCalled).toBe(true);
    expect(res._status).toBe(200);
  });

  it('skips the scope check when the extractor returns null', async () => {
    let handlerCalled = false;
    const handler = async (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) => {
      handlerCalled = true;
      res.status(200).json({ ok: true });
    };
    const wrapped = withVentureScope<never, never>(() => null)(handler as never);
    // Intentionally no auth — the extractor returning null should skip the
    // check entirely, letting the handler through unscoped.
    const req = makeReq();
    const res = makeRes();
    await wrapped(req as never, res as never);
    expect(handlerCalled).toBe(true);
    expect(res._status).toBe(200);
  });

  it('propagates non-VentureScopeError exceptions from the handler', async () => {
    const handler = async () => { throw new Error('handler_failure'); };
    const wrapped = withVentureScope<never, never>(() => null)(handler);
    const req = makeReq();
    const res = makeRes();
    await expect(wrapped(req as never, res as never)).rejects.toThrow('handler_failure');
  });
});
