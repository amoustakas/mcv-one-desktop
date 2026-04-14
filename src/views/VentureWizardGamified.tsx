import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Rocket, Trophy, Sparkles, Zap, Globe, Users, Box, FileText, Building2, PartyPopper } from 'lucide-react';
import { PageShell, GlassCard, Button, Badge } from '../components/ui';
import { apiPost } from '../lib/api/client';
import { ventures as builtinVentures, type Venture } from '../lib/ventures';
import { useNavigation } from '../stores/navigation';

interface StoryRow {
  id: string;
  epic_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'blocked' | 'done' | 'cancelled';
  priority_order: number;
  xp?: number;
  acceptance_criteria?: string[];
  artifacts?: unknown[];
}

interface EpicRow {
  id: string;
  title: string;
  summary?: string;
  status: string;
  progress_pct: number;
  xp: number;
}

type StepKind = 'identity' | 'domain' | 'socials' | 'team' | 'assets' | 'docs' | 'clerk' | 'launch';

// Map story title fragments to step kinds — lightweight heuristic
function inferStepKind(title: string): StepKind {
  const t = title.toLowerCase();
  if (t.includes('identity')) return 'identity';
  if (t.includes('domain')) return 'domain';
  if (t.includes('social')) return 'socials';
  if (t.includes('team')) return 'team';
  if (t.includes('asset')) return 'assets';
  if (t.includes('doc')) return 'docs';
  if (t.includes('clerk') || t.includes('tenant')) return 'clerk';
  if (t.includes('launch')) return 'launch';
  return 'identity';
}

const STEP_ICON: Record<StepKind, typeof Rocket> = {
  identity: Rocket, domain: Globe, socials: Sparkles, team: Users,
  assets: Box, docs: FileText, clerk: Building2, launch: PartyPopper,
};

const STEP_COLOR: Record<StepKind, string> = {
  identity: '#00F0FF', domain: '#00F0FF', socials: '#8B5CF6', team: '#F59E0B',
  assets: '#10B981', docs: '#EF4444', clerk: '#8B5CF6', launch: '#F59E0B',
};

function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export default function VentureWizardGamified() {
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';
  const venture: Venture | undefined = builtinVentures.find(v => v.id === ventureId);

  const [epic, setEpic] = useState<EpicRow | null>(null);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [justLeveled, setJustLeveled] = useState(false);
  const [confetti, setConfetti] = useState(false);

  async function loadGenesis() {
    setLoading(true);
    try {
      // Find the Genesis Epic for this venture
      const list = await apiPost<{ epics: EpicRow[] }>('/api/epics', {
        action: 'list',
        venture_id: ventureId,
      });
      const genesisId = list.epics.find((e: EpicRow & { tags?: string[] }) =>
        (e as { tags?: string[] }).tags?.includes('venture-genesis')
      )?.id;
      if (!genesisId) {
        setError('No Venture Genesis Epic yet. Run the seeder or ask NAOS to generate one.');
        setLoading(false);
        return;
      }
      const full = await apiPost<{ epic: EpicRow; stories: StoryRow[] }>('/api/epics', {
        action: 'get',
        id: genesisId,
      });
      setEpic(full.epic);
      setStories((full.stories || []).sort((a, b) => a.priority_order - b.priority_order));
      // Jump to first not-done story
      const firstOpen = (full.stories || []).findIndex(s => s.status !== 'done');
      setActiveIdx(firstOpen >= 0 ? firstOpen : 0);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wizard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGenesis(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ventureId]);

  const { earnedXp, totalXp, level, pct } = useMemo(() => {
    const earned = stories.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.xp ?? 0), 0);
    const total = stories.reduce((sum, s) => sum + (s.xp ?? 0), 0);
    return {
      earnedXp: earned,
      totalXp: total,
      level: levelFromXp(earned),
      pct: total > 0 ? Math.round((earned / total) * 100) : 0,
    };
  }, [stories]);

  const currentStory = stories[activeIdx];
  const currentKind = currentStory ? inferStepKind(currentStory.title) : 'identity';
  const CurrentIcon = STEP_ICON[currentKind];
  const currentColor = STEP_COLOR[currentKind];

  function next() {
    if (activeIdx < stories.length - 1) setActiveIdx(activeIdx + 1);
  }
  function prev() {
    if (activeIdx > 0) setActiveIdx(activeIdx - 1);
  }

  async function completeCurrentStep() {
    if (!currentStory || currentStory.status === 'done') { next(); return; }
    setCompleting(true);
    const prevLevel = level;
    try {
      await apiPost('/api/epics', {
        action: 'update_story',
        id: currentStory.id,
        status: 'done',
      });
      // Optimistic update
      const updated = stories.map(s => s.id === currentStory.id ? { ...s, status: 'done' as const } : s);
      setStories(updated);

      const newEarned = updated.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.xp ?? 0), 0);
      const newLevel = levelFromXp(newEarned);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1400);
      if (newLevel > prevLevel) {
        setJustLeveled(true);
        setTimeout(() => setJustLeveled(false), 2000);
      }
      next();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark complete');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return <PageShell><div className="vwg-loading">Loading Venture Wizard…</div></PageShell>;
  }

  if (error) {
    return (
      <PageShell>
        <GlassCard className="vwg-card">
          <div className="vwg-error">
            <Sparkles size={20} style={{ color: 'var(--cyan)' }} />
            <div>
              <h3>Wizard unavailable</h3>
              <p>{error}</p>
              <Button size="sm" onClick={loadGenesis} icon={<Zap size={12} />}>Retry</Button>
            </div>
          </div>
        </GlassCard>
      </PageShell>
    );
  }

  if (!epic || stories.length === 0) {
    return <PageShell><div className="vwg-loading">No stories in the Genesis Epic yet.</div></PageShell>;
  }

  return (
    <PageShell>
      <div className="vwg-root">
        {confetti && <div className="vwg-confetti">✨🎉✨🚀✨</div>}

        {/* Hero */}
        <GlassCard className="vwg-card vwg-hero">
          <div className="vwg-hero-row">
            <div className="vwg-hero-left">
              <span className="vwg-hero-icon" style={{ background: venture?.color || 'var(--cyan)' }}>
                {venture?.icon || ventureId.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div className="vwg-hero-title">{venture?.name || ventureId} · Venture Wizard</div>
                <div className="vwg-hero-sub">{epic.title}</div>
              </div>
            </div>
            <div className="vwg-hero-right">
              <div className="vwg-level-block">
                <Trophy size={18} style={{ color: 'var(--gold)' }} />
                <div>
                  <div className="vwg-level-val">Level {level}</div>
                  <div className="vwg-level-xp">{earnedXp} / {totalXp} XP</div>
                </div>
              </div>
              {justLeveled && <div className="vwg-level-up">LEVEL UP!</div>}
            </div>
          </div>
          <div className="vwg-xp-bar">
            <div className="vwg-xp-fill" style={{ width: `${pct}%` }} />
          </div>
        </GlassCard>

        {/* Stepper */}
        <div className="vwg-stepper">
          {stories.map((s, i) => {
            const kind = inferStepKind(s.title);
            const Icon = STEP_ICON[kind];
            const isActive = i === activeIdx;
            const isDone = s.status === 'done';
            return (
              <button
                key={s.id}
                className={`vwg-step ${isActive ? 'vwg-step-active' : ''} ${isDone ? 'vwg-step-done' : ''}`}
                onClick={() => setActiveIdx(i)}
                title={s.title}
              >
                <span className="vwg-step-icon" style={{ background: isDone ? 'var(--success)' : isActive ? STEP_COLOR[kind] : 'var(--bg-input)' }}>
                  {isDone ? <Check size={12} /> : <Icon size={12} />}
                </span>
                <span className="vwg-step-label">{s.title.split('(')[0].trim()}</span>
                {typeof s.xp === 'number' && s.xp > 0 && <span className="vwg-step-xp">+{s.xp}</span>}
              </button>
            );
          })}
        </div>

        {/* Active step card */}
        <GlassCard className="vwg-card vwg-active-step">
          <div className="vwg-step-head">
            <span className="vwg-step-big-icon" style={{ background: currentColor }}>
              <CurrentIcon size={20} />
            </span>
            <div>
              <h3 className="vwg-step-title">{currentStory.title}</h3>
              {currentStory.description && <p className="vwg-step-desc">{currentStory.description}</p>}
            </div>
            <Badge color={currentStory.status === 'done' ? '#10B981' : '#00F0FF'}>
              {currentStory.status}
            </Badge>
          </div>

          {currentStory.acceptance_criteria && currentStory.acceptance_criteria.length > 0 && (
            <div className="vwg-criteria">
              <div className="vwg-criteria-label">Acceptance criteria</div>
              <ul>
                {currentStory.acceptance_criteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="vwg-hints">
            <StepHint kind={currentKind} venture={venture} ventureId={ventureId} />
          </div>

          <div className="vwg-nav">
            <Button variant="ghost" size="sm" onClick={prev} disabled={activeIdx === 0} icon={<ChevronLeft size={12} />}>
              Previous
            </Button>
            <div className="vwg-nav-center">
              Step {activeIdx + 1} of {stories.length}
            </div>
            {currentStory.status === 'done' ? (
              <Button size="sm" onClick={next} disabled={activeIdx === stories.length - 1} icon={<ChevronRight size={12} />}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={completeCurrentStep} disabled={completing} icon={<Check size={12} />}>
                {completing ? 'Saving…' : `Mark complete (+${currentStory.xp ?? 0} XP)`}
              </Button>
            )}
          </div>
        </GlassCard>

        {pct === 100 && (
          <GlassCard className="vwg-card vwg-victory">
            <PartyPopper size={24} style={{ color: 'var(--gold)' }} />
            <div>
              <h3>{venture?.name || ventureId} is fully leveled!</h3>
              <p>All Genesis quests complete. XP: {earnedXp}. Next step: graduate to venture launch and start the Department quests.</p>
            </div>
          </GlassCard>
        )}

        <style>{`
          .vwg-root { display: flex; flex-direction: column; gap: 12px; position: relative; }
          .vwg-loading { padding: 48px; text-align: center; color: var(--text-muted); font-size: 13px; }
          .vwg-card { padding: 18px; }
          .vwg-error { display: flex; gap: 16px; align-items: flex-start; }
          .vwg-error h3 { margin: 0 0 6px; font-size: 14px; color: var(--text-primary); }
          .vwg-error p { margin: 0 0 10px; font-size: 12px; color: var(--text-secondary); }

          .vwg-hero { display: flex; flex-direction: column; gap: 12px; background: linear-gradient(135deg, var(--cyan-glow), transparent 60%); border: 1px solid var(--border-active); }
          .vwg-hero-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
          .vwg-hero-left { display: flex; align-items: center; gap: 12px; }
          .vwg-hero-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); font-weight: 800; color: var(--bg-deep); font-size: 20px; font-family: var(--font-display); }
          .vwg-hero-title { font-size: 16px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); }
          .vwg-hero-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
          .vwg-hero-right { display: flex; align-items: center; gap: 14px; }
          .vwg-level-block { display: flex; align-items: center; gap: 10px; }
          .vwg-level-val { font-size: 14px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); }
          .vwg-level-xp { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
          .vwg-level-up { font-size: 12px; font-weight: 700; color: var(--gold); font-family: var(--font-display); animation: vwg-pop 2s ease; }
          .vwg-xp-bar { height: 8px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
          .vwg-xp-fill { height: 100%; background: linear-gradient(90deg, var(--cyan), var(--purple), var(--gold)); transition: width 0.5s ease; box-shadow: 0 0 12px var(--cyan-glow); }

          .vwg-stepper { display: flex; gap: 4px; overflow-x: auto; padding: 4px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); }
          .vwg-step { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary); font-size: 11px; text-align: left; white-space: nowrap; transition: all 0.15s; flex-shrink: 0; }
          .vwg-step:hover { background: var(--bg-hover); color: var(--text-primary); }
          .vwg-step-active { background: var(--cyan-glow); border-color: var(--border-active); color: var(--text-primary); }
          .vwg-step-done { opacity: 0.65; }
          .vwg-step-done .vwg-step-label { text-decoration: line-through; }
          .vwg-step-icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); color: var(--bg-deep); flex-shrink: 0; }
          .vwg-step-label { font-weight: 500; }
          .vwg-step-xp { font-family: var(--font-mono); font-size: 10px; color: var(--cyan); }

          .vwg-active-step { display: flex; flex-direction: column; gap: 16px; }
          .vwg-step-head { display: flex; align-items: flex-start; gap: 14px; }
          .vwg-step-big-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--bg-deep); flex-shrink: 0; }
          .vwg-step-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); flex: 1; }
          .vwg-step-desc { margin: 4px 0 0; font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

          .vwg-criteria { padding: 12px 14px; background: var(--bg-input); border-radius: var(--radius-sm); font-size: 12px; }
          .vwg-criteria-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-display); margin-bottom: 6px; }
          .vwg-criteria ul { margin: 0; padding-left: 18px; color: var(--text-secondary); }
          .vwg-criteria li { margin-bottom: 3px; }

          .vwg-hints { padding: 14px; background: var(--bg-card); border: 1px dashed var(--border-active); border-radius: var(--radius-md); }

          .vwg-nav { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border); gap: 10px; flex-wrap: wrap; }
          .vwg-nav-center { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }

          .vwg-victory { display: flex; gap: 16px; align-items: center; background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), transparent 60%); border: 1px solid rgba(245, 158, 11, 0.3); }
          .vwg-victory h3 { margin: 0 0 4px; font-size: 14px; color: var(--text-primary); }
          .vwg-victory p { margin: 0; font-size: 12px; color: var(--text-secondary); }

          .vwg-confetti { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); font-size: 32px; animation: vwg-drop 1.4s ease forwards; pointer-events: none; z-index: 10; }

          @keyframes vwg-pop { 0% { transform: scale(0.8); opacity: 0; } 20% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
          @keyframes vwg-drop { 0% { transform: translate(-50%, -20px); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, 40px); opacity: 0; } }
        `}</style>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Per-step hints — contextual guidance + deep links into the Venture Detail tabs
// ---------------------------------------------------------------------------

function StepHint({ kind, venture, ventureId }: { kind: StepKind; venture?: Venture; ventureId: string }) {
  const { setView } = useNavigation();
  const jumpTo = (tab: string) => {
    // For now there's no tab-aware route; setView('venture-detail') shows default Overview.
    // In a later pass we can push tab selection into navigation store.
    setView('venture-detail');
    console.info(`[wizard] jump to ${tab} tab for ${ventureId}`);
  };

  switch (kind) {
    case 'identity':
      return <HintBody title="Identity is how NAOS personalizes every agent response for this venture." action="Open Settings tab" onClick={() => jumpTo('settings')} />;
    case 'domain':
      return <HintBody title={`Primary domain: ${venture?.domain || '—'}. Add additional hosts from the Domains tab with DNS record guidance.`} action="Open Domains tab" onClick={() => jumpTo('domains')} />;
    case 'socials':
      return <HintBody title="Fill X, GitHub, Discord, Telegram, LinkedIn, YouTube. Every social unlocks per-venture presence cards + social-health metrics." action="Open Socials tab" onClick={() => jumpTo('socials')} />;
    case 'team':
      return <HintBody title="Add teammates with roles. Once promoted to a dedicated Clerk tenant, invitations + SSO come online." action="Open Team tab" onClick={() => jumpTo('team')} />;
    case 'assets':
      return <HintBody title="Auto-suggestions from GitHub + domain scan land here as Tier 2/3 candidates. Confirm each chip to make them official." action="Open Assets tab" onClick={() => jumpTo('assets')} />;
    case 'docs':
      return <HintBody title="One click seeds 5 Legal templates (MSA, NDA, IP Assignment, ToS, Privacy). Same for Compliance, Research, Finance, Ops, Product." action="Open Docs tab" onClick={() => jumpTo('docs')} />;
    case 'clerk':
      return <HintBody title="Promotion creates a dedicated Clerk organization, mirrors members, flips RLS to tenant-scoped, unlocks SSO + verified domains + white-label." action="Promote to tenant" onClick={() => jumpTo('team')} />;
    case 'launch':
      return <HintBody title="Final step. Flip status to active, announce the launch. Department agent quests unlock from here." action="Open Settings tab" onClick={() => jumpTo('settings')} />;
  }
}

function HintBody({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{title}</div>
      <Button variant="ghost" size="sm" onClick={onClick}>{action}</Button>
    </div>
  );
}

