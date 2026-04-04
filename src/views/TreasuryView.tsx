import { Landmark, Coins, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ventures = [
  { name: 'MCV One', burn: -2400, color: '#00F0FF' },
  { name: 'BetEdge AI', burn: -8200, color: '#F59E0B' },
  { name: 'FutureState', burn: 340, color: '#8B5CF6' },
  { name: 'WarForge', burn: -500, color: '#EF4444' },
  { name: 'MCV Studios', burn: -200, color: '#EC4899' },
  { name: 'EdgeIQ Markets', burn: -1800, color: '#3B82F6' },
  { name: 'ARQ Labs', burn: -3100, color: '#6366F1' },
  { name: 'MCV Dev', burn: -600, color: '#3B82F6' },
  { name: 'MCV Tech', burn: -1500, color: '#6B7280' },
];

const netBurn = ventures.reduce((a, v) => a + v.burn, 0);

function formatUSD(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}K`;
  return `$${abs}`;
}

export default function TreasuryView() {
  return (
    <div className="trsy">
      <h1 className="trsy-title">
        <Landmark size={20} />
        Treasury & Token Economy
      </h1>

      {/* EDGE Token Dashboard */}
      <div className="trsy-section">
        <h2 className="trsy-section-title">EDGE Token</h2>
        <div className="trsy-token-grid">
          <div className="trsy-token-card main">
            <Coins size={20} />
            <div>
              <span className="trsy-token-price">$0.025</span>
              <span className="trsy-token-label">TGE Price</span>
            </div>
          </div>
          <div className="trsy-token-card">
            <span className="trsy-token-val">$25M</span>
            <span className="trsy-token-label">FDV</span>
          </div>
          <div className="trsy-token-card">
            <span className="trsy-token-val">1B</span>
            <span className="trsy-token-label">Total Supply</span>
          </div>
          <div className="trsy-token-card">
            <span className="trsy-token-val">Jupiter</span>
            <span className="trsy-token-label">Launch</span>
          </div>
          <div className="trsy-token-card">
            <span className="trsy-token-val">Solana</span>
            <span className="trsy-token-label">Network</span>
          </div>
          <div className="trsy-token-card">
            <Clock size={14} />
            <div>
              <span className="trsy-token-val">Pending</span>
              <span className="trsy-token-label">TGE Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Venture P&L */}
      <div className="trsy-section">
        <h2 className="trsy-section-title">Cross-Venture Burn Rate</h2>
        <div className="trsy-pnl-summary">
          <span className={`trsy-pnl-net ${netBurn >= 0 ? 'pos' : 'neg'}`}>
            {netBurn >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {formatUSD(netBurn)}/mo net
          </span>
        </div>
        <div className="trsy-pnl-list">
          {ventures.map((v) => (
            <div key={v.name} className="trsy-pnl-row">
              <span className="trsy-pnl-dot" style={{ background: v.color }} />
              <span className="trsy-pnl-name">{v.name}</span>
              <div className="trsy-pnl-bar-track">
                <div
                  className={`trsy-pnl-bar ${v.burn >= 0 ? 'pos' : 'neg'}`}
                  style={{ width: `${Math.min(Math.abs(v.burn) / 100, 100)}%` }}
                />
              </div>
              <span className={`trsy-pnl-val ${v.burn >= 0 ? 'pos' : 'neg'}`}>
                {v.burn >= 0 ? '+' : '-'}{formatUSD(v.burn)}/mo
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Token Economy Status */}
      <div className="trsy-section">
        <h2 className="trsy-section-title">Token Economy</h2>
        <div className="trsy-eco-grid">
          {['Staking Pools', 'Governance', 'Treasury Ops', 'Launchpad'].map((item) => (
            <div key={item} className="trsy-eco-card">
              <span className="trsy-eco-name">{item}</span>
              <span className="trsy-eco-status">Awaiting TGE</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .trsy { height: 100%; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 24px; }
        .trsy-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }

        .trsy-section-title { font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }

        .trsy-token-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
        .trsy-token-card { padding: 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 4px; }
        .trsy-token-card.main { flex-direction: row; align-items: center; gap: 12px; border-color: rgba(139, 92, 246, 0.2); color: var(--purple); }
        .trsy-token-card.main > div { display: flex; flex-direction: column; }
        .trsy-token-price { font-family: var(--font-mono); font-size: 1.5rem; font-weight: 700; color: var(--purple); }
        .trsy-token-val { font-family: var(--font-mono); font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .trsy-token-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

        .trsy-pnl-summary { margin-bottom: 8px; }
        .trsy-pnl-net { font-family: var(--font-mono); font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .trsy-pnl-net.pos { color: var(--success); }
        .trsy-pnl-net.neg { color: var(--error); }

        .trsy-pnl-list { display: flex; flex-direction: column; gap: 4px; }
        .trsy-pnl-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
        .trsy-pnl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .trsy-pnl-name { font-size: 12px; font-weight: 500; width: 120px; flex-shrink: 0; }
        .trsy-pnl-bar-track { flex: 1; height: 4px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; }
        .trsy-pnl-bar { height: 100%; border-radius: 2px; transition: width 0.3s ease; }
        .trsy-pnl-bar.pos { background: var(--success); }
        .trsy-pnl-bar.neg { background: var(--error); opacity: 0.6; }
        .trsy-pnl-val { font-family: var(--font-mono); font-size: 11px; font-weight: 600; width: 80px; text-align: right; flex-shrink: 0; }
        .trsy-pnl-val.pos { color: var(--success); }
        .trsy-pnl-val.neg { color: var(--error); }

        .trsy-eco-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .trsy-eco-card { padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 4px; text-align: center; }
        .trsy-eco-name { font-size: 13px; font-weight: 600; }
        .trsy-eco-status { font-size: 10px; color: var(--text-muted); font-style: italic; }
      `}</style>
    </div>
  );
}
