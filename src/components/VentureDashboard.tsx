import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Building, Users, DollarSign, Coins, Target, Zap, Shield, Gamepad2, BarChart3, Brain, Globe } from 'lucide-react';
import { type Venture } from '../lib/ventures';

// ── Shared Helpers ──
function formatCAD(n: number) { return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n); }
function formatCompact(n: number) { if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${n}`; }

// ── FutureState Dashboard ──
function FutureStateDash() {
  const [data, setData] = useState<{ properties: any[]; portfolio: any; stats: any } | null>(null);
  useEffect(() => {
    Promise.all([
      fetch('/api/futurestate?action=properties').then(r=>r.json()),
      fetch('/api/futurestate?action=portfolio').then(r=>r.json()),
      fetch('/api/futurestate?action=stats').then(r=>r.json()),
    ]).then(([p,po,s]) => setData({ properties: p.data||[], portfolio: po.data, stats: s.data }));
  }, []);
  if (!data) return <div className="vd-loading">Loading FutureState data...</div>;
  const { properties, portfolio, stats } = data;
  return (
    <>
      <div className="vd-kpi-row">
        <div className="vd-kpi"><DollarSign size={14}/><div><span className="vd-kpi-val">{formatCompact(stats?.totalAUM||0)}</span><span className="vd-kpi-label">AUM</span></div></div>
        <div className="vd-kpi"><Users size={14}/><div><span className="vd-kpi-val">{stats?.totalInvestors||0}</span><span className="vd-kpi-label">Investors</span></div></div>
        <div className="vd-kpi"><Building size={14}/><div><span className="vd-kpi-val">{stats?.propertiesListed||0}</span><span className="vd-kpi-label">Properties</span></div></div>
        <div className="vd-kpi"><TrendingUp size={14}/><div><span className="vd-kpi-val">{stats?.avgYield||0}%</span><span className="vd-kpi-label">Avg Yield</span></div></div>
        <div className="vd-kpi"><Coins size={14}/><div><span className="vd-kpi-val">{formatCompact(stats?.totalYieldDistributed||0)}</span><span className="vd-kpi-label">Yield Paid</span></div></div>
      </div>
      {portfolio && (
        <div className="vd-portfolio-bar">
          <div className="vd-port-item"><span className="vd-port-label">Invested</span><span className="vd-port-val">{formatCAD(portfolio.totalInvested)}</span></div>
          <div className="vd-port-item"><span className="vd-port-label">Current</span><span className="vd-port-val gain">{formatCAD(portfolio.currentValue)}</span></div>
          <div className="vd-port-item"><span className="vd-port-label">P&L</span><span className={`vd-port-val ${portfolio.currentValue>=portfolio.totalInvested?'gain':'loss'}`}>{portfolio.currentValue>=portfolio.totalInvested?'+':''}{formatCAD(portfolio.currentValue-portfolio.totalInvested)}</span></div>
          <div className="vd-port-item highlight"><span className="vd-port-label">Unclaimed</span><span className="vd-port-val">{formatCAD(portfolio.unclaimedYield)}</span></div>
        </div>
      )}
      <div className="vd-grid">
        {properties.map((p: any) => {
          const funded = p.tokensIssued>0 ? Math.round((p.tokensSold/p.tokensIssued)*100) : 0;
          return (
            <div key={p.id} className="vd-prop-card glass">
              <div className="vd-prop-top"><span className="vd-prop-status" style={{color: p.status==='YIELDING'?'var(--success)':p.status==='FUNDING'?'var(--cyan)':'var(--purple)'}}>{p.status}</span><span className="vd-prop-sym">{p.tokenSymbol}</span></div>
              <h4 className="vd-prop-name">{p.name}</h4>
              <span className="vd-prop-loc">{p.city} &middot; {p.type?.replace('_',' ')}</span>
              <div className="vd-prop-stats">
                <div><span className="vd-stat-val">{formatCAD(p.tokenPrice)}</span><span className="vd-stat-label">Token</span></div>
                <div><span className="vd-stat-val">{p.projectedYield}%</span><span className="vd-stat-label">Yield</span></div>
                <div><span className="vd-stat-val">{p.occupancyRate}%</span><span className="vd-stat-label">Occ</span></div>
              </div>
              <div className="vd-fund-bar"><div className="vd-fund-fill" style={{width:`${funded}%`}}/></div>
              <span className="vd-fund-text">{funded}% funded &middot; {formatCompact(p.totalValue)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── BetEdge Dashboard ──
function BetEdgeDash() {
  const models = [
    { sport: 'NFL', accuracy: 56.2, trend: '+1.4%', games: 1240, color: '#EF4444' },
    { sport: 'NBA', accuracy: 54.8, trend: '+0.8%', games: 2100, color: '#F59E0B' },
    { sport: 'MLB', accuracy: 53.1, trend: '-0.3%', games: 4200, color: '#3B82F6' },
    { sport: 'NHL', accuracy: 55.4, trend: '+2.1%', games: 1380, color: '#10B981' },
    { sport: 'Soccer', accuracy: 52.7, trend: '+0.5%', games: 3600, color: '#8B5CF6' },
  ];
  return (
    <>
      <div className="vd-kpi-row">
        <div className="vd-kpi"><Target size={14}/><div><span className="vd-kpi-val">54.8%</span><span className="vd-kpi-label">Avg Accuracy</span></div></div>
        <div className="vd-kpi"><Zap size={14}/><div><span className="vd-kpi-val">6</span><span className="vd-kpi-label">Signal Models</span></div></div>
        <div className="vd-kpi"><Users size={14}/><div><span className="vd-kpi-val">78%</span><span className="vd-kpi-label">MVP Progress</span></div></div>
        <div className="vd-kpi"><BarChart3 size={14}/><div><span className="vd-kpi-val">12.5K</span><span className="vd-kpi-label">Games Analyzed</span></div></div>
      </div>
      <h3 className="vd-section-title">Model Performance</h3>
      <div className="vd-table">
        <div className="vd-table-header"><span>Sport</span><span>Accuracy</span><span>Trend</span><span>Games</span></div>
        {models.map(m => (
          <div key={m.sport} className="vd-table-row">
            <span className="vd-table-sport"><span className="vd-dot" style={{background:m.color}}/>{m.sport}</span>
            <span className="vd-table-acc">{m.accuracy}%</span>
            <span className={`vd-table-trend ${m.trend.startsWith('+')?'gain':'loss'}`}>{m.trend}</span>
            <span className="vd-table-games">{m.games.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <h3 className="vd-section-title">Pricing Tiers</h3>
      <div className="vd-tier-grid">
        <div className="vd-tier glass"><span className="vd-tier-name">Free</span><span className="vd-tier-price">$0/mo</span><span className="vd-tier-desc">Basic predictions, 2 sports</span></div>
        <div className="vd-tier glass highlight"><span className="vd-tier-name">Pro</span><span className="vd-tier-price">$99/mo</span><span className="vd-tier-desc">All sports, CLV tracking, alerts</span></div>
        <div className="vd-tier glass"><span className="vd-tier-name">Elite</span><span className="vd-tier-price">$299/mo</span><span className="vd-tier-desc">Full API, custom models, priority</span></div>
      </div>
    </>
  );
}

// ── WarForge Dashboard ──
function WarForgeDash() {
  return (
    <>
      <div className="vd-kpi-row">
        <div className="vd-kpi"><Gamepad2 size={14}/><div><span className="vd-kpi-val">Concept</span><span className="vd-kpi-label">Phase</span></div></div>
        <div className="vd-kpi"><Users size={14}/><div><span className="vd-kpi-val">0</span><span className="vd-kpi-label">Players</span></div></div>
        <div className="vd-kpi"><Shield size={14}/><div><span className="vd-kpi-val">MMORPG</span><span className="vd-kpi-label">Genre</span></div></div>
        <div className="vd-kpi"><Coins size={14}/><div><span className="vd-kpi-val">P2E</span><span className="vd-kpi-label">Economy</span></div></div>
      </div>
      <h3 className="vd-section-title">Core Systems</h3>
      <div className="vd-grid">
        {['Combat & PvP', 'Guild Economies', 'NFT Item System', 'AI-Driven NPCs', 'Play-to-Earn', 'World Building'].map(s => (
          <div key={s} className="vd-system-card glass">
            <span className="vd-system-name">{s}</span>
            <span className="vd-system-status">Design Phase</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── EdgeIQ Dashboard ──
function EdgeIQDash() {
  return (
    <>
      <div className="vd-kpi-row">
        <div className="vd-kpi"><BarChart3 size={14}/><div><span className="vd-kpi-val">0</span><span className="vd-kpi-label">Active Markets</span></div></div>
        <div className="vd-kpi"><DollarSign size={14}/><div><span className="vd-kpi-val">$0</span><span className="vd-kpi-label">TVL</span></div></div>
        <div className="vd-kpi"><Users size={14}/><div><span className="vd-kpi-val">Dev</span><span className="vd-kpi-label">Status</span></div></div>
        <div className="vd-kpi"><Brain size={14}/><div><span className="vd-kpi-val">AI</span><span className="vd-kpi-label">Powered</span></div></div>
      </div>
      <h3 className="vd-section-title">Product Suite</h3>
      <div className="vd-grid">
        {[{n:'Prediction Markets',s:'In Development'},{n:'Liquidity Pools',s:'Planned'},{n:'Governance',s:'Planned'},{n:'AI Analytics',s:'In Development'}].map(p => (
          <div key={p.n} className="vd-system-card glass">
            <span className="vd-system-name">{p.n}</span>
            <span className="vd-system-status">{p.s}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Generic Venture Dashboard ──
function GenericDash({ venture }: { venture: Venture }) {
  return (
    <div className="vd-generic">
      <div className="vd-generic-icon" style={{ color: venture.color, borderColor: `${venture.color}30` }}>{venture.icon}</div>
      <h2>{venture.name}</h2>
      <p className="vd-generic-tagline">{venture.tagline}</p>
      <div className="vd-generic-meta">
        <span><Globe size={12}/> {venture.domain}</span>
        <span className="vd-generic-status" style={{color: venture.status==='active'?'var(--success)':'var(--cyan)'}}>{venture.status.toUpperCase()}</span>
      </div>
      <p className="vd-generic-hint">Use Aegis chat to interact with this venture's AI context.</p>
    </div>
  );
}

// ── Main Component ──
interface VentureDashboardProps { venture: Venture; }

export default function VentureDashboard({ venture }: VentureDashboardProps) {
  const [loading, setLoading] = useState(false);
  const dashMap: Record<string, () => React.ReactNode> = {
    futurestate: () => <FutureStateDash />,
    betedge: () => <BetEdgeDash />,
    warforge: () => <WarForgeDash />,
    edgeiq: () => <EdgeIQDash />,
  };

  const DashContent = dashMap[venture.id];

  return (
    <div className="vd">
      <div className="vd-header">
        <div>
          <h1 className="vd-title" style={{ color: venture.color }}>{venture.name}</h1>
          <span className="vd-subtitle">{venture.tagline} &middot; {venture.domain}</span>
        </div>
        <button className="vd-refresh" onClick={() => setLoading(!loading)}><RefreshCw size={14}/></button>
      </div>
      {DashContent ? <DashContent /> : <GenericDash venture={venture} />}

      <style>{`
        .vd { height:100%; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
        .vd-header { display:flex; justify-content:space-between; align-items:flex-start; }
        .vd-title { font-family:var(--font-display); font-size:1.5rem; font-weight:700; }
        .vd-subtitle { font-size:11px; color:var(--text-muted); }
        .vd-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); transition:all 0.15s; }
        .vd-refresh:hover { background:var(--bg-card); color:var(--cyan); }
        .vd-loading { padding:40px; text-align:center; color:var(--text-muted); font-size:12px; }

        .vd-section-title { font-family:var(--font-display); font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:8px; }

        /* KPI Row */
        .vd-kpi-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:8px; }
        .vd-kpi { display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-muted); }
        .vd-kpi>div { display:flex; flex-direction:column; }
        .vd-kpi-val { font-family:var(--font-mono); font-size:1.1rem; font-weight:700; color:var(--text-primary); }
        .vd-kpi-label { font-size:9px; text-transform:uppercase; letter-spacing:0.5px; }

        /* Portfolio bar */
        .vd-portfolio-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .vd-port-item { padding:10px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); display:flex; flex-direction:column; }
        .vd-port-item.highlight { border-color:rgba(0,240,255,0.15); }
        .vd-port-label { font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; }
        .vd-port-val { font-size:1rem; font-weight:700; font-family:var(--font-mono); }
        .vd-port-val.gain { color:var(--success); }
        .vd-port-val.loss { color:var(--error); }

        /* Glass cards */
        .glass { background:rgba(11,17,33,0.8); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.06); }
        .glass:hover { border-color:rgba(255,255,255,0.12); box-shadow:0 0 20px rgba(0,240,255,0.04); }

        /* Property grid */
        .vd-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:8px; }
        .vd-prop-card { padding:14px; border-radius:var(--radius-md); display:flex; flex-direction:column; gap:4px; transition:all 0.2s; cursor:default; }
        .vd-prop-top { display:flex; justify-content:space-between; }
        .vd-prop-status { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .vd-prop-sym { font-size:10px; font-family:var(--font-mono); color:var(--text-muted); background:var(--bg-surface); padding:1px 6px; border-radius:3px; }
        .vd-prop-name { font-size:13px; font-weight:600; }
        .vd-prop-loc { font-size:10px; color:var(--text-muted); }
        .vd-prop-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; margin-top:4px; }
        .vd-stat-val { display:block; font-size:13px; font-weight:600; font-family:var(--font-mono); }
        .vd-stat-label { display:block; font-size:9px; color:var(--text-muted); text-transform:uppercase; }
        .vd-fund-bar { height:3px; background:var(--bg-surface); border-radius:2px; overflow:hidden; margin-top:6px; }
        .vd-fund-fill { height:100%; background:var(--purple); border-radius:2px; }
        .vd-fund-text { font-size:10px; color:var(--text-muted); }

        /* Table */
        .vd-table { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; }
        .vd-table-header { display:grid; grid-template-columns:1fr 80px 70px 80px; padding:6px 14px; background:var(--bg-elevated); font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; }
        .vd-table-row { display:grid; grid-template-columns:1fr 80px 70px 80px; padding:8px 14px; border-top:1px solid var(--border); align-items:center; }
        .vd-table-sport { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:500; }
        .vd-dot { width:8px; height:8px; border-radius:50%; }
        .vd-table-acc { font-family:var(--font-mono); font-size:13px; font-weight:600; }
        .vd-table-trend { font-family:var(--font-mono); font-size:11px; font-weight:600; }
        .vd-table-trend.gain { color:var(--success); }
        .vd-table-trend.loss { color:var(--error); }
        .vd-table-games { font-family:var(--font-mono); font-size:11px; color:var(--text-muted); }

        /* Tier grid */
        .vd-tier-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .vd-tier { padding:16px; border-radius:var(--radius-md); display:flex; flex-direction:column; gap:4px; text-align:center; transition:all 0.2s; }
        .vd-tier.highlight { border-color:rgba(245,158,11,0.3); }
        .vd-tier-name { font-family:var(--font-display); font-size:14px; font-weight:700; }
        .vd-tier-price { font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:var(--text-primary); }
        .vd-tier-desc { font-size:10px; color:var(--text-muted); }

        /* System cards */
        .vd-system-card { padding:16px; border-radius:var(--radius-md); display:flex; flex-direction:column; gap:4px; text-align:center; transition:all 0.2s; }
        .vd-system-name { font-size:13px; font-weight:600; }
        .vd-system-status { font-size:10px; color:var(--text-muted); font-style:italic; }

        /* Generic */
        .vd-generic { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:40px; text-align:center; flex:1; }
        .vd-generic-icon { width:80px; height:80px; border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; font-size:2.5rem; font-weight:800; background:var(--bg-card); border:2px solid; }
        .vd-generic-tagline { font-size:14px; color:var(--text-secondary); }
        .vd-generic-meta { display:flex; align-items:center; gap:16px; font-size:12px; color:var(--text-muted); }
        .vd-generic-meta span { display:flex; align-items:center; gap:4px; }
        .vd-generic-status { font-weight:600; }
        .vd-generic-hint { font-size:11px; color:var(--text-muted); margin-top:16px; }
      `}</style>
    </div>
  );
}
