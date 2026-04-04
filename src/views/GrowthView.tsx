import { TrendingUp, Target, Megaphone, BarChart3, Users, Globe, Mail, Zap } from 'lucide-react';

const channels = [
  { name: 'Organic Search', visitors: 12400, trend: '+23%', color: '#10B981' },
  { name: 'Social Media', visitors: 8200, trend: '+15%', color: '#3B82F6' },
  { name: 'Direct', visitors: 5100, trend: '+8%', color: '#8B5CF6' },
  { name: 'Referral', visitors: 3400, trend: '+41%', color: '#F59E0B' },
  { name: 'Email', visitors: 2100, trend: '+12%', color: '#EC4899' },
];

const campaigns = [
  { name: 'EDGE Token Launch', status: 'Planned', venture: 'MCV One', reach: '—', color: '#00F0FF' },
  { name: 'BetEdge Beta Invite', status: 'Draft', venture: 'BetEdge AI', reach: '—', color: '#F59E0B' },
  { name: 'FutureState Waitlist', status: 'Active', venture: 'FutureState', reach: '2.4K', color: '#8B5CF6' },
  { name: 'WarForge Teaser', status: 'Concept', venture: 'WarForge', reach: '—', color: '#EF4444' },
];

const metrics = [
  { label: 'Total Users', value: '742', icon: <Users size={14} />, trend: '+18%' },
  { label: 'Active/Week', value: '234', icon: <Zap size={14} />, trend: '+9%' },
  { label: 'Domains', value: '9', icon: <Globe size={14} />, trend: '—' },
  { label: 'Email Subs', value: '1.2K', icon: <Mail size={14} />, trend: '+32%' },
];

export default function GrowthView() {
  return (
    <div className="growth">
      <div className="growth-header">
        <TrendingUp size={20} />
        <h1 className="growth-title">Growth Studio</h1>
      </div>

      {/* Metrics */}
      <div className="growth-metrics">
        {metrics.map(m => (
          <div key={m.label} className="growth-metric">
            {m.icon}
            <div>
              <span className="growth-metric-val">{m.value}</span>
              <span className="growth-metric-label">{m.label}</span>
            </div>
            <span className="growth-metric-trend">{m.trend}</span>
          </div>
        ))}
      </div>

      <div className="growth-grid">
        {/* Channels */}
        <div className="growth-section">
          <h2 className="growth-section-title"><BarChart3 size={14} /> Traffic Channels</h2>
          <div className="growth-channels">
            {channels.map(c => (
              <div key={c.name} className="growth-channel">
                <span className="growth-ch-dot" style={{ background: c.color }} />
                <span className="growth-ch-name">{c.name}</span>
                <div className="growth-ch-bar-track">
                  <div className="growth-ch-bar" style={{ width: `${(c.visitors / 15000) * 100}%`, background: c.color }} />
                </div>
                <span className="growth-ch-val">{(c.visitors / 1000).toFixed(1)}K</span>
                <span className="growth-ch-trend" style={{ color: '#10B981' }}>{c.trend}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaigns */}
        <div className="growth-section">
          <h2 className="growth-section-title"><Megaphone size={14} /> Campaigns</h2>
          <div className="growth-campaigns">
            {campaigns.map(c => (
              <div key={c.name} className="growth-campaign">
                <span className="growth-camp-dot" style={{ background: c.color }} />
                <div className="growth-camp-info">
                  <span className="growth-camp-name">{c.name}</span>
                  <span className="growth-camp-venture">{c.venture}</span>
                </div>
                <span className={`growth-camp-status ${c.status.toLowerCase()}`}>{c.status}</span>
                <span className="growth-camp-reach">{c.reach}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Calendar placeholder */}
        <div className="growth-section">
          <h2 className="growth-section-title"><Target size={14} /> Content Pipeline</h2>
          <div className="growth-placeholder">
            <p>Content calendar, social posts, and scheduled campaigns will appear here once integrations are connected.</p>
            <p className="growth-hint">Use <code>/note</code> in NAOS to save campaign ideas.</p>
          </div>
        </div>
      </div>

      <style>{`
        .growth { height: 100%; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
        .growth-header { display: flex; align-items: center; gap: 8px; }
        .growth-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; }

        .growth-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .growth-metric { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-muted); }
        .growth-metric > div { flex: 1; display: flex; flex-direction: column; }
        .growth-metric-val { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
        .growth-metric-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .growth-metric-trend { font-size: 10px; font-family: var(--font-mono); color: var(--success); }

        .growth-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .growth-section-title { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }

        .growth-channels { display: flex; flex-direction: column; gap: 6px; }
        .growth-channel { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
        .growth-ch-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .growth-ch-name { font-size: 11px; width: 100px; flex-shrink: 0; }
        .growth-ch-bar-track { flex: 1; height: 4px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; }
        .growth-ch-bar { height: 100%; border-radius: 2px; }
        .growth-ch-val { font-size: 10px; font-family: var(--font-mono); color: var(--text-secondary); width: 40px; text-align: right; }
        .growth-ch-trend { font-size: 10px; font-family: var(--font-mono); width: 40px; text-align: right; }

        .growth-campaigns { display: flex; flex-direction: column; gap: 6px; }
        .growth-campaign { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
        .growth-camp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .growth-camp-info { flex: 1; min-width: 0; }
        .growth-camp-name { display: block; font-size: 12px; font-weight: 500; }
        .growth-camp-venture { display: block; font-size: 10px; color: var(--text-muted); }
        .growth-camp-status { font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; }
        .growth-camp-status.active { background: rgba(16,185,129,0.15); color: var(--success); }
        .growth-camp-status.draft { background: rgba(0,240,255,0.1); color: var(--cyan); }
        .growth-camp-status.planned { background: rgba(139,92,246,0.15); color: var(--purple); }
        .growth-camp-status.concept { background: rgba(107,114,128,0.15); color: var(--text-muted); }
        .growth-camp-reach { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); }

        .growth-placeholder { padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; }
        .growth-placeholder p { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
        .growth-hint { font-size: 11px !important; }
        .growth-hint code { background: var(--bg-surface); padding: 1px 5px; border-radius: 3px; }
      `}</style>
    </div>
  );
}
