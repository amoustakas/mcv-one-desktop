# @mcv/intelligence/personas — AI Personas Module

**Parent Package:** @mcv/intelligence  
**Tier:** 4 (Intelligence Layer — Extension)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q4 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `personas` module manages per-venture AI personality, brand voice, and behavioral guardrails. It defines how AI assistants speak, what topics they engage with, what tools they can use, and how they adapt their tone based on context. Each venture can create multiple personas — a friendly support agent, a formal legal assistant, a witty marketing bot — each with distinct system prompts, temperature settings, RAG sources, available tools, and safety constraints.

Personas sit between the application layer and the AI Gateway: when a user message arrives, the Personas module resolves the appropriate persona, compiles a context-aware system prompt from templates and brand voice rules, attaches RAG sources and tool configurations, then hands the fully-formed request to the Gateway for model routing and execution. On the way back, it validates the response against guardrails before delivery.

**This module ensures every AI interaction reflects the venture's brand identity consistently.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createPersona,           // Define a new AI persona
  getPersona,              // Get persona by ID or slug
  updatePersona,           // Update persona configuration
  deletePersona,           // Soft-delete persona
  listPersonas,            // List personas for a venture
  duplicatePersona,        // Clone persona with modifications
  publishPersona,          // Mark persona as production-ready
  archivePersona,          // Archive a persona (keeps data, removes from active rotation)
  restorePersona,          // Restore archived persona to draft status
  getPersonaVersion,       // Get specific version of persona config
  listPersonaVersions,     // List all versions for rollback
  rollbackPersona,         // Rollback to a previous version
} from './server/services/persona-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA CHAT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createPersonaChat,       // Create chat session with persona
  applyPersona,            // Apply persona to a raw ChatRequest
  resolveSystemPrompt,     // Resolve prompt template with variables
  validateResponse,        // Check response against persona guardrails
  getPersonaForChannel,    // Resolve persona by channel/context
} from './server/services/chat-service';

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND VOICE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineBrandVoice,        // Create venture-wide brand voice profile
  getBrandVoice,           // Get brand voice for venture
  updateBrandVoice,        // Update brand voice settings
  deleteBrandVoice,        // Delete brand voice profile
  analyzeTone,             // Analyze text for tone alignment
  rewriteForVoice,         // Rewrite text to match brand voice
  scoreToneAlignment,      // Score how well text matches brand voice (0-1)
} from './server/services/voice-service';

// ═══════════════════════════════════════════════════════════════════════════════
// GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineGuardrails,        // Set persona safety constraints
  checkGuardrails,         // Validate input/output against rules
  getGuardrails,           // Get guardrail config
  updateGuardrails,        // Update guardrail rules
  testGuardrails,          // Dry-run guardrails against sample content
  getGuardrailStats,       // Get violation statistics
} from './server/services/guardrail-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getPersonaStats,         // Usage stats for a persona
  getPersonaFeedback,      // User satisfaction data
  comparePersonas,         // A/B compare persona performance
  getPersonaTimeSeries,    // Time-series usage data for charts
  getTopPersonas,          // Top personas by usage/satisfaction
} from './server/services/analytics-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createTemplate,          // Create reusable prompt template
  getTemplate,             // Get template by ID
  listTemplates,           // List templates for venture
  updateTemplate,          // Update template content/variables
  deleteTemplate,          // Delete prompt template
  renderTemplate,          // Render template with variables
  validateTemplate,        // Validate template syntax
  importTemplate,          // Import template from JSON/YAML
  exportTemplate,          // Export template to JSON/YAML
} from './server/services/template-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { usePersonaChat } from './client/hooks/use-persona-chat';
export { usePersonaManager } from './client/hooks/use-persona-manager';
export { useBrandVoice } from './client/hooks/use-brand-voice';
export { useGuardrailTester } from './client/hooks/use-guardrail-tester';
export { usePersonaAnalytics } from './client/hooks/use-persona-analytics';
export { useTemplateEditor } from './client/hooks/use-template-editor';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { PersonaBuilder } from './client/components/persona-builder';
export { PersonaTestChat } from './client/components/persona-test-chat';
export { BrandVoiceEditor } from './client/components/brand-voice-editor';
export { GuardrailConfigurator } from './client/components/guardrail-configurator';
export { PersonaAnalyticsDashboard } from './client/components/persona-analytics-dashboard';
export { PromptTemplateEditor } from './client/components/prompt-template-editor';
export { ToneRadar } from './client/components/tone-radar';
export { PersonaCard } from './client/components/persona-card';
export { PersonaSelector } from './client/components/persona-selector';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  DEFAULT_SYSTEM_PROMPT,
  PERSONA_STATUS,
  TONE_DIMENSIONS,
  GUARDRAIL_ACTIONS,
  MAX_SYSTEM_PROMPT_TOKENS,
  SAFETY_LEVELS,
  PII_TYPES,
  TEMPLATE_CATEGORIES,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Persona,
  PersonaConfig,
  PersonaStatus,
  NewPersona,
  PersonaVersion,

  BrandVoice,
  ToneProfile,
  ToneDimension,
  ToneAnalysisResult,

  Guardrails,
  GuardrailRule,
  GuardrailAction,
  GuardrailCheckResult,
  GuardrailViolation,

  PromptTemplate,
  TemplateVariable,
  RenderedPrompt,

  PersonaStats,
  PersonaFeedback,
  PersonaComparison,

  PersonaChatSession,
  PersonaChatOptions,
  PersonaChatMessage,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                          PERSONAS MODULE — COMPLETE ARCHITECTURE                          │
│                                                                                           │
│  ╔═══════════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                              ENTRY POINTS                                            ║ │
│  ║                                                                                      ║ │
│  ║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            ║ │
│  ║  │  Widget Chat │  │ NAOS Agent   │  │  Admin UI    │  │  API Route   │            ║ │
│  ║  │  (embedded)  │  │  (Queen,     │  │  (Persona    │  │  /api/chat/  │            ║ │
│  ║  │              │  │   Ralph...)  │  │   Builder)   │  │  persona     │            ║ │
│  ║  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            ║ │
│  ║         │                 │                 │                 │                      ║ │
│  ║         └─────────────────┴────────┬────────┴─────────────────┘                      ║ │
│  ╚════════════════════════════════════╪══════════════════════════════════════════════════╝ │
│                                       │                                                    │
│  ╔════════════════════════════════════╪══════════════════════════════════════════════════╗ │
│  ║                        PERSONA RESOLUTION LAYER                                      ║ │
│  ║                                                                                      ║ │
│  ║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║ │
│  ║  │                    PERSONA DEFINITION (Config)                                │   ║ │
│  ║  │                                                                               │   ║ │
│  ║  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   ║ │
│  ║  │  │  Identity   │  │  Voice &   │  │  Tools &   │  │ Guardrails │            │   ║ │
│  ║  │  │             │  │  Tone      │  │  Knowledge │  │            │            │   ║ │
│  ║  │  │ • Name      │  │            │  │            │  │ • Blocked  │            │   ║ │
│  ║  │  │ • Avatar    │  │ • Warmth   │  │ • RAG      │  │   topics   │            │   ║ │
│  ║  │  │ • Role      │  │ • Formality│  │   sources  │  │ • Max len  │            │   ║ │
│  ║  │  │ • System    │  │ • Humor    │  │ • Tool     │  │ • PII      │            │   ║ │
│  ║  │  │   prompt    │  │ • Empathy  │  │   access   │  │   handling │            │   ║ │
│  ║  │  │ • Model     │  │ • Brevity  │  │ • External │  │ • Response │            │   ║ │
│  ║  │  │   prefs     │  │ • Technclty│  │   APIs     │  │   filters  │            │   ║ │
│  ║  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │   ║ │
│  ║  └──────────────────────────────────────────────────────────────────────────────┘   ║ │
│  ║                                                                                      ║ │
│  ║                     ┌──────────────┐  ┌──────────────┐                              ║ │
│  ║                     │Brand Voice   │  │  Prompt      │                              ║ │
│  ║                     │ Profile      │  │  Templates   │                              ║ │
│  ║                     │              │  │              │                              ║ │
│  ║                     │ Venture-wide │  │ {{variable}} │                              ║ │
│  ║                     │ tone, vocab, │  │ Handlebars   │                              ║ │
│  ║                     │ style rules  │  │ conditionals │                              ║ │
│  ║                     └──────┬───────┘  └──────┬───────┘                              ║ │
│  ║                            └────────┬────────┘                                       ║ │
│  ╚═════════════════════════════════════╪═════════════════════════════════════════════════╝ │
│                                        │                                                   │
│  ╔═════════════════════════════════════╪═════════════════════════════════════════════════╗ │
│  ║                     PERSONA RUNTIME PIPELINE                                         ║ │
│  ║                                                                                      ║ │
│  ║  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   ║ │
│  ║  │   1.       │  │   2.       │  │   3.       │  │   4.       │  │   5.       │   ║ │
│  ║  │  Resolve   │─▶│  Check     │─▶│  Assemble  │─▶│  Gateway   │─▶│  Validate  │   ║ │
│  ║  │  Persona   │  │  Input     │  │  Context   │  │  Request   │  │  Response  │   ║ │
│  ║  │            │  │  Guards    │  │            │  │            │  │            │   ║ │
│  ║  │ • By slug  │  │            │  │ • System   │  │ • Model    │  │ • Guardrail│   ║ │
│  ║  │   or ID    │  │ • Topics   │  │   prompt   │  │ • Temp     │  │   check    │   ║ │
│  ║  │ • Cache    │  │ • Patterns │  │ • RAG docs │  │ • Tools    │  │ • Tone     │   ║ │
│  ║  │   lookup   │  │ • PII scan │  │ • Memory   │  │ • Stream   │  │   analysis │   ║ │
│  ║  │ • Version  │  │ • Inject   │  │ • Brand    │  │ • Budget   │  │ • PII      │   ║ │
│  ║  │   check    │  │   block    │  │   voice    │  │   check    │  │   redact   │   ║ │
│  ║  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘   ║ │
│  ║                                                                                      ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                           │
│  ╔══════════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                          INTEGRATION LAYER                                          ║ │
│  ║                                                                                     ║ │
│  ║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              ║ │
│  ║  │  Gateway    │  │  RAG        │  │  Memory     │  │  Audit      │              ║ │
│  ║  │  Module     │  │  Module     │  │  Module     │  │  Module     │              ║ │
│  ║  │             │  │             │  │             │  │             │              ║ │
│  ║  │ chat()      │  │ query()     │  │ recall()    │  │ logEvent() │              ║ │
│  ║  │ streamChat()│  │ search()    │  │ store()     │  │ export()   │              ║ │
│  ║  │ embed()     │  │ rerank()    │  │ summarize() │  │ query()    │              ║ │
│  ║  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘              ║ │
│  ║                                                                                     ║ │
│  ╚═════════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                           │
│  ╔══════════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                           DATABASE LAYER                                            ║ │
│  ║                                                                                     ║ │
│  ║  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      ║ │
│  ║  │  ai_personas   │ │  brand_voices  │ │prompt_templates│ │ persona_stats  │      ║ │
│  ║  │                │ │                │ │                │ │                │      ║ │
│  ║  │ Persona config,│ │ Venture-wide   │ │ Reusable prompt│ │ Conversations, │      ║ │
│  ║  │ system prompt, │ │ tone profile,  │ │ templates with │ │ satisfaction,  │      ║ │
│  ║  │ model prefs,   │ │ vocabulary,    │ │ variables and  │ │ usage counts,  │      ║ │
│  ║  │ guardrails,    │ │ style guide,   │ │ conditionals,  │ │ guardrail      │      ║ │
│  ║  │ versioned      │ │ few-shot exs   │ │ categories     │ │ violations     │      ║ │
│  ║  └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘      ║ │
│  ║                                                                                     ║ │
│  ║  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────────────────────┐   ║ │
│  ║  │persona_versions│ │guardrail_logs  │ │           Redis Cache                │   ║ │
│  ║  │                │ │                │ │                                      │   ║ │
│  ║  │ Version history│ │ Every guardrail│ │ persona:{ventureId}:{slug} → config  │   ║ │
│  ║  │ for rollback,  │ │ check with     │ │ brand_voice:{ventureId} → profile    │   ║ │
│  ║  │ diff tracking  │ │ pass/fail and  │ │ template:{ventureId}:{slug} → compiled│   ║ │
│  ║  │                │ │ violation info │ │ TTL: 3600s (1 hour)                  │   ║ │
│  ║  └────────────────┘ └────────────────┘ └──────────────────────────────────────┘   ║ │
│  ║                                                                                     ║ │
│  ╚═════════════════════════════════════════════════════════════════════════════════════╝ │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Persona Lifecycle

Personas follow a strict state machine to ensure only validated configurations reach production:

```
                    ┌─────────────────────────────────────────────────┐
                    │                                                 │
                    ▼                                                 │
              ┌──────────┐    publish()    ┌─────────────┐          │
  create() ──▶│  DRAFT   │──────────────▶│  PUBLISHED  │          │
              │          │                │             │          │
              │ • Editable│◀──────────────│ • Read-only │          │
              │ • Not in  │   unpublish() │ • Cached    │          │
              │   rotation│                │ • In active │          │
              └────┬─────┘                │   rotation  │          │
                   │                      └──────┬──────┘          │
                   │                             │                 │
                   │    test()             archive()              │
                   │      │                      │                 │
                   │      ▼                      ▼                 │
                   │ ┌──────────┐         ┌──────────┐            │
                   │ │ TESTING  │         │ ARCHIVED │            │
                   │ │          │         │          │────────────┘
                   │ │ • Sandbox│         │ • Hidden │  restore()
                   │ │   only   │         │ • Data   │
                   │ │ • A/B    │         │   retained│
                   │ │   compare│         └──────────┘
                   │ └──────────┘                │
                   │                             │
                   │         delete()            │ delete()
                   │           │                 │
                   │           ▼                 ▼
                   │    ┌──────────────────────────┐
                   └───▶│       SOFT-DELETED       │
                        │                          │
                        │ • Retained 90 days       │
                        │ • Then hard-purged       │
                        └──────────────────────────┘
```

**State Transitions:**

| From | To | Method | Permission Required |
|------|----|--------|-------------------|
| *(new)* | `draft` | `createPersona()` | `persona:create` |
| `draft` | `testing` | *(internal — via test chat)* | `persona:update` |
| `draft` | `published` | `publishPersona()` | `persona:publish` |
| `testing` | `published` | `publishPersona()` | `persona:publish` |
| `published` | `draft` | *(unpublish)* | `persona:publish` |
| `published` | `archived` | `archivePersona()` | `persona:archive` |
| `archived` | `draft` | `restorePersona()` | `persona:update` |
| `draft` / `archived` | `soft-deleted` | `deletePersona()` | `persona:delete` |

> **Note:** Published personas cannot be deleted directly — they must be archived first. This prevents accidentally breaking live integrations.

---

## Runtime Pipeline — Detailed Walkthrough

When a message flows through a persona, the following steps execute in order:

### Step 1: Resolve Persona

```typescript
// Persona resolved by slug (most common) or ID
// Published personas are cached in Redis for fast lookup
const persona = await getPersona({ ventureId, slug: 'support-agent' });

// Resolution order:
// 1. Check Redis cache: persona:{ventureId}:{slug}
// 2. If miss, query DB with venture isolation
// 3. If found and status === 'published', cache for TTL
// 4. If not found, throw PERSONA_NOT_FOUND error
```

### Step 2: Check Input Guardrails

```typescript
// Before any LLM call, validate the user's input
const inputCheck = await checkGuardrails({
  personaId: persona.id,
  content: userMessage,
  type: 'input',
});

// If blocked topics or patterns match:
// - action: 'block' → return fallback response immediately (no LLM call)
// - action: 'warn'  → proceed but flag for review
// - action: 'rewrite' → sanitize input before sending to LLM
// - action: 'log'   → proceed normally, record violation
```

### Step 3: Assemble Context

```typescript
// Build the full context for the LLM request:
// 1. Render system prompt template with variables
const systemPrompt = await resolveSystemPrompt(persona.id, {
  ...persona.defaultVariables,
  ...runtimeVariables,     // user_name, user_tier, etc.
});

// 2. Fetch relevant RAG documents (if ragStoreIds configured)
const ragContext = persona.ragStoreIds.length > 0
  ? await ragQuery(persona.ragStoreIds, userMessage)
  : [];

// 3. Recall conversation memory (if enableMemory)
const memories = persona.enableMemory
  ? await recallMemory(userId, persona.memoryConfig)
  : [];

// 4. Inject brand voice instructions
const brandVoice = persona.brandVoiceId
  ? await getBrandVoice(persona.brandVoiceId)
  : await getVentureDefaultBrandVoice(persona.ventureId);
```

### Step 4: Gateway Request

```typescript
// Forward assembled request to the Gateway module
const response = await chat({
  messages: [
    { role: 'system', content: systemPrompt },
    ...ragContext.map(doc => ({ role: 'system', content: `[Knowledge]: ${doc}` })),
    ...memories.map(mem => ({ role: 'system', content: `[Memory]: ${mem}` })),
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ],
  ventureId: persona.ventureId,
  model: persona.preferredModel,
  tier: persona.preferredTier,
  temperature: persona.temperature,
  topP: persona.topP,
  maxTokens: persona.maxResponseTokens,
  frequencyPenalty: persona.frequencyPenalty,
  presencePenalty: persona.presencePenalty,
  tools: resolveTools(persona.allowedTools),
  toolChoice: persona.toolChoice,
});
```

### Step 5: Validate Response

```typescript
// Validate the LLM response against output guardrails
const outputCheck = await checkGuardrails({
  personaId: persona.id,
  content: response.content,
  type: 'output',
});

if (!outputCheck.passed) {
  for (const violation of outputCheck.violations) {
    switch (violation.action) {
      case 'block':
        return { content: persona.guardrails.fallbackResponse };
      case 'rewrite':
        return { content: outputCheck.rewrittenContent };
      case 'flag':
        await flagForReview(persona.id, response, violation);
        return { content: response.content }; // Deliver but flag
      case 'log':
        await logViolation(persona.id, violation);
        return { content: response.content }; // Deliver normally
    }
  }
}

// Optional: async tone analysis (non-blocking)
if (brandVoice) {
  queueToneAnalysis(response.content, brandVoice);
}
```

---

## Core Interfaces

### Persona

```typescript
interface Persona {
  /** Unique persona ID (UUID v4) */
  id: string;

  /** Venture scope — enforces tenant isolation */
  ventureId: string;

  /** URL-safe slug (e.g., 'support-agent', 'content-writer') */
  slug: string;

  /** Display name shown in UI and chat headers */
  name: string;

  /** Short description of the persona's purpose */
  description: string;

  /** Avatar URL (displayed in chat UI, persona cards) */
  avatarUrl?: string;

  /** Lifecycle status — controls visibility and editability */
  status: PersonaStatus;

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM PROMPT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * System prompt template with Handlebars-style {{variables}}.
   *
   * Supports:
   *  - Simple substitution: {{variable_name}}
   *  - Conditionals:        {{#if variable}}...{{/if}}
   *  - Iteration:           {{#each items}}...{{/each}}
   *  - Helpers:             {{uppercase variable}}
   *
   * Max size: 8192 tokens (configurable via PERSONA_MAX_SYSTEM_PROMPT_TOKENS)
   */
  systemPrompt: string;

  /** Static variables always injected into the prompt at render time */
  defaultVariables: Record<string, string>;

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Preferred model ID (null = use gateway auto-routing by complexity) */
  preferredModel?: string;

  /** Preferred tier for gateway routing (0-4) */
  preferredTier?: number;

  /** Sampling temperature (0-2). Lower = deterministic, higher = creative */
  temperature: number;

  /** Top-p nucleus sampling (0-1). Alternative to temperature */
  topP?: number;

  /** Maximum tokens the model should generate per response */
  maxResponseTokens: number;

  /** Frequency penalty (-2 to 2). Reduces token repetition */
  frequencyPenalty?: number;

  /** Presence penalty (-2 to 2). Encourages topic diversity */
  presencePenalty?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE & TOOLS
  // ═══════════════════════════════════════════════════════════════════════════

  /** RAG store IDs this persona can search (from @mcv/intelligence/rag) */
  ragStoreIds: string[];

  /** Whether this persona can access the venture's knowledge graph */
  knowledgeAccess: boolean;

  /** Tool IDs this persona can invoke (from @mcv/intelligence/tools registry) */
  allowedTools: string[];

  /** Tool choice strategy for the LLM */
  toolChoice: 'auto' | 'none' | 'required';

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND VOICE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Brand voice profile ID (null = use venture-wide default) */
  brandVoiceId?: string;

  /** Per-persona tone overrides — merged on top of brand voice */
  toneOverrides?: Partial<ToneProfile>;

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDRAILS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Safety and content guardrail configuration */
  guardrails: Guardrails;

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY
  // ═══════════════════════════════════════════════════════════════════════════

  /** Whether to use long-term memory for conversation context */
  enableMemory: boolean;

  /** Memory recall configuration */
  memoryConfig?: {
    /** Number of relevant memories to retrieve (default: 10) */
    topK: number;
    /** Minimum cosine similarity for memory inclusion (0-1) */
    relevanceThreshold: number;
    /** Memory categories to include (empty = all) */
    categories: string[];
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  /** Organizational tags for filtering and grouping */
  tags: string[];

  /** Version number — auto-incremented on each update; enables rollback */
  version: number;

  /** User ID of the persona creator */
  createdBy: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;

  /** When the persona was first published (null if never published) */
  publishedAt?: Date;
}

type PersonaStatus = 'draft' | 'testing' | 'published' | 'archived';
```

### PersonaVersion

```typescript
/**
 * Immutable snapshot of a persona configuration at a point in time.
 * Created automatically on every update for rollback capability.
 */
interface PersonaVersion {
  /** Version record ID */
  id: string;

  /** Parent persona ID */
  personaId: string;

  /** Version number (matches persona.version at time of snapshot) */
  version: number;

  /** Complete persona config snapshot (JSON) */
  config: Omit<Persona, 'id' | 'ventureId' | 'createdAt' | 'updatedAt' | 'version'>;

  /** What changed in this version */
  changeSummary: string;

  /** Who made the change */
  changedBy: string;

  /** When this version was created */
  createdAt: Date;
}
```

### BrandVoice

```typescript
interface BrandVoice {
  /** Unique ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Brand name (e.g., 'BetEdge', 'SerpSpace') */
  brandName: string;

  /** Multi-dimensional tone profile (each dimension: 0-10) */
  tone: ToneProfile;

  /** Vocabulary preferences for consistent brand language */
  vocabulary: {
    /** Words/phrases to prefer (e.g., ['awesome', 'let's go']) */
    preferred: string[];
    /** Words/phrases to avoid (e.g., ['unfortunately', 'regrettably']) */
    avoided: string[];
    /** Domain-specific terminology with definitions */
    jargon: Record<string, string>;
  };

  /** Writing style guidelines */
  style: {
    /** Sentence length preference */
    sentenceLength: 'short' | 'medium' | 'long';
    /** Whether to use contractions (e.g., "don't" vs "do not") */
    contractions: boolean;
    /** Whether emoji are allowed/encouraged */
    emoji: boolean;
    /** Formatting richness level */
    formatting: 'minimal' | 'structured' | 'rich';
    /** Sign-off phrase appended to messages (null = none) */
    signOff?: string;
  };

  /** Example message pairs for few-shot learning */
  examples: Array<{
    /** Sample user input */
    input: string;
    /** Ideal brand-voice response */
    idealResponse: string;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Multi-dimensional tone profile.
 * Each dimension is scored on a 0-10 scale.
 * Used for both defining target voice and analyzing response alignment.
 */
interface ToneProfile {
  /** 0 (cold/distant) to 10 (warm/friendly) */
  warmth: number;
  /** 0 (casual/colloquial) to 10 (formal/professional) */
  formality: number;
  /** 0 (serious/dry) to 10 (humorous/playful) */
  humor: number;
  /** 0 (detached/neutral) to 10 (highly empathetic) */
  empathy: number;
  /** 0 (verbose/detailed) to 10 (concise/terse) */
  brevity: number;
  /** 0 (reserved/calm) to 10 (enthusiastic/energetic) */
  enthusiasm: number;
  /** 0 (simple/accessible) to 10 (technical/specialized) */
  technicality: number;
}

/** Result of analyzing text against a brand voice profile */
interface ToneAnalysisResult {
  /** Per-dimension scores for the analyzed text */
  measured: ToneProfile;
  /** Target profile being compared against */
  target: ToneProfile;
  /** Per-dimension delta (measured - target) */
  deltas: ToneProfile;
  /** Overall alignment score (0-1 where 1 = perfect match) */
  alignmentScore: number;
  /** Dimensions that are significantly off-target (|delta| > 2) */
  outliers: Array<{
    dimension: keyof ToneProfile;
    measured: number;
    target: number;
    delta: number;
    suggestion: string;
  }>;
}
```

### Guardrails

```typescript
interface Guardrails {
  /** Topics the persona must not discuss (matched via semantic similarity) */
  blockedTopics: string[];

  /** Regex patterns that trigger a guardrail action */
  blockedPatterns: Array<{
    /** Regular expression pattern string */
    pattern: string;
    /** Regex flags (e.g., 'i' for case-insensitive, 'g' for global) */
    flags: string;
    /** Human-readable explanation shown in logs/admin UI */
    message: string;
  }>;

  /** Maximum response length in characters (truncated or blocked if exceeded) */
  maxResponseLength: number;

  /** Whether to detect and redact PII in AI responses */
  redactPII: boolean;

  /** Specific PII types to detect and redact (requires redactPII: true) */
  piiTypes?: Array<'email' | 'phone' | 'ssn' | 'credit_card' | 'address' | 'name' | 'dob'>;

  /** Context-triggered disclaimers appended to certain responses */
  disclaimers: Array<{
    /** Regex pattern that triggers this disclaimer */
    trigger: string;
    /** Disclaimer text appended to the response */
    text: string;
  }>;

  /** Content safety strictness level */
  safetyLevel: 'strict' | 'moderate' | 'permissive';

  /** Custom validation rules (extensible) */
  customRules: GuardrailRule[];

  /** Default action when any guardrail is violated */
  onViolation: GuardrailAction;

  /** Fallback response returned when a 'block' action fires */
  fallbackResponse: string;
}

interface GuardrailRule {
  /** Rule identifier (e.g., 'no-medical-advice') */
  name: string;
  /** Human-readable description */
  description: string;
  /** Whether to check input, output, or both */
  type: 'input' | 'output' | 'both';
  /** Validation — either a regex pattern or a named validator function */
  check: string;
  /** Action to take when this specific rule fires */
  action: GuardrailAction;
  /** Custom message for logging and admin display */
  message: string;
  /** Whether this rule is active (allows disabling without deleting) */
  enabled?: boolean;
}

/**
 * Actions taken when a guardrail is violated:
 *
 *  block   — Stop processing, return fallback response
 *  warn    — Proceed but add warning to admin dashboard
 *  rewrite — Use LLM to rewrite response, removing violation
 *  flag    — Deliver response but flag for human review
 *  log     — Deliver normally, just record the violation
 */
type GuardrailAction = 'block' | 'warn' | 'rewrite' | 'flag' | 'log';

interface GuardrailCheckResult {
  /** Whether all checks passed (no violations with block/rewrite action) */
  passed: boolean;
  /** List of triggered violations */
  violations: GuardrailViolation[];
  /** Modified content (present when a 'rewrite' action produced new content) */
  rewrittenContent?: string;
  /** Time taken for all guardrail checks in milliseconds */
  checkDurationMs: number;
}

interface GuardrailViolation {
  /** Rule name that was triggered */
  rule: string;
  /** Action taken */
  action: GuardrailAction;
  /** Explanation message */
  message: string;
  /** Severity classification */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** The substring or pattern that triggered the violation */
  matchedContent?: string;
}
```

### PromptTemplate

```typescript
interface PromptTemplate {
  /** Unique ID */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Template name (e.g., 'Support Response Framework') */
  name: string;

  /** URL-safe slug (e.g., 'support-response') */
  slug: string;

  /**
   * Template content with Handlebars-style placeholders.
   *
   * Supported syntax:
   *   {{variable}}                    — Simple substitution
   *   {{#if variable}}...{{/if}}      — Conditional block
   *   {{#unless var}}...{{/unless}}   — Negative conditional
   *   {{#each items}}...{{/each}}     — Iteration
   *   {{uppercase variable}}          — Built-in helper
   *   {{lowercase variable}}          — Built-in helper
   *   {{truncate variable 100}}       — Truncate to N chars
   */
  content: string;

  /** Declared variables with types, descriptions, and defaults */
  variables: TemplateVariable[];

  /** Template category for organization */
  category: 'system' | 'instruction' | 'few-shot' | 'output-format' | 'context';

  /** Tags for filtering */
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVariable {
  /** Variable name (used in {{name}}) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Value type — used for validation */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Whether this variable must be provided at render time */
  required: boolean;
  /** Default value (used when variable is not provided) */
  defaultValue?: unknown;
  /** Validation constraints */
  validation?: {
    /** Minimum string length or numeric value */
    min?: number;
    /** Maximum string length or numeric value */
    max?: number;
    /** Allowed values (enum constraint) */
    enum?: unknown[];
    /** Regex pattern the value must match */
    pattern?: string;
  };
}

/** Result of rendering a template */
interface RenderedPrompt {
  /** The rendered prompt text with all variables resolved */
  content: string;
  /** Variables that were used during rendering */
  resolvedVariables: Record<string, unknown>;
  /** Variables that used default values (not explicitly provided) */
  defaultedVariables: string[];
  /** Any warnings (e.g., unused variables, truncated values) */
  warnings: string[];
  /** Estimated token count of the rendered prompt */
  estimatedTokens: number;
}
```

### PersonaStats

```typescript
interface PersonaStats {
  /** Persona ID */
  personaId: string;

  /** Venture ID */
  ventureId: string;

  /** Aggregation period */
  period: 'daily' | 'weekly' | 'monthly';

  /** Period start date */
  periodStart: Date;

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Total unique conversation sessions */
  totalConversations: number;

  /** Total messages processed (user + assistant) */
  totalMessages: number;

  /** Total tokens consumed (prompt + completion) */
  totalTokensUsed: number;

  /** Total cost in USD */
  totalCostUsd: number;

  /** Unique users who interacted with this persona */
  uniqueUsers: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Average response time in milliseconds */
  avgResponseTimeMs: number;

  /** P95 response time */
  p95ResponseTimeMs: number;

  /** Average tokens per response */
  avgResponseTokens: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // QUALITY METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Average user satisfaction score (1-5 stars) */
  avgSatisfaction: number | null;

  /** Number of guardrail violations */
  guardrailViolations: number;

  /** Number of conversations escalated to human agents */
  escalations: number;

  /** Average tone alignment score (0-1) */
  avgToneAlignment: number | null;
}

interface PersonaComparison {
  /** Personas being compared */
  personas: Array<{ id: string; name: string; slug: string }>;

  /** Comparison period */
  period: { from: Date; to: Date };

  /** Per-metric comparison */
  metrics: Array<{
    /** Metric name */
    name: string;
    /** Value for each persona (same order as personas array) */
    values: number[];
    /** Index of the winning persona */
    winnerIndex: number;
    /** Improvement percentage of winner over runner-up */
    improvementPercent: number;
    /** Statistical significance (p-value, null if insufficient data) */
    pValue: number | null;
  }>;

  /** Overall recommendation */
  recommendation: string;
}
```

### PersonaChatSession

```typescript
interface PersonaChatSession {
  /** Session ID */
  id: string;

  /** The resolved persona */
  persona: Persona;

  /** Resolved system prompt (with variables rendered) */
  systemPrompt: string;

  /** Resolved brand voice (persona override merged with venture default) */
  brandVoice: BrandVoice | null;

  /** Conversation message history */
  messages: PersonaChatMessage[];

  /** Runtime variables for this session */
  variables: Record<string, string>;

  /**
   * Send a message and receive a response.
   * Automatically runs through the full pipeline:
   * input guardrails → context assembly → gateway → output guardrails
   */
  send: (message: string) => Promise<PersonaChatResponse>;

  /** End the session and persist final state */
  close: () => Promise<void>;
}

interface PersonaChatOptions {
  /** Persona ID or slug */
  personaId?: string;
  personaSlug?: string;

  /** Venture scope */
  ventureId: string;

  /** User ID for memory and attribution */
  userId?: string;

  /** Runtime variables merged with persona defaults */
  variables?: Record<string, string>;

  /** Override streaming behavior */
  stream?: boolean;

  /** Existing conversation ID to resume */
  conversationId?: string;
}

interface PersonaChatMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: Date;
  /** Guardrail check result (for assistant messages) */
  guardrailCheck?: GuardrailCheckResult;
  /** Tone analysis (for assistant messages, if brand voice active) */
  toneAnalysis?: ToneAnalysisResult;
  /** Token usage for this message */
  tokenUsage?: { prompt: number; completion: number; total: number };
  /** Cost for this message */
  costUsd?: number;
}

interface PersonaChatResponse {
  /** Response content (may be rewritten by guardrails) */
  content: string;
  /** Guardrail validation result */
  guardrailCheck: GuardrailCheckResult;
  /** Tone analysis (if brand voice active) */
  toneAnalysis?: ToneAnalysisResult;
  /** Token usage */
  usage: { prompt: number; completion: number; total: number };
  /** Cost in USD */
  costUsd: number;
  /** Model that processed the request */
  model: string;
  /** Response latency in ms */
  latencyMs: number;
  /** Tool calls made during response generation */
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }>;
}
```

---

## Database Schema

### ai_personas Table

```typescript
export const aiPersonas = pgTable('ai_personas', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE — Venture isolation (every query MUST filter by ventureId)
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  // URL-safe slug, unique per venture (e.g., 'support-agent', 'content-writer')
  slug: varchar('slug', { length: 64 }).notNull(),

  // Display name shown in UI and chat headers
  name: varchar('name', { length: 128 }).notNull(),

  // Short description of purpose (shown in persona cards, admin list)
  description: text('description'),

  // Avatar image URL (CDN path or external URL)
  avatarUrl: text('avatar_url'),

  // Lifecycle status: 'draft' | 'testing' | 'published' | 'archived'
  status: varchar('status', { length: 16 }).default('draft').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM PROMPT — Handlebars template with {{variable}} support
  // ═══════════════════════════════════════════════════════════════════════════

  // The core personality definition — supports {{variables}} and conditionals
  systemPrompt: text('system_prompt').notNull(),

  // Static key-value pairs always injected into the template
  defaultVariables: jsonb('default_variables').default({})
    .$type<Record<string, string>>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL PREFERENCES — Influence gateway routing
  // ═══════════════════════════════════════════════════════════════════════════

  // Explicit model ID (null = let gateway decide via complexity scoring)
  preferredModel: varchar('preferred_model', { length: 128 }),

  // Preferred tier (0-4, null = auto-route)
  preferredTier: integer('preferred_tier'),

  // Sampling temperature (0.00-2.00)
  temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.70').notNull(),

  // Top-p nucleus sampling (0.00-1.00)
  topP: decimal('top_p', { precision: 3, scale: 2 }),

  // Maximum tokens the model should generate per response
  maxResponseTokens: integer('max_response_tokens').default(2048).notNull(),

  // Repetition reduction (-2.00 to 2.00)
  frequencyPenalty: decimal('frequency_penalty', { precision: 3, scale: 2 }),

  // Topic diversity encouragement (-2.00 to 2.00)
  presencePenalty: decimal('presence_penalty', { precision: 3, scale: 2 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE & TOOLS — What this persona can access
  // ═══════════════════════════════════════════════════════════════════════════

  // RAG store IDs (references file_search_stores.store_id from @mcv/intelligence/rag)
  ragStoreIds: text('rag_store_ids').array().default([]),

  // Whether this persona can query the venture's knowledge graph
  knowledgeAccess: boolean('knowledge_access').default(false).notNull(),

  // Tool slugs from the ai_skills registry this persona can invoke
  allowedTools: text('allowed_tools').array().default([]),

  // LLM tool choice strategy: 'auto' | 'none' | 'required'
  toolChoice: varchar('tool_choice', { length: 16 }).default('auto').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND VOICE — Link to venture's tone/style profile
  // ═══════════════════════════════════════════════════════════════════════════

  // FK to brand_voices.id (null = use venture's default brand voice)
  brandVoiceId: uuid('brand_voice_id'),

  // Per-persona tone adjustments merged on top of brand voice profile
  toneOverrides: jsonb('tone_overrides').$type<Partial<ToneProfile>>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDRAILS — Safety constraints (stored as structured JSON)
  // ═══════════════════════════════════════════════════════════════════════════

  // Complete guardrail configuration (see Guardrails interface)
  guardrails: jsonb('guardrails').notNull().$type<Guardrails>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY — Conversation context recall
  // ═══════════════════════════════════════════════════════════════════════════

  // Whether to recall long-term memory during conversations
  enableMemory: boolean('enable_memory').default(true).notNull(),

  // Memory retrieval configuration (topK, threshold, categories)
  memoryConfig: jsonb('memory_config').$type<{
    topK: number;
    relevanceThreshold: number;
    categories: string[];
  }>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  // Organizational tags (e.g., ['support', 'customer-facing', 'tier-1'])
  tags: text('tags').array().default([]),

  // Auto-incremented on each update; used for version tracking and rollback
  version: integer('version').default(1).notNull(),

  // User who created this persona
  createdBy: uuid('created_by').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Set when publishPersona() is first called; never cleared
  publishedAt: timestamp('published_at', { withTimezone: true }),

  // Soft-delete timestamp (null = not deleted)
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

}, (table) => [
  // Fast lookup by venture (required for all queries)
  index('ai_personas_venture_idx').on(table.ventureId),

  // Unique slug per venture (prevents duplicate persona slugs within a venture)
  uniqueIndex('ai_personas_venture_slug_idx').on(table.ventureId, table.slug),

  // Filter by status within a venture (e.g., list all published personas)
  index('ai_personas_status_idx').on(table.ventureId, table.status),

  // Lookup by creator
  index('ai_personas_created_by_idx').on(table.createdBy),
]);
```

### persona_versions Table

```typescript
/**
 * Immutable version history for persona configurations.
 * A new row is inserted on every persona update, enabling rollback.
 */
export const personaVersions = pgTable('persona_versions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Parent persona
  personaId: uuid('persona_id').references(() => aiPersonas.id, { onDelete: 'cascade' }).notNull(),

  // Version number (matches ai_personas.version at time of snapshot)
  version: integer('version').notNull(),

  // Full persona config snapshot as JSON
  config: jsonb('config').notNull().$type<Record<string, unknown>>(),

  // Human-readable summary of what changed
  changeSummary: text('change_summary'),

  // Who made this change
  changedBy: uuid('changed_by').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('persona_versions_persona_idx').on(table.personaId),
  uniqueIndex('persona_versions_persona_version_idx').on(table.personaId, table.version),
]);
```

### brand_voices Table

```typescript
export const brandVoices = pgTable('brand_voices', {
  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  // Brand name (e.g., 'BetEdge', 'SerpSpace', 'FutureState')
  brandName: varchar('brand_name', { length: 128 }).notNull(),

  // Whether this is the venture's default brand voice
  isDefault: boolean('is_default').default(false).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TONE PROFILE (each dimension: 0-10 integer scale)
  // ═══════════════════════════════════════════════════════════════════════════

  toneWarmth: integer('tone_warmth').default(5).notNull(),         // cold ←→ warm
  toneFormality: integer('tone_formality').default(5).notNull(),   // casual ←→ formal
  toneHumor: integer('tone_humor').default(3).notNull(),           // serious ←→ humorous
  toneEmpathy: integer('tone_empathy').default(7).notNull(),       // detached ←→ empathetic
  toneBrevity: integer('tone_brevity').default(5).notNull(),       // verbose ←→ concise
  toneEnthusiasm: integer('tone_enthusiasm').default(5).notNull(), // reserved ←→ enthusiastic
  toneTechnicality: integer('tone_technicality').default(5).notNull(), // simple ←→ technical

  // ═══════════════════════════════════════════════════════════════════════════
  // VOCABULARY — Words and phrases that define the brand
  // ═══════════════════════════════════════════════════════════════════════════

  // Words/phrases to use (e.g., ['awesome', 'let's go', 'game on'])
  preferredWords: text('preferred_words').array().default([]),

  // Words/phrases to avoid (e.g., ['unfortunately', 'regrettably', 'policy states'])
  avoidedWords: text('avoided_words').array().default([]),

  // Domain terminology: { 'parlay': 'A combination bet on multiple events' }
  jargon: jsonb('jargon').default({}).$type<Record<string, string>>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLE — Structural writing preferences
  // ═══════════════════════════════════════════════════════════════════════════

  // 'short' | 'medium' | 'long'
  sentenceLength: varchar('sentence_length', { length: 16 }).default('medium').notNull(),

  // Whether to use contractions ("don't" vs "do not")
  contractions: boolean('contractions').default(true).notNull(),

  // Whether emoji are allowed/encouraged
  emoji: boolean('emoji').default(false).notNull(),

  // 'minimal' | 'structured' | 'rich'
  formatting: varchar('formatting', { length: 16 }).default('structured').notNull(),

  // Sign-off phrase (null = none). E.g., "Game on! 🎯"
  signOff: text('sign_off'),

  // ═══════════════════════════════════════════════════════════════════════════
  // FEW-SHOT EXAMPLES — Used for in-context learning
  // ═══════════════════════════════════════════════════════════════════════════

  // Array of { input, idealResponse } pairs
  examples: jsonb('examples').default([]).$type<Array<{
    input: string;
    idealResponse: string;
  }>>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('brand_voices_venture_idx').on(table.ventureId),
  // Only one default brand voice per venture
  uniqueIndex('brand_voices_venture_default_idx')
    .on(table.ventureId)
    .where(sql`is_default = true`),
]);
```

### prompt_templates Table

```typescript
export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  // Human-readable template name
  name: varchar('name', { length: 128 }).notNull(),

  // URL-safe slug, unique per venture
  slug: varchar('slug', { length: 64 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Handlebars template body with {{variable}} placeholders
  content: text('content').notNull(),

  // Variable declarations with types, descriptions, defaults, validation
  variables: jsonb('variables').default([]).$type<TemplateVariable[]>(),

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  // 'system' | 'instruction' | 'few-shot' | 'output-format' | 'context'
  category: varchar('category', { length: 32 }).default('system').notNull(),

  // Organizational tags
  tags: text('tags').array().default([]),

  // Whether this is a system-provided template (cannot be deleted by users)
  isSystem: boolean('is_system').default(false).notNull(),

  // Usage counter (incremented each time template is rendered)
  usageCount: integer('usage_count').default(0).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('prompt_templates_venture_idx').on(table.ventureId),
  uniqueIndex('prompt_templates_venture_slug_idx').on(table.ventureId, table.slug),
  index('prompt_templates_category_idx').on(table.ventureId, table.category),
]);
```

### persona_stats Table

```typescript
export const personaStats = pgTable('persona_stats', {
  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  personaId: uuid('persona_id').references(() => aiPersonas.id).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // PERIOD — Aggregation window
  // ═══════════════════════════════════════════════════════════════════════════

  // 'daily' | 'weekly' | 'monthly'
  period: varchar('period', { length: 16 }).notNull(),

  // Start of the aggregation period (e.g., 2026-02-01T00:00:00Z for monthly)
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  totalConversations: integer('total_conversations').default(0).notNull(),
  totalMessages: integer('total_messages').default(0).notNull(),
  totalTokensUsed: bigint('total_tokens_used', { mode: 'number' }).default(0).notNull(),
  totalCostUsd: decimal('total_cost_usd', { precision: 10, scale: 4 }).default('0').notNull(),
  uniqueUsers: integer('unique_users').default(0).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  avgResponseTimeMs: integer('avg_response_time_ms'),
  p95ResponseTimeMs: integer('p95_response_time_ms'),
  avgResponseTokens: integer('avg_response_tokens'),

  // ═══════════════════════════════════════════════════════════════════════════
  // QUALITY METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  // Average satisfaction score (1.00-5.00, null if no ratings)
  avgSatisfaction: decimal('avg_satisfaction', { precision: 3, scale: 2 }),

  // Count of guardrail violations in this period
  guardrailViolations: integer('guardrail_violations').default(0).notNull(),

  // Count of escalations to human agents
  escalations: integer('escalations').default(0).notNull(),

  // Average tone alignment score (0.00-1.00)
  avgToneAlignment: decimal('avg_tone_alignment', { precision: 3, scale: 2 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('persona_stats_persona_idx').on(table.personaId),
  index('persona_stats_period_idx').on(table.personaId, table.periodStart),
  index('persona_stats_venture_idx').on(table.ventureId, table.periodStart),
  // Prevent duplicate stats for the same persona/period
  uniqueIndex('persona_stats_unique_idx').on(table.personaId, table.period, table.periodStart),
]);
```

### guardrail_logs Table

```typescript
/**
 * Detailed log of every guardrail check — used for analytics,
 * debugging, and compliance auditing.
 */
export const guardrailLogs = pgTable('guardrail_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  personaId: uuid('persona_id').references(() => aiPersonas.id).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK DETAILS
  // ═══════════════════════════════════════════════════════════════════════════

  // 'input' | 'output'
  checkType: varchar('check_type', { length: 8 }).notNull(),

  // Whether the check passed (no blocking violations)
  passed: boolean('passed').notNull(),

  // Number of violations detected
  violationCount: integer('violation_count').default(0).notNull(),

  // Violation details (array of GuardrailViolation objects)
  violations: jsonb('violations').default([]).$type<GuardrailViolation[]>(),

  // The content that was checked (truncated to 500 chars for storage)
  checkedContent: text('checked_content'),

  // Action taken: 'allowed' | 'blocked' | 'rewritten' | 'flagged'
  actionTaken: varchar('action_taken', { length: 16 }).notNull(),

  // Check duration in milliseconds
  durationMs: integer('duration_ms'),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  // User ID (if available)
  userId: uuid('user_id'),

  // Conversation/session ID for correlation
  sessionId: varchar('session_id', { length: 64 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('guardrail_logs_persona_idx').on(table.personaId),
  index('guardrail_logs_venture_idx').on(table.ventureId, table.createdAt),
  index('guardrail_logs_passed_idx').on(table.personaId, table.passed),
  index('guardrail_logs_action_idx').on(table.actionTaken),
]);
```

### Database Entity Relationships

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    ventures     │     │   ai_personas   │     │persona_versions │
│                 │     │                 │     │                 │
│ id (PK)        │◀────│ venture_id (FK) │◀────│ persona_id (FK) │
│ name           │     │ id (PK)         │     │ version         │
│ ...            │     │ slug            │     │ config (JSON)   │
│                 │     │ status          │     │ changed_by      │
│                 │     │ brand_voice_id ─┼──┐  └─────────────────┘
│                 │     │ guardrails (J)  │  │
│                 │     │ version         │  │
└────────┬────────┘     └───────┬─────────┘  │
         │                      │            │
         │              ┌───────▼─────────┐  │  ┌─────────────────┐
         │              │  persona_stats  │  │  │  brand_voices   │
         │              │                 │  │  │                 │
         │              │ persona_id (FK) │  └─▶│ id (PK)         │
         │              │ venture_id (FK) │     │ venture_id (FK) │
         │              │ period          │     │ tone_*          │
         │              │ period_start    │     │ vocabulary      │
         │              │ metrics...      │     │ style           │
         │              └─────────────────┘     │ examples (J)    │
         │                                      └─────────────────┘
         │
         │              ┌─────────────────┐     ┌─────────────────┐
         │              │prompt_templates │     │ guardrail_logs  │
         │              │                 │     │                 │
         └──────────────│ venture_id (FK) │     │ persona_id (FK) │
                        │ slug            │     │ venture_id (FK) │
                        │ content         │     │ check_type      │
                        │ variables (J)   │     │ passed          │
                        │ category        │     │ violations (J)  │
                        └─────────────────┘     └─────────────────┘
```

---

## tRPC Procedures / API Routes

### Server-Side tRPC Router

```typescript
// packages/api/src/routers/persona.router.ts

export const personaRouter = createTRPCRouter({
  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONA CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  list: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      status: z.enum(['draft', 'testing', 'published', 'archived']).optional(),
      tags: z.array(z.string()).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => listPersonas(input)),

  get: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      id: z.string().uuid().optional(),
      slug: z.string().optional(),
    }).refine(data => data.id || data.slug, 'Either id or slug required'))
    .query(async ({ input }) => getPersona(input)),

  create: protectedProcedure
    .input(createPersonaSchema) // See Zod schemas below
    .mutation(async ({ input, ctx }) => createPersona({ ...input, createdBy: ctx.user.id })),

  update: protectedProcedure
    .input(updatePersonaSchema)
    .mutation(async ({ input, ctx }) => updatePersona(input.id, input.data, ctx.user.id)),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => deletePersona(input.id)),

  publish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => publishPersona(input.id)),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => archivePersona(input.id)),

  restore: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => restorePersona(input.id)),

  duplicate: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      newSlug: z.string().min(1).max(64),
      newName: z.string().min(1).max(128),
    }))
    .mutation(async ({ input, ctx }) => duplicatePersona(input.id, input.newSlug, input.newName, ctx.user.id)),

  // ═══════════════════════════════════════════════════════════════════════════
  // VERSIONING
  // ═══════════════════════════════════════════════════════════════════════════

  listVersions: protectedProcedure
    .input(z.object({ personaId: z.string().uuid() }))
    .query(async ({ input }) => listPersonaVersions(input.personaId)),

  rollback: protectedProcedure
    .input(z.object({ personaId: z.string().uuid(), version: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => rollbackPersona(input.personaId, input.version, ctx.user.id)),

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════════════════

  chat: protectedProcedure
    .input(z.object({
      personaSlug: z.string(),
      ventureId: z.string().uuid(),
      message: z.string().min(1).max(10000),
      conversationId: z.string().optional(),
      variables: z.record(z.string()).optional(),
      stream: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const chat = await createPersonaChat({
        personaSlug: input.personaSlug,
        ventureId: input.ventureId,
        userId: ctx.user.id,
        variables: input.variables,
        conversationId: input.conversationId,
      });
      return chat.send(input.message);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND VOICE
  // ═══════════════════════════════════════════════════════════════════════════

  getBrandVoice: protectedProcedure
    .input(z.object({ ventureId: z.string().uuid() }))
    .query(async ({ input }) => getBrandVoice(input.ventureId)),

  updateBrandVoice: protectedProcedure
    .input(brandVoiceSchema)
    .mutation(async ({ input }) => updateBrandVoice(input)),

  analyzeTone: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      text: z.string().min(1).max(5000),
    }))
    .mutation(async ({ input }) => analyzeTone(input.text, { ventureId: input.ventureId })),

  rewriteForVoice: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      text: z.string().min(1).max(5000),
    }))
    .mutation(async ({ input }) => rewriteForVoice(input.text, { ventureId: input.ventureId })),

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDRAILS
  // ═══════════════════════════════════════════════════════════════════════════

  testGuardrails: protectedProcedure
    .input(z.object({
      personaId: z.string().uuid(),
      content: z.string().min(1),
      type: z.enum(['input', 'output']),
    }))
    .mutation(async ({ input }) => checkGuardrails(input)),

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  stats: protectedProcedure
    .input(z.object({
      personaId: z.string().uuid(),
      period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      from: z.date(),
      to: z.date(),
    }))
    .query(async ({ input }) => getPersonaStats(input.personaId, input)),

  compare: protectedProcedure
    .input(z.object({
      personaIds: z.array(z.string().uuid()).min(2).max(5),
      period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
      metrics: z.array(z.string()),
    }))
    .query(async ({ input }) => comparePersonas(input)),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  listTemplates: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => listTemplates(input)),

  renderTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      variables: z.record(z.unknown()),
    }))
    .mutation(async ({ input }) => renderTemplate(input.templateId, input.variables)),
});
```

---

## Usage Examples

### Creating Personas

```typescript
import { createPersona, publishPersona } from '@mcv/intelligence/personas';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Support agent persona with full configuration
// ═══════════════════════════════════════════════════════════════════════════════

const supportAgent = await createPersona({
  ventureId: 'betedge-venture-uuid',
  slug: 'support-agent',
  name: 'BetEdge Support',
  description: 'Friendly, helpful support agent for BetEdge customers',
  avatarUrl: 'https://cdn.mcv.one/avatars/support-agent.png',

  systemPrompt: `You are {{agent_name}}, the official support agent for {{venture_name}}.

Your personality:
- Friendly and approachable, but professional
- Patient with beginners, efficient with experts
- Always empathetic when users have issues
- You use the user's first name when you know it

Your knowledge:
- You know everything in the {{venture_name}} help center
- For betting questions, you can look up odds and stats
- You NEVER provide financial advice

When you can't help:
- Offer to create a support ticket
- Provide the human support email: support@betedge.com
- Never make up information`,

  defaultVariables: {
    agent_name: 'Ace',
    venture_name: 'BetEdge',
  },

  temperature: 0.7,
  maxResponseTokens: 500,
  preferredTier: 1, // Standard tier — balanced quality/cost

  ragStoreIds: ['betedge-help-center', 'betedge-faq'],
  knowledgeAccess: true,
  allowedTools: ['searchKnowledge', 'createTicket', 'checkOrderStatus', 'getOdds'],

  guardrails: {
    blockedTopics: ['competitors', 'insider-information', 'financial-advice'],
    blockedPatterns: [
      {
        pattern: '\\b(guaranteed|sure thing|can\'t lose)\\b',
        flags: 'i',
        message: 'Cannot make guarantees about betting outcomes',
      },
    ],
    maxResponseLength: 2000,
    redactPII: true,
    piiTypes: ['credit_card', 'ssn'],
    disclaimers: [
      {
        trigger: 'odds|betting|wager',
        text: 'Gambling involves risk. Please bet responsibly.',
      },
    ],
    safetyLevel: 'strict',
    customRules: [],
    onViolation: 'block',
    fallbackResponse: 'I\'m not able to help with that topic. Would you like me to connect you with a human agent?',
  },

  enableMemory: true,
  memoryConfig: {
    topK: 10,
    relevanceThreshold: 0.6,
    categories: ['preferences', 'issues'],
  },

  tags: ['support', 'customer-facing'],
  createdBy: 'admin-user-uuid',
});

// Publish when ready for production
await publishPersona(supportAgent.id);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Creative content writer persona
// ═══════════════════════════════════════════════════════════════════════════════

const contentWriter = await createPersona({
  ventureId: 'serpspace-venture-uuid',
  slug: 'content-writer',
  name: 'Sage',
  description: 'SEO-optimized content writer for SerpSpace',

  systemPrompt: `You are Sage, the content writing expert at {{venture_name}}.

You write:
- Blog posts optimized for SEO
- Social media captions
- Email newsletters
- Product descriptions

Style rules:
- Use active voice
- Keep paragraphs short (2-3 sentences)
- Include relevant keywords naturally
- Write at a {{reading_level}} reading level
- {{#if include_cta}}Always include a call-to-action{{/if}}`,

  defaultVariables: {
    venture_name: 'SerpSpace',
    reading_level: '8th grade',
    include_cta: 'true',
  },

  temperature: 0.9,  // Higher for creative writing
  maxResponseTokens: 4096,
  preferredModel: 'anthropic/claude-3.5-sonnet',

  ragStoreIds: ['serpspace-style-guide', 'serpspace-keyword-research'],
  allowedTools: ['keywordResearch', 'competitorAnalysis'],

  guardrails: {
    blockedTopics: ['politics', 'religion', 'adult-content'],
    blockedPatterns: [],
    maxResponseLength: 10000,
    redactPII: false,
    disclaimers: [],
    safetyLevel: 'moderate',
    customRules: [],
    onViolation: 'warn',
    fallbackResponse: 'I can\'t create content on that topic. Let me suggest an alternative.',
  },

  enableMemory: false,
  tags: ['content', 'marketing', 'seo'],
  createdBy: 'admin-user-uuid',
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Strict legal assistant persona
// ═══════════════════════════════════════════════════════════════════════════════

const legalAssistant = await createPersona({
  ventureId: 'futurestate-venture-uuid',
  slug: 'legal-assistant',
  name: 'Lexis',
  description: 'Formal legal research assistant with strict guardrails',

  systemPrompt: `You are Lexis, a legal research assistant for {{venture_name}}.

You are NOT a lawyer. You provide legal research summaries, not legal advice.

Guidelines:
- Always include jurisdictional context
- Cite specific statutes, case law, or regulations when possible
- Use precise legal terminology
- Always include the disclaimer that this is not legal advice
- When uncertain, say so explicitly
- Never speculate about case outcomes`,

  defaultVariables: {
    venture_name: 'FutureState Capital',
  },

  temperature: 0.3,  // Low temperature for precision
  maxResponseTokens: 2048,
  preferredTier: 2,  // Premium tier for complex reasoning

  ragStoreIds: ['legal-library', 'regulatory-docs'],
  knowledgeAccess: true,
  allowedTools: ['legalSearch', 'caseAnalysis', 'statuteLookup'],

  guardrails: {
    blockedTopics: ['personal-legal-advice', 'case-outcome-predictions'],
    blockedPatterns: [
      {
        pattern: '\\b(you should|I recommend|my advice)\\b',
        flags: 'i',
        message: 'Must not provide personal legal advice',
      },
    ],
    maxResponseLength: 5000,
    redactPII: true,
    piiTypes: ['ssn', 'address', 'dob'],
    disclaimers: [
      {
        trigger: '.*',
        text: '⚖️ This is legal research information only, not legal advice. Consult a licensed attorney for guidance specific to your situation.',
      },
    ],
    safetyLevel: 'strict',
    customRules: [
      {
        name: 'no-jurisdiction-assumption',
        description: 'Must specify jurisdiction context',
        type: 'output',
        check: '(?:in most|generally|typically).*(?:states|countries|jurisdictions)',
        action: 'warn',
        message: 'Response should specify exact jurisdictions rather than generalizing',
      },
    ],
    onViolation: 'block',
    fallbackResponse: 'I cannot provide guidance on that topic. Please consult a licensed attorney.',
  },

  enableMemory: true,
  memoryConfig: { topK: 15, relevanceThreshold: 0.7, categories: ['research', 'cases'] },
  tags: ['legal', 'research', 'compliance'],
  createdBy: 'admin-user-uuid',
});
```

### Using Personas in Chat

```typescript
import { createPersonaChat, applyPersona } from '@mcv/intelligence/personas';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Create a chat session with a persona
// ═══════════════════════════════════════════════════════════════════════════════

const chat = await createPersonaChat({
  personaSlug: 'support-agent',
  ventureId: 'betedge-venture-uuid',
  userId: 'user-123',
  variables: {
    user_name: 'Sarah',
    user_tier: 'gold',
  },
});

// Send message — full pipeline: guardrails → context → gateway → validate
const response = await chat.send('I placed a bet yesterday but it hasn\'t settled yet');

console.log(`${chat.persona.name}: ${response.content}`);
console.log(`Guardrails: ${response.guardrailCheck.passed ? '✅ PASS' : '❌ BLOCKED'}`);
console.log(`Tone analysis: warmth=${response.toneAnalysis?.measured.warmth}`);
console.log(`Cost: $${response.costUsd.toFixed(4)}`);
console.log(`Latency: ${response.latencyMs}ms`);

// Continue conversation (memory is maintained across messages)
const followUp = await chat.send('Can you check order BET-98765?');

// End session and persist memory
await chat.close();

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Apply persona to existing gateway request (lower-level API)
// ═══════════════════════════════════════════════════════════════════════════════

import { chat as gatewayChat } from '@mcv/intelligence/gateway';

const request = await applyPersona({
  personaSlug: 'support-agent',
  ventureId: 'betedge-venture-uuid',
  messages: [
    { role: 'user', content: 'How do I withdraw my winnings?' },
  ],
  variables: {
    user_name: 'Mike',
  },
});

// request now has system prompt, temperature, tools, etc. from persona
// Use directly with gateway for full control
const response = await gatewayChat(request);
```

### Brand Voice

```typescript
import {
  defineBrandVoice,
  analyzeTone,
  rewriteForVoice,
  scoreToneAlignment,
} from '@mcv/intelligence/personas';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Define venture brand voice
// ═══════════════════════════════════════════════════════════════════════════════

const voice = await defineBrandVoice({
  ventureId: 'betedge-venture-uuid',
  brandName: 'BetEdge',
  tone: {
    warmth: 7,
    formality: 4,
    humor: 6,
    empathy: 8,
    brevity: 6,
    enthusiasm: 7,
    technicality: 3,
  },
  vocabulary: {
    preferred: ['awesome', 'let\'s go', 'game on', 'you\'re in the zone'],
    avoided: ['unfortunately', 'regrettably', 'we cannot', 'policy states'],
    jargon: {
      'parlay': 'A combination bet on multiple events',
      'spread': 'The point difference set by oddsmakers',
      'juice': 'The commission/fee charged by the sportsbook',
    },
  },
  style: {
    sentenceLength: 'short',
    contractions: true,
    emoji: true,
    formatting: 'minimal',
    signOff: 'Game on! 🎯',
  },
  examples: [
    {
      input: 'What are the odds for the Lakers game?',
      idealResponse: 'The Lakers are looking at +3.5 tonight against the Celtics! 🏀 Tipoff is at 8pm ET. Want me to check any specific markets?',
    },
    {
      input: 'My withdrawal is stuck',
      idealResponse: 'Oh no, let me look into that right away! 💨 Can you share your withdrawal ID? I\'ll get this sorted ASAP.',
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Analyze and rewrite content for brand voice
// ═══════════════════════════════════════════════════════════════════════════════

const offBrandText = 'Unfortunately, we regret to inform you that your withdrawal request cannot be processed at this time due to pending verification.';

// Analyze tone alignment
const analysis = await analyzeTone(offBrandText, {
  ventureId: 'betedge-venture-uuid',
});

console.log('Tone analysis:');
console.log(`  Warmth:    ${analysis.measured.warmth}/10 (target: 7) — ${analysis.measured.warmth >= 6 ? '✅' : '❌'}`);
console.log(`  Formality: ${analysis.measured.formality}/10 (target: 4) — ${analysis.measured.formality <= 5 ? '✅' : '❌'}`);
console.log(`  Alignment: ${(analysis.alignmentScore * 100).toFixed(0)}%`);

if (analysis.outliers.length > 0) {
  console.log('  Outliers:');
  for (const outlier of analysis.outliers) {
    console.log(`    ${outlier.dimension}: ${outlier.measured} vs ${outlier.target} — ${outlier.suggestion}`);
  }
}

// Rewrite to match brand voice
const rewritten = await rewriteForVoice(offBrandText, {
  ventureId: 'betedge-venture-uuid',
});

console.log(`\nRewritten: ${rewritten.content}`);
// "Hey! Your withdrawal needs a quick verification step before we can send it through.
//  It usually takes less than 24 hours. I'll keep an eye on it for you! 👀"
```

### Guardrail Validation

```typescript
import { checkGuardrails, validateResponse, testGuardrails } from '@mcv/intelligence/personas';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Check input/output against guardrails
// ═══════════════════════════════════════════════════════════════════════════════

// Check user input before sending to LLM
const inputCheck = await checkGuardrails({
  personaId: supportAgent.id,
  content: 'What do you think about DraftKings vs BetEdge?',
  type: 'input',
});

if (!inputCheck.passed) {
  console.log('Input blocked:');
  for (const violation of inputCheck.violations) {
    console.log(`  [${violation.severity}] ${violation.rule}: ${violation.message}`);
  }
  // "[medium] blockedTopics: Competitor discussion is not allowed"
  console.log(`Check took: ${inputCheck.checkDurationMs}ms`);
}

// Validate AI response before delivering to user
const outputCheck = await validateResponse({
  personaId: supportAgent.id,
  content: 'This bet is a guaranteed winner!',
});

if (!outputCheck.passed) {
  console.log(`Response blocked. Using fallback.`);
  // Automatically uses persona's fallbackResponse
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: PII redaction in responses
// ═══════════════════════════════════════════════════════════════════════════════

const piiCheck = await checkGuardrails({
  personaId: supportAgent.id,
  content: 'Your card ending in 4242 has been charged. SSN 123-45-6789 confirmed.',
  type: 'output',
});

console.log(`PII detected: ${piiCheck.violations.length} items`);
console.log(`Rewritten: ${piiCheck.rewrittenContent}`);
// "Your card ending in **** has been charged. SSN ***-**-**** confirmed."

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Dry-run guardrails for testing (admin tool)
// ═══════════════════════════════════════════════════════════════════════════════

const testResults = await testGuardrails({
  personaId: supportAgent.id,
  samples: [
    { content: 'What are your competitors doing?', type: 'input' },
    { content: 'I guarantee you will win!', type: 'output' },
    { content: 'The Lakers are +3.5 tonight.', type: 'output' },
    { content: 'Here is SSN: 123-45-6789', type: 'output' },
  ],
});

for (const result of testResults) {
  console.log(`"${result.content.substring(0, 40)}..." → ${result.passed ? '✅ PASS' : '❌ BLOCKED'}`);
  if (!result.passed) {
    console.log(`  Violations: ${result.violations.map(v => v.rule).join(', ')}`);
  }
}
```

### Persona Analytics & A/B Testing

```typescript
import { getPersonaStats, comparePersonas, getPersonaTimeSeries } from '@mcv/intelligence/personas';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Get persona performance stats
// ═══════════════════════════════════════════════════════════════════════════════

const stats = await getPersonaStats(supportAgent.id, {
  period: 'monthly',
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
});

console.log(`${supportAgent.name} — January 2026:`);
console.log(`  Conversations:       ${stats.totalConversations}`);
console.log(`  Messages:            ${stats.totalMessages}`);
console.log(`  Unique users:        ${stats.uniqueUsers}`);
console.log(`  Avg response time:   ${stats.avgResponseTimeMs}ms`);
console.log(`  P95 response time:   ${stats.p95ResponseTimeMs}ms`);
console.log(`  Total cost:          $${stats.totalCostUsd}`);
console.log(`  Satisfaction:        ${stats.avgSatisfaction}/5`);
console.log(`  Guardrail violations:${stats.guardrailViolations}`);
console.log(`  Escalations:         ${stats.escalations}`);
console.log(`  Tone alignment:      ${stats.avgToneAlignment ? (stats.avgToneAlignment * 100).toFixed(0) + '%' : 'N/A'}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: A/B compare persona versions
// ═══════════════════════════════════════════════════════════════════════════════

const comparison = await comparePersonas({
  personaIds: [supportAgentV1.id, supportAgentV2.id],
  period: 'weekly',
  metrics: ['satisfaction', 'responseTime', 'escalations', 'cost', 'toneAlignment'],
});

console.log('A/B Comparison:');
for (const metric of comparison.metrics) {
  const winner = comparison.personas[metric.winnerIndex];
  console.log(`  ${metric.name}:`);
  console.log(`    ${comparison.personas[0].name}: ${metric.values[0]}`);
  console.log(`    ${comparison.personas[1].name}: ${metric.values[1]}`);
  console.log(`    Winner: ${winner.name} (${metric.improvementPercent.toFixed(1)}% better)`);
  if (metric.pValue !== null) {
    console.log(`    Statistical significance: p=${metric.pValue.toFixed(4)} ${metric.pValue < 0.05 ? '✅' : '⚠️ not significant'}`);
  }
}
console.log(`\nRecommendation: ${comparison.recommendation}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Time-series data for dashboard charts
// ═══════════════════════════════════════════════════════════════════════════════

const timeSeries = await getPersonaTimeSeries({
  personaId: supportAgent.id,
  metric: 'totalMessages',
  period: 'daily',
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
});

// Returns array of { date, value } for charting
for (const point of timeSeries) {
  console.log(`  ${point.date.toISOString().slice(0, 10)}: ${point.value} messages`);
}
```

### Prompt Templates

```typescript
import { createTemplate, renderTemplate, validateTemplate } from '@mcv/intelligence/personas';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Create and use prompt templates
// ═══════════════════════════════════════════════════════════════════════════════

const template = await createTemplate({
  ventureId: 'betedge-venture-uuid',
  name: 'Support Response Framework',
  slug: 'support-response',
  category: 'instruction',
  content: `Respond to the user's {{issue_type}} issue.

Context:
- User: {{user_name}} ({{user_tier}} tier)
- Account age: {{account_age_days}} days
- Previous tickets: {{ticket_count}}

Response format:
1. Acknowledge the issue empathetically
2. Provide the solution or next steps
3. {{#if offer_compensation}}Offer {{compensation_type}} as goodwill{{/if}}
4. Ask if there's anything else`,

  variables: [
    { name: 'issue_type', description: 'Type of support issue', type: 'string', required: true },
    { name: 'user_name', description: 'User first name', type: 'string', required: true },
    { name: 'user_tier', description: 'User tier level', type: 'string', required: true, defaultValue: 'standard' },
    { name: 'account_age_days', description: 'Days since account creation', type: 'number', required: false },
    { name: 'ticket_count', description: 'Previous support tickets', type: 'number', required: false, defaultValue: 0 },
    { name: 'offer_compensation', description: 'Whether to offer compensation', type: 'boolean', required: false, defaultValue: false },
    { name: 'compensation_type', description: 'Type of compensation', type: 'string', required: false },
  ],
  tags: ['support', 'framework'],
});

// Validate template syntax before saving
const validation = await validateTemplate(template.content, template.variables);
console.log(`Template valid: ${validation.valid}`);
if (!validation.valid) {
  console.log(`Errors: ${validation.errors.join(', ')}`);
}

// Render with variables
const rendered = await renderTemplate(template.id, {
  issue_type: 'withdrawal delay',
  user_name: 'Sarah',
  user_tier: 'platinum',
  account_age_days: 450,
  ticket_count: 2,
  offer_compensation: true,
  compensation_type: 'a $10 free bet',
});

console.log(`Rendered (${rendered.estimatedTokens} tokens):`);
console.log(rendered.content);
console.log(`Defaulted vars: ${rendered.defaultedVariables.join(', ')}`);
console.log(`Warnings: ${rendered.warnings.join(', ') || 'none'}`);
```

### Client-Side Usage (React)

```tsx
import { usePersonaChat, usePersonaManager } from '@mcv/intelligence/personas/client';
import { PersonaBuilder, PersonaTestChat, ToneRadar } from '@mcv/intelligence/personas/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Persona chat component (embedded widget)
// ═══════════════════════════════════════════════════════════════════════════════

function SupportChat({ ventureId, userId }: Props) {
  const {
    messages,
    sendMessage,
    isTyping,
    persona,
    toneAnalysis,
    error,
  } = usePersonaChat({
    personaSlug: 'support-agent',
    ventureId,
    userId,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b">
        <img src={persona?.avatarUrl} className="w-8 h-8 rounded-full" />
        <span className="font-medium">{persona?.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {isTyping && <TypingIndicator name={persona?.name} />}
      </div>

      <ChatInput onSend={sendMessage} disabled={isTyping} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 16: Persona builder admin with live test chat
// ═══════════════════════════════════════════════════════════════════════════════

function PersonaAdmin({ ventureId }: { ventureId: string }) {
  const {
    personas,
    selectedPersona,
    selectPersona,
    createPersona,
    updatePersona,
    publishPersona,
    isLoading,
  } = usePersonaManager({ ventureId });

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <PersonaList
          personas={personas}
          selected={selectedPersona?.id}
          onSelect={selectPersona}
          onCreate={createPersona}
        />
      </aside>

      <main className="flex-1 flex">
        {selectedPersona && (
          <>
            <div className="flex-1">
              <PersonaBuilder
                persona={selectedPersona}
                onSave={updatePersona}
                onPublish={publishPersona}
              />
            </div>

            <div className="w-96 border-l">
              <PersonaTestChat
                personaId={selectedPersona.id}
                ventureId={ventureId}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
```

### Integration with Gateway & NAOS Agents

```typescript
import { applyPersona, validateResponse } from '@mcv/intelligence/personas';
import { streamChat } from '@mcv/intelligence/gateway';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 17: Full integration pipeline (streaming)
// ═══════════════════════════════════════════════════════════════════════════════

async function handleChatMessage(
  ventureId: string,
  personaSlug: string,
  userId: string,
  message: string,
) {
  // 1. Apply persona — resolves template, attaches RAG, sets model prefs
  const request = await applyPersona({
    personaSlug,
    ventureId,
    messages: [{ role: 'user', content: message }],
    variables: {
      user_name: await getUserName(userId),
      user_tier: await getUserTier(userId),
    },
  });

  // 2. Stream through gateway — model routing, budget check, etc.
  const response = await streamChat({
    ...request,
    ventureId,
    userId,
    onToken: (token) => emitToClient(userId, token),
    onComplete: async (response) => {
      // 3. Validate response against output guardrails
      const check = await validateResponse({
        personaId: request.personaId,
        content: response.content,
      });

      if (!check.passed) {
        // Replace streamed content with guardrail-safe version
        emitToClient(userId, {
          type: 'rewrite',
          content: check.rewrittenContent || request.guardrails.fallbackResponse,
        });
      }
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 18: NAOS agent with persona personality
// ═══════════════════════════════════════════════════════════════════════════════

import { createPersonaChat } from '@mcv/intelligence/personas';

async function createVentureAnalystAgent(ventureId: string) {
  // Each NAOS agent can use a persona for consistent behavior & voice
  const agentChat = await createPersonaChat({
    personaSlug: 'venture-analyst',
    ventureId,
    variables: {
      venture_name: await getVentureName(ventureId),
      analysis_depth: 'comprehensive',
      output_format: 'structured',
    },
  });

  // Agent interacts with persona-defined personality, tools, and guardrails
  const analysis = await agentChat.send(
    'Analyze this month\'s customer retention metrics and suggest improvements.'
  );

  // Agent's response is automatically validated against guardrails,
  // checked for tone alignment, and tools are scoped to persona config
  return analysis;
}
```

### Versioning & Rollback

```typescript
import { updatePersona, listPersonaVersions, rollbackPersona } from '@mcv/intelligence/personas';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 19: Version history and rollback
// ═══════════════════════════════════════════════════════════════════════════════

// Every update automatically creates a version snapshot
await updatePersona(supportAgent.id, {
  temperature: 0.8,  // Tweak temperature
  systemPrompt: '...(updated prompt)...',
}, 'admin-user-uuid');

// List version history
const versions = await listPersonaVersions(supportAgent.id);
console.log(`${versions.length} versions:`);
for (const v of versions) {
  console.log(`  v${v.version}: ${v.changeSummary} (by ${v.changedBy} at ${v.createdAt})`);
}

// Rollback to a previous version if something went wrong
await rollbackPersona(supportAgent.id, 3, 'admin-user-uuid');
// This creates a NEW version (v6) with the config from v3
// Published status is preserved — the rollback is seamless
```

---

## Tone Analysis Algorithm

Brand voice analysis uses a two-stage approach to measure how well a given text matches the target tone profile:

### Stage 1: LLM-Based Tone Scoring

```
Input Text → LLM (Tier 0, cheap) → Per-Dimension Scores (0-10)

Prompt:
  "Analyze the following text on these 7 dimensions. Return JSON scores (0-10).
   Dimensions: warmth, formality, humor, empathy, brevity, enthusiasm, technicality.
   Text: '{text}'"

Output:
  { warmth: 3, formality: 8, humor: 1, empathy: 2, brevity: 4, enthusiasm: 2, technicality: 6 }
```

### Stage 2: Alignment Calculation

```
For each dimension d:
  delta[d] = |measured[d] - target[d]|
  normalized_delta[d] = delta[d] / 10

Overall alignment = 1 - (mean(normalized_delta) * weight_factor)

Where weight_factor accounts for dimension importance:
  - warmth, empathy: weight 1.2 (more important for customer-facing)
  - formality, technicality: weight 1.0 (standard)
  - humor, enthusiasm: weight 0.8 (less critical)
  - brevity: weight 0.9

Outlier threshold: |delta| > 2 triggers a suggestion
```

### Stage 3: Suggestion Generation

When outliers are detected, the system generates specific suggestions:

| Dimension | High vs Target | Suggestion |
|-----------|---------------|------------|
| warmth | Too low | "Add more personal touches, use the user's name, express care" |
| warmth | Too high | "Tone down familiarity, maintain professional distance" |
| formality | Too low | "Use complete sentences, avoid slang, reduce contractions" |
| formality | Too high | "Relax the tone, use contractions, be more conversational" |
| humor | Too low | "Add light humor or playful language where appropriate" |
| humor | Too high | "Reduce jokes and playfulness, keep focused on the topic" |

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| Persona lookup (by slug, cached) | < 2ms | < 5ms | Redis hit |
| Persona lookup (by slug, uncached) | < 10ms | < 25ms | DB query + cache write |
| Template rendering | < 2ms | < 10ms | Handlebars compile + render |
| Guardrail check (input, patterns) | < 5ms | < 15ms | Regex + topic matching |
| Guardrail check (output, with PII) | < 30ms | < 80ms | Includes PII detection |
| Guardrail check (rewrite action) | < 2s | < 5s | Requires LLM call for rewrite |
| Tone analysis | < 500ms | < 1.5s | LLM call (Tier 0 model) |
| Brand voice rewrite | < 2s | < 5s | LLM call (Tier 1 model) |
| Persona stats aggregation | < 100ms | < 300ms | DB aggregate query |
| Full pipeline (resolve → chat → validate) | < 3s | < 8s | Dominated by LLM latency |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Concurrent persona chats | 100 | 1,000+ |
| Guardrail checks/second | 500 | 5,000+ |
| Template renders/second | 2,000 | 20,000+ |

### Optimization Strategies

1. **Persona caching** — Published personas cached in Redis with 1-hour TTL; cache invalidated on update via pub/sub
2. **Template pre-compilation** — Handlebars templates compiled once on first render, compiled form cached in memory (LRU, 1000 entries)
3. **Guardrail pattern compilation** — All blocked patterns compiled into a single composite regex at persona load time (avoids per-check compilation)
4. **Async tone analysis** — Tone analysis runs asynchronously after response delivery; doesn't block the user-facing response
5. **Stats batching** — Persona stats written in batches every 60 seconds via a write buffer; reduces DB write pressure
6. **Brand voice caching** — Venture default brand voice cached alongside persona config
7. **Connection pooling** — Drizzle connection pool shared across all persona operations (max 20 connections)

### Caching Architecture

```
Request Flow:
  1. Check Redis: persona:{ventureId}:{slug}
       ├── HIT  → Use cached config (< 2ms)
       └── MISS → Query PostgreSQL (< 25ms)
                    └── If status === 'published' → Write to Redis (TTL: 3600s)

Invalidation:
  - updatePersona()  → DELETE persona:{ventureId}:{slug}
  - publishPersona() → DELETE persona:{ventureId}:{slug}  (will re-cache on next read)
  - archivePersona() → DELETE persona:{ventureId}:{slug}

Memory Estimate:
  - Average persona config: ~4KB JSON
  - 100 published personas: ~400KB Redis memory
  - 1000 published personas: ~4MB Redis memory
```

---

## Security Considerations

### Venture Isolation

- **Row-level scoping**: Every DB query includes `WHERE venture_id = ?` — cross-venture access is architecturally impossible
- **Cache key scoping**: Redis keys include `ventureId` — `persona:{ventureId}:{slug}`
- **API validation**: All tRPC procedures validate `ventureId` against the authenticated user's venture access

### Prompt Injection Defense

- **Separation of concerns**: System prompts are injected as the `system` role; user input is always the `user` role — models treat them differently
- **Guardrail pre-check**: Input guardrails scan for common injection patterns:
  - `"ignore previous instructions"`
  - `"you are now a"`
  - `"system prompt:"`
  - `"[INST]"` / `"<|system|>"`
- **Output validation**: Even if injection succeeds, output guardrails catch violating responses
- **Template sandboxing**: Handlebars templates cannot execute arbitrary code — only substitution, conditionals, and built-in helpers

### PII Protection

- **Input scanning**: Optional PII detection on user input before sending to LLM
- **Output redaction**: When `redactPII: true`, responses are scanned and PII is replaced with `****` patterns
- **Supported PII types**: email, phone, SSN, credit card, address, name, date of birth
- **Detection method**: Regex patterns for structured data (SSN, credit cards); NER model for unstructured PII (names, addresses)
- **Audit trail**: All PII detections logged to `guardrail_logs` for compliance review

### Access Control

| Operation | Required Permission | Notes |
|-----------|-------------------|-------|
| List personas | `persona:read` | Venture members can view |
| View persona details | `persona:read` | Includes guardrail config |
| Create persona | `persona:create` | Admin role required |
| Update persona | `persona:update` | Admin role required |
| Publish persona | `persona:publish` | Admin role required |
| Archive/restore persona | `persona:archive` | Admin role required |
| Delete persona | `persona:delete` | Owner or super-admin only |
| Chat with persona | `persona:chat` | Any authenticated user |
| View analytics | `