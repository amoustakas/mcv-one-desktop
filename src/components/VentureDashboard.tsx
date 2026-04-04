import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Building, Users, DollarSign, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { type Venture } from '../lib/ventures';

interface Property {
  id: string; name: string; type: string; assetClass: string; status: string;
  tokenSymbol: string; tokenPrice: number; totalValue: number;
  tokensIssued: number; tokensSold: number; projectedYield: number;
  capRate: number; occupancyRate: number; city: string;
}

interface Holding {
  propertyId: string; propertyName: string; tokenAmount: number;
  avgPrice: number; currentPrice: number; yieldEarned: number; unclaimedYield: number;
}

interface Portfolio {
  totalInvested: number; currentValue: number; totalYieldEarned: number;
  unclaimedYield: number; holdingCount: number; holdings: Holding[];
}

interface Stats {
  totalAUM: number; totalInvestors: number; propertiesListed: number;
  propertiesYielding: number; totalYieldDistributed: number; avgYield: number;
}

function formatCAD(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const statusColors: Record<string, string> = {
  YIELDING: 'var(--success)', FUNDING: 'var(--cyan)', UPCOMING: 'var(--purple)',
  FUNDED: 'var(--warning)', EXITED: 'var(--text-muted)',
};

interface VentureDashboardProps {
  venture: Venture;
}

export default function VentureDashboard({ venture }: VentureDashboardProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const isFutureState = venture.id === 'futurestate';

  async function loadData() {
    if (!isFutureState) { setLoading(false); return; }
    setLoading(true);
    try {
      const [propsRes, portRes, statsRes] = await Promise.all([
        fetch('/api/futurestate?action=properties').then((r) => r.json()),
        fetch('/api/futurestate?action=portfolio').then((r) => r.json()),
        fetch('/api/futurestate?action=stats').then((r) => r.json()),
      ]);
      setProperties(propsRes.data || []);
      setPortfolio(portRes.data || null);
      setStats(statsRes.data || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [venture.id]);

  if (!isFutureState) {
    return (
      <div className="vdash-empty">
        <div className="vdash-empty-icon" style={{ color: venture.color }}>{venture.icon}</div>
        <h2>{venture.name} Dashboard</h2>
        <p>Dashboard integration coming soon. Use Chat to interact with NAOS about {venture.name}.</p>
      </div>
    );
  }

  return (
    <div className="vdash">
      <div className="vdash-header">
        <h2 className="vdash-title" style={{ color: venture.color }}>FutureState Dashboard</h2>
        <span className="vdash-subtitle">Tokenized Real Estate — Ontario, Canada</span>
        <button className="vdash-refresh" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="vdash-stats-grid">
          <div className="vdash-stat">
            <DollarSign size={16} />
            <div><span className="vdash-stat-val">{formatCompact(stats.totalAUM)}</span><span className="vdash-stat-label">Total AUM</span></div>
          </div>
          <div className="vdash-stat">
            <Users size={16} />
            <div><span className="vdash-stat-val">{stats.totalInvestors}</span><span className="vdash-stat-label">Investors</span></div>
          </div>
          <div className="vdash-stat">
            <Building size={16} />
            <div><span className="vdash-stat-val">{stats.propertiesListed}</span><span className="vdash-stat-label">Properties</span></div>
          </div>
          <div className="vdash-stat">
            <TrendingUp size={16} />
            <div><span className="vdash-stat-val">{stats.avgYield}%</span><span className="vdash-stat-label">Avg Yield</span></div>
          </div>
          <div className="vdash-stat">
            <Coins size={16} />
            <div><span className="vdash-stat-val">{formatCompact(stats.totalYieldDistributed)}</span><span className="vdash-stat-label">Yield Paid</span></div>
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="vdash-section">
          <h3 className="vdash-section-title">Your Portfolio</h3>
          <div className="vdash-portfolio-row">
            <div className="vdash-port-card">
              <span className="vdash-port-label">Invested</span>
              <span className="vdash-port-val">{formatCAD(portfolio.totalInvested)}</span>
            </div>
            <div className="vdash-port-card">
              <span className="vdash-port-label">Current Value</span>
              <span className="vdash-port-val gain">{formatCAD(portfolio.currentValue)}</span>
            </div>
            <div className="vdash-port-card">
              <span className="vdash-port-label">P&L</span>
              <span className={`vdash-port-val ${portfolio.currentValue >= portfolio.totalInvested ? 'gain' : 'loss'}`}>
                {portfolio.currentValue >= portfolio.totalInvested ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {formatCAD(portfolio.currentValue - portfolio.totalInvested)}
              </span>
            </div>
            <div className="vdash-port-card">
              <span className="vdash-port-label">Yield Earned</span>
              <span className="vdash-port-val gain">{formatCAD(portfolio.totalYieldEarned)}</span>
            </div>
            <div className="vdash-port-card highlight">
              <span className="vdash-port-label">Unclaimed</span>
              <span className="vdash-port-val">{formatCAD(portfolio.unclaimedYield)}</span>
            </div>
          </div>

          {/* Holdings */}
          <div className="vdash-holdings">
            {portfolio.holdings.map((h) => {
              const pnl = (h.currentPrice - h.avgPrice) * h.tokenAmount;
              const pnlPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
              return (
                <div key={h.propertyId} className="vdash-holding">
                  <div className="vdash-holding-left">
                    <span className="vdash-holding-name">{h.propertyName}</span>
                    <span className="vdash-holding-tokens">{h.tokenAmount.toLocaleString()} tokens @ {formatCAD(h.currentPrice)}</span>
                  </div>
                  <div className="vdash-holding-right">
                    <span className={`vdash-holding-pnl ${pnl >= 0 ? 'gain' : 'loss'}`}>
                      {pnl >= 0 ? '+' : ''}{formatCAD(pnl)} ({pnlPct.toFixed(1)}%)
                    </span>
                    <span className="vdash-holding-yield">Yield: {formatCAD(h.yieldEarned)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Property Cards */}
      <div className="vdash-section">
        <h3 className="vdash-section-title">Properties</h3>
        <div className="vdash-prop-grid">
          {properties.map((p) => {
            const funded = p.tokensIssued > 0 ? Math.round((p.tokensSold / p.tokensIssued) * 100) : 0;
            return (
              <div key={p.id} className="vdash-prop-card">
                <div className="vdash-prop-top">
                  <span className="vdash-prop-status" style={{ color: statusColors[p.status] || 'var(--text-muted)' }}>
                    {p.status}
                  </span>
                  <span className="vdash-prop-symbol">{p.tokenSymbol}</span>
                </div>
                <h4 className="vdash-prop-name">{p.name}</h4>
                <span className="vdash-prop-loc">{p.city} &middot; {p.type.replace('_', ' ')}</span>
                <div className="vdash-prop-stats">
                  <div><span className="vdash-prop-stat-val">{formatCAD(p.tokenPrice)}</span><span className="vdash-prop-stat-label">Token</span></div>
                  <div><span className="vdash-prop-stat-val">{p.projectedYield}%</span><span className="vdash-prop-stat-label">Yield</span></div>
                  <div><span className="vdash-prop-stat-val">{p.occupancyRate}%</span><span className="vdash-prop-stat-label">Occ.</span></div>
                </div>
                <div className="vdash-fund-bar">
                  <div className="vdash-fund-fill" style={{ width: `${funded}%` }} />
                </div>
                <span className="vdash-fund-label">{funded}% funded &middot; {formatCompact(p.totalValue)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .vdash { height: 100%; overflow-y: auto; padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-lg); }
        .vdash-header { display: flex; align-items: baseline; gap: var(--space-sm); flex-wrap: wrap; }
        .vdash-title { font-size: var(--text-xl); font-weight: 700; }
        .vdash-subtitle { font-size: var(--text-xs); color: var(--text-muted); }
        .vdash-refresh { margin-left: auto; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: var(--radius-sm); color: var(--text-secondary); transition: all var(--transition-fast); }
        .vdash-refresh:hover { background: var(--bg-card); color: var(--cyan); }

        .vdash-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-sm); }
        .vdash-stat { display: flex; align-items: center; gap: var(--space-sm); padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-muted); }
        .vdash-stat > div { display: flex; flex-direction: column; }
        .vdash-stat-val { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
        .vdash-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

        .vdash-section-title { font-size: var(--text-sm); font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--space-sm); }

        .vdash-portfolio-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: var(--space-sm); margin-bottom: var(--space-md); }
        .vdash-port-card { padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; flex-direction: column; }
        .vdash-port-card.highlight { border-color: var(--cyan-glow); background: rgba(0,245,255,0.03); }
        .vdash-port-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .vdash-port-val { font-size: var(--text-base); font-weight: 700; display: flex; align-items: center; gap: 2px; }
        .vdash-port-val.gain { color: var(--success); }
        .vdash-port-val.loss { color: var(--error); }

        .vdash-holdings { display: flex; flex-direction: column; gap: 4px; }
        .vdash-holding { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
        .vdash-holding-left { display: flex; flex-direction: column; }
        .vdash-holding-name { font-size: var(--text-sm); font-weight: 600; }
        .vdash-holding-tokens { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
        .vdash-holding-right { display: flex; flex-direction: column; align-items: flex-end; }
        .vdash-holding-pnl { font-size: var(--text-sm); font-weight: 600; font-family: var(--font-mono); }
        .vdash-holding-pnl.gain { color: var(--success); }
        .vdash-holding-pnl.loss { color: var(--error); }
        .vdash-holding-yield { font-size: 10px; color: var(--text-muted); }

        .vdash-prop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-sm); }
        .vdash-prop-card { padding: var(--space-md); background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 6px; transition: border-color var(--transition-fast); }
        .vdash-prop-card:hover { border-color: var(--border-active); }
        .vdash-prop-top { display: flex; justify-content: space-between; align-items: center; }
        .vdash-prop-status { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .vdash-prop-symbol { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); background: var(--bg-surface); padding: 1px 6px; border-radius: 3px; }
        .vdash-prop-name { font-size: var(--text-sm); font-weight: 600; }
        .vdash-prop-loc { font-size: 10px; color: var(--text-muted); }
        .vdash-prop-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-top: 4px; }
        .vdash-prop-stat-val { display: block; font-size: var(--text-sm); font-weight: 600; font-family: var(--font-mono); }
        .vdash-prop-stat-label { display: block; font-size: 9px; color: var(--text-muted); text-transform: uppercase; }
        .vdash-fund-bar { height: 4px; background: var(--bg-surface); border-radius: 2px; overflow: hidden; margin-top: 6px; }
        .vdash-fund-fill { height: 100%; background: var(--purple); border-radius: 2px; transition: width var(--transition-base); }
        .vdash-fund-label { font-size: 10px; color: var(--text-muted); }

        .vdash-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-sm); text-align: center; padding: var(--space-2xl); }
        .vdash-empty-icon { width: 64px; height: 64px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: var(--text-3xl); font-weight: 800; background: var(--bg-card); border: 1px solid var(--border); }
        .vdash-empty h2 { font-size: var(--text-xl); font-weight: 600; }
        .vdash-empty p { font-size: var(--text-sm); color: var(--text-muted); max-width: 400px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media (max-width: 640px) { .vdash-prop-grid { grid-template-columns: 1fr; } .vdash-portfolio-row { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}
