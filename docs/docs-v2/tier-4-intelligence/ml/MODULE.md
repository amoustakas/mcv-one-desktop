# @mcv/intelligence/ml — Machine Learning & AI Orchestration Module

**Parent Package:** @mcv/intelligence  
**Actual Package:** @mcv/ai  
**Tier:** 4 (Intelligence Layer — AI Operations)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q3 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `ml` module (implemented as `@mcv/ai`) provides the **AI orchestration layer** for the MCV.ONE ecosystem. It manages **agent swarms** (NAOS agents: Queen, Ralph, Hephaestus, Scout, Talos, and custom agents), **task dispatch and routing**, **autonomous event-driven automations**, **AI-powered chat sessions with persistent history**, **skill/tool registration**, **knowledge base management with RAG integration**, **reusable prompt templates**, and an **interactive workbench** for AI-assisted architecture planning and deployment.

This is **not** a traditional ML training/inference library — it is the **operational brain** that coordinates how AI agents collaborate, execute tasks, and interact with users across all MCV ventures. Every AI conversation, autonomous workflow, agent action, and swarm deployment flows through this module. The gateway module (`@mcv/intelligence/gateway`) handles the actual LLM API calls; this module handles the **orchestration, state management, and business logic** above it.

**Key capabilities:**

- **Multi-agent swarm orchestration** with role-based routing and load-aware selection
- **Task dispatch** with automatic agent selection, sub-task chains, and approval workflows
- **Autonomous event-driven automations** with trigger matching and template interpolation
- **Conversational AI chat** with persistent history, context attachments, and session management
- **Skill/tool registry** for agent capabilities with versioning and execution metrics
- **Knowledge base management** linked to RAG vector stores for retrieval-augmented generation
- **Prompt bank** with reusable templates, variable interpolation, and usage tracking
- **Interactive workbench** for AI-assisted project planning, blueprint generation, and swarm deployment
- **Per-agent performance metrics** including success rates, response times, and task counts

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           @mcv/ai — AI ORCHESTRATION MODULE                          │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                            ENTRY POINTS                                       │   │
│  │                                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │  API Routes  │  │  Cron Jobs   │  │  Webhooks    │  │  Workbench   │     │   │
│  │  │  /api/ai/*   │  │  Scheduled   │  │  Event-based │  │  UI Actions  │     │   │
│  │  │  Chat, Tasks │  │  Tasks       │  │  Triggers    │  │  Blueprints  │     │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │   │
│  │         │                 │                 │                 │               │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘               │   │
│  │                                    │                                           │   │
│  └────────────────────────────────────┼───────────────────────────────────────────┘   │
│                                       │                                               │
│  ┌────────────────────────────────────▼───────────────────────────────────────────┐   │
│  │                          SERVICE LAYER (6 Services)                             │   │
│  │                                                                                 │   │
│  │  ┌───────────────────────┐  ┌───────────────────────┐                          │   │
│  │  │  AgentOrchestrator    │  │  AIChatService         │                          │   │
│  │  │  Service              │  │                        │                          │   │
│  │  │                       │  │  • sendMessage()       │                          │   │
│  │  │  • dispatchTask()     │  │  • getHistory()        │                          │   │
│  │  │  • selectAgent()      │  │  • Create/resume       │                          │   │
│  │  │  • updateAgentStatus()│  │    conversations       │                          │   │
│  │  │  • getSwarmStatus()   │  │  • Append messages     │                          │   │
│  │  │                       │  │  • Auto-routes to      │                          │   │
│  │  │  Routes tasks to best │  │    Queen agent         │                          │   │
│  │  │  available agent by   │  │                        │                          │   │
│  │  │  role + availability  │  │  Uses AgentOrchestrator│                          │   │
│  │  └───────────┬───────────┘  └───────────┬────────────┘                          │   │
│  │              │                           │                                       │   │
│  │  ┌───────────▼───────────┐  ┌───────────▼────────────┐                          │   │
│  │  │  AutonomousAgent      │  │  AISkillService         │                          │   │
│  │  │  Service              │  │                        │                          │   │
│  │  │                       │  │  • registerSkill()     │                          │   │
│  │  │  • checkTriggers()    │  │  • getSkillsForAgent() │                          │   │
│  │  │  • Event matching     │  │  • Upsert by slug      │                          │   │
│  │  │  • Auto-dispatch via  │  │  • Role-based filtering│                          │   │
│  │  │    AgentOrchestrator  │  │  • In-memory filter    │                          │   │
│  │  │  • Stats tracking     │  │    (prototype)         │                          │   │
│  │  └───────────────────────┘  └────────────────────────┘                          │   │
│  │                                                                                 │   │
│  │  ┌───────────────────────┐  ┌────────────────────────┐                          │   │
│  │  │  KnowledgeBase        │  │  WorkbenchService       │                          │   │
│  │  │  Service              │  │                        │                          │   │
│  │  │                       │  │  • chat()              │                          │   │
│  │  │  • createKnowledgeBase│  │  • extractContext()    │                          │   │
│  │  │  • listKnowledgeBases │  │  • generateBlueprint() │                          │   │
│  │  │  • Links to RAG store │  │  • deploySwarm()       │                          │   │
│  │  │  • Per-venture scoped │  │                        │                          │   │
│  │  │                       │  │  CTO Orchestrator for  │                          │   │
│  │  └───────────────────────┘  │  AI-assisted planning  │                          │   │
│  │                              └────────────────────────┘                          │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA FLOW                                               │   │
│  │                                                                                  │   │
│  │   User Command ──► AIChatService ──► AgentOrchestrator ──► dispatchTask()      │   │
│  │                          │                    │                    │              │   │
│  │                   aiConversations        selectAgent()        aiTasks            │   │
│  │                   (message history)      (by role/load)      (task queue)       │   │
│  │                                               │                                  │   │
│  │   Event Fired ──► AutonomousAgentService ─────┘                                 │   │
│  │                   (trigger matching)                                              │   │
│  │                                                                                  │   │
│  │   Workbench ──► WorkbenchService ──► extractContext() ──► generateBlueprint()   │   │
│  │   Planning       (CTO chat)           (keyword parse)      (mock nodes)         │   │
│  │                       │                                         │                │   │
│  │                       └──── deploySwarm() ──► AgentOrchestrator ┘               │   │
│  │                              (multi-task dispatch)                                │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           DATABASE LAYER (@mcv/db)                                │  │
│  │                                                                                   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ ┌───────────────────────┐ │  │
│  │  │  ai_agents   │ │  ai_tasks   │ │ai_conversations │ │     ai_skills         │ │  │
│  │  │             │ │             │ │                 │ │                       │ │  │
│  │  │ Agent swarm │ │ Task queue  │ │ Chat history    │ │ Tool/skill registry   │ │  │
│  │  │ registry    │ │ with status │ │ with messages   │ │ with versions         │ │  │
│  │  │ + metrics   │ │ + approval  │ │ + context       │ │ + execution stats     │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ └───────────────────────┘ │  │
│  │                                                                                   │  │
│  │  ┌─────────────────┐ ┌─────────────────────┐ ┌──────────────────────────────┐   │  │
│  │  │ ai_automations  │ │ ai_knowledge_bases  │ │        ai_prompts            │   │  │
│  │  │                 │ │                     │ │                              │   │  │
│  │  │ Event triggers  │ │ RAG store links     │ │ Reusable prompt templates   │   │  │
│  │  │ with actions    │ │ per venture         │ │ with variable interpolation │   │  │
│  │  │ + stats         │ │ + doc/token counts  │ │ + usage tracking            │   │  │
│  │  └─────────────────┘ └─────────────────────┘ └──────────────────────────────┘   │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          EXTERNAL DEPENDENCIES                                    │  │
│  │                                                                                   │  │
│  │  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐ │  │
│  │  │  @mcv/gateway         │  │  @mcv/rag             │  │  @paralleldrive/     │ │  │
│  │  │                       │  │                       │  │  cuid2               │ │  │
│  │  │  LLM API calls for   │  │  Knowledge retrieval  │  │                      │ │  │
│  │  │  real AI responses    │  │  for agent context    │  │  Collision-resistant │ │  │
│  │  │  (not yet wired in    │  │  (not yet wired in    │  │  unique ID           │ │  │
│  │  │  prototype)           │  │  prototype)           │  │  generation          │ │  │
│  │  └───────────────────────┘  └───────────────────────┘  └──────────────────────┘ │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// AGENT ORCHESTRATION — Task dispatch and swarm management
// ═══════════════════════════════════════════════════════════════════════════════

export {
  agentOrchestrator,             // Singleton orchestrator instance
  AgentOrchestratorService,      // Class for custom instantiation
} from './server/services/agent-orchestrator.service';

export type {
  CreateTaskParams,              // Task dispatch parameters
} from './server/services/agent-orchestrator.service';

// ═══════════════════════════════════════════════════════════════════════════════
// AI CHAT — Conversational AI with persistent history
// ═══════════════════════════════════════════════════════════════════════════════

export {
  aiChatService,                 // Singleton chat service
  AIChatService,                 // Class for custom instantiation
} from './server/services/ai-chat.service';

export type {
  SendMessageParams,             // Chat message parameters
} from './server/services/ai-chat.service';

// ═══════════════════════════════════════════════════════════════════════════════
// AI SKILLS / TOOLS — Agent capability registry
// ═══════════════════════════════════════════════════════════════════════════════

export {
  aiSkillService,                // Singleton skill service
  AISkillService,                // Class for custom instantiation
} from './server/services/ai-skill.service';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMOUS AGENTS — Event-driven automation triggers
// ═══════════════════════════════════════════════════════════════════════════════

export {
  autonomousAgentService,        // Singleton autonomous agent service
  AutonomousAgentService,        // Class for custom instantiation
} from './server/services/autonomous-agent.service';

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE — RAG-linked knowledge repositories
// ═══════════════════════════════════════════════════════════════════════════════

export {
  knowledgeBaseService,          // Singleton knowledge base service
  KnowledgeBaseService,          // Class for custom instantiation
} from './server/services/knowledge-base.service';

// ═══════════════════════════════════════════════════════════════════════════════
// WORKBENCH — AI-Assisted Architecture Planning & Deployment
// ═══════════════════════════════════════════════════════════════════════════════

export {
  workbenchService,              // Singleton workbench service
  WorkbenchService,              // Class for custom instantiation
} from './server/services/workbench.service';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — Shared interfaces and type aliases
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  ChatMessage,                   // Chat message with role and content
  WorkbenchDraft,                // Live draft from workbench sessions
  LiveDraft,                     // Backwards-compatible alias for WorkbenchDraft
  ArchitectureNode,              // Architecture diagram node for visualization
} from './types';
```

---

## TypeScript Interfaces

### Core Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ChatMessage — Message exchanged between users and AI agents
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  /** Optional unique identifier for the message */
  id?: string;

  /** Message sender role */
  role: 'user' | 'assistant' | 'system';

  /** Message content (plain text or markdown) */
  content: string;

  /** Unix timestamp in milliseconds */
  timestamp?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WorkbenchDraft — Live draft produced during AI-assisted planning
// Updated in real-time as the conversation progresses
// ═══════════════════════════════════════════════════════════════════════════════

export interface WorkbenchDraft {
  /** High-level summary of the project */
  summary: string;

  /** Project goals extracted from conversation */
  goals: string[];

  /** Technical and functional requirements */
  requirements: string[];

  /** Constraints (compliance, budget, timeline, etc.) */
  constraints: string[];

  /** Recommended technology stack */
  techStack: string[];
}

/** Backwards-compatible alias for WorkbenchDraft */
export type LiveDraft = WorkbenchDraft;

// ═══════════════════════════════════════════════════════════════════════════════
// ArchitectureNode — Node in an architecture diagram generated by the Workbench
// Used for ReactFlow or similar graph visualization libraries
// ═══════════════════════════════════════════════════════════════════════════════

export interface ArchitectureNode {
  /** Unique node identifier */
  id: string;

  /** Component type category */
  type: 'app' | 'package' | 'service' | 'database';

  /** Human-readable component name */
  name: string;

  /** Whether this is new, modified, or existing infrastructure */
  status: 'existing' | 'modified' | 'new';
}
```

### Service Parameter Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CreateTaskParams — Parameters for dispatching a task to the agent swarm
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateTaskParams {
  /** Venture scope for the task (required for multi-tenancy) */
  ventureId: string;

  /** How the task was initiated */
  type: 'command' | 'scheduled' | 'workflow_triggered' | 'autonomous';

  /** Natural language instruction for the agent */
  prompt: string;

  /** Additional structured context passed to the agent */
  context?: Record<string, unknown>;

  /** Parent task ID for sub-task chains (hierarchical execution) */
  parentTaskId?: string;

  /** Request a specific agent role (e.g., 'queen', 'ralph', 'hephaestus') */
  preferredAgent?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SendMessageParams — Parameters for sending a chat message
// ═══════════════════════════════════════════════════════════════════════════════

export interface SendMessageParams {
  /** Venture scope (required for multi-tenancy) */
  ventureId: string;

  /** User who sent the message */
  userId: string;

  /** Message content (plain text or markdown) */
  message: string;

  /** Existing conversation ID (creates new conversation if omitted) */
  conversationId?: string;

  /** Additional context for the AI (current page, selected entities, etc.) */
  context?: Record<string, unknown>;
}
```

### Database Inferred Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Drizzle-inferred types exported from @mcv/db/schema
// ═══════════════════════════════════════════════════════════════════════════════

/** Full AI Agent row (SELECT) */
export type AiAgent = typeof aiAgents.$inferSelect;

/** Insert parameters for AI Agent (INSERT) */
export type NewAiAgent = typeof aiAgents.$inferInsert;

/** Full AI Task row (SELECT) */
export type AiTask = typeof aiTasks.$inferSelect;

/** Insert parameters for AI Task (INSERT) */
export type NewAiTask = typeof aiTasks.$inferInsert;

/** Full AI Conversation row (SELECT) */
export type AiConversation = typeof aiConversations.$inferSelect;

/** Insert parameters for AI Conversation (INSERT) */
export type NewAiConversation = typeof aiConversations.$inferInsert;

/** Full AI Skill row (SELECT) */
export type AiSkill = typeof aiSkills.$inferSelect;

/** Insert parameters for AI Skill (INSERT) */
export type NewAiSkill = typeof aiSkills.$inferInsert;

/** Full AI Automation row (SELECT) */
export type AiAutomation = typeof aiAutomations.$inferSelect;

/** Insert parameters for AI Automation (INSERT) */
export type NewAiAutomation = typeof aiAutomations.$inferInsert;

/** Full AI Knowledge Base row (SELECT) */
export type AiKnowledgeBase = typeof aiKnowledgeBases.$inferSelect;

/** Insert parameters for AI Knowledge Base (INSERT) */
export type NewAiKnowledgeBase = typeof aiKnowledgeBases.$inferInsert;

/** Full AI Prompt row (SELECT) */
export type AiPrompt = typeof aiPrompts.$inferSelect;

/** Insert parameters for AI Prompt (INSERT) */
export type NewAiPrompt = typeof aiPrompts.$inferInsert;
```

---

## Agent Roles (NAOS Swarm)

The MCV agent swarm follows a hierarchical model with specialized roles. Each agent has its own model assignment, system prompt, and skill set:

| Role | Name | Purpose | Default Skills |
|------|------|---------|----------------|
| `queen` | Queen | **Primary coordinator** — handles general commands, triages incoming requests, delegates to specialists | routing, summarization, triage |
| `ralph` | Ralph | **Architect/Developer** — handles code generation, technical planning, API design, schema design | code-gen, architecture, review |
| `hephaestus` | Hephaestus | **Builder/Worker** — executes development tasks, runs automations, CI/CD pipelines | deploy, build, execute |
| `scout` | Scout | **Research/Analysis** — gathers information, performs research, market analysis | search, analyze, report |
| `talos` | Talos | **Security/Compliance** — security audits, compliance checks, vulnerability scanning | audit, scan, validate |
| `custom` | Custom | **Venture-specific** — custom agents defined per venture with specific roles | (configurable) |

### Agent Selection Flow

```
User Command ─────────────────────────────────────────────────────────►
              │
              ▼
        ┌─────────────────────┐
        │ preferredAgent set? │
        └─────────┬───────────┘
            Yes   │   No
              │   │
              ▼   ▼
   ┌──────────────────────────┐     ┌──────────────────────┐
   │ Find agent with matching │     │ Find "queen" agent   │
   │ role in venture          │     │ for this venture     │
   └──────────┬───────────────┘     └──────────┬───────────┘
              │                                 │
         Found?                            Found?
        Yes │ No                         Yes │ No
            │  │                             │  │
            ▼  ▼                             ▼  ▼
      Return  Fall back to                Return  Fall back to
      matched first available             queen   first available
      agent   agent                       agent   agent
```

The orchestrator queries all agents for the venture, then applies role matching:

1. If `preferredAgent` is specified → find agent with matching `role`, fall back to first available
2. If no preference → find agent with `role === 'queen'`, fall back to first available
3. If no agents exist for the venture → throw `"No suitable agent found for this task"`

---

## Database Schemas

The `@mcv/ai` module relies on 7 database tables defined in `@mcv/db/schema/ai-command.ts`. All tables use `text` primary keys with `cuid2` auto-generation.

### `ai_agents` — Agent Registry

Stores all AI agents (NAOS swarm members) registered per venture. Each agent has its own model assignment, system prompt, performance metrics, and skill bindings.

```typescript
export const aiAgents = pgTable("ai_agents", {
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════

  // Venture this agent belongs to (multi-tenancy)
  ventureId: text("venture_id").notNull(),

  // ═══════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════

  // Human-readable agent name (e.g., "Queen - Coordinator")
  name: text("name").notNull(),

  // Agent role in the swarm: queen, ralph, hephaestus, scout, talos, custom
  role: text("role").notNull(),

  // Current operational status: idle, working, error, disabled
  status: text("status").default("idle").notNull(),

  // ═══════════════════════════════════════════════════════════════════
  // MODEL CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════

  // LLM model identifier (e.g., "gpt-4-turbo", "claude-3-opus")
  model: text("model").notNull(),

  // System prompt that defines agent behavior and personality
  systemPrompt: text("system_prompt").notNull(),

  // ═══════════════════════════════════════════════════════════════════
  // CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════

  // Array of skill slugs this agent can use (references ai_skills.slug)
  skills: jsonb("skills").$type<string[]>(),

  // Agent-specific configuration (temperature, max tokens, etc.)
  config: jsonb("config"),

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE METRICS
  // ═══════════════════════════════════════════════════════════════════

  // Total tasks this agent has executed
  totalTasks: integer("total_tasks").default(0),

  // Success rate as a decimal (0.0 - 1.0, default: 1.0)
  successRate: doublePrecision("success_rate").default(1.0),

  // Average response time in milliseconds
  avgResponseTime: doublePrecision("avg_response_time"),

  // ═══════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════

  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `text` | NO | `cuid2()` | Primary key |
| `venture_id` | `text` | NO | — | Owning venture |
| `name` | `text` | NO | — | Display name |
| `role` | `text` | NO | — | Swarm role: queen, ralph, hephaestus, scout, talos, custom |
| `status` | `text` | NO | `'idle'` | Operational status: idle, working, error, disabled |
| `model` | `text` | NO | — | LLM model identifier |
| `system_prompt` | `text` | NO | — | Agent behavior/personality prompt |
| `skills` | `jsonb` | YES | — | Array of skill slugs |
| `config` | `jsonb` | YES | — | Agent-specific configuration |
| `total_tasks` | `integer` | YES | `0` | Total tasks executed |
| `success_rate` | `double precision` | YES | `1.0` | Success rate (0.0–1.0) |
| `avg_response_time` | `double precision` | YES | — | Average response time (ms) |
| `last_active_at` | `timestamp` | YES | — | Last heartbeat |
| `created_at` | `timestamp` | NO | `now()` | Record creation |
| `updated_at` | `timestamp` | NO | `now()` | Last modification |

---

### `ai_tasks` — Task Queue

Stores all tasks dispatched to agents, including status tracking, approval workflows, token/cost metrics, and parent-child relationships for sub-task chains.

```typescript
export const aiTasks = pgTable("ai_tasks", {
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════

  ventureId: text("venture_id").notNull(),
  agentId: text("agent_id").references(() => aiAgents.id),

  // ═══════════════════════════════════════════════════════════════════
  // TASK DEFINITION
  // ═══════════════════════════════════════════════════════════════════

  // How the task was initiated: command, scheduled, workflow_triggered, autonomous
  type: text("type").notNull(),

  // Natural language instruction for the agent
  prompt: text("prompt").notNull(),

  // Snapshot of context at execution time (entities, page, user info)
  context: jsonb("context"),

  // ═══════════════════════════════════════════════════════════════════
  // EXECUTION STATE
  // ═══════════════════════════════════════════════════════════════════

  // Task lifecycle: queued → running → completed/failed/cancelled
  // Or: queued → pending_approval → running → completed/failed
  status: text("status").default("queued").notNull(),

  // Human-in-the-loop approval: none, pending, approved, rejected
  approvalStatus: text("approval_status").default("none"),

  // Task output (JSON, may contain generated code, reports, etc.)
  result: jsonb("result"),

  // Error message if task failed
  error: text("error"),

  // ═══════════════════════════════════════════════════════════════════
  // COST TRACKING
  // ═══════════════════════════════════════════════════════════════════

  // Total tokens consumed by this task
  tokensUsed: integer("tokens_used"),

  // Total cost in USD
  cost: doublePrecision("cost"),

  // ═══════════════════════════════════════════════════════════════════
  // HIERARCHY
  // ═══════════════════════════════════════════════════════════════════

  // Parent task ID for sub-task chains
  parentTaskId: text("parent_task_id"),

  // ═══════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════

  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `text` | NO | `cuid2()` | Primary key |
| `venture_id` | `text` | NO | — | Owning venture |
| `agent_id` | `text` | YES | — | Assigned agent (FK → ai_agents) |
| `type` | `text` | NO | — | Origin: command, scheduled, workflow_triggered, autonomous |
| `prompt` | `text` | NO | — | Natural language instruction |
| `context` | `jsonb` | YES | — | Execution-time context snapshot |
| `status` | `text` | NO | `'queued'` | Lifecycle: queued, running, completed, failed, cancelled, pending_approval |
| `approval_status` | `text` | YES | `'none'` | HITL approval: none, pending, approved, rejected |
| `result` | `jsonb` | YES | — | Task output/result |
| `error` | `text` | YES | — | Error message if failed |
| `tokens_used` | `integer` | YES | — | Total tokens consumed |
| `cost` | `double precision` | YES | — | Total cost in USD |
| `parent_task_id` | `text` | YES | — | Parent task for sub-task chains |
| `started_at` | `timestamp` | YES | — | Execution start |
| `completed_at` | `timestamp` | YES | — | Execution end |
| `created_at` | `timestamp` | NO | `now()` | Record creation |
| `updated_at` | `timestamp` | NO | `now()` | Last modification |

---

### `ai_conversations` — Chat History

Stores persistent conversation threads between users and AI agents. Messages are stored as a JSONB array, and conversations include attached context (current page, selected entities, etc.).

```typescript
export const aiConversations = pgTable("ai_conversations", {
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════

  ventureId: text("venture_id").notNull(),
  userId: text("user_id"),
  agentId: text("agent_id").references(() => aiAgents.id),

  // ═══════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════

  // Auto-generated or user-set conversation title
  title: text("title"),

  // Array of ChatMessage objects (role, content, timestamp)
  messages: jsonb("messages"),

  // Attached context: current page, selected entities, filters, etc.
  context: jsonb("context"),

  // ═══════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════

  // Conversation lifecycle: active, archived
  status: text("status").default("active").notNull(),

  // ═══════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `text` | NO | `cuid2()` | Primary key |
| `venture_id` | `text` | NO | — | Owning venture |
| `user_id` | `text` | YES | — | User in conversation |
| `agent_id` | `text` | YES | — | Primary agent (FK → ai_agents, usually Queen) |
| `title` | `text` | YES | — | Conversation title |
| `messages` | `jsonb` | YES | — | Array of `{role, content, timestamp}` objects |
| `context` | `jsonb` | YES | — | Attached entities, current page, etc. |
| `status` | `text` | NO | `'active'` | Lifecycle: active, archived |
| `created_at` | `timestamp` | NO | `now()` | Creation |
| `updated_at` | `timestamp` | NO | `now()` | Last update |

---

### `ai_skills` — Tool/Skill Registry

Stores available tools and skills that agents can invoke. Includes versioning, execution metrics, and role-based access control.

```typescript
export const aiSkills = pgTable("ai_skills", {
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════

  // Human-readable skill name
  name: text("name").notNull(),

  // URL-safe unique identifier (used for upsert)
  slug: text("slug").unique().notNull(),

  // What the skill does
  description: text("description").notNull(),

  // Semantic version (e.g., "1.0.0", "2.1.3")
  version: text("version").default("1.0.0"),

  // ═══════════════════════════════════════════════════════════════════
  // DEFINITION
  // ═══════════════════════════════════════════════════════════════════

  // JSON Schema defining input/output contract (Zod-compatible)
  schema: jsonb("schema").notNull(),

  // Which agent roles can use this skill (null = all agents)
  agentTypes: jsonb("agent_types").$type<string[]>(),

  // Whether this is a system-provided skill (vs user-created)
  isBuiltin: boolean("is_builtin").default(true),

  // ═══════════════════════════════════════════════════════════════════
  // EXECUTION METRICS
  // ═══════════════════════════════════════════════════════════════════

  // How many times this skill has been invoked
  executionCount: integer("execution_count").default(0),

  // Average execution time in milliseconds
  avgLatencyMs: doublePrecision("avg_latency_ms"),

  // Success rate as percentage (0-100)
  successRate: doublePrecision("success_rate").default(100),

  // ═══════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `text` | NO | `cuid2()` | Primary key |
| `name` | `text` | NO | — | Display name |
| `slug` | `text` | NO | — | Unique identifier (used for upsert) |
| `description` | `text` | NO | — | What the skill does |
| `version` | `text` | YES | `'1.0.0'` | Semantic version |
| `schema` | `jsonb` | NO | — | Input/output JSON Schema (Zod-compatible) |
| `agent_types` | `jsonb` | YES | — | Allowed roles (null = all agents) |
| `is_builtin` | `boolean` | YES | `true` | System skill flag |
| `execution_count` | `integer` | YES | `0` | Total invocations |
| `avg_latency_ms` | `double precision` | YES | — | Average execution time |
| `success_rate` | `double precision` | YES | `100` | Success percentage (0–100) |
| `created_at` | `timestamp` | NO | `now()` | Creation |
| `updated_at` | `timestamp` | NO | `now()` | Last update |

---

### `ai_automations` — Autonomous Triggers

Stores event-driven automation rules that trigger agent tasks when matching events occur. Supports multi-action pipelines with configurable actions per trigger.

```typescript
export const aiAutomations = pgTable("ai_automations", {
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════

  ventureId: text("venture_id").notNull(),

  // ═══════════════════════════════════════════════════════════════════
  // DEFINITION
  // ═══════════════════════════════════════════════════════════════════

  // Automation display name
  name: text("name").notNull(),

  // Optional description
  description: text("description"),

  // Trigger definition: { type: 'event', event: 'deal.moved', condition: '...' }
  trigger: jsonb("trigger").notNull(),

  // Array of actions to execute: [{ type: 'dispatch', config: {...} }]
  actions: jsonb("actions").$type<Array<{
    type: string;
    config: Record<string, unknown>;
  }>>(),

  // Default agent to handle this automation (FK → ai_agents)
  agentId: text("agent_id").references(() => aiAgents.id),

  // Prompt template with {{variable}} interpolation
  promptTemplate: text("prompt_template").notNull(),

  // ═══════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════

  isActive: boolean("is_active").default(true),

  // ═══════════════════════════════════════════════════════════════════
  // EXECUTION METRICS
  // ═══════════════════════════════════════════════════════════════════

  executionCount: integer("execution_count").default(0),
  lastExecutedAt: timestamp("last_executed_at"),

  // ═══════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `text` | NO | `cuid2()` | Primary key |
| `venture_id` | `text` | NO | — | Owning venture |
| `name` | `text` | NO | — | Automation name |
| `description` | `text` | YES | — | Optional description |
| `trigger` | `jsonb` | NO | — | Trigger definition `{type, event, condition}` |
| `actions` | `jsonb` | YES | — | Array of `{type, config}` action objects |
| `agent_id` | `text` | YES | — | Default agent (FK → ai_agents) |
| `prompt_template` | `text` | NO | — | Template with `{{variable}}` interpolation |
| `is_active` | `boolean` | YES | `true` | Whether enabled |
| `execution_count` | `integer` | YES | `0` | Times triggered |
| `last_executed_at` | `timestamp` | YES | — | Last trigger time |
| `created_at` | `timestamp` | NO | `now()` | Creation |
| `updated_at` | `timestamp` | NO | `now()` | Last update |

---

### `ai_knowledge_bases` — Knowledge Repositories

Links ventures to RAG vector stores for retrieval-augmented generation. Tracks document counts and token volumes for monitoring.

```typescript
export const aiKnowledgeBases = pgTable("ai_knowledge_bases", {
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════

  ventureId: text("venture_id").notNull(),

  // ═══════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════

  name: text("name").notNull(),
  description: text("description"),

  // ═══════════════════════════════════════════════════════════════════
  // CONTENT METRICS
  // ═══════════════════════════════════════════════════════════════════

  // Number of documents indexed
  documentCount: integer("document_count").default(0),

  // Total tokens across all documents
  totalTokens: integer("total_tokens").default(0),

  // ═══════════════════════════════════════════════════════════════════
  // RAG INTEGRATION
  // ═══════════════════════════════════════════════════════════════════

  // Reference ID in the vector database (@mcv/rag)
  ragStoreId: text("rag_store_id"),

  // ═══════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════

  lastUpdatedAt: timestamp("last_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `text` | NO | `cuid2()` | Primary key |
| `venture_id` | `text` | NO | — | Owning venture |
| `name` | `text` | NO | — | KB display name |
| `description` | `text` | YES | — | KB description |
| `document_count` | `integer` | YES | `0` | Documents indexed |
| `total_tokens` | `integer` | YES | `0` | Total tokens stored |
| `rag_store_id` | `text` | YES | — | RAG vector store reference |
| `last_updated_at` | `timestamp` | YES | — | Last content update |
| `created_at` | `timestamp` | NO | `now()` | Creation |
| `updated_at` | `timestamp` | NO | `now()` | Last update |

---

### `ai_prompts` — Prompt Bank

Stores reusable prompt templates with variable interpolation. Templates can be system-provided (protected from deletion) or user-created, categorized for organization.

```typescript
export const aiPrompts = pgTable("ai_prompts", {
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════

  id: text("id").primaryKey().$defaultFn(() => createId()),

  // ═══════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════

  ventureId: text("venture_id").notNull(),

  // ═══════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════

  // Template display name
  name: text("name").notNull(),

  // Optional description
  description: text("description"),

  // ═══════════════════════════════════════════════════════════════════
  // TEMPLATE CONTENT
  // ═══════════════════════════════════════════════════════════════════

  // The prompt template with {{variable}} placeholders
  content: text("content").notNull(),

  // Detected variable names extracted from content
  variables: jsonb("variables").$type<string[]>(),

  // ═══════════════════════════════════════════════════════════════════
  // CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════════

  // System templates cannot be deleted by users
  isSystem: boolean("is_system").default(false),

  // Category for organization: general, coding, analysis, writing, etc.
  category: text("category").default("general"),

  // ═══════════════════════════════════════════════════════════════════
  // USAGE METRICS
  // ═══════════════════════════════════════════════════════════════════

  usageCount: integer("usage_count").default(0),

  // ═══════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `text` | NO | `cuid2()` | Primary key |
| `venture_id` | `text` | NO | — | Owning venture |
| `name` | `text` | NO | — | Template display name |
| `description` | `text` | YES | — | Template description |
| `content` | `text` | NO | — | Prompt template with `{{variables}}` |
| `variables` | `jsonb` | YES | — | Detected variable names |
| `is_system` | `boolean` | YES | `false` | System template (protected) |
| `category` | `text` | YES | `'general'` | Category: general, coding, analysis, writing |
| `usage_count` | `integer` | YES | `0` | Times used |
| `created_at` | `timestamp` | NO | `now()` | Creation |
| `updated_at` | `timestamp` | NO | `now()` | Last update |

---

## Service Implementation Details

### AgentOrchestratorService

The central service that routes tasks to agents. Currently implements basic role-matching selection; production will add load balancing, success-rate weighting, and queue-based execution.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `dispatchTask()` | `CreateTaskParams` | `{ task, agent }` | Create task and assign to best agent |
| `selectAgent()` | `ventureId, preferredRole?, prompt?` | `AiAgent \| undefined` | Find best agent (private) |
| `updateAgentStatus()` | `agentId, status` | `void` | Update heartbeat + status |
| `getSwarmStatus()` | `ventureId` | `AiAgent[]` | Get all agents ordered by last active |

**Key implementation detail:** `selectAgent()` loads ALL agents for the venture into memory and filters by role. The `_prompt` parameter is currently unused but reserved for future NLP-based routing.

### AIChatService

Manages conversational AI sessions with persistent message history. Auto-creates conversations with the Queen agent when no conversation ID is provided.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `sendMessage()` | `SendMessageParams` | `{ conversationId, message }` | Process message, append to history |
| `getHistory()` | `conversationId` | `AiConversation \| undefined` | Retrieve conversation with all messages |

**Key implementation detail:** In the current prototype, responses are mocked (`"Processing command: ..."`). Production will pipe through `@mcv/gateway` for real LLM responses. The service auto-detects commands in messages and may dispatch tasks via `AgentOrchestrator`.

### AISkillService

Registry for tools/skills that agents can invoke. Uses slug-based upsert for idempotent registration.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `registerSkill()` | `{name, slug, description, schema, agentTypes?}` | `AiSkill[]` | Register or update a skill |
| `getSkillsForAgent()` | `role` | `AiSkill[]` | Get skills available to a role |

**Key implementation detail:** `getSkillsForAgent()` loads ALL skills into memory and filters in JavaScript. This is acceptable for prototype but should use a JSONB containment query (`@>`) in production for ventures with 100+ skills.

### AutonomousAgentService

Event-driven automation engine. Evaluates all active automations against incoming events and dispatches tasks for matches.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `checkTriggers()` | `ventureId, event` | `Array<{task, agent}>` | Evaluate triggers and dispatch |

**Key implementation detail:** Currently supports basic `trigger.type === 'event'` and `trigger.event === event.type` matching. Production should support conditional expressions, CRON triggers, and webhook triggers. Dispatches to `hephaestus` role by default.

### KnowledgeBaseService

Creates and lists knowledge bases linked to RAG vector stores.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `createKnowledgeBase()` | `{ventureId, name, description?}` | `AiKnowledgeBase` | Create KB with RAG store |
| `listKnowledgeBases()` | `ventureId` | `AiKnowledgeBase[]` | List all KBs for a venture |

**Key implementation detail:** The RAG store ID is currently mocked (`rag_${createId()}`). Production will call `@mcv/rag` service to create real vector stores.

### WorkbenchService

Interactive "CTO Orchestrator" that guides users through project planning via conversational AI, extracts requirements into structured drafts, generates architecture blueprints, and deploys agent swarms.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `chat()` | `message, history` | `string` | CTO-style conversational guidance |
| `extractContext()` | `history` | `Partial<WorkbenchDraft>` | Extract requirements from conversation |
| `generateBlueprint()` | `draft` | `ReactFlowNode[]` | Generate architecture visualization |
| `deploySwarm()` | `ventureId, tasks` | `Array<{task, agent}>` | Dispatch planning items as tasks |

**Key implementation detail:** `chat()` uses keyword-based heuristics (not real LLM). `extractContext()` uses keyword matching to identify technologies and requirements. `deploySwarm()` dispatches all tasks to the `ralph` role. Production should use `@mcv/gateway` for LLM-powered extraction and intelligent agent assignment.

---

## Code Examples

### 1. Dispatch a Task to the Agent Swarm

```typescript
import { agentOrchestrator } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Dispatch a command to the most suitable agent
// ═══════════════════════════════════════════════════════════════════════════════

const { task, agent } = await agentOrchestrator.dispatchTask({
  ventureId: 'venture_abc123',
  type: 'command',
  prompt: 'Generate a REST API for the user management module with CRUD endpoints',
  context: {
    module: 'users',
    framework: 'hono',
    database: 'postgres',
  },
  preferredAgent: 'ralph', // Request the architect agent
});

console.log(`Task ${task.id} assigned to ${agent.role} (${agent.name})`);
console.log(`Status: ${task.status}`);     // "queued"
console.log(`Agent model: ${agent.model}`); // "gpt-4-turbo"
// Task clx1abc... assigned to ralph (Ralph - Architect)
```

### 2. Send a Chat Message (New Conversation)

```typescript
import { aiChatService } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Start a new conversation — auto-creates with Queen agent
// ═══════════════════════════════════════════════════════════════════════════════

const response = await aiChatService.sendMessage({
  ventureId: 'venture_abc123',
  userId: 'user_xyz789',
  message: 'What is the current deployment status of the payments module?',
});

console.log(response.conversationId); // New cuid2 conversation ID
console.log(response.message.content); // AI response
console.log(response.message.role);    // "assistant"
// conversationId: "clx2def..."
// message.content: "Processing command: "What is the current deployment status...""
```

### 3. Continue an Existing Conversation

```typescript
import { aiChatService } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Continue a conversation — appends to existing message history
// ═══════════════════════════════════════════════════════════════════════════════

const followUp = await aiChatService.sendMessage({
  ventureId: 'venture_abc123',
  userId: 'user_xyz789',
  message: 'Can you roll back the last deployment?',
  conversationId: 'clx2def456', // Existing conversation
});

// Both the user message and AI response are appended to conversation.messages
// The full history is preserved in the JSONB array
```

### 4. Retrieve Conversation History

```typescript
import { aiChatService } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Get full conversation with all messages
// ═══════════════════════════════════════════════════════════════════════════════

const conversation = await aiChatService.getHistory('clx2def456');

if (conversation) {
  console.log(`Title: ${conversation.title}`);
  console.log(`Status: ${conversation.status}`);
  console.log(`Agent: ${conversation.agentId}`);

  const messages = conversation.messages as Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;

  console.log(`Messages: ${messages.length}`);

  for (const msg of messages) {
    console.log(`[${msg.role}] ${msg.content}`);
  }
}
// Title: New Command Session
// Status: active
// Messages: 4
// [user] What is the current deployment status...
// [assistant] Processing command: "What is the current..."
// [user] Can you roll back the last deployment?
// [assistant] Processing command: "Can you roll back..."
```

### 5. Register a Custom Skill (Upsert)

```typescript
import { aiSkillService } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Register a new skill — or update if slug already exists
// ═══════════════════════════════════════════════════════════════════════════════

await aiSkillService.registerSkill({
  name: 'Deploy to Production',
  slug: 'deploy-production',
  description: 'Triggers a production deployment pipeline via CI/CD',
  schema: {
    input: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name' },
        version: { type: 'string', description: 'Version tag' },
        environment: { type: 'string', enum: ['staging', 'production'] },
      },
      required: ['service', 'version', 'environment'],
    },
    output: {
      type: 'object',
      properties: {
        deploymentId: { type: 'string' },
        status: { type: 'string' },
        url: { type: 'string' },
      },
    },
  },
  agentTypes: ['queen', 'hephaestus'], // Only these agents can use it
});

// Calling again with same slug updates the existing record (upsert)
await aiSkillService.registerSkill({
  name: 'Deploy to Production v2',
  slug: 'deploy-production', // Same slug → UPDATE
  description: 'Updated deployment skill with rollback support',
  schema: { /* updated schema */ },
  agentTypes: ['queen', 'hephaestus', 'ralph'], // Added ralph
});
```

### 6. List Skills for an Agent Role

```typescript
import { aiSkillService } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Get all skills available to a specific agent role
// Skills with null agentTypes are available to ALL roles
// ═══════════════════════════════════════════════════════════════════════════════

const queenSkills = await aiSkillService.getSkillsForAgent('queen');

for (const skill of queenSkills) {
  console.log(`${skill.name} v${skill.version} (${skill.slug})`);
  console.log(`  Built-in: ${skill.isBuiltin}`);
  console.log(`  Executions: ${skill.executionCount}`);
  console.log(`  Success rate: ${skill.successRate}%`);
  console.log(`  Avg latency: ${skill.avgLatencyMs}ms`);
}

// Deploy to Production v2 v1.0.0 (deploy-production)
//   Built-in: false
//   Executions: 42
//   Success rate: 97.6%
//   Avg latency: 3200ms
```

### 7. Set Up Autonomous Event Triggers

```typescript
import { autonomousAgentService } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Check triggers when a business event occurs
// All matching automations will dispatch tasks
// ═══════════════════════════════════════════════════════════════════════════════

const results = await autonomousAgentService.checkTriggers(
  'venture_abc123',
  {
    type: 'payment.failed',
    payload: {
      customerId: 'cust_123',
      amount: 99.99,
      currency: 'USD',
      failureReason: 'insufficient_funds',
    },
  }
);

console.log(`${results.length} automations triggered`);

for (const { task, agent } of results) {
  console.log(`Task ${task.id} → ${agent.role} (${agent.name})`);
  console.log(`  Type: ${task.type}`);    // "workflow_triggered"
  console.log(`  Status: ${task.status}`); // "queued"
}

// 2 automations triggered
// Task clx3ghi... → hephaestus (Hephaestus - Builder)
//   Type: workflow_triggered
//   Status: queued
```

### 8. Create a Knowledge Base

```typescript
import { knowledgeBaseService } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a knowledge base linked to a RAG vector store
// ═══════════════════════════════════════════════════════════════════════════════

const kb = await knowledgeBaseService.createKnowledgeBase({
  ventureId: 'venture_abc123',
  name: 'Product Documentation',
  description: 'All product docs, PRDs, and API specs for agent reference',
});

console.log(`KB created: ${kb.id}`);
console.log(`RAG store: ${kb.ragStoreId}`);     // "rag_clx4jkl..."
console.log(`Documents: ${kb.documentCount}`);    // 0
console.log(`Tokens: ${kb.totalTokens}`);         // 0

// List all knowledge bases for a venture
const allKBs = await knowledgeBaseService.listKnowledgeBases('venture_abc123');
console.log(`Total KBs: ${allKBs.length}`);
```

### 9. Interactive Workbench Session

```typescript
import { workbenchService } from '@mcv/ai';
import type { ChatMessage } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// CTO Orchestrator — AI-assisted project planning conversation
// ═══════════════════════════════════════════════════════════════════════════════

const history: ChatMessage[] = [];

// Start the planning conversation
const r1 = await workbenchService.chat(
  'I want to build a SaaS analytics dashboard for e-commerce',
  history
);
history.push(
  { role: 'user', content: 'I want to build a SaaS analytics dashboard for e-commerce' },
  { role: 'assistant', content: r1 }
);
console.log(`AI: ${r1}`);
// "That sounds interesting. To build the perfect blueprint,
//  I need to understand the core problem you are solving. Who is this for?"

// Continue with user details
const r2 = await workbenchService.chat(
  'The target users are small business owners who need real-time sales metrics',
  history
);
history.push(
  { role: 'user', content: 'The target users are...' },
  { role: 'assistant', content: r2 }
);
console.log(`AI: ${r2}`);
// "Got it. And what are the specific technical constraints?
//  (e.g., Compliance, specific Integrations, Latency requirements)"

// Authentication details
const r3 = await workbenchService.chat(
  'We need OAuth2 authentication and database storage for user profiles',
  history
);
history.push(
  { role: 'user', content: 'We need OAuth2 authentication and database storage...' },
  { role: 'assistant', content: r3 }
);
```

### 10. Extract Requirements from Workbench Conversation

```typescript
import { workbenchService } from '@mcv/ai';
import type { ChatMessage } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Context Extraction — Parse conversation into structured draft
// Uses keyword matching to identify technologies and requirements
// ═══════════════════════════════════════════════════════════════════════════════

// Assuming `history` from Example 9
const draft = await workbenchService.extractContext(history);

console.log(JSON.stringify(draft, null, 2));
// {
//   "summary": "Implementation of a new feature focusing on user needs...",
//   "goals": ["High Performance / Low Latency"],
//   "requirements": [
//     "User Authentication via Supabase",
//     "Data Persistence Layer"
//   ],
//   "techStack": [
//     "Auth.js",
//     "Postgres (Drizzle ORM)"
//   ],
//   "constraints": []
// }

// Keywords detected:
// "auth" / "login" → Auth.js requirement
// "scale" / "performance" → Redis caching tech stack
// "react" / "frontend" → React / HeroUI
// "database" / "store" → Postgres (Drizzle ORM)
```

### 11. Generate and Deploy Architecture Blueprint

```typescript
import { workbenchService } from '@mcv/ai';
import type { WorkbenchDraft } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Blueprint Generation — Create architecture visualization nodes
// Returns ReactFlow-compatible node objects
// ═══════════════════════════════════════════════════════════════════════════════

const draft: WorkbenchDraft = {
  summary: 'E-commerce analytics dashboard',
  goals: ['Real-time metrics', 'Mobile responsive'],
  requirements: ['User Auth', 'Data pipeline', 'Chart rendering'],
  constraints: ['Budget: $5k/mo infra', 'SOC2 compliance'],
  techStack: ['React', 'Postgres', 'Redis', 'Hono'],
};

const blueprint = await workbenchService.generateBlueprint(draft);
console.log('Architecture nodes:', JSON.stringify(blueprint, null, 2));
// [
//   { id: '1', position: { x: 250, y: 50 }, data: { label: 'Admin App' }, type: 'input' },
//   { id: '2', position: { x: 250, y: 200 }, data: { label: 'Feature Router' } },
// ]

// ═══════════════════════════════════════════════════════════════════════════════
// Swarm Deployment — Dispatch planning items as agent tasks
// Each task is dispatched to the ralph (architect) agent
// ═══════════════════════════════════════════════════════════════════════════════

const tasks = await workbenchService.deploySwarm('venture_abc123', [
  { title: 'Set up authentication module', estimate: '2 days' },
  { title: 'Build data ingestion pipeline', estimate: '3 days' },
  { title: 'Create dashboard UI components', estimate: '4 days' },
]);

for (const { task, agent } of tasks) {
  console.log(`${task.id} → ${agent.role}: ${task.prompt}`);
}
// clx5mno... → ralph: Execute development task: Set up authentication module. Estimate: 2 days.
// clx5pqr... → ralph: Execute development task: Build data ingestion pipeline. Estimate: 3 days.
// clx5stu... → ralph: Execute development task: Create dashboard UI components. Estimate: 4 days.
```

### 12. Monitor Agent Swarm Status

```typescript
import { agentOrchestrator } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Get all agents and their current status (ordered by last active)
// ═══════════════════════════════════════════════════════════════════════════════

const swarm = await agentOrchestrator.getSwarmStatus('venture_abc123');

console.log(`Swarm size: ${swarm.length} agents`);

for (const agent of swarm) {
  console.log(`${agent.role} (${agent.name})`);
  console.log(`  Status: ${agent.status}`);
  console.log(`  Model: ${agent.model}`);
  console.log(`  Total tasks: ${agent.totalTasks}`);
  console.log(`  Success rate: ${(agent.successRate * 100).toFixed(1)}%`);
  console.log(`  Avg response: ${agent.avgResponseTime}ms`);
  console.log(`  Last active: ${agent.lastActiveAt}`);
  console.log(`  Skills: ${(agent.skills || []).join(', ')}`);
}
// Swarm size: 3 agents
// ralph (Ralph - Architect)
//   Status: working
//   Model: gpt-4-turbo
//   Total tasks: 156
//   Success rate: 94.2%
//   Avg response: 4500ms
//   Last active: 2026-02-08T14:25:00Z
//   Skills: code-gen, architecture, review
```

### 13. Sub-Task Chains (Hierarchical Execution)

```typescript
import { agentOrchestrator } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Parent task — high-level feature request dispatched to Queen
// Queen then delegates sub-tasks to specialist agents
// ═══════════════════════════════════════════════════════════════════════════════

const parent = await agentOrchestrator.dispatchTask({
  ventureId: 'venture_abc123',
  type: 'command',
  prompt: 'Build the complete user profile module',
  preferredAgent: 'queen',
});

// Queen delegates sub-tasks to specialists
const subTask1 = await agentOrchestrator.dispatchTask({
  ventureId: 'venture_abc123',
  type: 'autonomous',
  prompt: 'Design the database schema for user profiles',
  parentTaskId: parent.task.id, // Links to parent
  preferredAgent: 'ralph',      // Schema design → architect
});

const subTask2 = await agentOrchestrator.dispatchTask({
  ventureId: 'venture_abc123',
  type: 'autonomous',
  prompt: 'Implement the API endpoints for user CRUD operations',
  parentTaskId: parent.task.id, // Same parent
  preferredAgent: 'hephaestus', // Implementation → builder
});

console.log(`Parent: ${parent.task.id} (${parent.agent.role})`);
console.log(`  └─ Sub-1: ${subTask1.task.id} (${subTask1.agent.role})`);
console.log(`  └─ Sub-2: ${subTask2.task.id} (${subTask2.agent.role})`);
// Parent: clx6vwx... (queen)
//   └─ Sub-1: clx6yza... (ralph)
//   └─ Sub-2: clx6bcd... (hephaestus)
```

### 14. Update Agent Heartbeat

```typescript
import { agentOrchestrator } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Update agent status and heartbeat timestamp
// Used by agent runners to report their current state
// ═══════════════════════════════════════════════════════════════════════════════

// Agent starts working on a task
await agentOrchestrator.updateAgentStatus('agent_ralph_id', 'working');

// Agent completes the task
await agentOrchestrator.updateAgentStatus('agent_ralph_id', 'idle');

// Agent encounters an error
await agentOrchestrator.updateAgentStatus('agent_ralph_id', 'error');

// Each call updates:
// - status → new status value
// - last_active_at → new Date() (current timestamp)
```

### 15. Scheduled Task Dispatch (Cron Integration)

```typescript
import { agentOrchestrator } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Dispatch a scheduled task (e.g., triggered by cron job or scheduler)
// ═══════════════════════════════════════════════════════════════════════════════

const { task } = await agentOrchestrator.dispatchTask({
  ventureId: 'venture_abc123',
  type: 'scheduled',
  prompt: 'Generate the weekly analytics report for all active ventures',
  context: {
    reportType: 'weekly',
    period: '2026-02-01/2026-02-07',
    format: 'pdf',
    recipients: ['admin@venture.com', 'cto@venture.com'],
  },
});

console.log(`Scheduled task queued: ${task.id}`);
console.log(`Status: ${task.status}`);    // "queued"
console.log(`Type: ${task.type}`);        // "scheduled"
console.log(`Agent: ${task.agentId}`);    // Assigned to queen (default)
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| `dispatchTask()` | < 50ms | < 150ms | DB insert + agent query |
| `selectAgent()` | < 20ms | < 50ms | Single-table query + in-memory filter |
| `sendMessage()` | < 100ms | < 300ms | Read + update conversation JSONB |
| `getHistory()` | < 20ms | < 50ms | Single-row lookup by ID |
| `registerSkill()` | < 30ms | < 80ms | Upsert with slug lookup |
| `getSkillsForAgent()` | < 30ms | < 100ms | Full table scan + in-memory filter |
| `checkTriggers()` | < 50ms | < 200ms | Full scan of active automations |
| `extractContext()` | < 5ms | < 15ms | In-memory keyword matching |
| `deploySwarm()` | < 200ms | < 500ms | N × dispatchTask() sequentially |

### Agent Selection Latency

- Agent selection queries the `ai_agents` table filtered by `ventureId`
- For ventures with many agents (10+), add a composite index: `(venture_id, role, status)`
- Current implementation loads all agents into memory — acceptable for typical swarm sizes (3–8 agents)
- In-memory caching of the swarm roster is recommended for hot paths (> 100 requests/sec)

### Conversation Message Growth

- Messages are stored as a JSONB array in `ai_conversations.messages`
- Each message is approximately 200-500 bytes (role + content + timestamp)
- Conversations with 1000+ messages (200KB+) will cause increasingly slow reads/writes
- Maximum recommended conversation length: ~500 messages before archival
- Consider implementing pagination or message windowing at the application layer
- PostgreSQL JSONB operations scale linearly with array size

### Autonomous Trigger Evaluation

- `checkTriggers()` loads ALL active automations for a venture and evaluates in-memory
- For ventures with 100+ automations, pre-filter at the DB level:
  - Add a GIN index on `trigger` JSONB column
  - Use `trigger->>'type' = 'event' AND trigger->>'event' = $1` in WHERE clause
- Currently dispatches sequentially — use `Promise.all()` for parallel dispatch in production

### Task Queue Throughput

- Tasks are created synchronously in the database
- Each `dispatchTask()` performs: 1 SELECT (agents) + 1 INSERT (tasks) = 2 queries
- For high-throughput scenarios (>100 tasks/sec), consider:
  - Message queue integration (Redis/BullMQ) for async execution
  - Batch insert for bulk task creation
  - Connection pooling via PgBouncer
- The current implementation is optimized for interactive use (< 10 tasks/sec)

### Workbench Context Extraction

- `extractContext()` performs keyword matching on the full conversation history
- Processing time scales linearly with conversation length
- Current keyword set: auth, login, scale, performance, react, frontend, database, store
- Replace with LLM-based extraction via `@mcv/gateway` for production accuracy

### Recommended Indexes

```sql
-- Agent lookup by venture and role
CREATE INDEX idx_ai_agents_venture_role ON ai_agents (venture_id, role, status);

-- Task lookup by venture and status
CREATE INDEX idx_ai_tasks_venture_status ON ai_tasks (venture_id, status, created_at);

-- Task sub-task chain traversal
CREATE INDEX idx_ai_tasks_parent ON ai_tasks (parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Conversation lookup by user
CREATE INDEX idx_ai_conversations_user ON ai_conversations (venture_id, user_id, status);

-- Automation trigger evaluation
CREATE INDEX idx_ai_automations_active ON ai_automations (venture_id, is_active);

-- Skill lookup by slug (already unique)
-- Already covered by: UNIQUE (slug)

-- Knowledge base listing
CREATE INDEX idx_ai_kb_venture ON ai_knowledge_bases (venture_id);

-- Prompt bank browsing
CREATE INDEX idx_ai_prompts_venture_cat ON ai_prompts (venture_id, category);
```

---

## Security Considerations

### Venture Isolation (Multi-Tenancy)

- **All queries are scoped by `ventureId`** — agents, tasks, conversations, automations, knowledge bases, and prompts are venture-isolated
- There is no cross-venture data access at the service layer
- Ensure API routes validate `ventureId` against the authenticated user's venture memberships
- The `selectAgent()` method only returns agents belonging to the specified venture
- Database-level Row Level Security (RLS) should be added as defense-in-depth

### Prompt Injection Protection

- User prompts in `sendMessage()` are stored directly in conversation history
- Task prompts in `dispatchTask()` are stored as-is in `ai_tasks.prompt`
- **Implement prompt sanitization at the API layer** before calling service methods:
  - Strip known injection patterns (e.g., "ignore previous instructions")
  - Limit prompt length (recommended: 10,000 characters max)
  - Validate against content policies
- Task context objects should be validated against a JSON Schema before dispatch
- Consider output filtering for agent responses containing sensitive data (PII, secrets)

### Skill Schema Validation

- Custom skills accept arbitrary JSON schemas — **validate schemas at registration time**
- Skills with `agentTypes: null` (or empty array) are available to ALL agents
- Use explicit role lists in production to follow principle of least privilege
- Audit all skill registration events (see Audit Events below)
- Consider a skill approval workflow for user-created skills in regulated environments

### Conversation Data Sensitivity

- Conversations may contain sensitive business data, trade secrets, or PII
- Messages are stored in **plaintext JSONB** — consider encryption at rest for regulated industries
- Implement retention policies to automatically archive/purge old conversations
- The `context` field may contain entity references — avoid storing sensitive data inline
- Log access to conversation history for compliance auditing

### Autonomous Automation Safety

- Automations execute with the privileges of their assigned agent
- A misconfigured trigger can cause infinite loops (e.g., automation that triggers itself)
- **Implement safeguards:**
  - Maximum execution rate per automation (e.g., 10 executions per minute)
  - Cooldown period after execution
  - Automation disablement after N consecutive failures
  - HITL approval requirement for high-impact automations

### Authentication & Authorization

- All service methods assume the caller has been authenticated externally
- No built-in RBAC — integrate with `@mcv/permissions` at the API route level
- Agent status updates (`updateAgentStatus()`) should be restricted to system processes only
- Task creation should validate that the user has `ai.tasks.create` permission for the venture
- Knowledge base creation should validate `ai.kb.create` permission
- Skill registration should validate `ai.skills.manage` permission

### Human-in-the-Loop (HITL) Approval

- Tasks support `approvalStatus` field: `none`, `pending`, `approved`, `rejected`
- Critical operations should require approval before execution:
  - Production deployments
  - Data modifications
  - External API calls with side effects
- Integrate with `@mcv/hitl-approvals` for approval workflows

---

## Audit Events

| Event | Category | Description | Payload |
|-------|----------|-------------|---------|
| `ai.task.dispatched` | `task` | Task created and assigned to an agent | `{taskId, agentId, type, ventureId}` |
| `ai.task.started` | `task` | Task execution began | `{taskId, agentId}` |
| `ai.task.completed` | `task` | Task execution completed successfully | `{taskId, agentId, tokensUsed, cost}` |
| `ai.task.failed` | `task` | Task execution failed | `{taskId, agentId, error}` |
| `ai.task.approval_requested` | `task` | Task requires HITL approval | `{taskId, agentId, prompt}` |
| `ai.task.approved` | `task` | Task approved by human reviewer | `{taskId, approvedBy}` |
| `ai.task.rejected` | `task` | Task rejected by human reviewer | `{taskId, rejectedBy, reason}` |
| `ai.conversation.created` | `chat` | New conversation started | `{conversationId, userId, agentId, ventureId}` |
| `ai.conversation.message` | `chat` | Message added to conversation | `{conversationId, role, messageLength}` |
| `ai.conversation.archived` | `chat` | Conversation archived | `{conversationId, messageCount}` |
| `ai.skill.registered` | `skill` | New skill registered | `{skillId, slug, agentTypes}` |
| `ai.skill.updated` | `skill` | Existing skill updated (upsert) | `{skillId, slug, changes}` |
| `ai.skill.invoked` | `skill` | Skill executed by an agent | `{skillId, agentId, latencyMs}` |
| `ai.agent.status_changed` | `agent` | Agent status updated | `{agentId, oldStatus, newStatus}` |
| `ai.agent.created` | `agent` | New agent registered to swarm | `{agentId, role, model, ventureId}` |
| `ai.automation.triggered` | `automation` | Autonomous automation fired | `{automationId, eventType, taskId}` |
| `ai.automation.created` | `automation` | New automation rule created | `{automationId, name, trigger}` |
| `ai.automation.disabled` | `automation` | Automation disabled (manual or safety) | `{automationId, reason}` |
| `ai.kb.created` | `knowledge` | Knowledge base created | `{kbId, name, ragStoreId, ventureId}` |
| `ai.kb.updated` | `knowledge` | Knowledge base updated | `{kbId, documentCount, totalTokens}` |
| `ai.prompt.created` | `prompt` | Prompt template created | `{promptId, name, category}` |
| `ai.prompt.used` | `prompt` | Prompt template used | `{promptId, usageCount}` |
| `ai.workbench.session_started` | `workbench` | Workbench planning session started | `{ventureId, userId}` |
| `ai.workbench.blueprint_generated` | `workbench` | Architecture blueprint created | `{ventureId, nodeCount}` |
| `ai.workbench.deployed` | `workbench` | Swarm deployed from workbench | `{ventureId, taskCount}` |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════

# PostgreSQL connection string (required)
DATABASE_URL=postgresql://user:pass@localhost:5432/mcv

# ═══════════════════════════════════════════════════════════════════════════════
# AGENT CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Default agent role for unrouted tasks (when no preferredAgent specified)
AI_DEFAULT_AGENT_ROLE=queen

# Maximum agents per venture
AI_MAX_AGENTS_PER_VENTURE=20

# Agent heartbeat timeout — mark as 'error' after this period of inactivity
AI_AGENT_HEARTBEAT_TIMEOUT_MS=300000       # 5 minutes

# ═══════════════════════════════════════════════════════════════════════════════
# CONVERSATION SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

# Maximum messages per conversation before archival trigger
AI_MAX_CONVERSATION_LENGTH=500

# Auto-archive conversations after this period of inactivity
AI_CONVERSATION_ARCHIVE_AFTER_DAYS=30

# Default conversation title for new sessions
AI_DEFAULT_CONVERSATION_TITLE="New Command Session"

# ═══════════════════════════════════════════════════════════════════════════════
# TASK SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

# Task execution timeout (kills task if exceeded)
AI_TASK_TIMEOUT_MS=300000                  # 5 minutes

# Maximum queued tasks per venture
AI_MAX_QUEUED_TASKS_PER_VENTURE=1000

# Enable HITL approval for autonomous tasks
AI_REQUIRE_APPROVAL_FOR_AUTONOMOUS=false

# ═══════════════════════════════════════════════════════════════════════════════
# AUTOMATION SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

# Maximum active automations per venture
AI_AUTOMATION_MAX_PER_VENTURE=100

# Maximum trigger evaluations per minute per venture
AI_AUTOMATION_MAX_TRIGGERS_PER_MINUTE=60

# Cooldown between same automation executions (ms)
AI_AUTOMATION_COOLDOWN_MS=5000

# ═══════════════════════════════════════════════════════════════════════════════
# WORKBENCH SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

# Use real LLM for workbench chat (vs keyword-based mock)
AI_WORKBENCH_LLM_ENABLED=false

# Maximum tasks per swarm deployment
AI_WORKBENCH_MAX_DEPLOY_TASKS=50

# ═══════════════════════════════════════════════════════════════════════════════
# EXTERNAL INTEGRATIONS (used when LLM features are enabled)
# ═══════════════════════════════════════════════════════════════════════════════

# OpenRouter API key — required if AI_WORKBENCH_LLM_ENABLED=true
OPENROUTER_API_KEY=sk-or-v1-xxx

# RAG service URL — for knowledge base integration
RAG_SERVICE_URL=http://localhost:3100
```

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `AI_NO_AGENT_AVAILABLE` | 503 | No suitable agent found for the venture/role | Register agents for the venture, or check agent status |
| `AI_AGENT_DISABLED` | 503 | Requested agent is in `disabled` status | Re-enable the agent via admin panel |
| `AI_AGENT_BUSY` | 503 | All agents with the requested role are `working` | Retry after backoff, or increase swarm size |
| `AI_CONVERSATION_NOT_FOUND` | 404 | Conversation ID does not exist | Verify conversation ID or create new conversation |
| `AI_CONVERSATION_ARCHIVED` | 410 | Conversation has been archived | Create a new conversation |
| `AI_CONVERSATION_TOO_LONG` | 413 | Conversation exceeded max message count | Archive and start new conversation |
| `AI_TASK_DISPATCH_FAILED` | 500 | Failed to create task record in database | Check DB connectivity and constraints |
| `AI_TASK_TIMEOUT` | 504 | Task exceeded execution timeout | Increase timeout or break into sub-tasks |
| `AI_TASK_APPROVAL_REQUIRED` | 202 | Task requires HITL approval before execution | Approve via admin panel or API |
| `AI_TASK_REJECTED` | 403 | Task was rejected by human reviewer | Review rejection reason, modify and resubmit |
| `AI_SKILL_DUPLICATE_SLUG` | 409 | Skill slug already exists (handled via upsert) | Use upsert behavior — not a true error |
| `AI_SKILL_INVALID_SCHEMA` | 400 | Invalid JSON Schema in skill registration | Validate schema against JSON Schema spec |
| `AI_SKILL_NOT_FOUND` | 404 | Skill slug does not exist | Register the skill first |
| `AI_AUTOMATION_LIMIT` | 429 | Venture exceeded max automation count | Delete unused automations or increase limit |
| `AI_AUTOMATION_RATE_LIMIT` | 429 | Automation triggered too frequently | Wait for cooldown period |
| `AI_AUTOMATION_DISABLED` | 410 | Automation was disabled (safety or manual) | Re-enable after review |
| `AI_KB_CREATE_FAILED` | 500 | Knowledge base creation failed | Check RAG service connectivity |
| `AI_KB_NOT_FOUND` | 404 | Knowledge base ID does not exist | Verify KB ID |
| `AI_PROMPT_NOT_FOUND` | 404 | Prompt template ID does not exist | Verify prompt ID |
| `AI_PROMPT_SYSTEM_PROTECTED` | 403 | Cannot delete a system prompt template | Only user-created prompts can be deleted |
| `AI_WORKBENCH_NOT_INITIALIZED` | 400 | Workbench chat called without prior context | Start a new workbench session |
| `AI_WORKBENCH_DEPLOY_LIMIT` | 429 | Too many tasks in single deployment | Reduce task count or split deployment |
| `AI_VENTURE_NOT_FOUND` | 404 | Venture ID does not exist | Verify venture ID |
| `AI_UNAUTHORIZED` | 401 | User not authenticated | Provide valid authentication |
| `AI_FORBIDDEN` | 403 | User lacks required permission | Check role/permission assignments |

---

## Dependencies

### Internal Packages

| Package | Version | Purpose | Integration Status |
|---------|---------|---------|-------------------|
| `@mcv/db` | workspace | Database access (Drizzle ORM) and schema definitions | ✅ Active |
| `@mcv/gateway` | workspace | LLM API calls for real AI responses | 🔲 Planned (currently mocked) |
| `@mcv/rag` | workspace | Knowledge retrieval for agent context | 🔲 Planned (RAG ID mocked) |
| `@mcv/permissions` | workspace | Authorization checks at the API layer | 🔲 Planned |
| `@mcv/audit` | workspace | Audit event logging | 🔲 Planned |
| `@mcv/hitl-approvals` | workspace | Human-in-the-loop approval workflows | 🔲 Planned |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.x` | Database ORM for type-safe queries |
| `@paralleldrive/cuid2` | `^2.x` | Collision-resistant ID generation |

---

## Testing Notes

### Unit Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentOrchestratorService } from '@mcv/ai';

// ═══════════════════════════════════════════════════════════════════════════════
// Agent Orchestrator Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('AgentOrchestratorService', () => {
  let orchestrator: AgentOrchestratorService;

  beforeEach(() => {
    orchestrator = new AgentOrchestratorService();
  });

  it('should dispatch task to preferred agent role', async () => {
    const { task, agent } = await orchestrator.dispatchTask({
      ventureId: 'test-venture',
      type: 'command',
      prompt: 'Generate API endpoints',
      preferredAgent: 'ralph',
    });

    expect(task.status).toBe('queued');
    expect(task.type).toBe('command');
    expect(agent.role).toBe('ralph');
  });

  it('should default to queen when no preferred agent', async () => {
    const { agent } = await orchestrator.dispatchTask({
      ventureId: 'test-venture',
      type: 'command',
      prompt: 'What is the status?',
    });

    expect(agent.role).toBe('queen');
  });

  it('should throw when no agents available', async () => {
    await expect(
      orchestrator.dispatchTask({
        ventureId: 'empty-venture',
        type: 'command',
        prompt: 'Hello',
      })
    ).rejects.toThrow('No suitable agent found for this task');
  });

  it('should create sub-task with parentTaskId', async () => {
    const parent = await orchestrator.dispatchTask({
      ventureId: 'test-venture',
      type: 'command',
      prompt: 'Build user module',
    });

    const child = await orchestrator.dispatchTask({
      ventureId: 'test-venture',
      type: 'autonomous',
      prompt: 'Design database schema',
      parentTaskId: parent.task.id,
      preferredAgent: 'ralph',
    });

    expect(child.task.parentTaskId).toBe(parent.task.id);
  });

  it('should update agent status and heartbeat', async () => {
    await orchestrator.updateAgentStatus('agent-id', 'working');
    // Verify last_active_at was updated to current time
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI Chat Service Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('AIChatService', () => {
  it('should create new conversation when no ID provided', async () => {
    const result = await aiChatService.sendMessage({
      ventureId: 'test-venture',
      userId: 'user-123',
      message: 'Hello',
    });

    expect(result.conversationId).toBeTruthy();
    expect(result.message.role).toBe('assistant');
  });

  it('should append to existing conversation', async () => {
    const first = await aiChatService.sendMessage({
      ventureId: 'test-venture',
      userId: 'user-123',
      message: 'First message',
    });

    const second = await aiChatService.sendMessage({
      ventureId: 'test-venture',
      userId: 'user-123',
      message: 'Second message',
      conversationId: first.conversationId,
    });

    expect(second.conversationId).toBe(first.conversationId);

    const history = await aiChatService.getHistory(first.conversationId!);
    const messages = history?.messages as any[];
    expect(messages.length).toBe(4); // 2 user + 2 assistant
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Workbench Service Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('WorkbenchService', () => {
  it('should return clarifying question for initial message', async () => {
    const response = await workbenchService.chat(
      'I want to build an app',
      [] // empty history
    );

    expect(response).toContain('core problem');
  });

  it('should extract auth requirement from keywords', async () => {
    const history: ChatMessage[] = [
      { role: 'user', content: 'We need OAuth2 authentication' },
      { role: 'assistant', content: 'Great, noted.' },
    ];

    const draft = await workbenchService.extractContext(history);

    expect(draft.requirements).toContain('User Authentication via Supabase');
    expect(draft.techStack).toContain('Auth.js');
  });

  it('should extract database requirement from keywords', async () => {
    const history: ChatMessage[] = [
      { role: 'user', content: 'We need database storage' },
      { role: 'assistant', content: 'Noted.' },
    ];

    const draft = await workbenchService.extractContext(history);

    expect(draft.techStack).toContain('Postgres (Drizzle ORM)');
    expect(draft.requirements).toContain('Data Persistence Layer');
  });

  it('should deploy swarm with correct task count', async () => {
    const tasks = await workbenchService.deploySwarm('test-venture', [
      { title: 'Task 1', estimate: '1 day' },
      { title: 'Task 2', estimate: '2 days' },
    ]);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].task.type).toBe('autonomous');
    expect(tasks[0].agent.role).toBe('ralph');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Autonomous Agent Service Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('AutonomousAgentService', () => {
  it('should trigger matching automations', async () => {
    // Setup: automation with trigger { type: 'event', event: 'payment.failed' }
    const results = await autonomousAgentService.checkTriggers(
      'test-venture',
      { type: 'payment.failed', payload: { amount: 99.99 } }
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].task.type).toBe('workflow_triggered');
  });

  it('should not trigger non-matching events', async () => {
    const results = await autonomousAgentService.checkTriggers(
      'test-venture',
      { type: 'order.created', payload: {} }
    );

    // Assuming no automation matches 'order.created'
    expect(results.length).toBe(0);
  });

  it('should update execution count and timestamp', async () => {
    await autonomousAgentService.checkTriggers(
      'test-venture',
      { type: 'payment.failed', payload: {} }
    );

    // Verify automation.executionCount incremented
    // Verify automation.lastExecutedAt updated
  });
});
```

### Integration Testing

```typescript
describe('AI Module E2E', () => {
  it('should complete full chat → task → sub-task flow', async () => {
    // 1. Start conversation
    const chat = await aiChatService.sendMessage({
      ventureId: 'test-venture',
      userId: 'user-123',
      message: 'Build a new payment module',
    });
    expect(chat.conversationId).toBeTruthy();

    // 2. Dispatch parent task
    const parent = await agentOrchestrator.dispatchTask({
      ventureId: 'test-venture',
      type: 'command',
      prompt: 'Build a new payment module',
      preferredAgent: 'queen',
    });
    expect(parent.task.status).toBe('queued');

    // 3. Dispatch sub-tasks
    const sub = await agentOrchestrator.dispatchTask({
      ventureId: 'test-venture',
      type: 'autonomous',
      prompt: 'Design payment schema',
      parentTaskId: parent.task.id,
      preferredAgent: 'ralph',
    });
    expect(sub.task.parentTaskId).toBe(parent.task.id);
  });

  it('should complete full workbench → deploy flow', async () => {
    const history: ChatMessage[] = [];

    // 1. Chat to gather requirements
    const r1 = await workbenchService.chat('Build analytics dashboard', history);
    history.push(
      { role: 'user', content: 'Build analytics dashboard' },
      { role: 'assistant', content: r1 }
    );

    // 2. Extract context
    const draft = await workbenchService.extractContext(history);
    expect(draft.summary).toBeTruthy();

    // 3. Deploy swarm
    const tasks = await workbenchService.deploySwarm('test-venture', [
      { title: 'Build dashboard', estimate: '3 days' },
    ]);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].task.status).toBe('queued');
  });
});
```

---

## Migration Path (Prototype → Production)

The current implementation uses mocked responses and in-memory filtering. The following changes are planned for production:

| Component | Current (Prototype) | Production Target | Priority |
|-----------|-------------------|-------------------|----------|
| LLM Responses | Mocked string responses | `@mcv/gateway` integration | 🔴 Critical |
| Agent Selection | Role matching only | Load-based + success-rate weighting | 🟡 High |
| Trigger Evaluation | Simple event type matching | Conditional expressions + CRON | 🟡 High |
| Skill Filtering | Full table scan + JS filter | JSONB containment query (`@>`) | 🟢 Medium |
| RAG Integration | Mocked RAG store IDs | Real `@mcv/rag` vector stores | 🟡 High |
| Context Extraction | Keyword matching | LLM-powered extraction | 🟢 Medium |
| Blueprint Generation | Static mock nodes | LLM-generated architecture | 🟢 Medium |
| Task Execution | Return queued task only | Queue worker + status updates | 🔴 Critical |
| HITL Approvals | Schema support only | Full approval workflow UI | 🟡 High |
| Audit Logging | Not implemented | `@mcv/audit` integration | 🟡 High |
| Permission Checks | Not implemented | `@mcv/permissions` integration | 🔴 Critical |

---

## Related Modules

| Module | Relationship | Integration Point |
|--------|-------------|-------------------|
| `@mcv/intelligence/gateway` | LLM calls flow through the gateway for all AI operations | `chat()`, `streamChat()` for real responses |
| `@mcv/intelligence/rag` | Knowledge bases link to RAG stores for document retrieval | `createStore()`, `query()` for KB content |
| `@mcv/intelligence/embed` | Chat embeds use the AI chat service for conversations | `sendMessage()`, `getHistory()` for widget UIs |
| `@mcv/hitl-approvals` | Task approval workflows for autonomous operations | `approvalStatus` field on `ai_tasks` |
| `@mcv/audit` | All AI operations emit audit events for compliance | Audit event table integration |
| `@mcv/permissions` | Authorization checks before all service operations | Permission validation at API routes |

---

## File Structure

```
packages/ai/src/
├── index.ts                                    # Re-exports: server/* + types
├── types.ts                                    # ChatMessage, WorkbenchDraft, ArchitectureNode
└── server/
    ├── index.ts                                # Re-exports all services
    └── services/
        ├── agent-orchestrator.service.ts       # AgentOrchestratorService (84 lines)
        ├── ai-chat.service.ts                  # AIChatService (91 lines)
        ├── ai-skill.service.ts                 # AISkillService (52 lines)
        ├── autonomous-agent.service.ts         # AutonomousAgentService (52 lines)
        ├── knowledge-base.service.ts           # KnowledgeBaseService (42 lines)
        └── workbench.service.ts                # WorkbenchService (100 lines)

packages/db/src/schema/
└── ai-command.ts                               # All 7 AI tables + inferred types (153 lines)
```

Total source: **~421 lines** across 8 TypeScript files + 1 schema file.

---

*@mcv/intelligence/ml — Machine Learning & AI Orchestration Module*
