// ---------------------------------------------------------------------------
// NAOS Agent System — Core Type Definitions
// ---------------------------------------------------------------------------

/** Which Claude model to use for this agent */
export type AgentModel = 'haiku' | 'sonnet' | 'opus';

/** Model ID mapping for API calls */
export const MODEL_IDS: Record<AgentModel, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-6',
};

/** Agent's functional role in the NAOS hierarchy */
export type AgentRole =
  | 'coordinator'   // Aegis — routes, synthesizes, delegates
  | 'engineer'      // Forge — code, architecture, DevOps
  | 'finance'       // Ledger — treasury, P&L, accounting
  | 'marketing'     // Herald — growth, campaigns, social
  | 'data'          // Oracle — analytics, RAG, knowledge
  | 'security'      // Shield — audit, compliance, access
  | 'content'       // Scribe — docs, knowledge base, writing
  | 'operations'    // Director — tasks, scheduling, team
  | 'monitor';      // Sentinel — autonomous observation

/** Risk level determines HITL behavior */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ---------------------------------------------------------------------------
// Agent Personality — defines how the agent communicates
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Agent Capabilities — defines what the agent can do
// ---------------------------------------------------------------------------

export interface AgentCapabilities {
  /** Kit IDs this agent can use. Empty = ALL kits (coordinator only) */
  kitAllowlist: string[];
  /** Kit IDs this agent must NOT use */
  kitDenylist: string[];
  /** Which ventures this agent can operate in */
  ventureScope: string[] | '*';
  /** Max tool-calling rounds per message */
  maxToolRounds: number;
  /** Can this agent delegate to other agents? (Aegis only) */
  canDelegate: boolean;
  /** Can this agent run without user input? (Sentinel only) */
  canRunAutonomous: boolean;
}

// ---------------------------------------------------------------------------
// Agent Definition — the full agent entity
// ---------------------------------------------------------------------------

export interface AgentDefinition {
  id: string;
  name: string;
  title: string;
  role: AgentRole;
  model: AgentModel;
  riskLevel: RiskLevel;
  personality: AgentPersonality;
  capabilities: AgentCapabilities;
  /** System prompt with {{venture_context}}, {{memory_context}}, {{device_context}}, {{user_context}} placeholders */
  systemPromptTemplate: string;
  /** Lucide icon name for UI */
  icon: string;
  /** Hex color for UI theming */
  color: string;
  /** One-liner description for picker */
  description: string;
}

// ---------------------------------------------------------------------------
// Agent Session — runtime tracking
// ---------------------------------------------------------------------------

export interface AgentSession {
  id: string;
  agentId: string;
  ventureId: string;
  conversationId: string;
  startedAt: number;
  endedAt?: number;
  toolCallCount: number;
  tokenCount: { input: number; output: number };
  status: 'active' | 'waiting' | 'complete' | 'error';
}

// ---------------------------------------------------------------------------
// Agent Message — for inter-agent communication (Phase 3)
// ---------------------------------------------------------------------------

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
