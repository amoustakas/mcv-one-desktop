// @ts-nocheck
// src/stores/naos.ts — NAOS Agent State Management (Zustand + persist)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AgentDefinition,
  AgentSession,
  AgentRole,
  AgentModel,
  AgentPersonality,
  RiskLevel,
} from '../lib/naos/types';

// ---------------------------------------------------------------------------
// Extended NAOS Types (for agent roster / culture / org-chart features)
// ---------------------------------------------------------------------------

/** Tier levels for agent hierarchy (1 = executive, 5 = specialist) */
export type AgentTier = 1 | 2 | 3 | 4 | 5;

/** Full identity for an agent in the roster */
export interface AgentIdentity {
  id: string;
  name: string;
  title: string;
  role: AgentRole;
  model: AgentModel;
  tier: AgentTier;
  status: 'active' | 'idle' | 'offline' | 'training' | 'suspended';
  ventureScope: string[] | '*';
  reports_to: string | null;
  icon: string;
  color: string;
  description: string;
  created_at: number;
  updated_at: number;
}

/** Five-axis personality matrix for agent behavior modeling */
export interface PersonalityMatrix {
  agentId: string;
  /** Communication tone and style */
  tone: AgentPersonality['tone'];
  verbosity: AgentPersonality['verbosity'];
  traits: string[];
  catchphrases: string[];
  /** Big-five style personality axes (0-100) */
  axes: {
    analytical: number;    // 0 = intuitive, 100 = analytical
    assertive: number;     // 0 = passive, 100 = assertive
    creative: number;      // 0 = conventional, 100 = creative
    empathetic: number;    // 0 = detached, 100 = empathetic
    autonomous: number;    // 0 = dependent, 100 = autonomous
  };
  /** Preferred interaction style */
  interactionStyle: 'formal' | 'casual' | 'mentor' | 'peer' | 'executive';
}

/** Emotional state snapshot for an agent */
export interface EmotionalState {
  agentId: string;
  /** Current mood/energy level */
  mood: 'focused' | 'energized' | 'neutral' | 'stressed' | 'reflective';
  /** Confidence in recent outputs (0-100) */
  confidence: number;
  /** Workload saturation (0-100) */
  workload: number;
  /** Recent performance trend */
  trend: 'improving' | 'stable' | 'declining';
  /** Last updated timestamp */
  timestamp: number;
}

/** Relationship between two agents */
export interface AgentRelationship {
  fromAgentId: string;
  toAgentId: string;
  type: 'reports_to' | 'collaborates' | 'delegates' | 'advises' | 'monitors';
  strength: number; // 0-100
  lastInteraction: number;
  interactionCount: number;
}

/** Culture snapshot for the entire agent organization */
export interface CultureSnapshot {
  timestamp: number;
  totalAgents: number;
  activeAgents: number;
  avgConfidence: number;
  avgWorkload: number;
  dominantMood: EmotionalState['mood'];
  collaborationIndex: number; // 0-100
  autonomyIndex: number;     // 0-100
  topTraits: string[];
  ventureDistribution: Record<string, number>;
  tierDistribution: Record<string, number>;
}

/** Tree node for org-chart rendering */
export interface OrgNode {
  agent: AgentIdentity;
  personality?: PersonalityMatrix;
  emotional?: EmotionalState;
  children: OrgNode[];
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

interface NaosState {
  // Agent roster
  agents: Record<string, AgentIdentity>;
  personalities: Record<string, PersonalityMatrix>;
  emotionalStates: Record<string, EmotionalState>;
  relationships: AgentRelationship[];

  // Session tracking (carried from v1)
  sessions: Record<string, AgentSession>;
  agentOverrides: Record<string, Partial<AgentDefinition>>;

  // UI state
  selectedAgentId: string | null;
  viewMode: 'org-chart' | 'roster' | 'culture';
  filterTier: AgentTier | null;
  filterVenture: string | null;
  searchQuery: string;

  // Culture
  cultureSnapshot: CultureSnapshot | null;

  // --- Actions ---

  // Roster
  setAgents: (agents: AgentIdentity[]) => void;
  setPersonality: (agentId: string, personality: PersonalityMatrix) => void;
  setEmotionalState: (agentId: string, state: EmotionalState) => void;
  setRelationships: (rels: AgentRelationship[]) => void;

  // UI
  selectAgent: (id: string | null) => void;
  setViewMode: (mode: 'org-chart' | 'roster' | 'culture') => void;
  setFilterTier: (tier: AgentTier | null) => void;
  setFilterVenture: (venture: string | null) => void;
  setSearchQuery: (query: string) => void;

  // Culture
  setCultureSnapshot: (snapshot: CultureSnapshot) => void;

  // Session management (carried from v1)
  setActiveAgent: (id: string | null) => void;
  startSession: (session: AgentSession) => void;
  endSession: (sessionId: string, status?: AgentSession['status']) => void;
  updateSession: (sessionId: string, updates: Partial<AgentSession>) => void;
  setAgentOverride: (agentId: string, override: Partial<AgentDefinition>) => void;
  clearOverride: (agentId: string) => void;

  // --- Computed ---
  getAgent: (id: string) => AgentIdentity | undefined;
  getTeam: (parentId: string) => AgentIdentity[];
  getOrgTree: () => OrgNode[];
}

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useNAOSStore = create<NaosState>()(
  persist(
    (set, get) => ({
      // --- Initial state ---
      agents: {},
      personalities: {},
      emotionalStates: {},
      relationships: [],
      sessions: {},
      agentOverrides: {},
      selectedAgentId: null,
      viewMode: 'roster',
      filterTier: null,
      filterVenture: null,
      searchQuery: '',
      cultureSnapshot: null,

      // --- Roster actions ---

      setAgents: (agentList) => {
        const map: Record<string, AgentIdentity> = {};
        for (const a of agentList) {
          map[a.id] = a;
        }
        set({ agents: map });
      },

      setPersonality: (agentId, personality) =>
        set((s) => ({
          personalities: { ...s.personalities, [agentId]: personality },
        })),

      setEmotionalState: (agentId, state) =>
        set((s) => ({
          emotionalStates: { ...s.emotionalStates, [agentId]: state },
        })),

      setRelationships: (rels) => set({ relationships: rels }),

      // --- UI actions ---

      selectAgent: (id) => set({ selectedAgentId: id }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setFilterTier: (tier) => set({ filterTier: tier }),

      setFilterVenture: (venture) => set({ filterVenture: venture }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      // --- Culture ---

      setCultureSnapshot: (snapshot) => set({ cultureSnapshot: snapshot }),

      // --- Session management (carried from v1) ---

      setActiveAgent: (id) => set({ selectedAgentId: id }),

      startSession: (session) =>
        set((s) => ({ sessions: { ...s.sessions, [session.id]: session } })),

      endSession: (sessionId, status = 'complete') =>
        set((s) => {
          const existing = s.sessions[sessionId];
          if (!existing) return s;
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...existing, status, endedAt: Date.now() },
            },
          };
        }),

      updateSession: (sessionId, updates) =>
        set((s) => {
          const existing = s.sessions[sessionId];
          if (!existing) return s;
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...existing, ...updates },
            },
          };
        }),

      setAgentOverride: (agentId, override) =>
        set((s) => ({
          agentOverrides: { ...s.agentOverrides, [agentId]: override },
        })),

      clearOverride: (agentId) =>
        set((s) => {
          const { [agentId]: _, ...rest } = s.agentOverrides;
          return { agentOverrides: rest };
        }),

      // --- Computed ---

      getAgent: (id) => get().agents[id],

      getTeam: (parentId) =>
        Object.values(get().agents).filter((a) => a.reports_to === parentId),

      getOrgTree: () => {
        const { agents, personalities, emotionalStates } = get();
        const agentList = Object.values(agents);
        const nodeMap = new Map<string, OrgNode>();

        // Create nodes
        for (const agent of agentList) {
          nodeMap.set(agent.id, {
            agent,
            personality: personalities[agent.id],
            emotional: emotionalStates[agent.id],
            children: [],
          });
        }

        // Build tree
        const roots: OrgNode[] = [];
        for (const agent of agentList) {
          const node = nodeMap.get(agent.id)!;
          if (agent.reports_to && nodeMap.has(agent.reports_to)) {
            nodeMap.get(agent.reports_to)!.children.push(node);
          } else {
            roots.push(node);
          }
        }

        // Sort children by tier then name
        const sortChildren = (nodes: OrgNode[]) => {
          nodes.sort((a, b) => a.agent.tier - b.agent.tier || a.agent.name.localeCompare(b.agent.name));
          for (const node of nodes) {
            sortChildren(node.children);
          }
        };
        sortChildren(roots);

        return roots;
      },
    }),
    {
      name: 'mcv-naos',
      partialize: (s) => ({
        selectedAgentId: s.selectedAgentId,
        viewMode: s.viewMode,
        filterTier: s.filterTier,
        filterVenture: s.filterVenture,
        // Don't persist sessions, agents, personalities, emotional states (fetched from API)
        agentOverrides: s.agentOverrides,
      }),
    },
  ),
);
