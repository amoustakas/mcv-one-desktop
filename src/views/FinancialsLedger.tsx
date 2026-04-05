// @ts-nocheck
// src/views/FinancialsLedger.tsx
// Super Admin — Journal Entry Viewer + Trial Balance

import { useEffect, useState } from 'react';
import { BookMarked, ChevronDown, ChevronRight } from 'lucide-react';
import { useLedgerStore } from '../stores/ledger';
import type { JournalEntry, TrialBalanceRow } from '../lib/ledger/types';
import { PageShell, PageHeader, GlassCard, Badge, Tabs } from '../components/ui';
import { formatMoney } from '../lib/utils';

type TabKey = 'entries' | 'trial-balance';

const STATUS_ACCENT = {
  draft: 'muted',
  posted: 'green',
  reversed: 'warning',
} as const;

function EntryRow({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false);
  const totalDebits = entry.lines.reduce((s, l) => s + l.debitAmount, 0);

  return (
    <>
      <tr
        className="le-row le-row-main"
        onClick={() => setExpanded((e) => !e)}
        style={{ cursor: 'pointer' }}
      >
        <td className="le-td">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </td>
        <td className="le-td le-entry-num">{entry.entryNumber}</td>
        <td className="le-td le-date">{entry.entryDate.slice(0, 10)}</td>
        <td className="le-td le-desc">{entry.description}</td>
        <td className="le-td">
          <Badge variant={STATUS_ACCENT[entry.status] ?? 'muted'}>{entry.status}</Badge>
        </td>
        <td className="le-td le-amount">{formatMoney(totalDebits)}</td>
      </tr>
      {expanded && entry.lines.map((line, i) => (
        <tr key={i} className="le-row le-row-line">
          <td />
          <td />
          <td />
          <td className="le-td le-line-account">{line.accountId.slice(0, 8)}…</td>
          <td className="le-td">
            {line.debitAmount > 0 ? (
              <span className="le-debit">DR {formatMoney(line.debitAmount)}</span>
            ) : (
              <span className="le-credit">CR {formatMoney(line.creditAmount)}</span>
            )}
          </td>
          <td />
        </tr>
      ))}
    </>
  );
}

export default function FinancialsLedger() {
  const { entries, entriesLoading, trialBalance, trialBalanceLoading, fetchEntries, fetchTrialBalance } = useLedgerStore();
  const [activeTab, setActiveTab] = useState<TabKey>('entries');

  useEffect(() => {
    fetchEntries('mcv');
    fetchTrialBalance('mcv');
  }, [fetchEntries, fetchTrialBalance]);

  const loading = entriesLoading || trialBalanceLoading;

  const totalDebits = trialBalance.reduce((s, r) => s + r.debitBalance, 0);
  const totalCredits = trialBalance.reduce((s, r) => s + r.creditBalance, 0);
  const balanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const tabs = [
    { key: 'entries' as TabKey, label: 'Journal Entries' },
    { key: 'trial-balance' as TabKey, label: 'Trial Balance' },
  ];

  return (
    <PageShell scroll>
      <PageHeader title="Ledger" subtitle="Double-entry journal entries and trial balance" loading={loading} />

      <Tabs tabs={tabs} active={activeTab} onChange={(k) => setActiveTab(k as TabKey)} />

      {activeTab === 'entries' && (
        <GlassCard style={{ marginTop: 16 }}>
          {entries.length === 0 ? (
            <div className="le-empty">
              <BookMarked size={32} style={{ opacity: 0.3 }} />
              <p>No journal entries found</p>
            </div>
          ) : (
            <div className="le-table-wrap">
              <table className="le-table">
                <thead>
                  <tr>
                    <th style={{ width: 20 }} />
                    <th className="le-th">Entry #</th>
                    <th className="le-th">Date</th>
                    <th className="le-th">Description</th>
                    <th className="le-th">Status</th>
                    <th className="le-th">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(entries as JournalEntry[]).map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'trial-balance' && (
        <GlassCard style={{ marginTop: 16 }}>
          <div className="le-tb-header">
            <span className="le-tb-title">Trial Balance</span>
            <div
              className="le-balanced-chip"
              style={{
                background: balanced ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                borderColor: balanced ? '#10B981' : '#EF4444',
                color: balanced ? '#10B981' : '#EF4444',
              }}
            >
              {balanced ? '✓ Balanced' : '! Unbalanced'}
            </div>
          </div>
          <div className="le-table-wrap">
            <table className="le-table">
              <thead>
                <tr>
                  <th className="le-th">Code</th>
                  <th className="le-th">Account Name</th>
                  <th className="le-th">Type</th>
                  <th className="le-th" style={{ textAlign: 'right' }}>Debit</th>
                  <th className="le-th" style={{ textAlign: 'right' }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {(trialBalance as TrialBalanceRow[]).map((row) => (
                  <tr key={row.accountId} className="le-row">
                    <td className="le-td le-code">{row.accountCode}</td>
                    <td className="le-td le-acc-name">{row.accountName}</td>
                    <td className="le-td">
                      <span className="le-acc-type">{row.accountType}</span>
                    </td>
                    <td className="le-td le-num" style={{ textAlign: 'right' }}>
                      {row.debitBalance > 0 ? formatMoney(row.debitBalance) : '—'}
                    </td>
                    <td className="le-td le-num" style={{ textAlign: 'right' }}>
                      {row.creditBalance > 0 ? formatMoney(row.creditBalance) : '—'}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="le-row le-totals-row">
                  <td colSpan={3} className="le-td" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>TOTALS</td>
                  <td className="le-td le-num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-cyan)' }}>
                    {formatMoney(totalDebits)}
                  </td>
                  <td className="le-td le-num" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-cyan)' }}>
                    {formatMoney(totalCredits)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <style>{`
        .le-table-wrap { overflow-x: auto; }
        .le-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .le-th {
          text-align: left;
          padding: 8px 10px;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid var(--border);
        }
        .le-row:hover td { background: rgba(0,245,255,0.02); }
        .le-row-line td { background: rgba(0,245,255,0.01) !important; }
        .le-td {
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          color: var(--text-secondary);
          vertical-align: middle;
        }
        .le-entry-num { font-family: var(--font-mono); font-size: 11px; color: var(--color-cyan); }
        .le-date { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); white-space: nowrap; }
        .le-desc { color: var(--text-primary); }
        .le-amount { font-family: var(--font-mono); color: var(--text-secondary); text-align: right; }
        .le-line-account { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); padding-left: 24px; }
        .le-debit { color: #EF4444; font-family: var(--font-mono); font-size: 11px; }
        .le-credit { color: #10B981; font-family: var(--font-mono); font-size: 11px; }
        .le-code { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
        .le-acc-name { color: var(--text-primary); }
        .le-acc-type {
          font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px;
          padding: 2px 6px; border-radius: 4px;
          background: rgba(255,255,255,0.04); color: var(--text-muted);
        }
        .le-num { font-family: var(--font-mono); font-size: 11px; }
        .le-totals-row td {
          border-top: 1px solid rgba(0,245,255,0.15) !important;
          padding-top: 10px;
        }
        .le-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 60px; color: var(--text-muted); font-size: 13px;
        }
        .le-tb-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
        }
        .le-tb-title { font-size: 12px; font-weight: 600; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
        .le-balanced-chip {
          font-size: 10px; font-weight: 700;
          padding: 3px 8px; border: 1px solid; border-radius: 5px;
        }
      `}</style>
    </PageShell>
  );
}
