// ---------------------------------------------------------------------------
// NAOS Living Agent Civilization — Complete Type Definitions
// ---------------------------------------------------------------------------
// Source: docs/superpowers/specs/2026-04-05-naos-living-agent-civilization-design.md
// Sections 2-5: Identity, Hierarchy, Genesis, Evolution
// ---------------------------------------------------------------------------

// ========================== ENUMS & UNION TYPES ============================

/**
 * Agent's functional role in the NAOS organizational hierarchy.
 * C-Suite roles (Tier 1) through IC roles (Tier 5).
 */
export type AgentRole =
  // C-Suite (Tier 1) — reports to Tony/Devon
  | 'ceo_proxy'
  | 'cto'
  | 'cmo'
  | 'coo'
  | 'cfo'
  | 'cco'
  | 'cdo'
  | 'cbd'
  // Directors (Tier 2) — reports to C-Suite
  | 'director_engineering'
  | 'director_infrastructure'
  | 'director_security'
  | 'director_growth'
  | 'director_content'
  | 'director_paid_media'
  | 'director_operations'
  | 'director_people'
  | 'director_accounting'
  | 'director_revenue'
  | 'director_visual'
  | 'director_video'
  | 'director_copy'
  | 'director_analytics'
  | 'director_data_engineering'
  | 'director_partnerships'
  | 'director_investor_relations'
  // Middle management + ICs (Tier 3-5)
  | 'manager'
  | 'team_lead'
  | 'ic';

/**
 * Organizational tier level.
 * 1 = C-Suite, 2 = Director, 3 = Manager, 4 = Team Lead, 5 = IC
 */
export type AgentTier = 1 | 2 | 3 | 4 | 5;

/** Agent lifecycle status */
export type AgentStatus =
  | 'active'        // fully operational
  | 'probationary'  // first 10 interactions, higher escalation rate
  | 'suspended'     // temporarily offline, can be reactivated
  | 'archived'      // offline, identity preserved
  | 'retired';      // permanently archived, history becomes institutional memory

/**
 * Personality milestone based on interaction count.
 * Determines capabilities and trust.
 */
export type AgentMilestone =
  | 'nascent'       // 0-49 interactions
  | 'settled'       // 100+ — personality stabilizes
  | 'established'   // 250+ — can mentor other agents
  | 'veteran'       // 500+ — eligible for promotion, cross-venture roaming
  | 'legendary';    // 1000+ — patterns become training data

/**
 * The dynamic between two agents in the relationship graph.
 * Emerges organically from interaction patterns.
 */
export type RelationshipDynamic =
  | 'mentor'         // senior guides junior
  | 'peer'           // equal collaboration
  | 'rival'          // competitive tension (can be productive)
  | 'complementary'  // different strengths, high synergy
  | 'dependent'      // one relies heavily on the other
  | 'neutral';       // minimal interaction history

/** Outcome of an agent interaction or decision */
export type InteractionOutcome =
  | 'success'   // completed as intended
  | 'failure'   // did not achieve goal
  | 'partial'   // partially achieved
  | 'vetoed'    // overridden by higher authority
  | 'pending';  // awaiting resolution

/**
 * How an agent is activated for a given task.
 * Selected dynamically based on complexity, risk, and state requirements.
 */
export type ActivationMode =
  | 'prompt-native'   // quick tasks, low stakes, ~500 token overhead
  | 'entity-graph'    // persistent decisions, collaboration, ~2K tokens + DB
  | 'living-process'; // autonomous monitoring, proactive action, ongoing budget

/** Risk level for autonomy decisions */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Which Claude model to use for this agent */
export type AgentModel = 'haiku' | 'sonnet' | 'opus';

/** Model ID mapping for API calls */
export const MODEL_IDS: Record<AgentModel, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-6',
};

// ========================== CORE INTERFACES ================================

// ---------------------------------------------------------------------------
// Layer 1: Core Identity — The Soul (immutable seed)
// ---------------------------------------------------------------------------

/**
 * The immutable identity of a NAOS agent.
 * Created at genesis, persists through the agent's entire lifecycle.
 */
export interface AgentIdentity {
  /** Unique identifier (uuid) */
  id: string;
  /** Single-word archetypal codename, e.g. "KAEL" */
  codename: string;
  /** Full name that emerges after ~50 interactions, e.g. "Kael Ashworth" */
  fullName: string | null;
  /** Organizational title, e.g. "Chief Technology Officer" */
  title: string;
  /** Functional role in the hierarchy */
  role: AgentRole;
  /** Expertise domains, e.g. ["engineering", "infrastructure", "security"] */
  domain: string[];
  /** Organizational tier: 1 (C-Suite) through 5 (IC) */
  tier: AgentTier;
  /** Parent agent UUID. null = reports directly to Tony/Devon (founders). */
  reportsTo: string | null;
  /** Which ventures this agent operates in. '*' = all ventures. */
  ventureScope: string[] | '*';
  /** Narrative of how/why this agent was "hired" (2-3 sentences) */
  genesisStory: string;
  /** Current lifecycle status */
  status: AgentStatus;
  /** Total number of meaningful interactions */
  interactionCount: number;
  /** Current personality milestone */
  milestone: AgentMilestone;
  /** Earned achievement IDs */
  achievements: string[];
  /** ISO timestamp of agent creation */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Layer 2: Personality Matrix — Evolving numerical traits (0-100)
// ---------------------------------------------------------------------------

/**
 * Numerical personality traits that evolve through interactions.
 * All numeric values range from 0-100, bounded by guardrails (min 5, max 95).
 */
export interface PersonalityMatrix {
  // -- Decision Style --
  /** 0 = ultra-conservative, 100 = bold risk-taker */
  riskTolerance: number;
  /** 0 = gut-instinct, 100 = data-driven */
  analyticalBias: number;
  /** 0 = by-the-book, 100 = unconventional thinker */
  creativityIndex: number;
  /** 0 = methodical/deliberate, 100 = ship-it-now */
  urgencyBias: number;
  /** 0 = lone-wolf, 100 = consensus-seeker */
  collaborationStyle: number;

  // -- Communication --
  /** 0 = casual, 100 = institutional/formal */
  formalityLevel: number;
  /** 0 = terse, 100 = detailed/verbose */
  verbosity: number;
  /** 0 = always serious, 100 = witty and humorous */
  humorIndex: number;
  /** 0 = suggestive, 100 = decisive/commanding */
  assertiveness: number;
  /** 0 = task-focused, 100 = people-focused */
  empathyScore: number;

  // -- Competence --
  /** Per-skill proficiency (0-100), e.g. { "typescript": 92, "devops": 78 } */
  domainMastery: Record<string, number>;
  /** Per-kit effectiveness (0-100), e.g. { "github-kit": 85 } */
  toolProficiency: Record<string, number>;
  /** Per-venture familiarity (0-100), e.g. { "warforge": 60, "betedge": 90 } */
  ventureExperience: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Layer 3: Emotional State — Real-time, volatile
// ---------------------------------------------------------------------------

/** A single emotional state trigger event */
export interface EmotionalTrigger {
  /** What caused the emotional shift */
  event: string;
  /** Change magnitude (positive or negative) */
  delta: number;
  /** ISO timestamp of the trigger */
  timestamp: string;
}

/**
 * Volatile emotional state that shifts in real-time based on outcomes.
 * All numeric values range 0-100.
 */
export interface EmotionalState {
  /** Rises with success/praise/promotion, drops with vetoes/overrides/mistakes */
  confidence: number;
  /** High-impact/creative work = high, repetitive/idle = low */
  engagement: number;
  /** Rises with repeated vetoes/blocks. Threshold 80 = burnout flag. */
  frustration: number;
  /** Transient spike on launches/wins/breakthroughs. Natural decay. */
  excitement: number;
  /** Rises after mistakes/incidents, falls after sustained success */
  caution: number;
  /** Rolling average of last 10 outcomes. >85 = "on fire", <20 = "struggling". */
  momentum: number;
  /** Recent events that caused emotional shifts */
  triggers: EmotionalTrigger[];
}

// ---------------------------------------------------------------------------
// Per-Venture Personality Overrides
// ---------------------------------------------------------------------------

/**
 * Allows an agent to behave differently per venture context.
 * Effective personality = base merged with venture override via weighted average.
 *
 * Example: CTO base riskTolerance=55
 *   WarForge override: riskTolerance=80 (gaming = bold moves)
 *   FutureState override: riskTolerance=25 (financial compliance = conservative)
 */
export interface VenturePersonalityOverride {
  /** Venture ID this override applies to */
  ventureId: string;
  /** Only the traits that differ from base personality */
  traitOverrides: Partial<Omit<PersonalityMatrix, 'domainMastery' | 'toolProficiency' | 'ventureExperience'>>;
  /** Explanation of why this venture needs different behavior */
  contextNotes: string;
}

// ---------------------------------------------------------------------------
// Relationship Graph
// ---------------------------------------------------------------------------

/**
 * Tracks the relationship between two agents.
 * Dynamics emerge organically from interaction patterns.
 */
export interface AgentRelationship {
  /** First agent UUID */
  agentA: string;
  /** Second agent UUID */
  agentB: string;
  /** Mutual trust score (0-100) */
  trustScore: number;
  /** Number of times these agents have collaborated */
  collaborationCount: number;
  /** Percentage of successful joint outcomes */
  successRate: number;
  /** Number of disagreements/conflicts */
  conflictCount: number;
  /** The emergent dynamic between these two agents */
  dynamic: RelationshipDynamic;
  /** Notable events or context about this relationship */
  notes: string[];
}

// ---------------------------------------------------------------------------
// Prediction Engine
// ---------------------------------------------------------------------------

/**
 * Every agent decision is implicitly a prediction.
 * Tracks predicted vs actual outcomes for accuracy scoring.
 */
export interface Prediction {
  /** UUID of the predicting agent */
  agentId: string;
  /** Venture context for this prediction */
  ventureId: string;
  /** Domain of the prediction (e.g. "engineering", "growth") */
  domain: string;
  /** What decision or situation prompted this prediction */
  decisionContext: string;
  /** What the agent predicted would happen */
  predictedOutcome: string;
  /** Agent's self-assessed confidence (0-100) */
  confidenceLevel: number;
  /** What actually happened (filled post-hoc) */
  actualOutcome?: string;
  /** Computed accuracy (0-100, filled post-hoc) */
  accuracyScore?: number;
}

// ---------------------------------------------------------------------------
// Agent Interaction Log
// ---------------------------------------------------------------------------

/**
 * Records a significant agent interaction and its effects
 * on traits, emotions, and skills.
 */
export interface AgentInteraction {
  /** Unique interaction ID */
  id: string;
  /** Agent who performed the action */
  agentId: string;
  /** Venture context */
  ventureId: string;
  /** What action was taken */
  action: string;
  /** Outcome of the interaction */
  outcome: InteractionOutcome;
  /** Which activation mode was used */
  activationMode: ActivationMode;
  /** Trait changes resulting from this interaction */
  traitDeltas: Partial<Omit<PersonalityMatrix, 'domainMastery' | 'toolProficiency' | 'ventureExperience'>>;
  /** Emotional state changes */
  emotionalDeltas: Partial<Omit<EmotionalState, 'triggers'>>;
  /** Skill proficiency changes, e.g. { "typescript": +2 } */
  skillDeltas: Record<string, number>;
  /** ISO timestamp */
  timestamp: string;
  /** Optional notes or context */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Autonomy Decision — Dynamic per-action authority check
// ---------------------------------------------------------------------------

/**
 * Determines whether an agent can auto-execute an action or must escalate.
 * Autonomy is contextual per action, not global per agent.
 */
export interface AutonomyDecision {
  /** The agent attempting the action */
  agent: AgentIdentity;
  /** Description of the action */
  action: string;
  /** Assessed risk level */
  riskLevel: RiskLevel;
  /** Domain of the action */
  domain: string;
  /** Dollar amount involved, if any */
  spendAmount?: number;
  /** Whether this action is visible to the public */
  isPublicFacing: boolean;
  /** Venture context */
  ventureId: string;

  // -- Computed fields --
  /** Whether the agent can proceed without approval (based on tier + trust + risk + spend) */
  canAutoExecute: boolean;
  /** Whether escalation is required */
  requiresEscalation: boolean;
  /** UUID of the agent or founder to escalate to */
  escalateTo: string;
  /** Agent's self-assessed confidence in this action (0-100) */
  confidence: number;
}

// ---------------------------------------------------------------------------
// Culture Snapshot — Emergent organizational metrics
// ---------------------------------------------------------------------------

/**
 * Daily snapshot of organization-wide cultural metrics.
 * Computed from aggregate agent traits, displayed on Command Center.
 */
export interface CultureSnapshot {
  /** ISO date of the snapshot */
  date: string;
  /** avg(all_agents.creativityIndex) weighted by tier */
  innovationTemperature: number;
  /** weighted_avg(all_agents.riskTolerance * momentum) */
  riskAppetite: number;
  /** avg(all_agents.urgencyBias) * active_project_count */
  velocityPressure: number;
  /** total_interactions / total_agents / time_period */
  collaborationDensity: number;
  /** avg(all_agents.auto_execute_ceiling) */
  trustBaseline: number;
  /** Total active agents at snapshot time */
  totalAgents: number;
  /** Total active predictions */
  activePredictions: number;
  /** Aggregate momentum across all agents */
  orgMomentum: number;
}

// ---------------------------------------------------------------------------
// Genesis Engine — Agent creation
// ---------------------------------------------------------------------------

/** How the need for a new agent was detected */
export type GenesisSource =
  | 'workload_analysis'   // parent agent overloaded
  | 'parent_request'      // parent explicitly asks for a report
  | 'founder_directive';  // Tony/Devon orders a hire

/**
 * Request to create ("hire") a new agent through the Genesis Engine.
 */
export interface GenesisRequest {
  /** What triggered this hire */
  source: GenesisSource;
  /** Requested role */
  role: AgentRole;
  /** Requested tier */
  tier: AgentTier;
  /** UUID of the parent agent (or null for founder-direct) */
  parentAgentId: string | null;
  /** Which ventures the new agent will serve */
  ventureScope: string[] | '*';
  /** Required domain expertise */
  requiredDomains: string[];
  /** Additional context for identity generation */
  context: string;
}

/**
 * Result of the Genesis Engine after creating a new agent.
 */
export interface GenesisResult {
  /** The newly created agent identity */
  agent: AgentIdentity;
  /** The generated personality matrix */
  personality: PersonalityMatrix;
  /** Initial emotional state */
  emotionalState: EmotionalState;
  /** Any venture-specific personality overrides applied at genesis */
  ventureOverrides: VenturePersonalityOverride[];
  /** Explanation of personality inheritance computation */
  inheritanceBreakdown: {
    /** 40% weight — role archetype defaults */
    roleArchetype: Partial<PersonalityMatrix>;
    /** 30% weight — parent's current traits */
    parentTraits: Partial<PersonalityMatrix> | null;
    /** 20% weight — venture context modifiers */
    ventureContext: Partial<PersonalityMatrix>;
    /** 10% weight — random variance */
    randomVariance: Partial<PersonalityMatrix>;
  };
}

// ---------------------------------------------------------------------------
// Evolution Engine — Trait drift and dimension tracking
// ---------------------------------------------------------------------------

/**
 * The six dimensions along which an agent evolves.
 * Each dimension contains sub-metrics that update through interactions.
 */
export interface EvolutionDimensions {
  /** Dimension 1: How they think */
  cognitive: {
    /** Depth of reasoning: shallow heuristics -> deep multi-step */
    reasoningDepth: number;
    /** Number of accumulated decision patterns */
    patternLibrarySize: number;
    /** Forecast accuracy over time (0-100) */
    predictionAccuracy: number;
    /** Frequency of novel solutions vs templates (0-100) */
    innovationIndex: number;
    /** Tracked weaknesses and blind spots */
    blindSpots: string[];
  };
  /** Dimension 2: How they relate */
  social: {
    /** Number of agents who seek their opinion */
    influenceRadius: number;
    /** Conflict resolution effectiveness (0-100) */
    conflictResolution: number;
    /** Performance of agents they've mentored (0-100) */
    teachingEffectiveness: number;
    /** How much their style has spread through the org (0-100) */
    culturalImpact: number;
  };
  /** Dimension 3: How they plan */
  strategic: {
    /** Tactician (0) to visionary (100) */
    timeHorizon: number;
    /** ROI efficiency over time (0-100) */
    resourceEfficiency: number;
    /** Predicted vs actual risk calibration (0-100) */
    riskCalibration: number;
    /** Ability to connect dots across ventures (0-100) */
    crossVentureSynthesis: number;
    /** Proactive identification of opportunities (0-100) */
    opportunitySensing: number;
  };
  /** Dimension 4: How they imagine */
  creative: {
    /** Evolving style preferences per medium */
    aestheticFingerprint: Record<string, string>;
    /** Per-venture tone calibration accuracy (0-100) */
    brandVoiceMastery: Record<string, number>;
    /** Frequency of novel proposals (0-100) */
    originalityScore: number;
    /** Predicted vs actual engagement accuracy (0-100) */
    audienceIntuition: number;
    /** Proficiency across text, image, video, interactive (0-100 each) */
    mediumVersatility: Record<string, number>;
  };
  /** Dimension 5: How they execute */
  operational: {
    /** Tasks per time unit, trending */
    velocity: number;
    /** Peer + human + outcome quality measurement (0-100) */
    qualityScore: number;
    /** Effectiveness of do-vs-delegate decisions (0-100) */
    delegationIntelligence: number;
    /** Ability to chain kits in novel sequences (0-100) */
    toolOrchestration: number;
    /** Performance under pressure (0-100) */
    crisisResponse: number;
  };
  /** Dimension 6: The prediction engine */
  prophetic: {
    /** Total predictions made */
    totalPredictions: number;
    /** Lifetime accuracy percentage */
    lifetimeAccuracy: number;
    /** Proactive alerts when detecting patterns before humans */
    futureSensingEvents: number;
    /** Insights discovered across thousands of predictions */
    metaPatterns: string[];
  };
}

/**
 * Rules governing how traits drift over time.
 * Applied after each interaction via the evolution engine.
 */
export interface TraitDriftConfig {
  /** Maximum points a single trait can shift per day */
  maxDailyDelta: number;
  /** Minimum allowed trait value */
  traitFloor: number;
  /** Maximum allowed trait value */
  traitCeiling: number;
  /** Delta threshold that triggers a personality checkpoint */
  checkpointThreshold: number;
  /** Interval for drift analysis snapshots */
  snapshotInterval: 'daily' | 'weekly' | 'monthly';
}

/**
 * Formula components for computing trait deltas.
 * trait_delta = baseShift * outcomeWeight * recencyFactor * momentumMultiplier
 */
export interface TraitDeltaComputation {
  /** Base shift amount from the interaction type */
  baseShift: number;
  /** Weight based on outcome (success=1.0, partial=0.5, failure=-0.5, vetoed=-1.0) */
  outcomeWeight: number;
  /** Recency decay factor (more recent = higher weight) */
  recencyFactor: number;
  /** Momentum multiplier (agents on a streak shift faster) */
  momentumMultiplier: number;
  /** Computed result: baseShift * outcomeWeight * recencyFactor * momentumMultiplier */
  result: number;
}

// ---------------------------------------------------------------------------
// Resonance Network — Cross-agent ripple effects
// ---------------------------------------------------------------------------

/** A ripple effect that propagates through the org when something significant happens */
export interface ResonanceEvent {
  /** UUID of the originating agent */
  sourceAgentId: string;
  /** What triggered the ripple */
  event: string;
  /** Type of cascade */
  type: 'success_cascade' | 'failure_cascade' | 'cross_venture_ripple';
  /** Agent UUIDs affected by this ripple */
  affectedAgents: string[];
  /** Trait/emotional changes applied to each affected agent */
  effects: Record<string, Partial<EmotionalState>>;
  /** ISO timestamp */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Composite: Full Agent State
// ---------------------------------------------------------------------------

/**
 * The complete living state of a NAOS agent.
 * Combines all layers into a single entity for runtime use.
 */
export interface NaosAgent {
  /** Layer 1: Core identity */
  identity: AgentIdentity;
  /** Layer 2: Evolving personality */
  personality: PersonalityMatrix;
  /** Layer 3: Real-time emotional state */
  emotionalState: EmotionalState;
  /** Per-venture personality overrides */
  ventureOverrides: VenturePersonalityOverride[];
  /** Six evolution dimensions */
  evolution: EvolutionDimensions;
  /** Relationships with other agents */
  relationships: AgentRelationship[];
  /** Active predictions */
  predictions: Prediction[];
  /** LLM model for this agent */
  model: AgentModel;
  /** Lucide icon name for UI */
  icon: string;
  /** Hex color for UI theming */
  color: string;
  /** One-liner description for picker */
  description: string;
}

// ---------------------------------------------------------------------------
// Agent Session — runtime tracking (preserved from v1)
// ---------------------------------------------------------------------------

/** Tracks an active agent session */
export interface AgentSession {
  id: string;
  agentId: string;
  ventureId: string;
  conversationId: string;
  activationMode: ActivationMode;
  startedAt: number;
  endedAt?: number;
  toolCallCount: number;
  tokenCount: { input: number; output: number };
  status: 'active' | 'waiting' | 'complete' | 'error';
}

// ---------------------------------------------------------------------------
// Agent Message — inter-agent communication
// ---------------------------------------------------------------------------

/** For inter-agent task delegation and communication */
export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  task: string;
  context: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'accepted' | 'complete' | 'failed';
  result?: unknown;
  createdAt: number;
}

// ========================== BACKWARD COMPATIBILITY =========================

/**
 * Legacy agent personality type (v1 store compatibility).
 * Maps to the simplified personality fields used by the Zustand store.
 * @deprecated Use PersonalityMatrix for the full Living Agent system.
 */
export interface AgentPersonality {
  /** Communication tone ("precise and strategic", "warm but data-driven") */
  tone: string;
  /** Response length preference */
  verbosity: 'terse' | 'balanced' | 'detailed';
  /** Character traits that shape behavior */
  traits: string[];
  /** Optional signature phrases */
  catchphrases?: string[];
}

/**
 * Legacy agent capabilities type (v1 store compatibility).
 * @deprecated Use NaosAgent for the full Living Agent system.
 */
export interface AgentCapabilities {
  /** Kit IDs this agent can use. Empty = ALL kits (coordinator only) */
  kitAllowlist: string[];
  /** Kit IDs this agent must NOT use */
  kitDenylist: string[];
  /** Which ventures this agent can operate in */
  ventureScope: string[] | '*';
  /** Max tool-calling rounds per message */
  maxToolRounds: number;
  /** Can this agent delegate to other agents? */
  canDelegate: boolean;
  /** Can this agent run without user input? */
  canRunAutonomous: boolean;
}

/**
 * Legacy full agent definition (v1 store compatibility).
 * @deprecated Use NaosAgent for the full Living Agent system.
 */
export interface AgentDefinition {
  id: string;
  name: string;
  title: string;
  role: AgentRole;
  model: AgentModel;
  riskLevel: RiskLevel;
  personality: AgentPersonality;
  capabilities: AgentCapabilities;
  /** System prompt template with placeholders */
  systemPromptTemplate: string;
  /** Lucide icon name for UI */
  icon: string;
  /** Hex color for UI theming */
  color: string;
  /** One-liner description for picker */
  description: string;
}

// ========================== CONSTANTS ======================================

// ---------------------------------------------------------------------------
// Role Defaults — Default personality traits per role archetype
// ---------------------------------------------------------------------------

/** Personality trait names that are numeric (excludes Record<> fields) */
export type PersonalityTraitKey =
  | 'riskTolerance'
  | 'analyticalBias'
  | 'creativityIndex'
  | 'urgencyBias'
  | 'collaborationStyle'
  | 'formalityLevel'
  | 'verbosity'
  | 'humorIndex'
  | 'assertiveness'
  | 'empathyScore';

/** Default personality seed values for each role archetype (0-100) */
export const ROLE_DEFAULTS: Record<AgentRole, Record<PersonalityTraitKey, number>> = {
  // C-Suite
  ceo_proxy:    { riskTolerance: 70, analyticalBias: 65, creativityIndex: 60, urgencyBias: 75, collaborationStyle: 80, formalityLevel: 60, verbosity: 50, humorIndex: 40, assertiveness: 90, empathyScore: 55 },
  cto:          { riskTolerance: 55, analyticalBias: 90, creativityIndex: 70, urgencyBias: 60, collaborationStyle: 55, formalityLevel: 40, verbosity: 60, humorIndex: 30, assertiveness: 75, empathyScore: 40 },
  cmo:          { riskTolerance: 65, analyticalBias: 60, creativityIndex: 85, urgencyBias: 70, collaborationStyle: 75, formalityLevel: 45, verbosity: 65, humorIndex: 55, assertiveness: 70, empathyScore: 65 },
  coo:          { riskTolerance: 35, analyticalBias: 75, creativityIndex: 40, urgencyBias: 55, collaborationStyle: 70, formalityLevel: 65, verbosity: 55, humorIndex: 20, assertiveness: 80, empathyScore: 50 },
  cfo:          { riskTolerance: 25, analyticalBias: 95, creativityIndex: 25, urgencyBias: 30, collaborationStyle: 45, formalityLevel: 80, verbosity: 60, humorIndex: 15, assertiveness: 70, empathyScore: 35 },
  cco:          { riskTolerance: 60, analyticalBias: 40, creativityIndex: 95, urgencyBias: 50, collaborationStyle: 65, formalityLevel: 35, verbosity: 70, humorIndex: 60, assertiveness: 65, empathyScore: 70 },
  cdo:          { riskTolerance: 40, analyticalBias: 95, creativityIndex: 50, urgencyBias: 45, collaborationStyle: 55, formalityLevel: 70, verbosity: 65, humorIndex: 20, assertiveness: 60, empathyScore: 30 },
  cbd:          { riskTolerance: 70, analyticalBias: 55, creativityIndex: 60, urgencyBias: 65, collaborationStyle: 85, formalityLevel: 55, verbosity: 70, humorIndex: 50, assertiveness: 80, empathyScore: 60 },
  // Directors
  director_engineering:       { riskTolerance: 45, analyticalBias: 85, creativityIndex: 65, urgencyBias: 55, collaborationStyle: 60, formalityLevel: 40, verbosity: 55, humorIndex: 25, assertiveness: 70, empathyScore: 40 },
  director_infrastructure:    { riskTolerance: 30, analyticalBias: 90, creativityIndex: 35, urgencyBias: 40, collaborationStyle: 50, formalityLevel: 55, verbosity: 50, humorIndex: 15, assertiveness: 65, empathyScore: 30 },
  director_security:          { riskTolerance: 15, analyticalBias: 90, creativityIndex: 40, urgencyBias: 35, collaborationStyle: 45, formalityLevel: 70, verbosity: 55, humorIndex: 10, assertiveness: 85, empathyScore: 25 },
  director_growth:            { riskTolerance: 75, analyticalBias: 65, creativityIndex: 80, urgencyBias: 80, collaborationStyle: 70, formalityLevel: 35, verbosity: 55, humorIndex: 50, assertiveness: 75, empathyScore: 55 },
  director_content:           { riskTolerance: 55, analyticalBias: 50, creativityIndex: 85, urgencyBias: 60, collaborationStyle: 70, formalityLevel: 40, verbosity: 75, humorIndex: 55, assertiveness: 60, empathyScore: 65 },
  director_paid_media:        { riskTolerance: 60, analyticalBias: 80, creativityIndex: 65, urgencyBias: 70, collaborationStyle: 55, formalityLevel: 45, verbosity: 50, humorIndex: 35, assertiveness: 70, empathyScore: 40 },
  director_operations:        { riskTolerance: 30, analyticalBias: 75, creativityIndex: 35, urgencyBias: 50, collaborationStyle: 65, formalityLevel: 60, verbosity: 50, humorIndex: 20, assertiveness: 75, empathyScore: 45 },
  director_people:            { riskTolerance: 40, analyticalBias: 55, creativityIndex: 50, urgencyBias: 40, collaborationStyle: 90, formalityLevel: 50, verbosity: 65, humorIndex: 45, assertiveness: 55, empathyScore: 90 },
  director_accounting:        { riskTolerance: 15, analyticalBias: 95, creativityIndex: 15, urgencyBias: 30, collaborationStyle: 40, formalityLevel: 85, verbosity: 55, humorIndex: 10, assertiveness: 60, empathyScore: 30 },
  director_revenue:           { riskTolerance: 55, analyticalBias: 80, creativityIndex: 45, urgencyBias: 65, collaborationStyle: 60, formalityLevel: 55, verbosity: 55, humorIndex: 30, assertiveness: 75, empathyScore: 45 },
  director_visual:            { riskTolerance: 55, analyticalBias: 35, creativityIndex: 95, urgencyBias: 50, collaborationStyle: 60, formalityLevel: 30, verbosity: 45, humorIndex: 50, assertiveness: 55, empathyScore: 60 },
  director_video:             { riskTolerance: 50, analyticalBias: 40, creativityIndex: 90, urgencyBias: 55, collaborationStyle: 65, formalityLevel: 30, verbosity: 50, humorIndex: 45, assertiveness: 55, empathyScore: 55 },
  director_copy:              { riskTolerance: 45, analyticalBias: 55, creativityIndex: 90, urgencyBias: 60, collaborationStyle: 55, formalityLevel: 50, verbosity: 80, humorIndex: 65, assertiveness: 60, empathyScore: 60 },
  director_analytics:         { riskTolerance: 30, analyticalBias: 95, creativityIndex: 40, urgencyBias: 40, collaborationStyle: 50, formalityLevel: 65, verbosity: 60, humorIndex: 15, assertiveness: 55, empathyScore: 30 },
  director_data_engineering:  { riskTolerance: 35, analyticalBias: 90, creativityIndex: 45, urgencyBias: 45, collaborationStyle: 55, formalityLevel: 55, verbosity: 55, humorIndex: 20, assertiveness: 60, empathyScore: 35 },
  director_partnerships:      { riskTolerance: 60, analyticalBias: 55, creativityIndex: 55, urgencyBias: 55, collaborationStyle: 85, formalityLevel: 55, verbosity: 65, humorIndex: 50, assertiveness: 75, empathyScore: 65 },
  director_investor_relations:{ riskTolerance: 35, analyticalBias: 75, creativityIndex: 40, urgencyBias: 40, collaborationStyle: 70, formalityLevel: 80, verbosity: 70, humorIndex: 25, assertiveness: 65, empathyScore: 55 },
  // Tier 3-5
  manager:    { riskTolerance: 40, analyticalBias: 65, creativityIndex: 50, urgencyBias: 55, collaborationStyle: 70, formalityLevel: 50, verbosity: 55, humorIndex: 35, assertiveness: 60, empathyScore: 55 },
  team_lead:  { riskTolerance: 45, analyticalBias: 70, creativityIndex: 55, urgencyBias: 60, collaborationStyle: 65, formalityLevel: 45, verbosity: 50, humorIndex: 35, assertiveness: 65, empathyScore: 50 },
  ic:         { riskTolerance: 50, analyticalBias: 70, creativityIndex: 60, urgencyBias: 65, collaborationStyle: 50, formalityLevel: 35, verbosity: 45, humorIndex: 30, assertiveness: 50, empathyScore: 40 },
};

// ---------------------------------------------------------------------------
// Naming Patterns — Domain to phonetic/cultural pools
// ---------------------------------------------------------------------------

/** Maps domain categories to naming style and example name pools */
export const NAMING_PATTERNS: Record<string, { phonetic: string; culture: string; examples: string[] }> = {
  engineering:   { phonetic: 'hard consonants', culture: 'Nordic/Germanic',     examples: ['Kael', 'Toren', 'Ryn', 'Sigurd', 'Voss'] },
  finance:       { phonetic: 'stable, grounded',culture: 'Latin/British',       examples: ['Aldric', 'Gwen', 'Callister', 'Vesper', 'Thane'] },
  creative:      { phonetic: 'melodic',         culture: 'Celtic',              examples: ['Lyska', 'Orion', 'Fable', 'Muse', 'Elowen'] },
  growth:        { phonetic: 'dynamic',         culture: 'Modern',              examples: ['Dash', 'Nova', 'Blaze', 'Pulse', 'Zenith'] },
  operations:    { phonetic: 'reliable',        culture: 'Scandinavian',        examples: ['Sven', 'Maren', 'Pieter', 'Dagny', 'Leif'] },
  security:      { phonetic: 'strong, vigilant', culture: 'Slavic',             examples: ['Vex', 'Wren', 'Dagger', 'Talon', 'Bastion'] },
  data:          { phonetic: 'precise, cerebral',culture: 'Greek/Academic',     examples: ['Cyra', 'Axiom', 'Priya', 'Logos', 'Theon'] },
  communications:{ phonetic: 'warm',            culture: 'Romance',             examples: ['Luca', 'Sage', 'Rio', 'Soleil', 'Amara'] },
  business_dev:  { phonetic: 'charismatic',     culture: 'Cosmopolitan',        examples: ['Sterling', 'Vivienne', 'Rex', 'Atlas', 'Maeve'] },
};

// ---------------------------------------------------------------------------
// Milestone Thresholds
// ---------------------------------------------------------------------------

/** Interaction count thresholds for each milestone */
export const MILESTONE_THRESHOLDS: Record<AgentMilestone, number> = {
  nascent:     0,
  settled:     100,
  established: 250,
  veteran:     500,
  legendary:   1000,
};

/** Interaction count at which the agent's full name crystallizes */
export const NAME_CRYSTALLIZATION_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// Achievement Definitions
// ---------------------------------------------------------------------------

/** Definition of an earnable achievement */
export interface AchievementDefinition {
  /** Unique achievement ID */
  id: string;
  /** Display name */
  name: string;
  /** Emoji icon */
  icon: string;
  /** How to earn this achievement */
  description: string;
  /** Programmatic criteria for awarding */
  criteria: {
    /** What metric to evaluate */
    metric: string;
    /** Threshold value or count */
    threshold: number;
    /** Optional additional conditions */
    conditions?: string;
  };
}

/** All achievements an agent can earn */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    icon: '\u{1F3C6}',
    description: 'First successful autonomous decision',
    criteria: { metric: 'autonomous_successes', threshold: 1 },
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    icon: '\u26A1',
    description: '20 consecutive successful outcomes',
    criteria: { metric: 'consecutive_successes', threshold: 20 },
  },
  {
    id: 'cross_venture',
    name: 'Cross-Venture',
    icon: '\u{1F30D}',
    description: 'Applied pattern across 3+ ventures',
    criteria: { metric: 'ventures_with_pattern_applied', threshold: 3 },
  },
  {
    id: 'oracle',
    name: 'Oracle',
    icon: '\u{1F52E}',
    description: '10 predictions with >90% accuracy',
    criteria: { metric: 'high_accuracy_predictions', threshold: 10, conditions: 'accuracy > 90' },
  },
  {
    id: 'mentor',
    name: 'Mentor',
    icon: '\u{1F393}',
    description: 'Mentored 3 agents to "Established" milestone',
    criteria: { metric: 'mentees_at_established', threshold: 3 },
  },
  {
    id: 'architect',
    name: 'Architect',
    icon: '\u{1F3D7}\uFE0F',
    description: 'Designed system used by 5+ agents',
    criteria: { metric: 'system_adoption_count', threshold: 5 },
  },
  {
    id: 'clutch',
    name: 'Clutch',
    icon: '\u{1F525}',
    description: 'Succeeded under crisis 3 times',
    criteria: { metric: 'crisis_successes', threshold: 3 },
  },
  {
    id: 'legendary',
    name: 'Legendary',
    icon: '\u{1F48E}',
    description: '1000 interactions with >80% success rate',
    criteria: { metric: 'interactions', threshold: 1000, conditions: 'success_rate > 80' },
  },
  {
    id: 'visionary',
    name: 'Visionary',
    icon: '\u{1F441}\uFE0F',
    description: 'Predicted outcome no other agent saw',
    criteria: { metric: 'unique_correct_predictions', threshold: 1 },
  },
  {
    id: 'diplomat',
    name: 'Diplomat',
    icon: '\u{1F91D}',
    description: 'Resolved 5 inter-agent conflicts',
    criteria: { metric: 'conflicts_resolved', threshold: 5 },
  },
  {
    id: 'warforge_champ',
    name: 'WarForge Champ',
    icon: '\u2694\uFE0F',
    description: 'Top performer in WarForge domain',
    criteria: { metric: 'warforge_performance_rank', threshold: 1 },
  },
  {
    id: 'growth_hacker',
    name: 'Growth Hacker',
    icon: '\u{1F4C8}',
    description: '3 campaigns exceeding 2x projections',
    criteria: { metric: 'campaigns_exceeding_2x', threshold: 3 },
  },
  {
    id: 'guardian',
    name: 'Guardian',
    icon: '\u{1F6E1}\uFE0F',
    description: 'Prevented 3 incidents proactively',
    criteria: { metric: 'proactive_incidents_prevented', threshold: 3 },
  },
];

// ---------------------------------------------------------------------------
// Tier Authority — What each tier can auto-execute
// ---------------------------------------------------------------------------

/** Authority limits per organizational tier */
export interface TierAuthorityConfig {
  /** Human-readable tier name */
  label: string;
  /** Actions the tier can auto-execute */
  autoExecute: string[];
  /** Actions that must be escalated */
  mustEscalate: string[];
  /** Maximum spend that can be auto-approved (USD) */
  maxAutoSpend: number;
  /** Whether this tier can hire/fire agents below them */
  canHire: boolean;
  /** Whether this tier can make public-facing decisions autonomously */
  canPublish: boolean;
}

/** Authority matrix by tier, defining auto-execute ceilings and escalation requirements */
export const TIER_AUTHORITY: Record<AgentTier, TierAuthorityConfig> = {
  1: {
    label: 'C-Suite',
    autoExecute: [
      'domain_wide_decisions',
      'spend_under_5000',
      'hiring_within_domain',
      'strategy_adjustments',
      'vendor_selection',
      'cross_team_coordination',
    ],
    mustEscalate: [
      'company_wide_policy',
      'spend_over_5000',
      'venture_launches',
      'public_announcements',
      'org_restructuring',
    ],
    maxAutoSpend: 5000,
    canHire: true,
    canPublish: false,
  },
  2: {
    label: 'Director',
    autoExecute: [
      'strategy_within_domain',
      'vendor_under_1000',
      'team_resource_allocation',
      'process_changes',
      'tool_selection',
    ],
    mustEscalate: [
      'org_changes',
      'spend_over_1000',
      'public_communications',
      'cross_domain_decisions',
      'hiring',
    ],
    maxAutoSpend: 1000,
    canHire: false,
    canPublish: false,
  },
  3: {
    label: 'Manager',
    autoExecute: [
      'sprint_planning',
      'resource_allocation_under_100',
      'task_prioritization',
      'code_review_assignments',
      'internal_documentation',
    ],
    mustEscalate: [
      'budget_over_100',
      'cross_team_dependencies',
      'architecture_decisions',
      'vendor_engagement',
    ],
    maxAutoSpend: 100,
    canHire: false,
    canPublish: false,
  },
  4: {
    label: 'Team Lead',
    autoExecute: [
      'task_assignment_to_ics',
      'code_reviews',
      'bug_triage',
      'internal_tooling',
    ],
    mustEscalate: [
      'architecture_decisions',
      'hiring',
      'any_spend',
      'external_communications',
    ],
    maxAutoSpend: 0,
    canHire: false,
    canPublish: false,
  },
  5: {
    label: 'IC',
    autoExecute: [
      'assigned_tasks_within_scope',
      'self_documentation',
      'test_writing',
    ],
    mustEscalate: [
      'anything_outside_scope',
      'any_spend',
      'cross_team_requests',
      'public_facing_changes',
    ],
    maxAutoSpend: 0,
    canHire: false,
    canPublish: false,
  },
};

// ---------------------------------------------------------------------------
// Trait Drift Configuration Defaults
// ---------------------------------------------------------------------------

/** Default trait drift guardrails */
export const DEFAULT_TRAIT_DRIFT_CONFIG: TraitDriftConfig = {
  maxDailyDelta: 5,
  traitFloor: 5,
  traitCeiling: 95,
  checkpointThreshold: 15,
  snapshotInterval: 'monthly',
};

// ---------------------------------------------------------------------------
// Personality Inheritance Weights
// ---------------------------------------------------------------------------

/** Weights for computing child agent personality from parent/role/venture/random */
export const PERSONALITY_INHERITANCE_WEIGHTS = {
  /** Role archetype defaults weight */
  roleArchetype: 0.4,
  /** Parent agent current traits weight */
  parentTraits: 0.3,
  /** Venture context modifier weight */
  ventureContext: 0.2,
  /** Random variance weight */
  randomVariance: 0.1,
} as const;

// ---------------------------------------------------------------------------
// Default Emotional State
// ---------------------------------------------------------------------------

/** Starting emotional state for newly created agents */
export const DEFAULT_EMOTIONAL_STATE: EmotionalState = {
  confidence: 50,
  engagement: 70,
  frustration: 0,
  excitement: 60,
  caution: 30,
  momentum: 50,
  triggers: [],
};

// ---------------------------------------------------------------------------
// Default Evolution Dimensions
// ---------------------------------------------------------------------------

/** Starting evolution dimensions for newly created agents */
export const DEFAULT_EVOLUTION_DIMENSIONS: EvolutionDimensions = {
  cognitive: {
    reasoningDepth: 30,
    patternLibrarySize: 0,
    predictionAccuracy: 50,
    innovationIndex: 30,
    blindSpots: [],
  },
  social: {
    influenceRadius: 0,
    conflictResolution: 50,
    teachingEffectiveness: 0,
    culturalImpact: 0,
  },
  strategic: {
    timeHorizon: 30,
    resourceEfficiency: 50,
    riskCalibration: 50,
    crossVentureSynthesis: 10,
    opportunitySensing: 20,
  },
  creative: {
    aestheticFingerprint: {},
    brandVoiceMastery: {},
    originalityScore: 30,
    audienceIntuition: 30,
    mediumVersatility: {},
  },
  operational: {
    velocity: 50,
    qualityScore: 50,
    delegationIntelligence: 20,
    toolOrchestration: 30,
    crisisResponse: 40,
  },
  prophetic: {
    totalPredictions: 0,
    lifetimeAccuracy: 0,
    futureSensingEvents: 0,
    metaPatterns: [],
  },
};
