/**
 * mcv-one-desktop / vision-broker — SQLite-backed action audit store.
 *
 * Persists every ActionAuditEntry (Session 2: snapshot probes only;
 * Session 3+: real action requests gated by HITL) to a local
 * better-sqlite3 file at:
 *
 *   process.env.MCV_VISION_BROKER_DB
 *   ?? path.join(os.homedir(), '.mcv', 'vision-broker.db')
 *
 * The shared @mcv/vision SDK never touches this file — its only
 * relationship is the `ActionAuditEntry` type contract from
 * @mcv/vision/broker-contract. JSON-stringified columns
 * (`action`, `decision`, `sideEffects`) round-trip through this
 * module so consumers operate on parsed objects.
 *
 * Concurrency note: better-sqlite3 is synchronous and process-local.
 * Two desktop instances on the same workstation would each open their
 * own broker.db (single-writer per connection); cross-machine drift
 * is fine for Session 2 (local-only by design). Session 3 + the HITL
 * UI will introduce a cross-instance reconciliation story.
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

import type { ActionAuditEntry } from '@mcv/vision/broker-contract';

// ---------------------------------------------------------------------------
// DB path resolution
// ---------------------------------------------------------------------------

export function resolveBrokerDbPath(): string {
  const explicit = process.env.MCV_VISION_BROKER_DB;
  if (explicit && explicit.length > 0) return explicit;
  return path.join(homedir(), '.mcv', 'vision-broker.db');
}

// ---------------------------------------------------------------------------
// Schema — one DDL statement per array entry; we run each via prepare().run()
// rather than the multi-statement Database#exec path.
// ---------------------------------------------------------------------------

const SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS action_audit (
     id              TEXT    PRIMARY KEY,
     sessionId       TEXT    NOT NULL,
     agentHandle     TEXT    NOT NULL,
     tenantId        TEXT    NOT NULL,
     ventureId       TEXT    NOT NULL,
     action          TEXT    NOT NULL,
     preSnapshotId   TEXT    NOT NULL,
     postSnapshotId  TEXT,
     decision        TEXT,
     sideEffects     TEXT,
     startedAt       INTEGER NOT NULL,
     completedAt     INTEGER
   )`,
  `CREATE INDEX IF NOT EXISTS idx_action_audit_started ON action_audit(startedAt DESC)`,
];

// ---------------------------------------------------------------------------
// Store factory + lifecycle
// ---------------------------------------------------------------------------

export interface BrokerStore {
  appendAuditEntry(entry: ActionAuditEntry): void;
  getAuditEntry(id: string): ActionAuditEntry | null;
  listRecentEntries(limit: number): ActionAuditEntry[];
  /** Underlying handle — exposed for tests; production callers should
   *  not hold this reference long-term. */
  readonly db: Database.Database;
  close(): void;
}

export function openBrokerStore(dbPath?: string): BrokerStore {
  const resolvedPath = dbPath ?? resolveBrokerDbPath();
  const dir = path.dirname(resolvedPath);
  mkdirSync(dir, { recursive: true });

  const db = new Database(resolvedPath);
  // WAL keeps reads non-blocking against the (rare) action-write path
  // and gives us crash-resilient logs across daemon restarts.
  db.pragma('journal_mode = WAL');

  for (const sql of SCHEMA_STATEMENTS) {
    db.prepare(sql).run();
  }

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO action_audit (
      id, sessionId, agentHandle, tenantId, ventureId, action,
      preSnapshotId, postSnapshotId, decision, sideEffects,
      startedAt, completedAt
    ) VALUES (
      @id, @sessionId, @agentHandle, @tenantId, @ventureId, @action,
      @preSnapshotId, @postSnapshotId, @decision, @sideEffects,
      @startedAt, @completedAt
    )
  `);

  const selectStmt = db.prepare(`SELECT * FROM action_audit WHERE id = ?`);
  const recentStmt = db.prepare(
    `SELECT * FROM action_audit ORDER BY startedAt DESC, id DESC LIMIT ?`,
  );

  return {
    db,

    appendAuditEntry(entry: ActionAuditEntry): void {
      insertStmt.run({
        id: entry.id,
        sessionId: entry.sessionId,
        agentHandle: entry.agentHandle,
        tenantId: entry.tenantId,
        ventureId: entry.ventureId,
        action: JSON.stringify(entry.action),
        preSnapshotId: entry.preSnapshotId,
        postSnapshotId: entry.postSnapshotId,
        decision: entry.decision === null ? null : JSON.stringify(entry.decision),
        sideEffects:
          entry.sideEffects === null ? null : JSON.stringify(entry.sideEffects),
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
      });
    },

    getAuditEntry(id: string): ActionAuditEntry | null {
      const row = selectStmt.get(id) as RawAuditRow | undefined;
      return row ? deserializeRow(row) : null;
    },

    listRecentEntries(limit: number): ActionAuditEntry[] {
      const safeLimit = Math.max(0, Math.min(Math.floor(limit), 1000));
      const rows = recentStmt.all(safeLimit) as RawAuditRow[];
      return rows.map(deserializeRow);
    },

    close(): void {
      db.close();
    },
  };
}

// ---------------------------------------------------------------------------
// Internal — row deserialization
// ---------------------------------------------------------------------------

interface RawAuditRow {
  id: string;
  sessionId: string;
  agentHandle: string;
  tenantId: string;
  ventureId: string;
  action: string;
  preSnapshotId: string;
  postSnapshotId: string | null;
  decision: string | null;
  sideEffects: string | null;
  startedAt: number;
  completedAt: number | null;
}

function deserializeRow(row: RawAuditRow): ActionAuditEntry {
  return {
    id: row.id,
    sessionId: row.sessionId,
    agentHandle: row.agentHandle,
    tenantId: row.tenantId,
    ventureId: row.ventureId,
    action: JSON.parse(row.action),
    preSnapshotId: row.preSnapshotId,
    postSnapshotId: row.postSnapshotId,
    decision: row.decision === null ? null : JSON.parse(row.decision),
    sideEffects: row.sideEffects === null ? null : JSON.parse(row.sideEffects),
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}
