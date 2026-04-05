import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal, Radio, Cpu, HardDrive, Wifi, Activity,
  Shield, Wrench, Brain, Eye, RefreshCw, Pause, Play, Filter,
} from 'lucide-react';
import { useGithubRepos, useGithubCommits } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import { useTasks } from '../hooks/use-tasks';
import { useDocuments } from '../hooks/use-docs';
import { apiGet } from '../lib/api/client';
import { useAgentsStore } from '../stores/agents';

/* ──────────────────────── Types ──────────────────────── */

type Severity = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'AGENT';

interface LogEntry {
  id: number;
  timestamp: Date;
  severity: Severity;
  agent: string;
  message: string;
}

interface AgentInfo {
  name: string;
  role: string;
  status: 'active' | 'scanning' | 'monitoring' | 'idle' | 'analyzing';
  color: string;
  icon: React.ReactNode;
  lastAction: string;
  uptime: string;
}

interface TaskInfo {
  id: string;
  name: string;
  venture: string;
  progress: number;
  eta: string;
}

/* ──────────────────────── Constants ──────────────────────── */

const SEVERITY_COLOR: Record<Severity, string> = {
  INFO: '#8899AA',
  SUCCESS: '#10B981',
  WARN: '#F59E0B',
  ERROR: '#EF4444',
  AGENT: '#00F0FF',
};

const STATUS_META: Record<string, { color: string; label: string; pulse: boolean }> = {
  active:     { color: '#10B981', label: 'Active',     pulse: true },
  scanning:   { color: '#00F0FF', label: 'Scanning',   pulse: true },
  monitoring: { color: '#F59E0B', label: 'Monitoring', pulse: false },
  idle:       { color: '#556677', label: 'Idle',       pulse: false },
  analyzing:  { color: '#8B5CF6', label: 'Analyzing',  pulse: true },
};

/* ──────────────────────── Mock log generator ──────────────────────── */

let _logId = 0;

const LOG_TEMPLATES: { severity: Severity; agent: string; messages: string[] }[] = [
  // Aegis
  { severity: 'AGENT',   agent: 'Aegis',    messages: [
    'Processing natural language query: "Show me Q2 revenue trends"',
    'Routing intent to TreasuryModule.getRevenue()',
    'Context window: 12,847 tokens | 3 tool calls resolved',
    'Generating structured response with 4 data points',
    'Session #4891 completed in 1.2s (cache hit)',
    'Embedding query vector similarity: 0.94',
  ]},
  // GitHub webhooks
  { severity: 'INFO',    agent: 'GitHub',    messages: [
    'push: moust/mcv-one-desktop main +3 commits (ahead by 7)',
    'pull_request #142 opened: "feat: war-room terminal feed"',
    'pull_request #139 merged by moust (2 approvals)',
    'workflow_run: CI Pipeline completed (success) in 4m12s',
    'release: v0.8.3 published — 14 assets uploaded',
    'push: moust/futurestate develop +1 commit',
  ]},
  // Vercel
  { severity: 'SUCCESS', agent: 'Vercel',    messages: [
    'Build completed: mcv-one-desktop (prod) 48s | 2.1MB',
    'Deployment dpl_7xKm3 ready: mcv-one.vercel.app',
    'Edge function cold start: 12ms (p99)',
    'Serverless: /api/aegis invoked 847 times (0 errors)',
    'Preview deployment dpl_9zRn1 ready for PR #142',
    'Build cache hit ratio: 94.2%',
  ]},
  // Supabase
  { severity: 'INFO',    agent: 'Supabase',  messages: [
    'realtime: 4 active subscriptions on conversations table',
    'auth: Token refresh for user_mcv01 (session extended)',
    'db: Query execution avg 3.2ms (last 5m)',
    'storage: 12 objects uploaded to vault/documents',
    'edge-function: aegis-router invoked (200 OK, 89ms)',
    'realtime: broadcast on channel:war-room (3 listeners)',
  ]},
  // Scout
  { severity: 'AGENT',   agent: 'Scout',     messages: [
    'Scanning venture: Futurestate — 14 signals detected',
    'Market data refresh: S&P 500 +0.34%, NASDAQ +0.52%',
    'Competitor alert: New filing detected (SEC EDGAR)',
    'RSS feed digest: 28 articles, 3 high-relevance flagged',
    'Scanning venture: Kolo — social sentiment score: 7.2/10',
    'Data pipeline: 1,204 records processed in 3.1s',
  ]},
  // Sentry
  { severity: 'WARN',    agent: 'Sentry',    messages: [
    'API latency spike: /api/aegis p95 > 800ms (threshold 500ms)',
    'Rate limit approaching: GitHub API 4,712/5,000 calls',
    'Memory usage elevated: 78% on worker-03',
    'SSL certificate renewal: futurestate.dev expires in 14d',
    'Anomaly detected: login attempts +340% from AS13335',
    'Disk usage warning: /data at 82% capacity',
  ]},
  // Smith
  { severity: 'SUCCESS', agent: 'Smith',     messages: [
    'Component generated: InvestorDashboard.tsx (247 lines)',
    'API route scaffolded: /api/portfolio/rebalance',
    'Migration created: 20260404_add_war_room_events',
    'Test suite generated: 12 specs for TreasuryModule',
    'Code review complete: PR #142 — 3 suggestions, 0 blockers',
    'Template instantiated: venture-landing-page (Kolo)',
  ]},
  // Director
  { severity: 'AGENT',   agent: 'Director',  messages: [
    'Sprint velocity: 34 pts/week (+12% vs last sprint)',
    'Resource allocation optimized: 3 agents reassigned',
    'Priority recalculation complete: 7 tasks reordered',
    'Venture health score: Futurestate 8.4, Kolo 7.1, MCV 9.2',
    'Weekly report generated: 14 deliverables, 2 blockers',
    'Cross-venture dependency resolved: shared-auth-module',
  ]},
  // System
  { severity: 'INFO',    agent: 'System',    messages: [
    'Health check: all services nominal (uptime 99.97%)',
    'Cache invalidation: 342 keys purged (TTL expired)',
    'WebSocket connections: 4 active, 0 stale',
    'Background job queue: 3 pending, 0 failed',
    'Metrics flush: 1,847 data points shipped to analytics',
    'GC pause: 4ms (heap 128MB / 512MB)',
  ]},
  // Errors (rare)
  { severity: 'ERROR',   agent: 'System',    messages: [
    'Connection timeout: Supabase realtime (retrying in 5s)',
    'Rate limited: OpenAI API 429 — backoff 30s',
    'Webhook delivery failed: discord-notify (HTTP 503)',
  ]},
];

function generateLog(): LogEntry {
  const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const message = template.messages[Math.floor(Math.random() * template.messages.length)];
  return {
    id: ++_logId,
    timestamp: new Date(),
    severity: template.severity,
    agent: template.agent,
    message,
  };
}

/* ──────────────────────── Helpers ──────────────────────── */

function pad2(n: number) { return n.toString().padStart(2, '0'); }

function formatTs(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function formatUptime(base: number) {
  const diff = Math.floor((Date.now() - base) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/* ──────────────────────── Component ──────────────────────── */

export default function WarRoom() {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const seed: LogEntry[] = [];
    for (let i = 0; i < 15; i++) {
      const entry = generateLog();
      entry.timestamp = new Date(Date.now() - (15 - i) * 2500);
      seed.push(entry);
    }
    return seed;
  });

  // TanStack Query hooks for real data
  const { data: ghRepos = [] } = useGithubRepos();
  const { data: ghCommits = [] } = useGithubCommits();
  const { data: vcDeploys = [] } = useDeployments();
  const { data: allTasks = [] } = useTasks();
  const { data: allDocs = [] } = useDocuments();

  // Build real log entries from hook data and inject on change
  useEffect(() => {
    // Only inject once per data change to avoid duplicates
    const hasData = ghRepos.length > 0 || ghCommits.length > 0 || vcDeploys.length > 0;
    if (!hasData) return;

    const entries: LogEntry[] = [];

    // GitHub commits
    for (const c of ghCommits.slice(0, 5)) {
      entries.push({ id: ++_logId, timestamp: new Date(c.commit.author.date), severity: 'INFO', agent: 'GitHub', message: `commit ${c.sha.slice(0, 7)}: ${c.commit.message.split('\n')[0]}` });
    }
    if (ghRepos.length > 0) {
      entries.push({ id: ++_logId, timestamp: new Date(), severity: 'SUCCESS', agent: 'GitHub', message: `${ghRepos.length} repositories tracked | ${ghRepos.reduce((s, r) => s + (r.open_issues_count || 0), 0)} open issues` });
    }

    // Vercel deployments
    for (const d of vcDeploys.slice(0, 4)) {
      const sev: Severity = d.state === 'READY' ? 'SUCCESS' : d.state === 'ERROR' ? 'ERROR' : 'INFO';
      entries.push({ id: ++_logId, timestamp: new Date(d.created), severity: sev, agent: 'Vercel', message: `${d.name} → ${d.state} (${d.target || 'preview'}) ${d.url ? d.url : ''}` });
    }

    // Tasks summary
    if (allTasks.length > 0) {
      const active = allTasks.filter(t => t.status !== 'done' && t.status !== 'completed').length;
      entries.push({ id: ++_logId, timestamp: new Date(), severity: 'INFO', agent: 'Director', message: `Task board: ${active} active tasks | ${allTasks.length} total` });
    }

    // Docs summary
    if (allDocs.length > 0) {
      entries.push({ id: ++_logId, timestamp: new Date(), severity: 'INFO', agent: 'Aegis', message: `Knowledge base: ${allDocs.length} documents indexed` });
    }

    entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (entries.length > 0) {
      setLogs(prev => [...prev, ...entries].slice(-500));
    }
  }, [ghRepos, ghCommits, vcDeploys, allTasks, allDocs]);

  // Health check — no hook available, use apiGet in a one-time effect
  useEffect(() => {
    let mounted = true;
    apiGet<Record<string, boolean>>('/api/health').then(health => {
      if (!mounted || !health) return;
      const configured = Object.entries(health).filter(([, v]) => v).map(([k]) => k);
      setLogs(prev => [...prev, { id: ++_logId, timestamp: new Date(), severity: 'SUCCESS' as Severity, agent: 'System', message: `Health: ${configured.length} services configured [${configured.join(', ')}]` }].slice(-500));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const [paused, setPaused] = useState(false);
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Agent uptimes (set once on mount)
  const [agentUptimes] = useState(() => ({
    Aegis:    Date.now() - 14400000,
    Scout:    Date.now() - 7200000,
    Sentry:   Date.now() - 10800000,
    Smith:    Date.now() - 3600000,
    Director: Date.now() - 5400000,
  }));

  const [uptickKey, setUptickKey] = useState(0);

  // Metrics with gentle drift
  const [metrics, setMetrics] = useState({
    cpu: 34,
    memUsed: 2.1,
    memTotal: 4,
    apiCalls: 12,
    connections: 4,
  });

  // Agents store
  const addAgentTask = useAgentsStore((s) => s.addTask);
  const completeAgentTask = useAgentsStore((s) => s.completeTask);
  const activeTaskCount = useAgentsStore((s) => s.activeTaskCount);

  // Tasks — seed from hook data
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const tasksSeededRef = useRef(false);

  // Map local task IDs to agents store task IDs
  const storeTaskIdsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (tasksSeededRef.current || allTasks.length === 0) return;
    tasksSeededRef.current = true;
    const active = allTasks
      .filter(t => t.status === 'in_progress' || t.status === 'review')
      .slice(0, 6)
      .map((t, i) => ({
        id: t.id,
        name: t.title,
        venture: t.venture_id || 'Global',
        progress: t.status === 'review' ? 90 : 30 + i * 15,
        eta: t.status === 'review' ? '~1m' : `~${5 + i * 3}m`,
      }));
    if (active.length > 0) {
      setTasks(active);
      // Seed agents store with initial tasks
      for (const t of active) {
        const storeId = addAgentTask({
          agentType: 'scout',
          name: t.name,
          description: `War Room task: ${t.name} (${t.venture})`,
          status: 'executing',
          ventureId: t.venture,
        });
        storeTaskIdsRef.current[t.id] = storeId;
      }
    }
  }, [allTasks, addAgentTask]);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [logs]);

  // Log generation interval
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) {
        setLogs(prev => {
          const next = [...prev, generateLog()];
          // Cap at 500 entries
          return next.length > 500 ? next.slice(next.length - 500) : next;
        });
      }
    }, 1800 + Math.random() * 1400); // ~2-3s
    return () => clearInterval(id);
  }, []);

  // Metric drift + uptime tick
  useEffect(() => {
    const id = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(8, Math.min(95, prev.cpu + (Math.random() - 0.48) * 6)),
        memUsed: Math.max(0.8, Math.min(3.8, prev.memUsed + (Math.random() - 0.5) * 0.15)),
        memTotal: 4,
        apiCalls: Math.max(2, Math.min(60, prev.apiCalls + Math.floor((Math.random() - 0.45) * 5))),
        connections: Math.max(1, Math.min(12, prev.connections + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0))),
      }));
      setUptickKey(k => k + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Task progress drift
  useEffect(() => {
    const id = setInterval(() => {
      setTasks(prev => prev.map(t => {
        let p = t.progress + Math.floor(Math.random() * 4);
        if (p >= 100) {
          // Complete the task in agents store
          const storeId = storeTaskIdsRef.current[t.id];
          if (storeId) {
            completeAgentTask(storeId, `Completed: ${t.name}`);
          }

          // Reset with new task
          const names = [
            'Schema migration deploy', 'Aegis model sync', 'Edge function warm-up',
            'Market data ingest', 'Venture health scan', 'API stress test',
            'Cache rebuild cycle', 'Document embedding batch',
          ];
          const newName = names[Math.floor(Math.random() * names.length)];

          // Add the new task to agents store
          const newStoreId = addAgentTask({
            agentType: 'scout',
            name: newName,
            description: `War Room task: ${newName} (${t.venture})`,
            status: 'executing',
            ventureId: t.venture,
          });
          storeTaskIdsRef.current[t.id] = newStoreId;

          return {
            ...t,
            name: newName,
            progress: Math.floor(Math.random() * 20),
            eta: `~${Math.floor(Math.random() * 10) + 2}m`,
          };
        }
        return { ...t, progress: p };
      }));
    }, 4000);
    return () => clearInterval(id);
  }, [addAgentTask, completeAgentTask]);

  // Command handler
  const handleCommand = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setCmdHistory(h => [trimmed, ...h].slice(0, 50));
    setHistoryIdx(-1);

    if (trimmed === '/clear') {
      setLogs([]);
      return;
    }
    if (trimmed === '/pause') {
      setPaused(true);
      setLogs(prev => [...prev, {
        id: ++_logId,
        timestamp: new Date(),
        severity: 'WARN',
        agent: 'System',
        message: 'Log feed paused by operator',
      }]);
      return;
    }
    if (trimmed === '/resume') {
      setPaused(false);
      setLogs(prev => [...prev, {
        id: ++_logId,
        timestamp: new Date(),
        severity: 'SUCCESS',
        agent: 'System',
        message: 'Log feed resumed',
      }]);
      return;
    }
    if (trimmed.startsWith('/filter')) {
      const arg = trimmed.split(/\s+/)[1];
      if (arg) {
        setFilterAgent(arg.charAt(0).toUpperCase() + arg.slice(1).toLowerCase());
        setLogs(prev => [...prev, {
          id: ++_logId,
          timestamp: new Date(),
          severity: 'INFO',
          agent: 'System',
          message: `Filter active: showing only ${arg} logs`,
        }]);
      } else {
        setFilterAgent(null);
        setLogs(prev => [...prev, {
          id: ++_logId,
          timestamp: new Date(),
          severity: 'INFO',
          agent: 'System',
          message: 'Filter cleared: showing all logs',
        }]);
      }
      return;
    }

    // Echo user command into log
    setLogs(prev => [...prev, {
      id: ++_logId,
      timestamp: new Date(),
      severity: 'AGENT',
      agent: 'Operator',
      message: `> ${trimmed}`,
    }]);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(cmdInput);
      setCmdInput('');
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      if (nextIdx >= 0 && cmdHistory[nextIdx]) {
        setHistoryIdx(nextIdx);
        setCmdInput(cmdHistory[nextIdx]);
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = historyIdx - 1;
      if (nextIdx < 0) {
        setHistoryIdx(-1);
        setCmdInput('');
      } else {
        setHistoryIdx(nextIdx);
        setCmdInput(cmdHistory[nextIdx]);
      }
    }
  };

  const filteredLogs = filterAgent
    ? logs.filter(l => l.agent.toLowerCase() === filterAgent.toLowerCase())
    : logs;

  const agents: AgentInfo[] = [
    { name: 'Aegis',    role: 'AI Assistant',     status: 'active',     color: '#10B981', icon: <Shield size={14} />,     lastAction: 'Processed query #4891',        uptime: formatUptime(agentUptimes.Aegis) },
    { name: 'Scout',    role: 'Intelligence',     status: 'scanning',   color: '#00F0FF', icon: <Eye size={14} />,        lastAction: 'Scanning 14 RSS feeds',        uptime: formatUptime(agentUptimes.Scout) },
    { name: 'Sentry',   role: 'Monitoring',       status: 'monitoring', color: '#F59E0B', icon: <Activity size={14} />,   lastAction: 'Latency check on /api/aegis',  uptime: formatUptime(agentUptimes.Sentry) },
    { name: 'Smith',    role: 'Builder',          status: 'idle',       color: '#556677', icon: <Wrench size={14} />,     lastAction: 'Generated InvestorDash.tsx',   uptime: formatUptime(agentUptimes.Smith) },
    { name: 'Director', role: 'Orchestrator',     status: 'analyzing',  color: '#8B5CF6', icon: <Brain size={14} />,      lastAction: 'Sprint velocity recalc',       uptime: formatUptime(agentUptimes.Director) },
  ];

  // Force re-render for uptime display
  void uptickKey;

  return (
    <div className="wr">
      <div className="wr-cols">
        {/* ── LEFT: Terminal Feed ── */}
        <div className="wr-left">
          <div className="wr-term-header">
            <div className="wr-term-title">
              <Terminal size={16} />
              <span>War Room</span>
            </div>
            <div className="wr-term-controls">
              {filterAgent && (
                <button className="wr-ctrl-btn" onClick={() => setFilterAgent(null)} title="Clear filter">
                  <Filter size={12} />
                  <span>{filterAgent}</span>
                </button>
              )}
              <button
                className="wr-ctrl-btn"
                onClick={() => { setPaused(p => !p); }}
                title={paused ? 'Resume' : 'Pause'}
              >
                {paused ? <Play size={12} /> : <Pause size={12} />}
              </button>
              <div className={`wr-live ${paused ? 'wr-live--paused' : ''}`}>
                <Radio size={10} />
                <span>{paused ? 'PAUSED' : 'LIVE'}</span>
              </div>
            </div>
          </div>

          <div className="wr-term" ref={termRef} onClick={() => inputRef.current?.focus()}>
            {filteredLogs.map(entry => (
              <div key={entry.id} className="wr-log">
                <span className="wr-log-ts">{formatTs(entry.timestamp)}</span>
                <span className="wr-log-sev" style={{ color: SEVERITY_COLOR[entry.severity] }}>
                  {entry.severity.padEnd(7)}
                </span>
                <span className="wr-log-agent" style={{ color: entry.agent === 'Operator' ? '#00F0FF' : SEVERITY_COLOR[entry.severity] }}>
                  [{entry.agent}]
                </span>
                <span className="wr-log-msg" style={{ color: entry.severity === 'ERROR' ? '#EF4444' : entry.severity === 'WARN' ? '#F59E0B' : undefined }}>
                  {entry.message}
                </span>
              </div>
            ))}
            <div className="wr-cursor" />
          </div>

          <div className="wr-input-row">
            <span className="wr-prompt">mcv@war-room $</span>
            <input
              ref={inputRef}
              className="wr-input"
              value={cmdInput}
              onChange={e => setCmdInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="/clear  /pause  /resume  /filter <agent>"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        {/* ── RIGHT: Status Panels ── */}
        <div className="wr-right">
          {/* Agent Status Grid */}
          <div className="wr-panel">
            <div className="wr-panel-head">
              <Shield size={13} />
              <span>Agent Swarm</span>
              <span className="wr-panel-badge">{agents.filter(a => a.status !== 'idle').length} online</span>
            </div>
            <div className="wr-agents">
              {agents.map(a => {
                const meta = STATUS_META[a.status];
                return (
                  <div key={a.name} className="wr-agent" onClick={() => {
                    setFilterAgent(prev => prev === a.name ? null : a.name);
                  }}>
                    <div className="wr-agent-top">
                      <div className="wr-agent-icon" style={{ color: meta.color }}>{a.icon}</div>
                      <div className="wr-agent-info">
                        <span className="wr-agent-name">{a.name}</span>
                        <span className="wr-agent-role">{a.role}</span>
                      </div>
                      <div className="wr-agent-status">
                        <span className={`wr-dot ${meta.pulse ? 'wr-dot--pulse' : ''}`} style={{ background: meta.color }} />
                        <span style={{ color: meta.color, fontSize: '10px' }}>{meta.label}</span>
                      </div>
                    </div>
                    <div className="wr-agent-bottom">
                      <span className="wr-agent-action">{a.lastAction}</span>
                      <span className="wr-agent-uptime">{a.uptime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Metrics */}
          <div className="wr-panel">
            <div className="wr-panel-head">
              <Cpu size={13} />
              <span>System Metrics</span>
              <span className="wr-panel-badge wr-panel-badge--green">nominal</span>
            </div>
            <div className="wr-metrics">
              <div className="wr-metric">
                <div className="wr-metric-row">
                  <Cpu size={11} />
                  <span>CPU Usage</span>
                  <span className="wr-metric-val">{Math.round(metrics.cpu)}%</span>
                </div>
                <div className="wr-bar">
                  <div
                    className="wr-bar-fill"
                    style={{
                      width: `${metrics.cpu}%`,
                      background: metrics.cpu > 80 ? 'var(--error)' : metrics.cpu > 60 ? 'var(--warning)' : 'var(--success)',
                    }}
                  />
                </div>
              </div>
              <div className="wr-metric">
                <div className="wr-metric-row">
                  <HardDrive size={11} />
                  <span>Memory</span>
                  <span className="wr-metric-val">{metrics.memUsed.toFixed(1)}/{metrics.memTotal}GB</span>
                </div>
                <div className="wr-bar">
                  <div
                    className="wr-bar-fill"
                    style={{
                      width: `${(metrics.memUsed / metrics.memTotal) * 100}%`,
                      background: metrics.memUsed / metrics.memTotal > 0.8 ? 'var(--error)' : 'var(--cyan)',
                    }}
                  />
                </div>
              </div>
              <div className="wr-metric-nums">
                <div className="wr-metric-num">
                  <RefreshCw size={11} />
                  <span>API Calls/min</span>
                  <span className="wr-metric-val wr-metric-val--mono">{metrics.apiCalls}</span>
                </div>
                <div className="wr-metric-num">
                  <Wifi size={11} />
                  <span>Connections</span>
                  <span className="wr-metric-val wr-metric-val--mono">{metrics.connections}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="wr-panel">
            <div className="wr-panel-head">
              <Activity size={13} />
              <span>Active Tasks</span>
              <span className="wr-panel-badge">{activeTaskCount} running</span>
            </div>
            <div className="wr-tasks">
              {tasks.map(t => (
                <div key={t.id} className="wr-task">
                  <div className="wr-task-top">
                    <span className="wr-task-name">{t.name}</span>
                    <span className="wr-task-venture">{t.venture}</span>
                  </div>
                  <div className="wr-task-bottom">
                    <div className="wr-bar wr-bar--task">
                      <div
                        className="wr-bar-fill"
                        style={{
                          width: `${t.progress}%`,
                          background: t.progress > 75 ? 'var(--success)' : 'var(--cyan)',
                        }}
                      />
                    </div>
                    <span className="wr-task-pct">{t.progress}%</span>
                    <span className="wr-task-eta">{t.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Layout ── */
        .wr {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-deep);
          overflow: hidden;
        }
        .wr-cols {
          flex: 1;
          display: flex;
          gap: 1px;
          min-height: 0;
          background: rgba(0,240,255,0.04);
        }

        /* ── Left column: Terminal ── */
        .wr-left {
          flex: 0 0 65%;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: var(--bg-deep);
        }

        .wr-term-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #0B1121;
          border-bottom: 1px solid rgba(0,240,255,0.08);
          flex-shrink: 0;
        }
        .wr-term-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--cyan);
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .wr-term-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wr-ctrl-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 10px;
          cursor: pointer;
          transition: all 150ms;
        }
        .wr-ctrl-btn:hover {
          background: rgba(0,240,255,0.08);
          border-color: rgba(0,240,255,0.2);
          color: var(--cyan);
        }

        .wr-live {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #10B981;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25);
        }
        .wr-live svg {
          animation: wr-pulse-radio 1.5s ease-in-out infinite;
        }
        .wr-live--paused {
          color: var(--warning);
          background: rgba(245,158,11,0.1);
          border-color: rgba(245,158,11,0.25);
        }
        .wr-live--paused svg {
          animation: none;
        }

        @keyframes wr-pulse-radio {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ── Terminal body ── */
        .wr-term {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          background: #0a0a0a;
          padding: 8px 12px;
          font-family: var(--font-mono);
          font-size: 12px;
          line-height: 1.65;
          cursor: text;
          scrollbar-width: thin;
          scrollbar-color: #1a1a2e #0a0a0a;
        }
        .wr-term::-webkit-scrollbar { width: 6px; }
        .wr-term::-webkit-scrollbar-track { background: #0a0a0a; }
        .wr-term::-webkit-scrollbar-thumb { background: #1a1a2e; border-radius: 3px; }
        .wr-term::-webkit-scrollbar-thumb:hover { background: #2a2a4e; }

        .wr-log {
          display: flex;
          gap: 0;
          white-space: nowrap;
          animation: wr-log-in 200ms ease-out;
        }
        @keyframes wr-log-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wr-log-ts {
          color: #445566;
          min-width: 70px;
          flex-shrink: 0;
        }
        .wr-log-sev {
          min-width: 65px;
          flex-shrink: 0;
          font-weight: 600;
        }
        .wr-log-agent {
          min-width: 90px;
          flex-shrink: 0;
          font-weight: 500;
        }
        .wr-log-msg {
          color: #AABBAA;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Blinking cursor at bottom */
        .wr-cursor {
          display: inline-block;
          width: 7px;
          height: 14px;
          background: #10B981;
          margin-top: 2px;
          animation: wr-blink 1s step-end infinite;
        }
        @keyframes wr-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* ── Input row ── */
        .wr-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #0d0d0d;
          border-top: 1px solid #1a1a2e;
          flex-shrink: 0;
        }
        .wr-prompt {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #10B981;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .wr-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #E0E0E0;
          font-family: var(--font-mono);
          font-size: 12px;
          caret-color: #10B981;
        }
        .wr-input::placeholder {
          color: #334455;
        }

        /* ── Right column: Panels ── */
        .wr-right {
          flex: 0 0 35%;
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: rgba(0,240,255,0.04);
          min-width: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #1a1a2e var(--bg-surface);
        }

        .wr-panel {
          background: var(--bg-surface);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .wr-panel-head {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(0,240,255,0.06);
          color: var(--text-secondary);
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .wr-panel-badge {
          margin-left: auto;
          padding: 1px 7px;
          border-radius: 3px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 600;
          color: var(--cyan);
          background: rgba(0,240,255,0.08);
          border: 1px solid rgba(0,240,255,0.15);
          text-transform: none;
          letter-spacing: 0;
        }
        .wr-panel-badge--green {
          color: var(--success);
          background: rgba(16,185,129,0.08);
          border-color: rgba(16,185,129,0.15);
        }

        /* ── Agents ── */
        .wr-agents {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: rgba(0,0,0,0.2);
        }
        .wr-agent {
          padding: 9px 14px;
          background: var(--bg-surface);
          cursor: pointer;
          transition: background 150ms;
        }
        .wr-agent:hover {
          background: var(--bg-card);
        }
        .wr-agent-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wr-agent-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .wr-agent-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .wr-agent-name {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .wr-agent-role {
          font-size: 10px;
          color: var(--text-muted);
          line-height: 1.2;
        }
        .wr-agent-status {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .wr-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .wr-dot--pulse {
          animation: wr-dot-pulse 2s ease-in-out infinite;
        }
        @keyframes wr-dot-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; }
          50% { opacity: 0.6; box-shadow: 0 0 6px 2px currentColor; }
        }
        .wr-agent-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          padding-left: 34px;
        }
        .wr-agent-action {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .wr-agent-uptime {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #334455;
          flex-shrink: 0;
        }

        /* ── Metrics ── */
        .wr-metrics {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .wr-metric-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .wr-metric-val {
          margin-left: auto;
          font-family: var(--font-mono);
          font-weight: 600;
          color: var(--text-primary);
          font-size: 11px;
        }
        .wr-metric-val--mono {
          font-size: 14px;
          letter-spacing: -0.5px;
        }
        .wr-bar {
          height: 4px;
          background: rgba(255,255,255,0.04);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 4px;
        }
        .wr-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 1s ease;
        }
        .wr-metric-nums {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 2px;
        }
        .wr-metric-num {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-secondary);
          padding: 8px 10px;
          background: rgba(255,255,255,0.02);
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.04);
        }

        /* ── Tasks ── */
        .wr-tasks {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: rgba(0,0,0,0.2);
        }
        .wr-task {
          padding: 9px 14px;
          background: var(--bg-surface);
        }
        .wr-task-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .wr-task-name {
          font-size: 11px;
          color: var(--text-primary);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .wr-task-venture {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          padding: 1px 6px;
          background: rgba(255,255,255,0.03);
          border-radius: 3px;
          flex-shrink: 0;
        }
        .wr-task-bottom {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wr-bar--task {
          flex: 1;
        }
        .wr-task-pct {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 28px;
          text-align: right;
        }
        .wr-task-eta {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          min-width: 28px;
          text-align: right;
        }

        /* ── Responsive density for 4K ── */
        @media (min-width: 2560px) {
          .wr-term { font-size: 13px; padding: 12px 16px; }
          .wr-log-ts { min-width: 80px; }
          .wr-log-sev { min-width: 75px; }
          .wr-log-agent { min-width: 100px; }
          .wr-agent { padding: 11px 18px; }
          .wr-agent-name { font-size: 14px; }
          .wr-metrics { padding: 14px 18px; }
          .wr-panel-head { padding: 12px 18px; font-size: 13px; }
          .wr-input { font-size: 13px; }
          .wr-prompt { font-size: 13px; }
        }
      `}</style>
    </div>
  );
}
