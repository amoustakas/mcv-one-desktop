import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wand2, Play, Copy, Check, Save, RefreshCw, Settings2,
  Loader2, FileText, Sparkles, Variable, Hash,
} from 'lucide-react';
import Markdown from '../components/Markdown';

/* ───── Types ───── */
type ProviderId = 'claude' | 'gemini' | 'gpt';

interface ProviderDef {
  id: ProviderId;
  name: string;
  company: string;
  color: string;
  models: string[];
}

interface ContextDoc {
  id: string;
  title: string;
  venture_id: string;
  content?: string;
  enabled: boolean;
}

interface HistoryEntry {
  id: string;
  provider: ProviderId;
  model: string;
  prompt: string;
  output: string;
  timestamp: number;
}

/* ───── Provider Definitions ───── */
const PROVIDERS: ProviderDef[] = [
  {
    id: 'claude',
    name: 'Claude',
    company: 'Anthropic',
    color: '#D97706',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    company: 'Google',
    color: '#4285F4',
    models: ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  },
  {
    id: 'gpt',
    name: 'GPT',
    company: 'OpenAI',
    color: '#10A37F',
    models: ['gpt-4o', 'gpt-4o-mini'],
  },
];

/* ───── API Helpers ───── */
async function callDocsApi(body: Record<string, unknown>) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Docs API error: ${res.status}`);
  return res.json();
}

async function callChatApi(body: Record<string, unknown>) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  return res.json();
}

async function callGoogleApi(body: Record<string, unknown>) {
  const res = await fetch('/api/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google API error: ${res.status}`);
  return res.json();
}

/* ───── Variable Extraction ───── */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ''))));
}

function substituteVariables(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}

/* ───── Styles ───── */
const S = {
  root: {
    display: 'flex',
    height: '100%',
    gap: '1px',
    background: 'var(--bg-deep)',
    overflow: 'hidden',
  },

  /* Left Panel */
  left: {
    width: '300px',
    minWidth: '300px',
    background: 'rgba(11,17,33,0.8)',
    backdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  leftScroll: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },

  /* Center Panel */
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'var(--bg-surface)',
    overflow: 'hidden',
    minWidth: 0,
  },
  centerScroll: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },

  /* Right Panel */
  right: {
    width: '380px',
    minWidth: '380px',
    background: 'rgba(11,17,33,0.8)',
    backdropFilter: 'blur(12px)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  rightScroll: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },

  /* Section header */
  sectionLabel: {
    fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  /* Provider radio card */
  providerCard: (active: boolean, color: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    background: active ? `${color}10` : 'var(--bg-card)',
    border: `1px solid ${active ? color : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ...(active ? { boxShadow: `0 0 16px ${color}18, inset 0 1px 0 ${color}14` } : {}),
  }),
  providerRadio: (active: boolean, color: string) => ({
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: `2px solid ${active ? color : 'var(--border)'}`,
    background: active ? color : 'transparent',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  providerRadioInner: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#000',
  },
  providerName: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  providerCompany: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.04em',
  },

  /* Model select */
  modelSelect: {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    padding: '8px 10px',
    outline: 'none',
    cursor: 'pointer',
  },

  /* Textarea (shared) */
  textarea: {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    padding: '10px 12px',
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: 1.6,
    minHeight: '72px',
    boxSizing: 'border-box' as const,
  },
  monoTextarea: {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    padding: '16px',
    resize: 'none' as const,
    outline: 'none',
    lineHeight: 1.7,
    flex: 1,
    minHeight: '280px',
    boxSizing: 'border-box' as const,
  },

  /* Slider row */
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  sliderLabel: {
    fontSize: '0.7rem',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    minWidth: '55px',
  },
  slider: {
    flex: 1,
    appearance: 'none' as const,
    height: '3px',
    background: 'var(--border)',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
    accentColor: 'var(--cyan)',
  },
  sliderValue: {
    fontSize: '0.68rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--cyan)',
    minWidth: '40px',
    textAlign: 'right' as const,
  },

  /* Context doc row */
  contextDoc: (enabled: boolean) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '8px 10px',
    background: enabled ? 'rgba(0,240,255,0.04)' : 'transparent',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    border: `1px solid ${enabled ? 'rgba(0,240,255,0.12)' : 'transparent'}`,
  }),
  checkbox: (checked: boolean) => ({
    width: '14px',
    height: '14px',
    borderRadius: '3px',
    border: `1.5px solid ${checked ? 'var(--cyan)' : 'var(--border)'}`,
    background: checked ? 'var(--cyan)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
    transition: 'all 0.15s ease',
  }),
  checkMark: {
    fontSize: '9px',
    color: '#000',
    fontWeight: 700,
    lineHeight: 1,
  },
  docTitle: {
    fontSize: '0.74rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  docVenture: {
    fontSize: '0.6rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },

  /* Center header */
  centerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border)',
  },
  centerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  badge: (color: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.6rem',
    fontFamily: 'var(--font-mono)',
    color,
    background: `${color}12`,
    border: `1px solid ${color}30`,
    borderRadius: '20px',
    padding: '2px 10px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  }),

  /* Variable chip */
  varChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--purple)',
    background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: '20px',
    padding: '2px 8px',
    letterSpacing: '0.02em',
  },
  varInput: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    padding: '6px 10px',
    outline: 'none',
    flex: 1,
    boxSizing: 'border-box' as const,
  },
  varRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  /* Stats bar */
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 0',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },

  /* Buttons */
  btnPrimary: (color: string, disabled: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    background: disabled ? 'var(--bg-elevated)' : color,
    color: disabled ? 'var(--text-muted)' : '#000',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 22px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
  }),
  btnSecondary: {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '5px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    letterSpacing: '0.02em',
  },
  btnIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    padding: 0,
  },

  /* Right panel output */
  outputBox: {
    flex: 1,
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
    overflow: 'auto',
    fontSize: '0.78rem',
    color: 'var(--text-primary)',
    lineHeight: 1.7,
    minHeight: '180px',
  },
  outputHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outputLabel: {
    fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  outputActions: {
    display: 'flex',
    gap: '6px',
  },

  /* History */
  historyItem: (active: boolean) => ({
    padding: '10px 12px',
    background: active ? 'var(--bg-elevated)' : 'var(--bg-card)',
    border: `1px solid ${active ? 'var(--border-active)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  }),
  historyPrompt: {
    fontSize: '0.72rem',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontWeight: 500,
  },
  historyMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.6rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    letterSpacing: '0.02em',
  },
  historyBadge: (color: string) => ({
    fontSize: '0.56rem',
    fontFamily: 'var(--font-mono)',
    color,
    background: `${color}14`,
    border: `1px solid ${color}28`,
    borderRadius: '10px',
    padding: '1px 6px',
    letterSpacing: '0.04em',
  }),

  /* Empty state */
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    textAlign: 'center' as const,
    padding: '32px 16px',
    fontStyle: 'italic',
  },

  /* Optimize row */
  optimizeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  /* Divider */
  divider: {
    height: '1px',
    background: 'var(--border)',
    margin: '4px 0',
  },
} as const;

/* ───── Component ───── */
export default function PromptComposer() {
  /* Provider & model */
  const [provider, setProvider] = useState<ProviderId>('claude');
  const [models, setModels] = useState<Record<ProviderId, string>>({
    claude: PROVIDERS[0].models[0],
    gemini: PROVIDERS[1].models[0],
    gpt: PROVIDERS[2].models[0],
  });

  /* Prompt state */
  const [systemRole, setSystemRole] = useState('');
  const [prompt, setPrompt] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  /* Parameters */
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  /* Context docs */
  const [contextDocs, setContextDocs] = useState<ContextDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  /* Output */
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  /* History */
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  /* Derived */
  const providerDef = PROVIDERS.find(p => p.id === provider)!;
  const currentModel = models[provider];
  const detectedVars = useMemo(() => extractVariables(prompt), [prompt]);
  const charCount = prompt.length;
  const tokenEstimate = Math.ceil(charCount / 4);

  /* Build the final prompt with variable substitution + context */
  const buildFinalPrompt = useCallback(() => {
    let finalPrompt = substituteVariables(prompt, variableValues);

    const enabledDocs = contextDocs.filter(d => d.enabled);
    if (enabledDocs.length > 0) {
      const contextBlock = enabledDocs
        .map(d => `--- ${d.title} (${d.venture_id}) ---\n${d.content || ''}`)
        .join('\n\n');
      finalPrompt = `Context Documents:\n${contextBlock}\n\n---\n\n${finalPrompt}`;
    }

    return finalPrompt;
  }, [prompt, variableValues, contextDocs]);

  /* Fetch context documents on mount */
  useEffect(() => {
    let cancelled = false;
    async function loadDocs() {
      setDocsLoading(true);
      try {
        const data = await callDocsApi({ action: 'list' });
        if (cancelled) return;
        const docs: ContextDoc[] = (data.documents || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          title: d.title as string || 'Untitled',
          venture_id: d.venture_id as string || 'unknown',
          content: d.content as string || '',
          enabled: false,
        }));
        setContextDocs(docs);
      } catch {
        /* silent - docs panel will just be empty */
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    }
    loadDocs();
    return () => { cancelled = true; };
  }, []);

  /* Sync variable inputs when new vars detected */
  useEffect(() => {
    setVariableValues(prev => {
      const next: Record<string, string> = {};
      for (const v of detectedVars) {
        next[v] = prev[v] ?? '';
      }
      return next;
    });
  }, [detectedVars]);

  /* Toggle context doc */
  function toggleDoc(id: string) {
    setContextDocs(prev =>
      prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d)
    );
  }

  /* Optimize prompt via Gemini */
  async function handleOptimize() {
    if (!prompt.trim() || optimizing) return;
    setOptimizing(true);
    try {
      const data = await callGoogleApi({
        action: 'gemini-generate',
        prompt: `Optimize this prompt for ${currentModel}. Return ONLY the improved prompt text, nothing else:\n\n${prompt}`,
      });
      const optimized = (data.text || data.response || '') as string;
      if (optimized.trim()) {
        setPrompt(optimized.trim());
      }
    } catch (err) {
      setOutput(`**Optimization Error:** ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOptimizing(false);
    }
  }

  /* Run prompt */
  async function handleRun() {
    if (running || !prompt.trim()) return;
    setRunning(true);
    setOutput('');
    setCopied(false);

    const finalPrompt = buildFinalPrompt();

    try {
      let result = '';

      if (provider === 'claude') {
        const data = await callChatApi({
          messages: [{ role: 'user', content: finalPrompt }],
          systemPrompt: systemRole || undefined,
          temperature,
          maxTokens,
        });
        result = (data.response || data.text || data.content || '') as string;
      } else if (provider === 'gemini') {
        const data = await callGoogleApi({
          action: 'gemini-generate',
          prompt: finalPrompt,
          systemInstruction: systemRole || undefined,
          temperature,
          maxTokens,
        });
        result = (data.text || data.response || '') as string;
      } else {
        /* GPT - route through chat API with provider flag */
        const data = await callChatApi({
          messages: [{ role: 'user', content: finalPrompt }],
          systemPrompt: systemRole || undefined,
          model: currentModel,
          provider: 'openai',
          temperature,
          maxTokens,
        });
        result = (data.response || data.text || data.content || '') as string;
      }

      if (!result) result = '_No output returned from the model._';
      setOutput(result);

      /* Add to history (max 5) */
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        provider,
        model: currentModel,
        prompt: prompt.slice(0, 200),
        output: result,
        timestamp: Date.now(),
      };
      setHistory(prev => [entry, ...prev].slice(0, 5));
      setActiveHistoryId(entry.id);
    } catch (err) {
      setOutput(`**Error:** ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setRunning(false);
    }
  }

  /* Copy output */
  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* Save output as document */
  async function handleSave() {
    if (!output.trim() || saving) return;
    setSaving(true);
    try {
      await callDocsApi({
        action: 'create',
        title: `Prompt Output - ${providerDef.name} ${currentModel} - ${new Date().toLocaleDateString()}`,
        content: output,
        doc_type: 'note',
        venture_id: 'mcv',
        metadata: {
          source: 'prompt-composer',
          provider,
          model: currentModel,
          prompt: prompt.slice(0, 500),
        },
      });
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }

  /* Load history entry */
  function loadHistory(entry: HistoryEntry) {
    setActiveHistoryId(entry.id);
    setOutput(entry.output);
  }

  /* Format timestamp */
  function formatTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /* ───── Render ───── */
  return (
    <div style={S.root}>

      {/* ══════════ LEFT PANEL - Configuration ══════════ */}
      <div style={S.left}>
        <div style={S.leftScroll}>

          {/* Provider Selector */}
          <div>
            <div style={S.sectionLabel}>
              <Settings2 size={11} /> Provider
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PROVIDERS.map(p => (
                <div
                  key={p.id}
                  style={S.providerCard(provider === p.id, p.color)}
                  onClick={() => setProvider(p.id)}
                  role="radio"
                  aria-checked={provider === p.id}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProvider(p.id); } }}
                >
                  <div style={S.providerRadio(provider === p.id, p.color)}>
                    {provider === p.id && <div style={S.providerRadioInner} />}
                  </div>
                  <div>
                    <div style={S.providerName}>{p.name}</div>
                    <div style={S.providerCompany}>{p.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <div style={S.sectionLabel}>
              <Hash size={11} /> Model
            </div>
            <select
              style={S.modelSelect}
              value={currentModel}
              onChange={e => setModels(prev => ({ ...prev, [provider]: e.target.value }))}
            >
              {providerDef.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* System Role / Instruction */}
          <div>
            <div style={S.sectionLabel}>
              <Wand2 size={11} /> System Instruction
            </div>
            <textarea
              style={{ ...S.textarea, minHeight: '80px' }}
              placeholder="You are a helpful assistant specialized in..."
              value={systemRole}
              onChange={e => setSystemRole(e.target.value)}
            />
          </div>

          {/* Temperature */}
          <div>
            <div style={S.sectionLabel}>Temperature</div>
            <div style={S.sliderRow}>
              <span style={S.sliderLabel}>Precise</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                style={S.slider}
              />
              <span style={S.sliderValue}>{temperature.toFixed(1)}</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <div style={S.sectionLabel}>Max Tokens</div>
            <div style={S.sliderRow}>
              <span style={S.sliderLabel}>256</span>
              <input
                type="range"
                min={256}
                max={8192}
                step={256}
                value={maxTokens}
                onChange={e => setMaxTokens(parseInt(e.target.value, 10))}
                style={S.slider}
              />
              <span style={S.sliderValue}>{maxTokens.toLocaleString()}</span>
            </div>
          </div>

          <div style={S.divider} />

          {/* Context Assets */}
          <div>
            <div style={{ ...S.sectionLabel, justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={11} /> Context Assets
              </span>
              <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)' }}>
                {contextDocs.filter(d => d.enabled).length}/{contextDocs.length}
              </span>
            </div>

            {docsLoading ? (
              <div style={S.emptyState}>
                <Loader2 size={16} className="spin" />
                <span>Loading documents...</span>
              </div>
            ) : contextDocs.length === 0 ? (
              <div style={S.emptyState}>
                <FileText size={16} />
                <span>No documents available</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '260px', overflow: 'auto' }}>
                {contextDocs.map(doc => (
                  <div
                    key={doc.id}
                    style={S.contextDoc(doc.enabled)}
                    onClick={() => toggleDoc(doc.id)}
                    role="checkbox"
                    aria-checked={doc.enabled}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDoc(doc.id); } }}
                  >
                    <div style={S.checkbox(doc.enabled)}>
                      {doc.enabled && <span style={S.checkMark}>&#10003;</span>}
                    </div>
                    <div>
                      <div style={S.docTitle}>{doc.title}</div>
                      <div style={S.docVenture}>{doc.venture_id}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══════════ CENTER PANEL - Prompt Editor ══════════ */}
      <div style={S.center}>
        <div style={S.centerScroll}>

          {/* Header */}
          <div style={S.centerHeader}>
            <h2 style={S.centerTitle}>
              <Sparkles size={18} style={{ color: 'var(--cyan)' }} />
              Prompt Composer
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={S.badge(providerDef.color)}>
                {providerDef.name}
              </span>
              <span style={S.badge('var(--text-muted)')}>
                {currentModel}
              </span>
            </div>
          </div>

          {/* Prompt Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <textarea
              style={S.monoTextarea}
              placeholder={"Write your prompt here...\n\nUse {{variable}} syntax for dynamic substitution.\nExample: Analyze the {{metric}} for {{company}} in Q{{quarter}}."}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun();
              }}
            />

            {/* Stats bar */}
            <div style={S.statsBar}>
              <div style={S.stat}>
                <Hash size={10} />
                {charCount.toLocaleString()} chars
              </div>
              <div style={S.stat}>
                <Variable size={10} />
                ~{tokenEstimate.toLocaleString()} tokens
              </div>
              {detectedVars.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
                  {detectedVars.map(v => (
                    <span key={v} style={S.varChip}>
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Variable Substitution Panel */}
            {detectedVars.length > 0 && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}>
                <div style={{ ...S.sectionLabel, marginBottom: '10px' }}>
                  <Variable size={11} style={{ color: 'var(--purple)' }} /> Variable Substitution
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detectedVars.map(v => (
                    <div key={v} style={S.varRow}>
                      <span style={{
                        ...S.varChip,
                        minWidth: '90px',
                        justifyContent: 'center',
                      }}>
                        {`{{${v}}}`}
                      </span>
                      <input
                        type="text"
                        style={S.varInput}
                        placeholder={`Value for ${v}...`}
                        value={variableValues[v] || ''}
                        onChange={e =>
                          setVariableValues(prev => ({ ...prev, [v]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimize + Shortcut hint */}
            <div style={S.optimizeRow}>
              <button
                style={S.btnSecondary}
                onClick={handleOptimize}
                disabled={optimizing || !prompt.trim()}
              >
                {optimizing
                  ? <><Loader2 size={12} className="spin" /> Optimizing...</>
                  : <><Wand2 size={12} /> Optimize Prompt</>}
              </button>
              <div style={{ flex: 1 }} />
              <span style={{
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                Ctrl+Enter to run
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════ RIGHT PANEL - Output + History ══════════ */}
      <div style={S.right}>
        <div style={S.rightScroll}>

          {/* Run Button */}
          <button
            style={{
              ...S.btnPrimary(providerDef.color, running || !prompt.trim()),
              width: '100%',
            }}
            onClick={handleRun}
            disabled={running || !prompt.trim()}
          >
            {running
              ? <><Loader2 size={14} className="spin" /> Running...</>
              : <><Play size={14} /> Run Prompt</>}
          </button>

          {/* Output */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
            <div style={S.outputHeader}>
              <span style={S.outputLabel}>Output</span>
              {output && (
                <div style={S.outputActions}>
                  <button style={S.btnIcon} onClick={handleCopy} title="Copy output">
                    {copied ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
                  </button>
                  <button
                    style={S.btnIcon}
                    onClick={handleSave}
                    disabled={saving}
                    title="Save as document"
                  >
                    {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                  </button>
                  <button
                    style={S.btnIcon}
                    onClick={() => { setOutput(''); setActiveHistoryId(null); }}
                    title="Clear output"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              )}
            </div>
            <div style={S.outputBox}>
              {output ? (
                <Markdown content={output} />
              ) : (
                <div style={S.emptyState}>
                  <Sparkles size={18} />
                  <span>Run a prompt to see output here</span>
                </div>
              )}
            </div>
          </div>

          <div style={S.divider} />

          {/* History */}
          <div>
            <div style={S.sectionLabel}>
              <RefreshCw size={11} /> Recent Runs
              {history.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: '0.56rem', color: 'var(--text-muted)' }}>
                  {history.length}/5
                </span>
              )}
            </div>

            {history.length === 0 ? (
              <div style={S.emptyState}>
                <span>No runs yet</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflow: 'auto' }}>
                {history.map(entry => {
                  const pDef = PROVIDERS.find(p => p.id === entry.provider)!;
                  return (
                    <div
                      key={entry.id}
                      style={S.historyItem(activeHistoryId === entry.id)}
                      onClick={() => loadHistory(entry)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter') loadHistory(entry); }}
                    >
                      <div style={S.historyPrompt}>
                        {entry.prompt}
                      </div>
                      <div style={S.historyMeta}>
                        <span style={S.historyBadge(pDef.color)}>{pDef.name}</span>
                        <span>{entry.model.split('-').slice(-1)[0]}</span>
                        <span style={{ marginLeft: 'auto' }}>{formatTime(entry.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
