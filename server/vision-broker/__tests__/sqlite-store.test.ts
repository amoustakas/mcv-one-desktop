// sqlite-store.test.ts — round-trip + ordering assertions for the
// observability-only audit store. Uses a per-test temp DB so runs
// don't pollute the developer's ~/.mcv/vision-broker.db.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { ActionAuditEntry } from '@mcv/vision/broker-contract';
import { openBrokerStore, type BrokerStore, resolveBrokerDbPath } from '../sqlite-store';

let tmp: string;
let store: BrokerStore;

function makeEntry(over: Partial<ActionAuditEntry>): ActionAuditEntry {
  return {
    id: 'audit_' + Math.random().toString(36).slice(2, 10),
    sessionId: 'sess_test',
    agentHandle: 'test-harness',
    tenantId: 'tenant_demo',
    ventureId: 'venture_demo',
    action: { kind: 'click', refId: 'ref_abc' },
    preSnapshotId: 'snap_pre',
    postSnapshotId: 'snap_post',
    decision: { verdict: 'auto', decidedAt: 1000, decidedBy: null },
    sideEffects: {
      networkRequests: [{ method: 'POST', url: 'https://api.example/x', status: 200 }],
      crossOriginNavigations: [],
      formSubmits: 1,
    },
    startedAt: 1000,
    completedAt: 1100,
    ...over,
  };
}

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'mcv-vision-broker-'));
  store = openBrokerStore(path.join(tmp, 'broker.db'));
});

afterEach(() => {
  store.close();
  rmSync(tmp, { recursive: true, force: true });
});

describe('vision-broker · sqlite-store', () => {
  describe('resolveBrokerDbPath()', () => {
    it('returns the env override when MCV_VISION_BROKER_DB is set', () => {
      const before = process.env.MCV_VISION_BROKER_DB;
      try {
        process.env.MCV_VISION_BROKER_DB = 'C:/tmp/explicit.db';
        expect(resolveBrokerDbPath()).toBe('C:/tmp/explicit.db');
      } finally {
        if (before === undefined) delete process.env.MCV_VISION_BROKER_DB;
        else process.env.MCV_VISION_BROKER_DB = before;
      }
    });

    it('falls back to ~/.mcv/vision-broker.db when env is unset', () => {
      const before = process.env.MCV_VISION_BROKER_DB;
      delete process.env.MCV_VISION_BROKER_DB;
      try {
        const p = resolveBrokerDbPath();
        expect(p).toMatch(/\.mcv[\\/]vision-broker\.db$/);
      } finally {
        if (before !== undefined) process.env.MCV_VISION_BROKER_DB = before;
      }
    });
  });

  describe('appendAuditEntry + getAuditEntry round-trip', () => {
    it('persists and reads back a fully-populated entry', () => {
      const entry = makeEntry({ id: 'audit_full' });
      store.appendAuditEntry(entry);

      const read = store.getAuditEntry('audit_full');
      expect(read).toEqual(entry);
    });

    it('preserves null-shaped optional columns (decision/sideEffects/postSnapshotId/completedAt)', () => {
      const entry = makeEntry({
        id: 'audit_nulls',
        postSnapshotId: null,
        decision: null,
        sideEffects: null,
        completedAt: null,
      });
      store.appendAuditEntry(entry);

      const read = store.getAuditEntry('audit_nulls');
      expect(read).toEqual(entry);
      expect(read?.decision).toBeNull();
      expect(read?.sideEffects).toBeNull();
      expect(read?.postSnapshotId).toBeNull();
      expect(read?.completedAt).toBeNull();
    });

    it('returns null for an unknown id', () => {
      expect(store.getAuditEntry('does-not-exist')).toBeNull();
    });

    it('round-trips a wait/networkIdle action (synthetic snapshot probe)', () => {
      const entry = makeEntry({
        id: 'audit_wait',
        action: { kind: 'wait', condition: { kind: 'networkIdle', timeoutMs: 5000 } },
      });
      store.appendAuditEntry(entry);
      const read = store.getAuditEntry('audit_wait');
      expect(read?.action).toEqual({
        kind: 'wait',
        condition: { kind: 'networkIdle', timeoutMs: 5000 },
      });
    });
  });

  describe('listRecentEntries', () => {
    it('returns at-most-N rows in startedAt-DESC order', () => {
      for (let i = 0; i < 7; i++) {
        store.appendAuditEntry(makeEntry({ id: `audit_${i}`, startedAt: 1000 + i }));
      }

      const rows = store.listRecentEntries(5);
      expect(rows.length).toBe(5);
      expect(rows[0].id).toBe('audit_6');
      expect(rows[4].id).toBe('audit_2');

      // monotonically non-increasing startedAt
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i - 1].startedAt).toBeGreaterThanOrEqual(rows[i].startedAt);
      }
    });

    it('returns an empty array on a fresh DB', () => {
      expect(store.listRecentEntries(10)).toEqual([]);
    });

    it('clamps the limit to a sane upper bound', () => {
      store.appendAuditEntry(makeEntry({ id: 'one' }));
      // Asking for a million rows should not OOM nor throw — it just
      // returns at-most the number we have.
      const rows = store.listRecentEntries(1_000_000);
      expect(rows.length).toBe(1);
    });
  });
});
