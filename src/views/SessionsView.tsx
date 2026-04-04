import { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, RefreshCw, Terminal, Cpu, Zap, Clock, Circle, Activity } from 'lucide-react';

/* ── Types ── */
interface ClaudeSession {
  id: string;
  repo: string;
  branch: string;
  status: 'active' | 'idle' | 'completed';
  duration: string;
  lastCommand: string;
  tokens: number;
}

interface ApiCall {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusCode: number;
  responseTime: number;
  timestamp: string;
}

interface AgentActivity {
  id: string;
  agent: string;
  venture: string;
  task: string;
  status: 'running' | 'waiting' | 'complete' | 'error';
  role: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

/* ── Mock data generators ── */

function mockClaudeSessions(): ClaudeSession[] {
  return [
    { id: 'cs-1', repo: 'mcv-one-desktop', branch: 'feat/sessions-view', status: 'active', duration: '1h 23m', lastCommand: 'Creating SessionsView.tsx component', tokens: 48200 },
    { id: 'cs-2', repo: 'Futurestate', branch: 'main', status: 'active', duration: '42m', lastCommand: 'Refactoring precon property filters', tokens: 31400 },
    { id: 'cs-3', repo: 'mcv-one', branch: 'feat/agent-sdk', status: 'idle', duration: '2h 05m', lastCommand: 'Reviewing PR #47 comments', tokens: 62800 },
    { id: 'cs-4', repo: 'Bet-Edge', branch: 'dev', status: 'completed', duration: '35m', lastCommand: 'Fixed odds calculation regression', tokens: 18900 },
    { id: 'cs-5', repo: 'mcv-one-desktop', branch: 'main', status: 'idle', duration: '15m', lastCommand: 'Running test suite validation', tokens: 9400 },
    { id: 'cs-6', repo: 'Futurestate', branch: 'feat/tradfi-ticker', status: 'active', duration: '58m', lastCommand: 'Building TradFi ticker detail page', tokens: 41200 },
  ];
}

function mockApiCalls(): ApiCall[] {
  return [
    { id: 'api-1', endpoint: '/api/chat', method: 'POST', statusCode: 200, responseTime: 1240, timestamp: '14:32:08' },
    { id: 'api-2', endpoint: '/api/docs', method: 'POST', statusCode: 200, responseTime: 340, timestamp: '14:31:55' },
    { id: 'api-3', endpoint: '/api/github', method: 'GET', statusCode: 200, responseTime: 189, timestamp: '14:31:42' },
    { id: 'api-4', endpoint: '/api/vercel-status', method: 'GET', statusCode: 200, responseTime: 267, timestamp: '14:31:30' },
    { id: 'api-5', endpoint: '/api/chat', method: 'POST', statusCode: 429, responseTime: 45, timestamp: '14:31:18' },
    { id: 'api-6', endpoint: '/api/agents/dispatch', method: 'POST', statusCode: 200, responseTime: 892, timestamp: '14:30:55' },
    { id: 'api-7', endpoint: '/api/treasury/balances', method: 'GET', statusCode: 200, responseTime: 156, timestamp: '14:30:40' },
    { id: 'api-8', endpoint: '/api/signals/scan', method: 'POST', statusCode: 500, responseTime: 3200, timestamp: '14:30:22' },
    { id: 'api-9', endpoint: '/api/docs', method: 'DELETE', statusCode: 204, responseTime: 98, timestamp: '14:30:10' },
    { id: 'api-10', endpoint: '/api/crm/contacts', method: 'GET', statusCode: 200, responseTime: 412, timestamp: '14:29:58' },
    { id: 'api-11', endpoint: '/api/chat', method: 'POST', statusCode: 200, responseTime: 2100, timestamp: '14:29:44' },
    { id: 'api-12', endpoint: '/api/auth/refresh', method: 'POST', statusCode: 401, responseTime: 32, timestamp: '14:29:30' },
  ];
}

function mockAgentActivity(): AgentActivity[] {
  return [
    { id: 'ag-1', agent: 'Aegis', venture: 'MCV One', task: 'Processing CEO briefing synthesis from 3 venture dashboards', status: 'running', role: 'Queen Orchestrator' },
    { id: 'ag-2', agent: 'Smith', venture: 'Futurestate', task: 'Deploying investor portal update to preview', status: 'running', role: 'Ralph Execution Pod' },
    { id: 'ag-3', agent: 'Growth', venture: 'Bet-Edge', task: 'Analyzing user acquisition funnel metrics Q1 2026', status: 'waiting', role: 'Ralph Execution Pod' },
    { id: 'ag-4', agent: 'Director', venture: 'EdgeIQ', task: 'Compiling weekly treasury reconciliation report', status: 'complete', role: 'Ralph Execution Pod' },
    { id: 'ag-5', agent: 'Aegis', venture: 'Global', task: 'Monitoring session health across all active agents', status: 'running', role: 'Queen Orchestrator' },
  ];
}

function mockLogEntries(): LogEntry[] {
  return [
    { id: 'log-1', timestamp: '14:32:08', severity: 'info', message: '[claude-code] Session cs-1 token count: 48,200 / 200,000 context window' },
    { id: 'log-2', timestamp: '14:32:05', severity: 'success', message: '[api] POST /api/chat 200 OK (1240ms) - Aegis response streamed' },
    { id: 'log-3', timestamp: '14:31:58', severity: 'info', message: '[agent:smith] Futurestate preview deploy triggered on Vercel' },
    { id: 'log-4', timestamp: '14:31:55', severity: 'success', message: '[api] POST /api/docs 200 OK (340ms) - Document indexed' },
    { id: 'log-5', timestamp: '14:31:50', severity: 'warn', message: '[claude-code] Session cs-3 idle for 8 minutes - mcv-one/feat/agent-sdk' },
    { id: 'log-6', timestamp: '14:31:42', severity: 'info', message: '[api] GET /api/github 200 OK (189ms) - Fetched 12 repos' },
    { id: 'log-7', timestamp: '14:31:30', severity: 'success', message: '[agent:director] Treasury reconciliation report generated successfully' },
    { id: 'log-8', timestamp: '14:31:18', severity: 'warn', message: '[api] POST /api/chat 429 Rate Limited - backing off 30s' },
    { id: 'log-9', timestamp: '14:31:05', severity: 'info', message: '[claude-code] Session cs-4 completed - Bet-Edge/dev (35m, 18,900 tokens)' },
    { id: 'log-10', timestamp: '14:30:55', severity: 'success', message: '[agent:aegis] Dispatch acknowledged by Smith execution pod' },
    { id: 'log-11', timestamp: '14:30:40', severity: 'info', message: '[api] GET /api/treasury/balances 200 OK (156ms)' },
    { id: 'log-12', timestamp: '14:30:22', severity: 'error', message: '[api] POST /api/signals/scan 500 Internal Server Error (3200ms) - timeout upstream' },
    { id: 'log-13', timestamp: '14:30:10', severity: 'info', message: '[api] DELETE /api/docs 204 No Content (98ms)' },
    { id: 'log-14', timestamp: '14:29:58', severity: 'success', message: '[claude-code] Session cs-6 started - Futurestate/feat/tradfi-ticker' },
    { id: 'log-15', timestamp: '14:29:44', severity: 'info', message: '[agent:growth] Queued Bet-Edge Q1 funnel analysis - awaiting data pull' },
    { id: 'log-16', timestamp: '14:29:30', severity: 'warn', message: '[api] POST /api/auth/refresh 401 Unauthorized - token expired, re-authenticating' },
    { id: 'log-17', timestamp: '14:29:15', severity: 'success', message: '[claude-code] Session cs-2 auto-saved context snapshot (31,400 tokens)' },
    { id: 'log-18', timestamp: '14:29:00', severity: 'info', message: '[system] All sessions healthy - uptime 14h 32m - 0 critical errors' },
  ];
}

/* ── Helpers ── */

const STATUS_DOT: Record<string, string> = {
  active: '#10B981',
  idle: '#F59E0B',
  completed: '#556677',
  running: '#10B981',
  waiting: '#F59E0B',
  complete: '#556677',
  error: '#EF4444',
};

function statusCodeColor(code: number): string {
  if (code >= 200 && code < 300) return 'var(--success)';
  if (code >= 400 && code < 500) return 'var(--warning)';
  return 'var(--error)';
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET': return 'var(--cyan)';
    case 'POST': return 'var(--success)';
    case 'PUT': return 'var(--warning)';
    case 'PATCH': return 'var(--warning)';
    case 'DELETE': return 'var(--error)';
    default: return 'var(--text-muted)';
  }
}

const SEVERITY_COLOR: Record<string, string> = {
  info: 'var(--text-muted)',
  success: 'var(--success)',
  warn: 'var(--warning)',
  error: 'var(--error)',
};

const AGENT_COLOR: Record<string, string> = {
  Aegis: 'var(--cyan)',
  Smith: 'var(--purple)',
  Growth: 'var(--success)',
  Director: 'var(--warning)',
};

/* ── Component ── */

export default function SessionsView() {
  const [sessions, setSessions] = useState<ClaudeSession[]>(mockClaudeSessions);
  const [apiCalls, setApiCalls] = useState<ApiCall[]>(mockApiCalls);
  const [agents, setAgents] = useState<AgentActivity[]>(mockAgentActivity);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogEntries);
  const [refreshing, setRefreshing] = useState(false);
  const [uptime] = useState('14h 32m');
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulated live log injection
  useEffect(() => {
    const liveLogs: LogEntry[] = [
      { id: '', timestamp: '', severity: 'info', message: '[claude-code] Session cs-1 context checkpoint saved (49,100 tokens)' },
      { id: '', timestamp: '', severity: 'success', message: '[api] POST /api/chat 200 OK (980ms) - streaming response' },
      { id: '', timestamp: '', severity: 'info', message: '[agent:aegis] Health check: 5 agents reporting, 0 failures' },
      { id: '', timestamp: '', severity: 'warn', message: '[claude-code] Session cs-3 idle threshold exceeded (12m) - mcv-one' },
      { id: '', timestamp: '', severity: 'success', message: '[agent:smith] Preview deployment ready: futurestate-kx82.vercel.app' },
      { id: '', timestamp: '', severity: 'info', message: '[system] Memory usage: 2.1 GB / 8 GB - all sessions nominal' },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const entry = liveLogs[idx % liveLogs.length];
      setLogs(prev => [...prev.slice(-40), { ...entry, id: `live-${Date.now()}`, timestamp: ts }]);
      idx++;
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setSessions(mockClaudeSessions());
      setApiCalls(mockApiCalls());
      setAgents(mockAgentActivity());
      setRefreshing(false);
    }, 600);
  }, []);

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const totalApiToday = 1_247;

  return (
    <div className="sv">
      {/* HEADER */}
      <div className="sv-header">
        <div className="sv-header-left">
          <Monitor size={20} />
          <div>
            <h1 className="sv-title">Active Sessions</h1>
            <p className="sv-sub">
              {sessions.length} sessions &middot; {activeSessions} active &middot; {agents.filter(a => a.status === 'running').length} agents running
            </p>
          </div>
        </div>
        <button className="sv-refresh" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
        </button>
      </div>

      {/* KPI STRIP */}
      <div className="sv-kpis">
        <div className="sv-kpi glass">
          <Terminal size={14} />
          <div>
            <span className="sv-kpi-v">{sessions.length}</span>
            <span className="sv-kpi-l">Total Sessions</span>
          </div>
        </div>
        <div className="sv-kpi glass">
          <Cpu size={14} />
          <div>
            <span className="sv-kpi-v sv-kpi-cyan">{activeSessions}</span>
            <span className="sv-kpi-l">Active Claude Code</span>
          </div>
        </div>
        <div className="sv-kpi glass">
          <Zap size={14} />
          <div>
            <span className="sv-kpi-v sv-kpi-purple">{totalApiToday.toLocaleString()}</span>
            <span className="sv-kpi-l">API Calls Today</span>
          </div>
        </div>
        <div className="sv-kpi glass">
          <Clock size={14} />
          <div>
            <span className="sv-kpi-v sv-kpi-green">{uptime}</span>
            <span className="sv-kpi-l">Uptime</span>
          </div>
        </div>
      </div>

      {/* MAIN 3-COL GRID */}
      <div className="sv-grid">
        {/* Column 1: Claude Code Sessions */}
        <div className="sv-col">
          <h2 className="sv-col-title">
            <Terminal size={13} /> Claude Code Sessions
            <span className="sv-col-badge">{sessions.length}</span>
          </h2>
          <div className="sv-col-body">
            {sessions.map(s => (
              <div key={s.id} className="sv-session-card glass">
                <div className="sv-session-top">
                  <span className={`sv-dot ${s.status === 'active' ? 'sv-dot-pulse' : ''}`} style={{ background: STATUS_DOT[s.status] }} />
                  <span className="sv-session-repo">{s.repo}</span>
                  <span className="sv-session-status" style={{ color: STATUS_DOT[s.status] }}>{s.status}</span>
                </div>
                <div className="sv-session-branch">
                  <code>{s.branch}</code>
                </div>
                <div className="sv-session-meta">
                  <span><Clock size={10} /> {s.duration}</span>
                  <span className="sv-session-tokens">{s.tokens.toLocaleString()} tok</span>
                </div>
                <div className="sv-session-cmd">{s.lastCommand}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: API Sessions */}
        <div className="sv-col">
          <h2 className="sv-col-title">
            <Zap size={13} /> API Sessions
            <span className="sv-col-badge">{apiCalls.length}</span>
          </h2>
          <div className="sv-col-body">
            <div className="sv-api-table">
              <div className="sv-api-header">
                <span className="sv-api-h-method">Method</span>
                <span className="sv-api-h-endpoint">Endpoint</span>
                <span className="sv-api-h-status">Status</span>
                <span className="sv-api-h-time">Time</span>
              </div>
              {apiCalls.map(a => (
                <div key={a.id} className="sv-api-row">
                  <span className="sv-api-method" style={{ color: methodColor(a.method) }}>{a.method}</span>
                  <span className="sv-api-endpoint">{a.endpoint}</span>
                  <span className="sv-api-status" style={{ color: statusCodeColor(a.statusCode) }}>{a.statusCode}</span>
                  <span className="sv-api-time">{a.responseTime}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Agent Activity */}
        <div className="sv-col">
          <h2 className="sv-col-title">
            <Activity size={13} /> Agent Activity
            <span className="sv-col-badge">{agents.length}</span>
          </h2>
          <div className="sv-col-body">
            {agents.map(a => (
              <div key={a.id} className="sv-agent-card glass">
                <div className="sv-agent-top">
                  <span className={`sv-dot ${a.status === 'running' ? 'sv-dot-pulse' : ''}`} style={{ background: STATUS_DOT[a.status] }} />
                  <span className="sv-agent-name" style={{ color: AGENT_COLOR[a.agent] || 'var(--text-primary)' }}>{a.agent}</span>
                  <span className="sv-agent-role">{a.role}</span>
                </div>
                <div className="sv-agent-venture">
                  <Circle size={8} fill="var(--text-muted)" stroke="none" />
                  {a.venture}
                </div>
                <div className="sv-agent-task">{a.task}</div>
                <div className="sv-agent-status" style={{ color: STATUS_DOT[a.status] }}>
                  {a.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM: Session Log */}
      <div className="sv-log-section">
        <h2 className="sv-col-title sv-log-title">
          <Terminal size={13} /> Session Log
          <span className="sv-log-live">
            <span className="sv-dot sv-dot-pulse" style={{ background: 'var(--success)', width: 6, height: 6 }} />
            LIVE
          </span>
        </h2>
        <div className="sv-log" ref={logRef}>
          {logs.map(l => (
            <div key={l.id} className="sv-log-entry">
              <span className="sv-log-ts">{l.timestamp}</span>
              <span className="sv-log-sev" style={{ color: SEVERITY_COLOR[l.severity] }}>
                {l.severity === 'info' ? 'INF' : l.severity === 'success' ? 'OK ' : l.severity === 'warn' ? 'WRN' : 'ERR'}
              </span>
              <span className="sv-log-msg" style={{ color: SEVERITY_COLOR[l.severity] }}>{l.message}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .sv {
          height: 100%;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* ── Header ── */
        .sv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .sv-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--cyan);
        }
        .sv-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: var(--text-primary);
        }
        .sv-sub {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .sv-refresh {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all 0.15s;
        }
        .sv-refresh:hover { background: var(--bg-card); color: var(--cyan); }

        /* ── KPI Strip ── */
        .sv-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .sv-kpi {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }
        .sv-kpi > div { display: flex; flex-direction: column; }
        .sv-kpi-v {
          font-family: var(--font-mono);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .sv-kpi-l {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sv-kpi-cyan { color: var(--cyan) !important; }
        .sv-kpi-purple { color: var(--purple) !important; }
        .sv-kpi-green { color: var(--success) !important; }

        /* ── Glass reuse ── */
        .glass {
          background: rgba(11, 17, 33, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        /* ── 3-Column Grid ── */
        .sv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          flex: 1;
          min-height: 0;
        }
        @media (max-width: 1400px) {
          .sv-grid { grid-template-columns: 1fr 1fr; }
          .sv-grid > :last-child { grid-column: 1 / -1; }
        }

        .sv-col {
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          min-height: 0;
        }
        .sv-col-title {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .sv-col-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--cyan);
          background: var(--bg-surface);
          padding: 1px 6px;
          border-radius: 3px;
          margin-left: auto;
        }
        .sv-col-body {
          flex: 1;
          overflow-y: auto;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* ── Status dots ── */
        .sv-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          display: inline-block;
        }
        .sv-dot-pulse {
          animation: sv-pulse 2s ease-in-out infinite;
        }
        @keyframes sv-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; }
          50% { opacity: 0.7; box-shadow: 0 0 8px 2px currentColor; }
        }

        /* ── Claude Code Session Cards ── */
        .sv-session-card {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: border-color 0.15s;
        }
        .sv-session-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
        }
        .sv-session-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sv-session-repo {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }
        .sv-session-status {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sv-session-branch code {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--cyan);
          background: var(--bg-surface);
          padding: 1px 6px;
          border-radius: 3px;
        }
        .sv-session-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          color: var(--text-muted);
        }
        .sv-session-meta span {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .sv-session-tokens {
          font-family: var(--font-mono);
          color: var(--purple);
        }
        .sv-session-cmd {
          font-size: 10px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── API Table ── */
        .sv-api-table {
          display: flex;
          flex-direction: column;
        }
        .sv-api-header {
          display: grid;
          grid-template-columns: 58px 1fr 50px 60px;
          gap: 6px;
          padding: 5px 10px;
          font-size: 9px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border);
        }
        .sv-api-row {
          display: grid;
          grid-template-columns: 58px 1fr 50px 60px;
          gap: 6px;
          padding: 5px 10px;
          font-size: 11px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          align-items: center;
          transition: background 0.1s;
        }
        .sv-api-row:hover { background: var(--bg-elevated); }
        .sv-api-row:last-child { border-bottom: none; }
        .sv-api-method {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
        }
        .sv-api-endpoint {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-secondary);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .sv-api-status {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }
        .sv-api-time {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          text-align: right;
        }

        /* ── Agent Cards ── */
        .sv-agent-card {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: border-color 0.15s;
        }
        .sv-agent-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
        }
        .sv-agent-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sv-agent-name {
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-display);
        }
        .sv-agent-role {
          font-size: 9px;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-surface);
          padding: 1px 6px;
          border-radius: 3px;
          margin-left: auto;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .sv-agent-venture {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .sv-agent-task {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .sv-agent-status {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Session Log ── */
        .sv-log-section {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
        }
        .sv-log-title {
          border-bottom: 1px solid var(--border);
        }
        .sv-log-live {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--success);
          letter-spacing: 1px;
        }
        .sv-log {
          height: 180px;
          overflow-y: auto;
          padding: 4px 0;
          background: var(--bg-deep);
        }
        .sv-log-entry {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 2px 12px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          line-height: 1.7;
        }
        .sv-log-entry:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .sv-log-ts {
          color: var(--text-muted);
          flex-shrink: 0;
          min-width: 62px;
        }
        .sv-log-sev {
          font-weight: 700;
          flex-shrink: 0;
          min-width: 26px;
        }
        .sv-log-msg {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Shared ── */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 1100px) {
          .sv-kpis { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
