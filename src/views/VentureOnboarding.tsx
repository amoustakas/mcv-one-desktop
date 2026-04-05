import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Rocket, Globe, Users, Sparkles, Zap } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { apiPost } from '../lib/api/client';

type Step = 'identity' | 'links' | 'team' | 'genesis';
const STEPS: { id: Step; label: string; icon: React.FC<{ size: number }> }[] = [
  { id: 'identity', label: 'Identity', icon: Rocket },
  { id: 'links', label: 'Links & Socials', icon: Globe },
  { id: 'team', label: 'Team & Stack', icon: Users },
  { id: 'genesis', label: 'Genesis', icon: Sparkles },
];

const CATEGORIES = ['Platform & Core', 'Fintech & Web3', 'Gaming & Media', 'Analytics & R&D', 'Services', 'Other'];
const TYPES = ['SaaS', 'Marketplace', 'DeFi', 'Gaming', 'Infrastructure', 'Research', 'Agency', 'Media', 'Other'];
const STATUSES = ['concept', 'planned', 'development', 'active'];
const FUNDING_STAGES = ['Bootstrapped', 'Internal', 'Pre-Seed', 'Seed', 'Series A', 'Series B+', 'Revenue'];

interface VentureForm {
  name: string; tagline: string; description: string;
  domain: string; icon: string; color: string;
  type: string; category: string; status: string; fundingStage: string;
  website: string; github: string; twitter: string; discord: string; telegram: string; linkedin: string; youtube: string;
  teamMembers: { name: string; role: string }[];
  techStack: string[];
  competitors: string[];
}

export default function VentureOnboarding() {
  const [step, setStep] = useState<Step>('identity');
  const [form, setForm] = useState<VentureForm>({
    name: '', tagline: '', description: '', domain: '', icon: '', color: '#00F5FF',
    type: 'SaaS', category: 'Platform & Core', status: 'concept', fundingStage: 'Bootstrapped',
    website: '', github: '', twitter: '', discord: '', telegram: '', linkedin: '', youtube: '',
    teamMembers: [{ name: '', role: '' }],
    techStack: [], competitors: [],
  });
  const [newTech, setNewTech] = useState('');
  const [newComp, setNewComp] = useState('');
  const [genesisLog, setGenesisLog] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const { switchToGlobal } = useNavigation();

  const stepIdx = STEPS.findIndex(s => s.id === step);

  function next() { if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].id); }
  function prev() { if (stepIdx > 0) setStep(STEPS[stepIdx - 1].id); }

  function addTeamMember() { setForm(f => ({ ...f, teamMembers: [...f.teamMembers, { name: '', role: '' }] })); }
  function updateTeam(idx: number, field: 'name' | 'role', val: string) {
    setForm(f => ({ ...f, teamMembers: f.teamMembers.map((m, i) => i === idx ? { ...m, [field]: val } : m) }));
  }
  function removeTeam(idx: number) { setForm(f => ({ ...f, teamMembers: f.teamMembers.filter((_, i) => i !== idx) })); }
  function addTech() { if (newTech.trim() && !form.techStack.includes(newTech.trim())) { setForm(f => ({ ...f, techStack: [...f.techStack, newTech.trim()] })); setNewTech(''); } }
  function addComp() { if (newComp.trim()) { setForm(f => ({ ...f, competitors: [...f.competitors, newComp.trim()] })); setNewComp(''); } }

  async function runGenesis() {
    setGenerating(true);
    const log = (msg: string) => setGenesisLog(prev => [...prev, msg]);
    log('Initializing venture genesis...');
    await delay(400);
    log(`Venture: ${form.name} (${form.type})`);
    await delay(300);
    log(`Category: ${form.category} | Status: ${form.status}`);
    await delay(300);
    log(`Domain: ${form.domain || 'Not set'}`);
    log(`Team: ${form.teamMembers.filter(m => m.name).length} members`);
    log(`Tech Stack: ${form.techStack.join(', ') || 'Not configured'}`);
    await delay(500);
    log('Generating system prompt...');
    const systemPrompt = `You are the ${form.name} assistant. ${form.description || form.tagline || `A ${form.type} venture in ${form.category}.`} Help with strategy, development, and operations for this venture.`;
    await delay(600);
    log('Persisting to database...');
    try {
      const ventureData = {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        icon: form.icon || form.name.charAt(0).toUpperCase(),
        color: form.color,
        accent: form.color,
        domain: form.domain,
        type: form.type,
        status: form.status,
        category: form.category,
        founded: new Date().toISOString().slice(0, 7),
        funding_stage: form.fundingStage,
        socials: { website: form.website, github: form.github, twitter: form.twitter, discord: form.discord, telegram: form.telegram, linkedin: form.linkedin, youtube: form.youtube },
        team: form.teamMembers.filter(m => m.name),
        tech_stack: form.techStack,
        competitors: form.competitors,
        key_metrics: {},
        system_prompt: systemPrompt,
      };
      const data = await apiPost<{ venture?: { id: string }; error?: string }>('/api/ventures', { action: 'create', venture: ventureData });
      if (data.venture) {
        log(`Venture registered with ID: ${data.venture.id}`);
      } else {
        log(`Warning: ${data.error || 'Could not persist — venture saved locally only'}`);
      }
    } catch {
      log('Warning: Could not reach API — venture saved locally only');
    }
    await delay(400);
    log('Registering in portfolio...');
    await delay(300);
    log('');
    log(`Venture "${form.name}" genesis complete.`);
    log('Navigate to Portfolio to see your new venture.');
    setGenerating(false);
  }

  return (
    <div className="vo">
      {/* Step Indicator */}
      <div className="vo-steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isCurrent = s.id === step;
          const isDone = i < stepIdx;
          return (
            <button key={s.id} className={`vo-step ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`} onClick={() => setStep(s.id)}>
              <span className="vo-step-icon">{isDone ? <Check size={14} /> : <Icon size={14} />}</span>
              <span className="vo-step-label">{s.label}</span>
              {i < STEPS.length - 1 && <span className="vo-step-line" />}
            </button>
          );
        })}
      </div>

      <div className="vo-body">
        {/* Step 1: Identity */}
        {step === 'identity' && (
          <div className="vo-panel">
            <h2 className="vo-panel-title"><Rocket size={18} /> Venture Identity</h2>
            <p className="vo-panel-desc">Define the core identity of your new venture.</p>
            <div className="vo-form-grid">
              <div className="vo-field wide">
                <label>Venture Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. FutureState" autoFocus />
              </div>
              <div className="vo-field wide">
                <label>Tagline</label>
                <input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="One-line description" />
              </div>
              <div className="vo-field wide">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What does this venture do?" />
              </div>
              <div className="vo-field">
                <label>Domain</label>
                <input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="e.g. futurestate.ai" />
              </div>
              <div className="vo-field">
                <label>Icon Letter</label>
                <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value.slice(0, 2) })} placeholder="F" maxLength={2} />
              </div>
              <div className="vo-field">
                <label>Brand Color</label>
                <div className="vo-color-row">
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="vo-color-picker" />
                  <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="vo-color-hex" placeholder="#00F5FF" />
                </div>
              </div>
              <div className="vo-field">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="vo-field">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="vo-field">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="vo-field">
                <label>Funding Stage</label>
                <select value={form.fundingStage} onChange={e => setForm({ ...form, fundingStage: e.target.value })}>
                  {FUNDING_STAGES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Links */}
        {step === 'links' && (
          <div className="vo-panel">
            <h2 className="vo-panel-title"><Globe size={18} /> Links & Socials</h2>
            <p className="vo-panel-desc">Connect your venture's online presence.</p>
            <div className="vo-form-grid">
              {[
                { key: 'website', label: 'Website', ph: 'https://futurestate.ai' },
                { key: 'github', label: 'GitHub', ph: 'https://github.com/org' },
                { key: 'twitter', label: 'X / Twitter', ph: 'https://x.com/handle' },
                { key: 'discord', label: 'Discord', ph: 'https://discord.gg/invite' },
                { key: 'telegram', label: 'Telegram', ph: 'https://t.me/group' },
                { key: 'linkedin', label: 'LinkedIn', ph: 'https://linkedin.com/company/...' },
                { key: 'youtube', label: 'YouTube', ph: 'https://youtube.com/@channel' },
              ].map(({ key, label, ph }) => (
                <div key={key} className="vo-field wide">
                  <label>{label}</label>
                  <input value={(form as unknown as Record<string, string>)[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Team & Stack */}
        {step === 'team' && (
          <div className="vo-panel">
            <h2 className="vo-panel-title"><Users size={18} /> Team & Tech Stack</h2>
            <p className="vo-panel-desc">Who's building this and what's the stack?</p>

            <h3 className="vo-sub-title">Team Members</h3>
            <div className="vo-team-list">
              {form.teamMembers.map((m, i) => (
                <div key={i} className="vo-team-row">
                  <input value={m.name} onChange={e => updateTeam(i, 'name', e.target.value)} placeholder="Name" />
                  <input value={m.role} onChange={e => updateTeam(i, 'role', e.target.value)} placeholder="Role" />
                  {form.teamMembers.length > 1 && <button className="vo-remove" onClick={() => removeTeam(i)}>×</button>}
                </div>
              ))}
              <button className="vo-add-btn" onClick={addTeamMember}>+ Add Team Member</button>
            </div>

            <h3 className="vo-sub-title">Tech Stack</h3>
            <div className="vo-tags-section">
              <div className="vo-tags">
                {form.techStack.map(t => (
                  <span key={t} className="vo-tag">{t}<button className="vo-tag-x" onClick={() => setForm(f => ({ ...f, techStack: f.techStack.filter(x => x !== t) }))}>×</button></span>
                ))}
              </div>
              <div className="vo-tag-input-row">
                <input value={newTech} onChange={e => setNewTech(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTech()} placeholder="Add technology..." />
                <button onClick={addTech} className="vo-tag-add">Add</button>
              </div>
            </div>

            <h3 className="vo-sub-title">Competitors</h3>
            <div className="vo-tags-section">
              <div className="vo-tags">
                {form.competitors.map(c => (
                  <span key={c} className="vo-tag comp">{c}<button className="vo-tag-x" onClick={() => setForm(f => ({ ...f, competitors: f.competitors.filter(x => x !== c) }))}>×</button></span>
                ))}
              </div>
              <div className="vo-tag-input-row">
                <input value={newComp} onChange={e => setNewComp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComp()} placeholder="Add competitor..." />
                <button onClick={addComp} className="vo-tag-add">Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Genesis */}
        {step === 'genesis' && (
          <div className="vo-panel">
            <h2 className="vo-panel-title"><Sparkles size={18} /> Venture Genesis</h2>
            <p className="vo-panel-desc">Review and initialize your venture.</p>

            <div className="vo-genesis-summary">
              <div className="vo-gen-header">
                <span className="vo-gen-icon" style={{ background: form.color || '#00F5FF' }}>{form.icon || '?'}</span>
                <div>
                  <span className="vo-gen-name">{form.name || 'Unnamed Venture'}</span>
                  <span className="vo-gen-tagline">{form.tagline || 'No tagline'}</span>
                </div>
              </div>
              <div className="vo-gen-grid">
                <div><span className="vo-gen-k">Type</span><span className="vo-gen-v">{form.type}</span></div>
                <div><span className="vo-gen-k">Category</span><span className="vo-gen-v">{form.category}</span></div>
                <div><span className="vo-gen-k">Status</span><span className="vo-gen-v">{form.status}</span></div>
                <div><span className="vo-gen-k">Domain</span><span className="vo-gen-v">{form.domain || '—'}</span></div>
                <div><span className="vo-gen-k">Team</span><span className="vo-gen-v">{form.teamMembers.filter(m => m.name).length} members</span></div>
                <div><span className="vo-gen-k">Stack</span><span className="vo-gen-v">{form.techStack.length} technologies</span></div>
              </div>
            </div>

            {genesisLog.length > 0 && (
              <div className="vo-genesis-log">
                {genesisLog.map((msg, i) => (
                  <div key={i} className="vo-log-line">{msg && <><span className="vo-log-prefix"><Zap size={9} /></span> {msg}</>}</div>
                ))}
              </div>
            )}

            {!generating && genesisLog.length === 0 && (
              <button className="vo-genesis-btn" onClick={runGenesis} disabled={!form.name.trim()}>
                <Sparkles size={14} /> Initialize Venture Genesis
              </button>
            )}

            {!generating && genesisLog.length > 0 && (
              <button className="vo-genesis-btn done" onClick={switchToGlobal}>
                <Check size={14} /> Go to Portfolio
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div className="vo-footer">
        {stepIdx > 0 ? (
          <button className="vo-nav-btn" onClick={prev}><ChevronLeft size={14} /> Back</button>
        ) : <span />}
        {stepIdx < STEPS.length - 1 && (
          <button className="vo-nav-btn primary" onClick={next}>Next <ChevronRight size={14} /></button>
        )}
      </div>

      <style>{`
        .vo { height:100%; display:flex; flex-direction:column; overflow:hidden; }

        .vo-steps { display:flex; align-items:center; justify-content:center; gap:0; padding:16px 24px; border-bottom:1px solid var(--border); flex-shrink:0; }
        .vo-step { display:flex; align-items:center; gap:8px; padding:6px 14px; border-radius:var(--radius-full); font-size:12px; color:var(--text-muted); transition:all 0.15s; position:relative; }
        .vo-step.current { background:rgba(0,240,255,0.08); color:var(--cyan); }
        .vo-step.done { color:var(--success); }
        .vo-step-icon { width:28px; height:28px; border-radius:50%; background:var(--bg-card); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; }
        .vo-step.current .vo-step-icon { border-color:var(--cyan); background:rgba(0,240,255,0.1); }
        .vo-step.done .vo-step-icon { border-color:var(--success); background:rgba(16,185,129,0.1); }
        .vo-step-label { font-weight:500; }
        .vo-step-line { width:40px; height:1px; background:var(--border); margin-left:8px; }

        .vo-body { flex:1; overflow-y:auto; padding:20px 24px; display:flex; justify-content:center; }
        .vo-panel { max-width:700px; width:100%; }
        .vo-panel-title { font-family:var(--font-display); font-size:1.25rem; font-weight:700; display:flex; align-items:center; gap:8px; }
        .vo-panel-desc { font-size:12px; color:var(--text-muted); margin-top:4px; margin-bottom:20px; }

        .vo-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .vo-field { display:flex; flex-direction:column; gap:4px; }
        .vo-field.wide { grid-column:1/-1; }
        .vo-field label { font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; }
        .vo-field input, .vo-field select, .vo-field textarea {
          padding:8px 12px; background:var(--bg-input); border:1px solid var(--border);
          border-radius:var(--radius-sm); color:var(--text-primary); font-size:13px; font-family:inherit;
        }
        .vo-field input:focus, .vo-field select:focus, .vo-field textarea:focus { border-color:var(--border-active); outline:none; }
        .vo-field textarea { resize:vertical; }

        .vo-color-row { display:flex; gap:8px; }
        .vo-color-picker { width:40px; height:36px; border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; padding:2px; }
        .vo-color-hex { flex:1; padding:8px 12px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:13px; font-family:var(--font-mono); }

        .vo-sub-title { font-size:12px; font-weight:600; color:var(--text-secondary); margin:20px 0 8px; }

        .vo-team-list { display:flex; flex-direction:column; gap:6px; }
        .vo-team-row { display:flex; gap:8px; }
        .vo-team-row input { flex:1; padding:8px 12px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; }
        .vo-team-row input:focus { border-color:var(--border-active); outline:none; }
        .vo-remove { width:28px; height:36px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:16px; border-radius:var(--radius-sm); }
        .vo-remove:hover { color:var(--error); background:rgba(239,68,68,0.1); }
        .vo-add-btn { font-size:11px; color:var(--cyan); padding:6px 0; text-align:left; }

        .vo-tags-section { margin-bottom:8px; }
        .vo-tags { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px; }
        .vo-tag { font-size:11px; padding:3px 10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-full); color:var(--text-secondary); display:flex; align-items:center; gap:6px; }
        .vo-tag.comp { border-color:rgba(239,68,68,0.2); }
        .vo-tag-x { font-size:12px; color:var(--text-muted); cursor:pointer; }
        .vo-tag-x:hover { color:var(--error); }
        .vo-tag-input-row { display:flex; gap:6px; }
        .vo-tag-input-row input { flex:1; padding:6px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; }
        .vo-tag-input-row input:focus { border-color:var(--border-active); outline:none; }
        .vo-tag-add { padding:6px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--cyan); font-size:11px; }

        .vo-genesis-summary { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; margin-bottom:16px; }
        .vo-gen-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .vo-gen-icon { width:44px; height:44px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; color:var(--bg-deep); }
        .vo-gen-name { display:block; font-size:16px; font-weight:600; }
        .vo-gen-tagline { display:block; font-size:12px; color:var(--text-muted); }
        .vo-gen-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .vo-gen-grid>div { padding:8px; background:var(--bg-elevated); border-radius:var(--radius-sm); }
        .vo-gen-k { display:block; font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px; }
        .vo-gen-v { display:block; font-size:12px; font-weight:500; margin-top:2px; }

        .vo-genesis-log { background:var(--bg-deep); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; margin-bottom:16px; font-family:var(--font-mono); font-size:11px; max-height:200px; overflow-y:auto; }
        .vo-log-line { padding:2px 0; color:var(--text-secondary); display:flex; align-items:center; gap:6px; min-height:18px; }
        .vo-log-prefix { color:var(--cyan); }

        .vo-genesis-btn { display:flex; align-items:center; gap:8px; padding:10px 24px; background:var(--cyan); color:var(--bg-deep); font-size:13px; font-weight:600; border-radius:var(--radius-sm); transition:all 0.15s; }
        .vo-genesis-btn:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,240,255,0.2); }
        .vo-genesis-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }
        .vo-genesis-btn.done { background:var(--success); }

        .vo-footer { display:flex; justify-content:space-between; padding:12px 24px; border-top:1px solid var(--border); flex-shrink:0; }
        .vo-nav-btn { display:flex; align-items:center; gap:4px; padding:8px 16px; border-radius:var(--radius-sm); color:var(--text-muted); font-size:12px; transition:all 0.15s; }
        .vo-nav-btn:hover { background:var(--bg-card); color:var(--text-primary); }
        .vo-nav-btn.primary { background:var(--bg-card); border:1px solid var(--border); color:var(--cyan); }
        .vo-nav-btn.primary:hover { border-color:var(--cyan); }
      `}</style>
    </div>
  );
}

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
