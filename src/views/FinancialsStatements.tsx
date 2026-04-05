// @ts-nocheck
// src/views/FinancialsStatements.tsx
// Super Admin — Financial Statements (Income / Balance Sheet / Cash Flow)

import { useEffect, useState } from 'react';
import { FileBarChart, Calendar } from 'lucide-react';
import { useFinanceStore } from '../stores/finance';
import { PageShell, PageHeader, GlassCard, Tabs } from '../components/ui';
import { formatMoney } from '../lib/utils';

type TabKey = 'income' | 'balance' | 'cashflow';

function StatLine({ label, value, indent = 0, bold = false, separator = false, accent = false }:
  { label: string; value?: number | null; indent?: number; bold?: boolean; separator?: boolean; accent?: boolean }) {
  return (
    <div className={`sl-row ${bold ? 'sl-bold' : ''} ${separator ? 'sl-sep' : ''}`}
      style={{ paddingLeft: indent * 16 }}>
      <span className="sl-label">{label}</span>
      {value !== undefined && value !== null && (
        <span className={`sl-val ${accent ? 'sl-accent' : ''} ${value < 0 ? 'sl-neg' : ''}`}>
          {formatMoney(value)}
        </span>
      )}
      <style>{`
        .sl-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; }
        .sl-row.sl-bold .sl-label, .sl-row.sl-bold .sl-val { font-weight: 700; color: var(--text-primary); }
        .sl-row.sl-sep { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 10px; }
        .sl-label { font-size: 12px; color: var(--text-secondary); }
        .sl-val { font-size: 12px; font-family: var(--font-mono); color: var(--text-secondary); }
        .sl-accent { color: var(--color-cyan) !important; font-weight: 700; font-size: 14px !important; }
        .sl-neg { color: #EF4444 !important; }
      `}</style>
    </div>
  );
}

export default function FinancialsStatements() {
  const {
    incomeStatement, loadingIncomeStatement, fetchIncomeStatement,
    balanceSheet, loadingBalanceSheet, fetchBalanceSheet,
    cashFlow, loadingCashFlow, fetchCashFlow,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<TabKey>('income');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchIncomeStatement('mcv', startDate, endDate);
    fetchBalanceSheet('mcv', endDate);
    fetchCashFlow('mcv', startDate, endDate);
  }, [fetchIncomeStatement, fetchBalanceSheet, fetchCashFlow, startDate, endDate]);

  const loading = loadingIncomeStatement || loadingBalanceSheet || loadingCashFlow;

  const tabs = [
    { key: 'income' as TabKey, label: 'Income Statement' },
    { key: 'balance' as TabKey, label: 'Balance Sheet' },
    { key: 'cashflow' as TabKey, label: 'Cash Flow' },
  ];

  return (
    <PageShell scroll>
      <div className="fs-header-row">
        <PageHeader title="Financial Statements" subtitle="GAAP-style reports" loading={loading} />
        <div className="fs-period-pick">
          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
          <label className="fs-period-label">From</label>
          <input
            type="date"
            className="fs-date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label className="fs-period-label">to {endDate}</label>
        </div>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={(k) => setActiveTab(k as TabKey)} />

      <GlassCard className="fs-card">
        <div className="fs-statement-header">
          <FileBarChart size={14} style={{ color: 'var(--color-cyan)' }} />
          <span className="fs-stmt-title">
            {activeTab === 'income' && 'Income Statement'}
            {activeTab === 'balance' && 'Balance Sheet'}
            {activeTab === 'cashflow' && 'Cash Flow Statement'}
          </span>
          <span className="fs-stmt-period">Period: {startDate} — {endDate}</span>
        </div>

        {activeTab === 'income' && (
          <>
            {!incomeStatement ? (
              <p className="fs-empty">No income statement data</p>
            ) : (
              <div className="fs-stmt-body">
                <StatLine label="REVENUE" bold />
                <StatLine label="Subscriptions" value={incomeStatement.revenue.subscriptions} indent={1} />
                <StatLine label="One-Time Sales" value={incomeStatement.revenue.oneTimeSales} indent={1} />
                <StatLine label="Digital Products" value={incomeStatement.revenue.digitalProducts} indent={1} />
                <StatLine label="Platform Fees" value={incomeStatement.revenue.platformFees} indent={1} />
                <StatLine label="Metered Usage" value={incomeStatement.revenue.meteredUsage} indent={1} />
                <StatLine label="Loan Interest" value={incomeStatement.revenue.loanInterest} indent={1} />
                <StatLine label="Total Revenue" value={incomeStatement.revenue.total} bold separator />

                <StatLine label="COST OF REVENUE" bold />
                <StatLine label="Payment Processing" value={incomeStatement.costOfRevenue.paymentProcessingFees} indent={1} />
                <StatLine label="Refunds & Chargebacks" value={incomeStatement.costOfRevenue.refundsAndChargebacks} indent={1} />
                <StatLine label="Total COGS" value={incomeStatement.costOfRevenue.total} bold separator />

                <StatLine label="Gross Profit" value={incomeStatement.grossProfit} bold separator />
                <div className="fs-margin-row">
                  <span className="sl-label">Gross Margin</span>
                  <span className="sl-val" style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>{(incomeStatement.grossMargin * 100).toFixed(1)}%</span>
                </div>

                <StatLine label="OPERATING EXPENSES" bold />
                <StatLine label="Infrastructure" value={incomeStatement.operatingExpenses.infrastructure} indent={1} />
                <StatLine label="Third-Party Services" value={incomeStatement.operatingExpenses.thirdPartyServices} indent={1} />
                <StatLine label="Total OpEx" value={incomeStatement.operatingExpenses.total} bold separator />

                <StatLine label="Operating Income" value={incomeStatement.operatingIncome} bold separator accent />
                <StatLine label="Net Income" value={incomeStatement.netIncome} bold accent />
              </div>
            )}
          </>
        )}

        {activeTab === 'balance' && (
          <>
            {!balanceSheet ? (
              <p className="fs-empty">No balance sheet data</p>
            ) : (
              <div className="fs-stmt-body">
                <StatLine label="ASSETS" bold />
                <StatLine label="Cash & Equivalents" value={balanceSheet.assets.current.cashAndEquivalents} indent={1} />
                <StatLine label="Accounts Receivable" value={balanceSheet.assets.current.accountsReceivable} indent={1} />
                <StatLine label="Inventory" value={balanceSheet.assets.current.inventory} indent={1} />
                <StatLine label="Total Current Assets" value={balanceSheet.assets.current.total} bold separator />
                <StatLine label="Total Assets" value={balanceSheet.totalAssets} bold accent separator />

                <StatLine label="LIABILITIES" bold />
                <StatLine label="Accounts Payable" value={balanceSheet.liabilities.current.accountsPayable} indent={1} />
                <StatLine label="Unearned Revenue" value={balanceSheet.liabilities.current.unearnedRevenue} indent={1} />
                <StatLine label="Total Liabilities" value={balanceSheet.totalLiabilities} bold separator />

                <StatLine label="EQUITY" bold />
                <StatLine label="Retained Earnings" value={balanceSheet.equity.retainedEarnings} indent={1} />
                <StatLine label="Total Equity" value={balanceSheet.equity.totalEquity} bold separator accent />

                <div className="fs-balanced-chip" style={{ background: balanceSheet.balanced ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderColor: balanceSheet.balanced ? '#10B981' : '#EF4444' }}>
                  {balanceSheet.balanced ? '✓ Books balanced' : '! Books unbalanced'}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'cashflow' && (
          <>
            {!cashFlow ? (
              <p className="fs-empty">No cash flow data</p>
            ) : (
              <div className="fs-stmt-body">
                <StatLine label="OPERATING ACTIVITIES" bold />
                <StatLine label="Net Income" value={cashFlow.operating.netIncome} indent={1} />
                <StatLine label="Net Operating Cash Flow" value={cashFlow.operating.netOperatingCashFlow} bold separator accent />

                <StatLine label="INVESTING ACTIVITIES" bold />
                <StatLine label="Equipment Purchases" value={cashFlow.investing.equipmentPurchases} indent={1} />
                <StatLine label="Net Investing Cash Flow" value={cashFlow.investing.netInvestingCashFlow} bold separator />

                <StatLine label="FINANCING ACTIVITIES" bold />
                <StatLine label="Loan Proceeds" value={cashFlow.financing.loanProceeds} indent={1} />
                <StatLine label="Loan Repayments" value={cashFlow.financing.loanRepayments} indent={1} />
                <StatLine label="Net Financing Cash Flow" value={cashFlow.financing.netFinancingCashFlow} bold separator />

                <StatLine label="Net Change in Cash" value={cashFlow.netCashChange} bold accent separator />
                <StatLine label="Beginning Cash" value={cashFlow.beginningCash} />
                <StatLine label="Ending Cash" value={cashFlow.endingCash} bold accent />
              </div>
            )}
          </>
        )}
      </GlassCard>

      <style>{`
        .fs-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .fs-period-pick {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }
        .fs-period-label { font-size: 11px; color: var(--text-muted); }
        .fs-date-input {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 12px;
          outline: none;
          font-family: var(--font-mono);
        }
        .fs-card { margin-top: 16px; }
        .fs-statement-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
        }
        .fs-stmt-title { font-size: 13px; font-weight: 600; color: var(--text-primary); flex: 1; }
        .fs-stmt-period { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
        .fs-stmt-body { display: flex; flex-direction: column; max-width: 560px; }
        .fs-empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 40px; }
        .fs-balanced-chip {
          display: inline-block;
          padding: 4px 10px;
          border: 1px solid;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 8px;
        }
        .fs-margin-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
        }
      `}</style>
    </PageShell>
  );
}
