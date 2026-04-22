// envelope.ts read-helper unit tests — getEnvelope (operator + signer
// modes) and listEnvelopes. Mock the Supabase client with a per-table
// chained-builder recorder, since the real driver adds indirection
// we don't need to exercise.

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { getEnvelope, listEnvelopes } from '../envelope';
import { issueSignerToken, tokenHash } from '../signer';

type Row = Record<string, unknown>;
type TableState = {
  rows: Row[];
};

/**
 * Tiny Supabase-client fake that satisfies the fluent-builder surface
 * the read helpers actually use. Routes `.from(name)` to a named table
 * state and lets the helper chain `.select().eq().in().order().limit()
 * .maybeSingle()` against it.
 */
function makeSupabase(tables: Record<string, TableState>) {
  return {
    from(table: string) {
      const state = tables[table] ?? { rows: [] };
      const filters: Array<{ col: string; val: unknown; kind: 'eq' | 'in' }> = [];
      let orderCol: string | null = null;
      // Supabase's .order() defaults to ASCENDING; match that so
      // `.order('ordinal')` without options sorts 0-before-1.
      let orderAsc = true;
      let limitN = Infinity;

      const applyFilters = () => {
        return state.rows.filter((r) =>
          filters.every((f) => {
            if (f.kind === 'eq') return r[f.col] === f.val;
            return (f.val as unknown[]).includes(r[f.col]);
          }),
        );
      };

      const applyOrderAndLimit = (rows: Row[]) => {
        let out = rows;
        if (orderCol) {
          out = [...out].sort((a, b) => {
            const av = String(a[orderCol!]);
            const bv = String(b[orderCol!]);
            return orderAsc ? av.localeCompare(bv) : bv.localeCompare(av);
          });
        }
        if (limitN !== Infinity) out = out.slice(0, limitN);
        return out;
      };

      const api = {
        select(_cols: string) {
          return api;
        },
        eq(col: string, val: unknown) {
          filters.push({ col, val, kind: 'eq' });
          return api;
        },
        in(col: string, val: unknown[]) {
          filters.push({ col, val, kind: 'in' });
          return api;
        },
        order(col: string, opts?: { ascending?: boolean }) {
          orderCol = col;
          orderAsc = opts?.ascending ?? true;
          return api;
        },
        limit(n: number) {
          limitN = n;
          return api;
        },
        async maybeSingle() {
          const rows = applyFilters();
          return { data: rows[0] ?? null, error: null };
        },
        // Supabase returns an awaitable at the end of the chain — simulate
        // that by making the builder itself thenable.
        then<T>(resolve: (v: { data: Row[]; error: null }) => T) {
          const data = applyOrderAndLimit(applyFilters());
          return Promise.resolve(resolve({ data, error: null }));
        },
      };
      return api;
    },
  } as unknown as Parameters<typeof getEnvelope>[0];
}

beforeAll(() => {
  // Key wiring: signer.ts needs an issuer key to produce + verify
  // tokens. Use a per-run Ed25519 pair so token-verify roundtrips
  // against the same key.
  const kp = crypto.generateKeyPairSync('ed25519');
  const pem = kp.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  process.env.MCV_VC_ISSUER_PRIVATE_KEY_PEM = pem;
  process.env.MCV_VC_ISSUER_KID = 'test-key';
});

const PUBLIC_ID = 'mcvs_test01';
const ENV_ID = 'env-1';
const EXPIRES_AT = new Date(Date.now() + 3600_000);

function buildFixtureTables(overrides: Partial<{
  envelope: Row | null;
  signers: Row[];
  audit: Row[];
  content: Row | null;
}> = {}) {
  const envelope = overrides.envelope === null ? null : overrides.envelope ?? {
    id: ENV_ID,
    public_id: PUBLIC_ID,
    adapter: 'mcv-sign',
    venture_id: 'v-1',
    commitment_id: null,
    content_id: 'c-1',
    content_hash: 'deadbeef',
    envelope_payload: { version: 'mcv-sign/v0' },
    status: 'sent',
    subject: 'Test envelope',
    message: null,
    expires_at: EXPIRES_AT.toISOString(),
    completion_signature: null,
    completion_signing_key: null,
    completed_at: null,
    created_by: 'clerk-user-1',
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-16T00:00:00Z',
  };

  const signers = overrides.signers ?? [
    {
      id: 's-0',
      envelope_id: ENV_ID,
      ordinal: 0,
      email: 'alice@mcv.one',
      name: 'Alice',
      role: 'Investor',
      contact_id: null,
      status: 'pending',
      signed_at: null,
      token_hash: 'TBD',
      token_expires_at: EXPIRES_AT.toISOString(),
      signature: null,
      signature_algo: null,
      ip_address: null,
      user_agent: null,
      declined_reason: null,
    },
    {
      id: 's-1',
      envelope_id: ENV_ID,
      ordinal: 1,
      email: 'bob@mcv.one',
      name: 'Bob',
      role: 'Issuer',
      contact_id: null,
      status: 'pending',
      signed_at: null,
      token_hash: 'other-hash',
      token_expires_at: EXPIRES_AT.toISOString(),
      signature: null,
      signature_algo: null,
      ip_address: null,
      user_agent: null,
      declined_reason: null,
    },
  ];

  const audit = overrides.audit ?? [
    { id: 'a-1', envelope_id: ENV_ID, event_type: 'envelope_created', actor: 'clerk-user-1', actor_type: 'user', payload: {}, created_at: '2026-04-16T00:00:00Z' },
  ];

  const content = overrides.content ?? {
    id: 'c-1',
    body_markdown: '# Test document',
    body_html: null,
    body_json: null,
  };

  return {
    signing_envelopes: { rows: envelope ? [envelope] : [] },
    signing_envelope_signers: { rows: signers },
    signing_envelope_audit: { rows: audit },
    content: { rows: content ? [content] : [] },
  };
}

describe('getEnvelope — operator mode', () => {
  it('returns full envelope + all signers + audit trail', async () => {
    const tables = buildFixtureTables();
    const result = await getEnvelope(makeSupabase(tables), PUBLIC_ID, { mode: 'operator' });
    expect(result).not.toBeNull();
    if (!result || result.mode !== 'operator') throw new Error('wrong mode');

    expect(result.envelope.publicId).toBe(PUBLIC_ID);
    expect(result.envelope.createdBy).toBe('clerk-user-1');
    expect(result.signers).toHaveLength(2);
    expect(result.signers[0].email).toBe('alice@mcv.one');
    expect(result.signers[1].email).toBe('bob@mcv.one');
    expect(result.audit).toHaveLength(1);
    expect(result.audit[0].eventType).toBe('envelope_created');
  });

  it('returns null for unknown publicId', async () => {
    const tables = buildFixtureTables({ envelope: null });
    const result = await getEnvelope(makeSupabase(tables), PUBLIC_ID, { mode: 'operator' });
    expect(result).toBeNull();
  });

  it('exposes signature bytes + IP/UA to operators', async () => {
    const tables = buildFixtureTables({
      signers: [
        {
          id: 's-0', envelope_id: ENV_ID, ordinal: 0, email: 'alice@mcv.one', name: 'Alice', role: 'Investor',
          contact_id: null, status: 'signed', signed_at: '2026-04-16T01:00:00Z',
          token_hash: 'hash-1', token_expires_at: EXPIRES_AT.toISOString(),
          signature: 'base64-sig', signature_algo: 'Ed25519',
          ip_address: '1.2.3.4', user_agent: 'chrome',
          declined_reason: null,
        },
      ],
    });
    const result = await getEnvelope(makeSupabase(tables), PUBLIC_ID, { mode: 'operator' });
    if (!result || result.mode !== 'operator') throw new Error('wrong mode');
    expect(result.signers[0].signature).toBe('base64-sig');
    expect(result.signers[0].ipAddress).toBe('1.2.3.4');
    expect(result.signers[0].userAgent).toBe('chrome');
  });
});

describe('getEnvelope — signer mode', () => {
  it('returns only the caller signer + strips createdBy from envelope', async () => {
    // Issue a valid token for ordinal 0 (alice) and precompute its hash.
    const rawToken = issueSignerToken({
      envelopePublicId: PUBLIC_ID,
      signerEmail: 'alice@mcv.one',
      signerOrdinal: 0,
      expiresAt: EXPIRES_AT,
    });
    const hash = tokenHash(rawToken);

    const tables = buildFixtureTables({
      signers: [
        {
          id: 's-0', envelope_id: ENV_ID, ordinal: 0, email: 'alice@mcv.one', name: 'Alice', role: 'Investor',
          contact_id: null, status: 'pending', signed_at: null,
          token_hash: hash, token_expires_at: EXPIRES_AT.toISOString(),
          signature: null, signature_algo: null, ip_address: null, user_agent: null, declined_reason: null,
        },
        {
          id: 's-1', envelope_id: ENV_ID, ordinal: 1, email: 'bob@mcv.one', name: 'Bob', role: 'Issuer',
          contact_id: null, status: 'pending', signed_at: null,
          token_hash: 'bobs-hash', token_expires_at: EXPIRES_AT.toISOString(),
          signature: null, signature_algo: null, ip_address: null, user_agent: null, declined_reason: null,
        },
      ],
    });

    const result = await getEnvelope(makeSupabase(tables), PUBLIC_ID, { mode: 'signer', token: rawToken });
    expect(result).not.toBeNull();
    if (!result || result.mode !== 'signer') throw new Error('wrong mode');

    expect(result.signer.email).toBe('alice@mcv.one');
    // Bob must not leak into signer-mode response.
    expect((result as { signers?: unknown[] }).signers).toBeUndefined();
    // createdBy must be stripped — signer doesn't need to know who created.
    expect((result.envelope as Record<string, unknown>).createdBy).toBeUndefined();
    expect(result.content.body).toBe('# Test document');
    expect(result.content.bodyType).toBe('markdown');
  });

  it('rejects invalid token (malformed) with null', async () => {
    const tables = buildFixtureTables();
    const result = await getEnvelope(makeSupabase(tables), PUBLIC_ID, { mode: 'signer', token: 'garbage.garbage' });
    expect(result).toBeNull();
  });

  it('rejects token whose envelopePublicId mismatches', async () => {
    const rawToken = issueSignerToken({
      envelopePublicId: 'mcvs_OTHER',
      signerEmail: 'alice@mcv.one',
      signerOrdinal: 0,
      expiresAt: EXPIRES_AT,
    });
    const tables = buildFixtureTables();
    const result = await getEnvelope(makeSupabase(tables), PUBLIC_ID, { mode: 'signer', token: rawToken });
    expect(result).toBeNull();
  });

  it('rejects valid token whose hash no longer matches DB (rotated)', async () => {
    const rawToken = issueSignerToken({
      envelopePublicId: PUBLIC_ID,
      signerEmail: 'alice@mcv.one',
      signerOrdinal: 0,
      expiresAt: EXPIRES_AT,
    });
    // Put a DIFFERENT hash in the DB — simulates token rotation.
    const tables = buildFixtureTables({
      signers: [
        {
          id: 's-0', envelope_id: ENV_ID, ordinal: 0, email: 'alice@mcv.one', name: 'Alice', role: 'Investor',
          contact_id: null, status: 'pending', signed_at: null,
          token_hash: 'rotated-different-hash', token_expires_at: EXPIRES_AT.toISOString(),
          signature: null, signature_algo: null, ip_address: null, user_agent: null, declined_reason: null,
        },
      ],
    });
    const result = await getEnvelope(makeSupabase(tables), PUBLIC_ID, { mode: 'signer', token: rawToken });
    expect(result).toBeNull();
  });
});

describe('listEnvelopes', () => {
  beforeEach(() => {
    // Keep the signer-mode tests' env from leaking — listEnvelopes
    // doesn't need the issuer key but shouldn't blow up if it's gone.
  });

  it('aggregates signer counts per envelope', async () => {
    const envelopes = [
      { id: 'e-1', public_id: 'mcvs_1', adapter: 'mcv-sign', venture_id: 'v-1', commitment_id: null, content_id: 'c-1', content_hash: 'h1', status: 'in_progress', subject: 'A', message: null, expires_at: EXPIRES_AT.toISOString(), completed_at: null, created_by: null, created_at: '2026-04-16T00:00:00Z', updated_at: '2026-04-16T00:00:00Z' },
      { id: 'e-2', public_id: 'mcvs_2', adapter: 'docusign', venture_id: 'v-2', commitment_id: null, content_id: 'c-2', content_hash: 'h2', status: 'signed', subject: 'B', message: null, expires_at: EXPIRES_AT.toISOString(), completed_at: '2026-04-16T01:00:00Z', created_by: null, created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-16T01:00:00Z' },
    ];
    const signers = [
      { envelope_id: 'e-1', status: 'signed' },
      { envelope_id: 'e-1', status: 'pending' },
      { envelope_id: 'e-1', status: 'pending' },
      { envelope_id: 'e-2', status: 'signed' },
      { envelope_id: 'e-2', status: 'signed' },
    ];
    const tables = {
      signing_envelopes: { rows: envelopes },
      signing_envelope_signers: { rows: signers },
      signing_envelope_audit: { rows: [] },
      content: { rows: [] },
    };

    const result = await listEnvelopes(makeSupabase(tables));
    expect(result).toHaveLength(2);
    const e1 = result.find((e) => e.id === 'e-1')!;
    expect(e1.signerCount).toBe(3);
    expect(e1.signedCount).toBe(1);
    const e2 = result.find((e) => e.id === 'e-2')!;
    expect(e2.signerCount).toBe(2);
    expect(e2.signedCount).toBe(2);
  });

  it('filters by ventureId', async () => {
    const envelopes = [
      { id: 'e-1', public_id: 'mcvs_1', adapter: 'mcv-sign', venture_id: 'v-A', commitment_id: null, content_id: 'c', content_hash: 'h', status: 'sent', subject: null, message: null, expires_at: EXPIRES_AT.toISOString(), completed_at: null, created_by: null, created_at: '2026-04-16T00:00:00Z', updated_at: '2026-04-16T00:00:00Z' },
      { id: 'e-2', public_id: 'mcvs_2', adapter: 'mcv-sign', venture_id: 'v-B', commitment_id: null, content_id: 'c', content_hash: 'h', status: 'sent', subject: null, message: null, expires_at: EXPIRES_AT.toISOString(), completed_at: null, created_by: null, created_at: '2026-04-16T00:00:00Z', updated_at: '2026-04-16T00:00:00Z' },
    ];
    const tables = {
      signing_envelopes: { rows: envelopes },
      signing_envelope_signers: { rows: [] },
      signing_envelope_audit: { rows: [] },
      content: { rows: [] },
    };
    const result = await listEnvelopes(makeSupabase(tables), { ventureId: 'v-A' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e-1');
  });

  it('returns empty list when no envelopes match', async () => {
    const tables = {
      signing_envelopes: { rows: [] },
      signing_envelope_signers: { rows: [] },
      signing_envelope_audit: { rows: [] },
      content: { rows: [] },
    };
    const result = await listEnvelopes(makeSupabase(tables));
    expect(result).toEqual([]);
  });
});
