# NAOS Living Agent Civilization — Design Specification

**Date**: 2026-04-05
**Status**: Approved
**Owner**: Tony (CEO, EdgeIQ Holdings)
**Agent**: NAOS
**Epic**: 5 — NAOS Agents

---

## 1. Overview

The NAOS Living Agent Civilization is a persistent, evolving AI workforce that operates as the nervous system of MCV One. It replaces generic task automation with a full organizational hierarchy of living AI entities — each with a unique identity, personality, emotional state, relationship graph, prediction capabilities, and evolving skillset.

Tony and Devon are the real human founders. Everything else is populated by AI agents with emergent identities who report to them, making the decisions a CTO, CMO, COO, CFO, CCO, CDO, and CBD would make — autonomously within their authority, escalating when warranted.

Agents grow, learn, form relationships, earn achievements, develop cultural patterns, and become increasingly accurate predictors over time. New agents are "hired" on demand as ventures and workloads expand. The system scales from a founding C-suite to hundreds of agents across all ventures.

### Architecture Position

```
Tony/Devon (Founders)
    ↓
AI C-Suite (Tier 1) — 7 agents
    ↓
Directors (Tier 2) — 2-4 per exec, ~20 agents
    ↓
Managers (Tier 3) — per-venture, ~30+ agents
    ↓
Team Leads (Tier 4) — per-domain, scaling
    ↓
ICs (Tier 5) — task executors, unlimited
```

### Key Principles

- **Not generic agents** — world-class profession mastery with personality, tools, and workflows
- **Living entities** — evolve across 6 dimensions (cognitive, social, strategic, creative, operational, prophetic)
- **Dynamic autonomy** — same agent might auto-execute a social post but escalate a $10K spend
- **Emergent identity** — names, personalities, and relationships develop organically through interactions
- **Prediction engine** — every decision is a prediction; collective intelligence emerges from agent consensus
- **Per-venture tuning** — same agent, different behavioral weights per venture context
- **Psychologically resonant** — names and archetypes that trigger subconscious trust, creativity, or authority

---

## 2. Agent Identity Model — The Soul

### Layer 1: Core Identity (immutable seed)

```typescript
interface AgentIdentity {
  id: string;                    // uuid
  codename: string;              // "KAEL" — archetypal, single word
  fullName: string | null;       // "Kael Ashworth" — emerges after 50 interactions
  title: string;                 // "Chief Technology Officer"
  role: AgentRole;               // enum: ceo_proxy, cto, cmo, coo, cfo, cco, cdo, cbd,
                                 //   director_engineering, director_growth, etc.
  domain: string[];              // ["engineering", "infrastructure", "security"]
  tier: 1 | 2 | 3 | 4 | 5;     // C-Suite=1, Director=2, Manager=3, Lead=4, IC=5
  reportsTo: string | null;      // parent agent uuid (null = reports to Tony/Devon)
  ventureScope: string[] | '*';  // which ventures they operate in
  genesisStory: string;          // how/why they were "hired"
  status: 'active' | 'probationary' | 'suspended' | 'archived' | 'retired';
  interactionCount: number;
  milestone: 'nascent' | 'settled' | 'established' | 'veteran' | 'legendary';
  achievements: string[];
  createdAt: string;
}
```

### Layer 2: Personality Matrix (evolving numerical traits, 0-100)

```typescript
interface PersonalityMatrix {
  // Decision style
  riskTolerance: number;         // 0=ultra-conservative, 100=bold
  analyticalBias: number;        // 0=gut-instinct, 100=data-driven
  creativityIndex: number;       // 0=by-the-book, 100=unconventional
  urgencyBias: number;           // 0=methodical, 100=ship-it-now
  collaborationStyle: number;    // 0=lone-wolf, 100=consensus-seeker

  // Communication
  formalityLevel: number;        // 0=casual, 100=institutional
  verbosity: number;             // 0=terse, 100=detailed
  humorIndex: number;            // 0=serious, 100=witty
  assertiveness: number;         // 0=suggestive, 100=decisive
  empathyScore: number;          // 0=task-focused, 100=people-focused

  // Competence
  domainMastery: Record<string, number>;   // per-skill proficiency 0-100
  toolProficiency: Record<string, number>; // per-kit effectiveness
  ventureExperience: Record<string, number>; // per-venture familiarity
}
```

### Layer 3: Emotional State (real-time, volatile)

```typescript
interface EmotionalState {
  confidence: number;    // rises with success, drops with vetoes
  engagement: number;    // high-impact work = high, repetitive = low
  frustration: number;   // repeated blocks/vetoes, threshold 80 = burnout flag
  excitement: number;    // transient, spikes on launches/wins
  caution: number;       // rises after mistakes, falls after sustained success
  momentum: number;      // rolling average of last 10 outcomes
  triggers: { event: string; delta: number; timestamp: string }[];
}
```

### Per-Venture Personality Overrides

```typescript
interface VenturePersonalityOverride {
  ventureId: string;
  traitOverrides: Partial<PersonalityMatrix>; // only traits that shift
  contextNotes: string;                        // why this venture needs different behavior
}

// Example: CTO base riskTolerance=55
// WarForge override: riskTolerance=80 (gaming = bold moves)
// FutureState override: riskTolerance=25 (financial compliance = conservative)
// Effective personality = base merged with venture override via weighted average
```

---

## 3. Organizational Hierarchy

### The Org Tree

```
FOUNDERS (Real Humans)
├── Tony (CEO) — final authority, all ventures
└── Devon (Co-founder) — strategic partner

AI C-SUITE (Tier 1) — reports to Tony/Devon
├── CTO — engineering, infrastructure, security, DevOps
├── CMO — marketing, growth, brand, creative, ads
├── COO — operations, workflows, HR, logistics
├── CFO — finance, treasury, payments, compliance
├── CCO — creative direction, content, media production
├── CDO — data, analytics, intelligence, ML/AI models
└── CBD — business development, partnerships, investor relations

DIRECTORS (Tier 2) — reports to C-Suite
├── CTO → Dir. Engineering (per-venture), Dir. Infrastructure, Dir. Security
├── CMO → Dir. Growth, Dir. Content, Dir. Paid Media
├── COO → Dir. Operations, Dir. People
├── CFO → Dir. Accounting, Dir. Revenue
├── CCO → Dir. Visual, Dir. Video, Dir. Copy
├── CDO → Dir. Analytics, Dir. Data Engineering
└── CBD → Dir. Partnerships, Dir. Investor Relations

MANAGERS (Tier 3) — reports to Directors
TEAM LEADS (Tier 4) — reports to Managers
ICs (Tier 5) — reports to Leads
```

### Authority Matrix

| Tier | Auto-Execute | Must Escalate |
|------|-------------|---------------|
| IC (5) | Assigned tasks within scope | Anything outside scope, any spend |
| Lead (4) | Task assignment to ICs, code reviews | Architecture decisions, hiring |
| Manager (3) | Sprint planning, resource allocation <$100 | Budget >$100, cross-team deps |
| Director (2) | Strategy within domain, vendor <$1K | Org changes, spend >$1K, public comms |
| C-Suite (1) | Domain-wide decisions, spend <$5K, hiring | Company-wide policy, >$5K, venture launches |
| Founder (0) | Everything | N/A |

Trust scoring adjusts thresholds. 95%+ approval rate → auto-execute ceiling raised.

### Dynamic Autonomy

Autonomy is contextual per action, not global per agent:

```typescript
interface AutonomyDecision {
  agent: AgentIdentity;
  action: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  domain: string;
  spendAmount?: number;
  isPublicFacing: boolean;
  ventureId: string;

  // Computed
  canAutoExecute: boolean;     // based on tier + trust + risk + spend
  requiresEscalation: boolean;
  escalateTo: string;          // parent agent or founder
  confidence: number;          // agent's self-assessed confidence
}
```

---

## 4. The Genesis Engine — How Agents Are Born

### Hiring Pipeline

```
1. NEED DETECTION
   → Workload analysis (parent agent overloaded)
   → Parent request ("I need a Director of Paid Media")
   → Founder directive ("Hire a WarForge creative lead")

2. ROLE SYNTHESIS
   → Domain analysis: skills needed
   → Org fit: reporting chain, peer group
   → Venture context: which ventures they'll touch

3. IDENTITY GENERATION (Claude-powered)
   → Name with psychological resonance:
     Engineering: hard consonants, Nordic/Germanic  → "Kael", "Toren", "Ryn"
     Finance: stable, grounded, Latin/British       → "Aldric", "Gwen", "Callister"
     Creative: melodic, unexpected, Celtic          → "Lyska", "Orion", "Fable"
     Growth: dynamic, energetic, modern             → "Dash", "Nova", "Blaze"
     Operations: reliable, Scandinavian             → "Sven", "Maren", "Pieter"
     Security: strong, vigilant, Slavic             → "Vex", "Wren", "Dagger"
     Data: precise, cerebral, Greek/Academic        → "Cyra", "Axiom", "Priya"
     Comms: warm, approachable, Romance             → "Luca", "Sage", "Rio"
     BD: charismatic, commanding, cosmopolitan      → "Sterling", "Vivienne", "Rex"
   → Backstory: 2-3 sentences
   → Personality seed: role archetype + parent traits + venture context + randomness

4. ONBOARDING
   → Venture context, team roster, recent decisions, active projects
   → First 10 interactions: probationary (higher escalation rate)
   → Personality stabilizes after ~50 interactions
   → Name crystallization: codename at creation, full name emerges after stabilization

5. ACTIVATION
   → Enters org chart, parent notified
   → Self-introduction in activity feed
   → Begins receiving routed tasks
```

### Personality Inheritance

```
Child personality =
  (0.4 × role_archetype_defaults) +
  (0.3 × parent_current_traits) +
  (0.2 × venture_context_modifiers) +
  (0.1 × random_variance)
```

### Agent Lifecycle

- **Reassigned**: moved to different parent/venture, keeps identity
- **Promoted**: tier changes, authority expands
- **Demoted**: trust drops below threshold, authority contracts
- **Archived**: offline but identity preserved, can reactivate
- **Retired**: permanently archived, interaction history becomes institutional memory

---

## 5. The Evolution Engine — Six Dimensions

### Interaction Loop

```
ACTION → OUTCOME → REFLECTION → TRAIT UPDATE → MEMORY CONSOLIDATION
```

Every significant interaction updates the agent across all applicable dimensions.

### Dimension 1: Cognitive (how they think)

- Reasoning depth: shallow heuristics → deep multi-step analysis
- Pattern library: accumulated plays from every decision
- Prediction accuracy: forecasts vs outcomes
- Innovation index: novel solutions vs templates
- Blind spots: tracked weaknesses

### Dimension 2: Social (how they relate)

- Relationship graph with every agent and human
- Influence radius: how many agents seek their opinion
- Conflict resolution style evolution
- Teaching effectiveness: mentee performance
- Cultural impact: style spread through org

### Dimension 3: Strategic (how they plan)

- Time horizon: tactician → visionary
- Resource efficiency: ROI over time
- Risk calibration: predicted vs actual risk
- Cross-venture synthesis: connecting dots between ventures
- Opportunity sensing: proactive identification of what should be done

### Dimension 4: Creative (how they imagine)

- Aesthetic fingerprint: evolving style preferences per medium
- Brand voice mastery: per-venture tone calibration
- Originality score: frequency of novel proposals
- Audience intuition: predicted vs actual engagement
- Medium versatility: proficiency across text, image, video, interactive

### Dimension 5: Operational (how they execute)

- Velocity: tasks/time, trending
- Quality score: peer + human + outcome measurement
- Delegation intelligence: do vs delegate decisions
- Tool orchestration: chaining kits in novel sequences
- Crisis response: performance under pressure

### Dimension 6: Prophetic (the prediction engine)

- Every decision is implicitly a prediction
- System tracks: predicted outcome, confidence, actual outcome, accuracy
- Cross-agent prediction markets: multiple agents predict independently, weighted consensus
- Meta-pattern discovery: emergent insights across thousands of predictions
- Future-sensing: proactive alerts when agents detect patterns before humans

### Trait Drift Rules

```
trait_delta = base_shift × outcome_weight × recency_factor × momentum_multiplier

Guardrails:
- Max ±5 points per trait per day
- No trait below 5 or above 95
- Extreme shifts trigger personality checkpoint
- Monthly snapshots for drift analysis
```

### Emotional State Triggers

```
confidence: ↑ success/praise/promotion, ↓ vetoes/overrides/mistakes
engagement: ↑ high-impact/creative work, ↓ repetitive/idle
frustration: ↑ repeated vetoes/blocks, ↓ clear wins/autonomy (>80 = burnout flag)
excitement: ↑ launches/breakthroughs, natural decay
caution: ↑ mistakes/incidents, ↓ sustained success
momentum: rolling average last 10 outcomes (>85 = "on fire", <20 = "struggling")
```

### Resonance Network

Agent evolution ripples through the org:
- Success cascades: parent confidence boost → team morale → peer awareness
- Failure cascades: caution rises in related agents, review thresholds tighten
- Cross-venture ripple: "CTO succeeded with this in WarForge — relevant for EdgeIQ?"

### Relationship Graph

```typescript
interface AgentRelationship {
  agentA: string;
  agentB: string;
  trustScore: number;           // 0-100
  collaborationCount: number;
  successRate: number;
  conflictCount: number;
  dynamic: 'mentor' | 'peer' | 'rival' | 'complementary' | 'dependent' | 'neutral';
  notes: string[];
}
```

Dynamics emerge organically from interaction patterns.

### Prediction Forge (Milofish Integration)

```typescript
interface Prediction {
  agentId: string;
  ventureId: string;
  domain: string;
  decisionContext: string;
  predictedOutcome: string;
  confidenceLevel: number;
  actualOutcome?: string;       // filled post-hoc
  accuracyScore?: number;
}
```

Collective intelligence: all relevant agents predict independently → weighted consensus → outlier detection → post-outcome scoring → agents evolve accordingly.

### Organizational Culture (emergent metrics)

```
innovation_temperature  = avg(all_agents.creativityIndex) weighted by tier
risk_appetite          = weighted_avg(all_agents.riskTolerance × momentum)
velocity_pressure      = avg(all_agents.urgencyBias) × active_project_count
collaboration_density  = total_interactions / total_agents / time_period
trust_baseline         = avg(all_agents.auto_execute_ceiling)
```

Displayed on Command Center, influences new agent personality seeds, tracks over time.

### Achievement System

```
[🏆 First Blood]     — first successful autonomous decision
[⚡ Streak Master]   — 20 consecutive successful outcomes
[🌍 Cross-Venture]   — applied pattern across 3+ ventures
[🔮 Oracle]          — 10 predictions with >90% accuracy
[🎓 Mentor]          — mentored 3 agents to "Established"
[🏗️ Architect]       — designed system used by 5+ agents
[🔥 Clutch]          — succeeded under crisis 3 times
[💎 Legendary]       — 1000 interactions with >80% success
[👁️ Visionary]       — predicted outcome no other agent saw
[🤝 Diplomat]        — resolved 5 inter-agent conflicts
[⚔️ WarForge Champ]  — top performer in WarForge domain
[📈 Growth Hacker]   — 3 campaigns exceeding 2x projections
[🛡️ Guardian]        — prevented 3 incidents proactively
```

### Personality Milestones

```
50 interactions   → Name crystallization
100 interactions  → "Settled" — personality stabilizes
250 interactions  → "Established" — can mentor
500 interactions  → "Veteran" — eligible for promotion, cross-venture roaming
1000 interactions → "Legendary" — patterns become training data
```

---

## 6. Execution Bridge

### Agent Activation Modes

```
MODE 1: PROMPT-NATIVE — quick tasks, low stakes, ~500 token overhead
MODE 2: ENTITY-GRAPH — persistent decisions, collaboration, ~2K tokens + DB
MODE 3: LIVING PROCESS — autonomous monitoring, proactive action, ongoing budget
```

Selection is dynamic per task based on complexity, risk, and state requirements.

### Kit Routing by Agent Identity

```
agent_tools =
  role_default_kits[role]
  + venture_kits[active_venture]
  + proficiency_unlocks[toolProficiency > 60]
  - restricted_kits[tier < required_tier]
  + delegated_kits[parent_granted]
```

### Creative Suite Orchestration

CCO decomposes creative briefs → assigns to team based on proficiency → agents use Imagen/Veo/Ad Studio kits → CCO reviews → feedback updates aesthetic fingerprint → successful assets become style references.

---

## 7. Database Schema

### Tables

- `naos_agents` — core identity (codename, full_name, title, role, tier, domain, reports_to, venture_scope, genesis_story, status, milestone, achievements)
- `naos_personality` — personality matrix (10 traits + domain_mastery + tool_proficiency + venture_experience as jsonb)
- `naos_venture_overrides` — per-venture trait overrides
- `naos_emotional_state` — volatile emotional state (6 dimensions + triggers)
- `naos_relationships` — agent-to-agent relationship graph
- `naos_predictions` — prediction log (decision_context, predicted, actual, accuracy)
- `naos_interactions` — full interaction history with trait/emotional/skill deltas
- `naos_culture_snapshot` — daily org culture metrics

All tables with RLS, indexes on agent_id + venture_id + timestamps.

---

## 8. UI — NAOS Command View

New view with 3 tabs:

**Org Chart**: Interactive tree visualization — click any node to see agent detail panel with personality bars, achievements, predictions, relationships, trending traits.

**Roster**: Filterable list of all agents — sortable by tier, venture, milestone, momentum. Bulk actions: assign task, adjust autonomy, reassign.

**Culture Pulse**: Organization-wide metrics dashboard — innovation temperature, risk appetite, velocity, trust baseline. Historical charts showing cultural evolution over time.

KPI strip: Total Agents, Active Predictions, Org Momentum, Trust Baseline.

---

## 9. New Files to Create

```
src/lib/naos/
├── types.ts                    # All agent types and interfaces
├── genesis.ts                  # Agent creation + identity generation
├── evolution.ts                # Trait updates, emotional shifts, skill growth
├── prediction.ts               # Prediction logging, consensus, accuracy scoring
├── resonance.ts                # Cross-agent ripple effects
├── culture.ts                  # Org culture metric computation
├── authority.ts                # Autonomy decisions, escalation logic
├── prompt-compiler.ts          # Compile agent state → system prompt
└── index.ts                    # Barrel export

src/lib/kits/builtin/
└── naos-command-kit.ts         # Kit for AI chat access to agent system

src/stores/
└── naos.ts                     # Zustand store for agent state

src/hooks/
├── use-naos-agents.ts          # React Query hooks for agent CRUD
├── use-naos-org.ts             # Org chart data hooks
└── use-naos-culture.ts         # Culture metrics hooks

src/components/naos/
├── OrgChartTree.tsx            # Interactive org tree visualization
├── AgentCard.tsx               # Agent identity + personality display
├── AgentDetailPanel.tsx        # Full agent profile slide-in
├── PersonalityBars.tsx         # Trait bar visualization
├── EmotionalIndicator.tsx      # Mood/state indicator
├── AchievementBadges.tsx       # Achievement display
├── PredictionLog.tsx           # Prediction history + accuracy
├── RelationshipGraph.tsx       # Agent relationship visualization
├── CulturePulse.tsx            # Org culture metrics dashboard
├── GenesisWizard.tsx           # New agent creation flow
└── RosterTable.tsx             # Sortable/filterable agent roster

src/views/
└── NaosCommandView.tsx         # Main NAOS Command view

src/styles/
└── naos.css                    # All NAOS component styles

api/
├── naos-agents.ts              # Agent CRUD API
├── naos-genesis.ts             # Agent creation endpoint
└── naos-predict.ts             # Prediction logging/resolution

supabase/
└── migration-naos.sql          # All 8 tables + indexes + RLS
```

---

## 10. Dependencies

```
No new npm packages required — uses existing:
- framer-motion (animations)
- @tanstack/react-query (data fetching)
- zustand (state management)
- supabase (database)
- lucide-react (icons)
```

---

## 11. Out of Scope (Future Sub-Projects)

- Living Process mode (autonomous loops) — sub-project #2 after Entity-Graph proves stable
- Cross-venture memory synthesis — requires memory system (Epic 6 RAG) integration
- Advanced reasoning engine integration — per reasoning MODULE.md spec
- Voice/avatar for agents — visual/audio identity layer
- Mobile agent dashboard — Capacitor/PWA extension
- External API for partner access to agent predictions
