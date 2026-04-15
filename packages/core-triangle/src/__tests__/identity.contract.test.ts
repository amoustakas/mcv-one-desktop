// Contract tests for the Identity client + RBAC fallback helpers.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createIdentityClient,
  canClientSide,
  canWithSessionFallback,
  type IdentitySession,
} from '../identity';
import type { CoreServiceConfig } from '../types';

const BASE_URL = 'http://identity.test';

function mkConfig(overrides: Partial<CoreServiceConfig> = {}): CoreServiceConfig {
  return {
    baseUrl: BASE_URL,
    getAuthToken: async () => 'clerk-jwt',
    ventureId: 'mcv',
    timeoutMs: 5000,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Identity wire contract', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('session() → GET /users/me', () => {
    it('maps real {id, email, role, memberships[]} into legacy IdentitySession', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          data: {
            id: 'user-1',
            email: 'tony@edgeiq.com',
            name: 'Tony',
            image: null,
            role: 'owner',
            emailVerified: true,
            mfaEnabled: false,
            createdAt: '2024-01-01T00:00:00Z',
            memberships: [
              { ventureId: 'mcv', role: 'owner', status: 'active', joinedAt: '2024-01-01T00:00:00Z' },
              { ventureId: 'old', role: 'viewer', status: 'suspended', joinedAt: '2023-01-01T00:00:00Z' },
            ],
          },
        }),
      );

      const client = createIdentityClient(mkConfig());
      const res = await client.session();
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/users/me`);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.userId).toBe('user-1');
        expect(res.data.email).toBe('tony@edgeiq.com');
        expect(res.data.displayName).toBe('Tony');
        expect(res.data.roles).toEqual(['owner']);
        // only active memberships flow through
        expect(res.data.tenants).toEqual([{ id: 'mcv', role: 'owner' }]);
      }
    });
  });

  describe('tenants() → GET /ventures', () => {
    it('maps VentureListItem[] → TenantMembership[]', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          data: [
            { ventureId: 'mcv', role: 'owner', status: 'active', joinedAt: '2024-01-01T00:00:00Z', ventureName: 'MCV', ventureSlug: 'mcv' },
            { ventureId: 'futurestate', role: 'member', status: 'active', joinedAt: '2024-02-01T00:00:00Z', ventureName: 'FutureState', ventureSlug: 'futurestate' },
          ],
        }),
      );

      const client = createIdentityClient(mkConfig());
      const res = await client.tenants();
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/ventures`);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toHaveLength(2);
        expect(res.data[0]).toMatchObject({ ventureId: 'mcv', role: 'owner' });
      }
    });
  });

  describe('can() — documented gap', () => {
    it('returns CoreNotAvailableError without network call', async () => {
      const client = createIdentityClient(mkConfig());
      const res = await client.can({ resource: 'doc', action: 'read' });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.name).toBe('CoreNotAvailableError');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('ping() → GET /health', () => {
    it('returns service metadata on 200', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, version: '0.9.1' }));
      const client = createIdentityClient(mkConfig());
      const res = await client.ping();
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/health`);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.service).toBe('identity');
    });
  });
});

describe('canClientSide — RBAC fallback policy engine', () => {
  const ownerSession: IdentitySession = {
    userId: 'u1', email: 't@x', displayName: 'T',
    roles: ['owner'],
    tenants: [{ id: 'mcv', role: 'owner' }],
    expiresAt: '2099-01-01T00:00:00Z',
  };

  const memberSession: IdentitySession = {
    userId: 'u2', email: 'm@x', displayName: 'M',
    roles: ['member'],
    tenants: [{ id: 'mcv', role: 'member' }],
    expiresAt: '2099-01-01T00:00:00Z',
  };

  const viewerSession: IdentitySession = {
    userId: 'u3', email: 'v@x', displayName: 'V',
    roles: ['member'],
    tenants: [{ id: 'mcv', role: 'viewer' }],
    expiresAt: '2099-01-01T00:00:00Z',
  };

  it('denies when session is null (fail-closed)', () => {
    expect(canClientSide(null, { resource: 'x', action: 'read' }).allowed).toBe(false);
  });

  it('allows global owner any action on any venture', () => {
    const r = canClientSide(ownerSession, { resource: 'doc', action: 'delete', ventureId: 'unknown' });
    expect(r.allowed).toBe(true);
  });

  it('allows venture owner any action on their venture', () => {
    const member = { ...memberSession, tenants: [{ id: 'mcv', role: 'owner' }] };
    expect(canClientSide(member, { resource: 'doc', action: 'delete', ventureId: 'mcv' }).allowed).toBe(true);
  });

  it('allows member read actions on their venture', () => {
    expect(canClientSide(memberSession, { resource: 'doc', action: 'read', ventureId: 'mcv' }).allowed).toBe(true);
    expect(canClientSide(memberSession, { resource: 'doc', action: 'list', ventureId: 'mcv' }).allowed).toBe(true);
    expect(canClientSide(memberSession, { resource: 'kit', action: 'kit.browse', ventureId: 'mcv' }).allowed).toBe(true);
  });

  it('denies member write actions on their venture (fail-closed)', () => {
    const r = canClientSide(memberSession, { resource: 'doc', action: 'delete', ventureId: 'mcv' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('member-write-requires-server-rbac');
  });

  it('denies viewer writes, allows viewer reads', () => {
    expect(canClientSide(viewerSession, { resource: 'doc', action: 'read', ventureId: 'mcv' }).allowed).toBe(true);
    expect(canClientSide(viewerSession, { resource: 'doc', action: 'create', ventureId: 'mcv' }).allowed).toBe(false);
  });

  it('denies when no matching venture membership', () => {
    const r = canClientSide(memberSession, { resource: 'doc', action: 'read', ventureId: 'other-venture' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('no-venture-membership');
  });

  it('denies when no ventureId and no global admin/owner', () => {
    const r = canClientSide(memberSession, { resource: 'doc', action: 'read' });
    expect(r.allowed).toBe(false);
  });
});

describe('canWithSessionFallback — server-first with client fallback', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to canClientSide when server returns CoreNotAvailableError', async () => {
    // can() stub returns CoreNotAvailableError without hitting network.
    const client = createIdentityClient(mkConfig());
    const session: IdentitySession = {
      userId: 'u1', email: 'e', displayName: 'x',
      roles: ['admin'], tenants: [], expiresAt: '2099-01-01T00:00:00Z',
    };
    const result = await canWithSessionFallback(client, session, { resource: 'doc', action: 'delete' });
    // admin global role → allowed by client fallback
    expect(result.allowed).toBe(true);
  });
});
