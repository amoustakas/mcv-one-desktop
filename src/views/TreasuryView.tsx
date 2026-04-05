import { useState, useMemo } from 'react';
import { Landmark, Coins, Clock, ArrowUpRight, ArrowDownRight, Edit3, Save, X } from 'lucide-react';
import { ventures as ventureRegistry } from '../lib/ventures';
import { useFinancialsList, useUpsertFinancials } from '../hooks/use-treasury';
import { PageHeader, PageShell, StatCard, GlassCard, GridLayout } from '../components/ui';
import { formatMoney } from '../lib/utils';

interface VentureBurn { venture_id: string; name: string; color: string; revenue: number; expenses: number; burn: number; }

const currentMonth = new Date().toISOString().slice(0, 7); // e.g. 2026-04

export default function TreasuryView() {
  const [editId, setEditId] = useState<string | null>(null);
  const [editRevenue, setEditRevenue] = useState(0);
  const [editExpenses, setEditExpenses] = useState(0);
  const [month, setMonth] = useState(currentMonth);

  const { data: financials, isLoading, refetch } = useFinancialsList(month);
  const upsertFinancials = useUpsertFinancials();

  const burns: VentureBurn[] = useMemo(() => {
    const data: Record<string, { revenue: number; expenses: number }> = {};
    for (const f of (financials || [])) {
      data[f.venture_id] = { revenue: Number(f.revenue) || 0, expenses: Number(f.expenses) || 0 };
    }
    return ventureRegistry.map(v => {
      const d = data[v.id] || { revenue: 0, expenses: 0 };
      return { venture_id: v.id, name: v.name, color: v.color, revenue: d.revenue, expenses: d.expenses, burn: d.revenue - d.expenses };
    });
  }, [financials]);

  async function handleSave(ventureId: string) {
    await upsertFinancials.mutateAsync({ ventureId, month, revenue: editRevenue, expenses: editExpenses });
    setEditId(null);
  }

  function startEdit(b: VentureBurn) {
    setEditId(b.venture_id);
    setEditRevenue(b.revenue);
    setEditExpenses(b.expenses);
  }

  const netBurn = burns.reduce((a, v) => a + v.burn, 0);
  const totalRevenue = burns.reduce((a, v) => a + v.revenue, 0);
  const totalExpenses = burns.reduce((a, v) => a + v.expenses, 0);
  const maxBar = Math.max(...burns.map(v => Math.abs(v.burn)), 1);

  return (
    <PageShell scroll>
      <PageHeader icon={<Landmark size={20} />} title="Treasury & Token Economy" loading={isLoading} onRefresh={() => refetch()}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="trsy-month" />
      </PageHeader>

      {/* EDGE Token Dashboard */}
      <div className="trsy-section">
        <h2 className="trsy-section-title">EDGE Token</h2>
        <GridLayout cols={6} gap="sm">
          <GlassCard className="trsy-token-card main">
            <Coins size={20} />
            <div>
              <span className="trsy-token-price">$0.025</span>
              <span className="trsy-token-label">TGE Price</span>
            </div>
          </GlassCard>
          <StatCard label="FDV" value="$25M" />
          <StatCard label="Total Supply" value="1B" />
          <StatCard label="Launch" value="Jupiter" />
          <StatCard label="Network" value="Solana" />
          <GlassCard className="trsy-token-card">
            <Clock size={14} />
            <div>
              <span className="trsy-token-val">Pending</span>
              <span className="trsy-token-label">TGE Status</span>
            </div>
          </GlassCard>
        </GridLayout>
      </div>

      {/* P&L Summary */}
      <div className="trsy-section">
        <h2 className="trsy-section-title">Cross-Venture P&L — {month}</h2>
        <GridLayout cols={3} gap="sm">
          <StatCard label="Revenue" value={formatMoney(totalRevenue)} color="#10B981" />
          <StatCard label="Expenses" value={formatMoney(totalExpenses)} color="#EF4444" />
          <StatCard
            label="Net Burn"
            value={`${netBurn >= 0 ? '+' : '-'}${formatMoney(Math.abs(netBurn))}/mo`}
            color={netBurn >= 0 ? '#10B981' : '#EF4444'}
            icon={netBurn >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          />
        </GridLayout>

        <div className="trsy-pnl-list">
          <div className="trsy-pnl-header">
            <span>Venture</span><span></span><span>Revenue</span><span>Expenses</span><span>Net</span><span></span>
          </div>
          {burns.map((v) => (
            <div key={v.venture_id} className="trsy-pnl-row">
              <span className="trsy-pnl-name"><span className="trsy-pnl-dot" style={{ background: v.color }} />{v.name}</span>
              <div className="trsy-pnl-bar-track">
                <div className={`trsy-pnl-bar ${v.burn >= 0 ? 'pos' : 'neg'}`} style={{ width: `${(Math.abs(v.burn) / maxBar) * 100}%` }} />
              </div>
              {editId === v.venture_id ? (
                <>
                  <input type="number" value={editRevenue} onChange={e => setEditRevenue(parseFloat(e.target.value) || 0)} className="trsy-edit-input" />
                  <input type="number" value={editExpenses} onChange={e => setEditExpenses(parseFloat(e.target.value) || 0)} className="trsy-edit-input" />
                  <span className={`trsy-pnl-val ${(editRevenue - editExpenses) >= 0 ? 'pos' : 'neg'}`}>
                    {(editRevenue - editExpenses) >= 0 ? '+' : '-'}{formatMoney(Math.abs(editRevenue - editExpenses))}
                  </span>
                  <div className="trsy-row-actions">
                    <button className="trsy-icon-btn save" onClick={() => handleSave(v.venture_id)}><Save size={11} /></button>
                    <button className="trsy-icon-btn" onClick={() => setEditId(null)}><X size={11} /></button>
                  </div>
                </>
              ) : (
                <>
                  <span className="trsy-pnl-val pos">{v.revenue > 0 ? formatMoney(v.revenue) : '\u2014'}</span>
                  <span className="trsy-pnl-val neg">{v.expenses > 0 ? formatMoney(v.expenses) : '\u2014'}</span>
                  <span className={`trsy-pnl-val ${v.burn >= 0 ? 'pos' : 'neg'}`}>
                    {v.burn !== 0 ? `${v.burn >= 0 ? '+' : '-'}${formatMoney(Math.abs(v.burn))}` : '\u2014'}
                  </span>
                  <div className="trsy-row-actions">
                    <button className="trsy-icon-btn" onClick={() => startEdit(v)}><Edit3 size={11} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="trsy-hint">Click the edit icon on any venture to set revenue/expenses for {month}.</p>
      </div>

      {/* Token Economy Status */}
      <div className="trsy-section">
        <h2 className="trsy-section-title">Token Economy</h2>
        <GridLayout cols={4} gap="sm">
          {['Staking Pools', 'Governance', 'Treasury Ops', 'Launchpad'].map((item) => (
            <GlassCard key={item} className="trsy-eco-card">
              <span className="trsy-eco-name">{item}</span>
              <span className="trsy-eco-status">Awaiting TGE</span>
            </GlassCard>
          ))}
        </GridLayout>
      </div>

      <style>{`
        .trsy-month { padding:5px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; font-family:var(--font-mono); }

        .trsy-section { padding:0 20px 16px; }
        .trsy-section-title { font-family:var(--font-display); font-size:13px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }

        .trsy-token-card { padding:14px; display:flex; flex-direction:column; gap:4px; }
        .trsy-token-card.main { flex-direction:row; align-items:center; gap:12px; border-color:rgba(139,92,246,0.2); color:var(--purple); }
        .trsy-token-card.main>div { display:flex; flex-direction:column; }
        .trsy-token-price { font-family:var(--font-mono); font-size:1.5rem; font-weight:700; color:var(--purple); }
        .trsy-token-val { font-family:var(--font-mono); font-size:1rem; font-weight:700; color:var(--text-primary); }
        .trsy-token-label { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; }

        .trsy-pnl-list { display:flex; flex-direction:column; gap:2px; margin-top:12px; }
        .trsy-pnl-header { display:grid; grid-template-columns:140px 1fr 80px 80px 80px 50px; gap:8px; padding:4px 12px; font-size:9px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; }
        .trsy-pnl-row { display:grid; grid-template-columns:140px 1fr 80px 80px 80px 50px; gap:8px; align-items:center; padding:8px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); }
        .trsy-pnl-row:hover { border-color:var(--border-active); }
        .trsy-pnl-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; display:inline-block; margin-right:8px; }
        .trsy-pnl-name { font-size:12px; font-weight:500; white-space:nowrap; display:flex; align-items:center; }
        .trsy-pnl-bar-track { height:4px; background:var(--bg-elevated); border-radius:2px; overflow:hidden; }
        .trsy-pnl-bar { height:100%; border-radius:2px; transition:width 0.3s; }
        .trsy-pnl-bar.pos { background:var(--success); }
        .trsy-pnl-bar.neg { background:var(--error); opacity:0.6; }
        .trsy-pnl-val { font-family:var(--font-mono); font-size:11px; font-weight:600; text-align:right; }
        .trsy-pnl-val.pos { color:var(--success); }
        .trsy-pnl-val.neg { color:var(--error); }
        .trsy-row-actions { display:flex; gap:2px; justify-content:flex-end; }
        .trsy-icon-btn { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border-radius:3px; color:var(--text-muted); opacity:0.5; transition:all 0.15s; }
        .trsy-pnl-row:hover .trsy-icon-btn { opacity:1; }
        .trsy-icon-btn:hover { background:var(--bg-elevated); color:var(--text-primary); }
        .trsy-icon-btn.save { color:var(--cyan); opacity:1; }
        .trsy-edit-input { width:70px; padding:3px 6px; background:var(--bg-input); border:1px solid var(--border-active); border-radius:3px; color:var(--text-primary); font-size:11px; font-family:var(--font-mono); text-align:right; }
        .trsy-hint { font-size:10px; color:var(--text-muted); margin-top:6px; }

        .trsy-eco-card { padding:16px; display:flex; flex-direction:column; gap:4px; text-align:center; }
        .trsy-eco-name { font-size:13px; font-weight:600; }
        .trsy-eco-status { font-size:10px; color:var(--text-muted); font-style:italic; }
      `}</style>
    </PageShell>
  );
}
