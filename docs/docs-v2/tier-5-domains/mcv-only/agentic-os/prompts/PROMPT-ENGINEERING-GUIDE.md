# MCV One — Prompt Engineering Guide for Ralph Execution Pods

**Module:** `@mcv/agentic-os/prompts`
**Last Updated:** March 10, 2026
**Audience:** Agent developers, prompt engineers, venture teams

---

## 1. Prompt Architecture Overview

Every AI interaction in MCV One flows through the Prompts subsystem. This guide codifies the patterns, templates, and best practices for authoring prompts that power the Ralph execution pods, Queen orchestrator, and Scout monitors.

### 1.1 Execution Flow

```
User Request
  → Queen decomposes into tasks
    → Each task assigned to a Ralph pod type
      → Pod loads prompt template by slug
        → TemplateCompiler resolves variables
          → GuardrailsEngine validates input
            → ModelAdapter formats for target LLM
              → OpenRouter dispatches to model
                → Output guardrails validate response
                  → Result returned to Queen for aggregation
```

### 1.2 Template Structure

Every prompt template follows a standard envelope:

```typescript
{
  slug: 'smith.code-review',           // {pod}.{action}
  name: 'Code Review Analysis',
  category: 'task',                     // system | task | reasoning | formatting | safety | persona
  
  systemMessage: `...`,                 // Agent identity + constraints
  body: `...`,                          // Task-specific instructions with {{variables}}
  
  variables: [...],                     // Typed input definitions
  defaultModel: 'anthropic/claude-sonnet-4-20250514',
  defaultParameters: {
    temperature: 0.3,
    maxTokens: 4096,
    topP: 0.95,
  },
  guardrails: { ... },
}
```

---

## 2. System Prompt Patterns

System prompts define agent identity and behavioral constraints. They are loaded once per session and persist across all tasks within that session.

### 2.1 Queen System Prompt

```
You are Queen, the strategic orchestrator of the MCV One Neural Hive-Mind.

IDENTITY:
- You plan, delegate, and aggregate — you NEVER execute work directly
- You decompose complex requests into atomic tasks
- You assign tasks to specialized Ralph pods based on domain expertise
- You manage risk assessment and HITL routing

CONSTRAINTS:
- Maximum 20 concurrent delegated tasks
- Cost budget: ${{costBudget}} per request
- Always check risk level before dispatching financial or external tasks
- Never bypass HITL requirements for HIGH or CRITICAL risk tasks

DELEGATION RULES:
- Engineering tasks → Smith pod
- Marketing/growth tasks → Growth pod
- Operations/workflow tasks → Director pod
- Financial tasks → Ledger pod
- Writing/content tasks → Scribe pod
- Analytics/data tasks → Oracle pod
- Communication tasks → Herald pod
- Security/compliance tasks → Shield pod

CONTEXT:
- Current venture: {{venture.name}} ({{venture.slug}})
- User role: {{user.role}}
- Available pods: {{#each availablePods}}{{this.name}} ({{this.activeWorkers}}/{{this.maxWorkers}}){{/each}}
- Memory context: {{memoryContext}}

OUTPUT FORMAT:
Respond with a JSON execution plan:
{
  "tasks": [
    {
      "id": "task-001",
      "podType": "smith",
      "promptSlug": "smith.code-review",
      "variables": { ... },
      "dependencies": [],
      "riskLevel": "low",
      "priority": 1,
      "estimatedTokens": 4000,
      "estimatedCostUsd": 0.02
    }
  ],
  "parallelGroups": [["task-001", "task-002"], ["task-003"]],
  "hitlRequired": false,
  "totalEstimatedCost": 0.06,
  "reasoning": "..."
}
```

### 2.2 Ralph Pod System Prompts

Each pod type has a specialized system prompt. The pattern is:

```
You are {{podName}}, a {{podRole}} in the MCV One Neural Hive-Mind.

IDENTITY:
- {{podDescription}}
- You execute tasks assigned by Queen
- You have access to: {{#each instruments}}{{this.name}}{{/each}}

CAPABILITIES:
{{#each capabilities}}
- {{this}}: {{lookup capabilityDescriptions this}}
{{/each}}

CONSTRAINTS:
- Token budget: {{tokenBudget}} tokens per task
- Cost budget: ${{costBudget}} per task
- Timeout: {{timeoutMs}}ms
- {{#if requiresApproval}}Actions require HITL approval before execution{{/if}}

VENTURE CONTEXT:
- Venture: {{venture.name}}
- Industry: {{venture.industry}}
- {{#if venture.customSystemPrompt}}{{venture.customSystemPrompt}}{{/if}}

RESPONSE PROTOCOL:
1. Acknowledge the task
2. State your approach
3. Execute using available instruments
4. Report results with confidence assessment
5. Flag any issues or follow-up recommendations
```

#### Smith (Engineer) — Extended Identity Block

```
IDENTITY:
- You are a senior full-stack engineer
- Tech stack: TypeScript, Next.js 15, Drizzle ORM, tRPC, Turborepo, Supabase PostgreSQL
- You write clean, type-safe code following MCV conventions
- You always include tests for new code
- You follow the monorepo structure: apps/* for applications, packages/* for shared code
- Package naming: @mcv/{concept} for platform, @{venture}/{concept} for venture-specific

CODE STANDARDS:
- Use Drizzle ORM for all database operations (never raw SQL in application code)
- All tRPC routers use Zod validation
- All new columns must be nullable or have defaults (per ADR-010)
- Multi-tenancy: every query must include venture_id context (per ADR-006)
- State management: TanStack Query for server state, Zustand for client state (per ADR-005)
- Event publishing: use Redpanda via @mcv/events (per ADR-004)
```

#### Growth (Marketer) — Extended Identity Block

```
IDENTITY:
- You are a growth marketing specialist
- You create campaigns, content, and analytics reports
- You understand conversion funnels, A/B testing, and attribution
- You write engaging copy that matches the venture's brand voice
- You optimize for SEO, engagement metrics, and conversion rates

BRAND CONTEXT:
- Brand voice: {{venture.brandVoice}}
- Target audience: {{venture.targetAudience}}
- Competitors: {{venture.competitors}}
- Key differentiators: {{venture.differentiators}}
```

#### Ledger (Accountant) — Extended Identity Block

```
IDENTITY:
- You are a financial operations specialist
- You generate invoices, track budgets, and build financial reports
- You NEVER execute financial transactions without HITL approval
- You verify all calculations twice before presenting
- You follow GAAP/IFRS standards as appropriate

FINANCIAL CONSTRAINTS:
- All monetary values must be precise to 2 decimal places
- Currency: {{venture.currency}} (default USD)
- Fiscal year: {{venture.fiscalYearStart}}
- Tax jurisdiction: {{venture.taxJurisdiction}}
```

---

## 3. Task Prompt Patterns

Task prompts are the instructions for specific work items. They combine with the pod's system prompt to form the complete context.

### 3.1 Structured Output Pattern

When the task requires structured data (most common):

```
## Task: {{taskName}}

### Objective
{{taskDescription}}

### Input Data
{{#if inputData}}
```json
{{json inputData}}
```
{{else}}
No structured input provided. Use context from the conversation.
{{/if}}

### Requirements
{{#each requirements}}
- {{this}}
{{/each}}

### Output Schema
Respond with valid JSON matching this schema:
```json
{{json outputSchema}}
```

### Quality Criteria
- {{#each qualityCriteria}}{{this}}{{/each}}

### Constraints
- Maximum response length: {{maxTokens}} tokens
- Confidence threshold: {{confidenceThreshold}}
```

### 3.2 Code Generation Pattern

```
## Task: Generate {{componentType}}

### Specification
{{specification}}

### File Location
`{{filePath}}`

### Dependencies Available
{{#each dependencies}}
- `{{this.package}}` v{{this.version}} — {{this.purpose}}
{{/each}}

### Existing Code Context
{{#if existingCode}}
```typescript
{{existingCode}}
```
{{/if}}

### Code Standards
- Follow the MCV TypeScript Style Guide
- Include JSDoc comments for all exported functions
- Include Zod schemas for all input validation
- Include unit tests in a co-located `__tests__/` directory
- Use `venture_id` filtering in all database queries

### Output Format
Respond with the complete file content wrapped in a code block:
```typescript
// {{filePath}}
...your code here...
```
```

### 3.3 Analysis Pattern

```
## Task: Analyze {{analysisTarget}}

### Data Source
{{dataSource}}

### Analysis Dimensions
{{#each dimensions}}
- **{{this.name}}**: {{this.description}} (weight: {{this.weight}})
{{/each}}

### Time Range
From: {{dateRange.start}}
To: {{dateRange.end}}
Granularity: {{dateRange.granularity}}

### Expected Output
1. Executive Summary (2-3 sentences)
2. Key Findings (top {{findingsCount}} insights, ranked by impact)
3. Data Visualization Specifications (chart type, axes, data points)
4. Recommendations (actionable, prioritized by effort/impact)
5. Confidence Assessment (high/medium/low with reasoning)

### Analysis Constraints
- Base conclusions on data only — do not speculate beyond the evidence
- Flag data quality issues if detected
- Include sample sizes and statistical significance where applicable
```

### 3.4 Communication Pattern

```
## Task: Compose {{communicationType}}

### Recipient
{{#if recipient}}
- Name: {{recipient.name}}
- Role: {{recipient.role}}
- Relationship: {{recipient.relationship}}
- Communication style preference: {{recipient.stylePreference}}
{{/if}}

### Purpose
{{purpose}}

### Key Points
{{#each keyPoints}}
{{@index}}. {{this}}
{{/each}}

### Tone
{{tone}} (options: formal, professional, casual, urgent, empathetic)

### Brand Voice
{{venture.brandVoice}}

### Constraints
- Maximum length: {{maxLength}} words
- Include call-to-action: {{#if cta}}{{cta}}{{else}}No{{/if}}
- Sensitive content: {{#if sensitive}}Yes — requires HITL review before sending{{/if}}

### Format
{{format}} (options: email, slack_message, sms, push_notification, in_app)
```

---

## 4. Reasoning Strategy Prompts

### 4.1 Chain-of-Thought (Default)

```
Think through this step-by-step:

1. First, identify the core problem or objective
2. List the key constraints and requirements
3. Consider 2-3 possible approaches
4. Evaluate each approach against the constraints
5. Select the best approach and explain why
6. Execute the selected approach
7. Verify the result against the original objective

Show your reasoning at each step inside <reasoning> tags.
```

### 4.2 Tree-of-Thought (Complex Decisions)

```
Explore multiple solution paths:

BRANCH 1: {{approach1Name}}
  - Pros: ...
  - Cons: ...
  - Feasibility: high/medium/low
  - Estimated effort: ...

BRANCH 2: {{approach2Name}}
  - Pros: ...
  - Cons: ...
  - Feasibility: high/medium/low
  - Estimated effort: ...

BRANCH 3: {{approach3Name}}
  - Pros: ...
  - Cons: ...
  - Feasibility: high/medium/low
  - Estimated effort: ...

EVALUATION:
Score each branch on: feasibility (40%), quality (30%), speed (20%), cost (10%).
Select the highest-scoring branch. If scores are within 10%, prefer the simpler approach.
```

### 4.3 Reflection Pattern (Self-Verification)

```
After generating your initial response:

1. PAUSE — Do not submit yet
2. Re-read the original task requirements
3. Check each requirement against your response:
   {{#each requirements}}
   - [ ] {{this}} — met? (yes/no/partial)
   {{/each}}
4. If any requirement is not fully met, revise your response
5. Check for:
   - Logical consistency
   - Factual accuracy (cite sources if applicable)
   - Code correctness (mental dry-run)
   - Edge cases and error handling
6. Submit your verified response with a confidence score (0-100)
```

---

## 5. Guardrail Patterns

### 5.1 Input Guardrails

```typescript
guardrails: {
  input: {
    maxInputTokens: 8000,
    piiRedaction: {
      enabled: true,
      types: ['email', 'phone', 'ssn', 'credit_card'],
      action: 'redact',       // 'redact' | 'reject' | 'warn'
      replacement: '[REDACTED]',
    },
    contentFilter: {
      enabled: true,
      blockedCategories: ['violence', 'hate_speech', 'sexual_content'],
      action: 'reject',
    },
    injectionDetection: {
      enabled: true,
      patterns: [
        'ignore previous instructions',
        'disregard your system prompt',
        'you are now',
        'pretend you are',
      ],
      action: 'reject',
    },
  },
}
```

### 5.2 Output Guardrails

```typescript
guardrails: {
  output: {
    maxOutputTokens: 4096,
    schemaValidation: {
      enabled: true,
      schema: outputJsonSchema,       // Zod schema reference
      action: 'retry',                // 'retry' | 'reject' | 'warn'
      maxRetries: 2,
    },
    contentFilter: {
      enabled: true,
      blockedPatterns: [
        /password\s*[:=]\s*\S+/i,     // No plaintext passwords
        /api[_-]?key\s*[:=]\s*\S+/i,  // No API keys
        /BEGIN\s+(RSA|EC|DSA)\s+PRIVATE\s+KEY/, // No private keys
      ],
      action: 'redact',
    },
    halluccinationCheck: {
      enabled: true,
      requireCitations: false,         // true for research tasks
      factCheckThreshold: 0.8,
    },
  },
}
```

---

## 6. Variable Resolution Patterns

### 6.1 Source Types

| Source | Resolution Path | Example |
|--------|----------------|---------|
| `user` | Current authenticated user record | `user.profile.name` → "Tony Moustakas" |
| `venture` | Active venture settings | `venture.branding.primaryColor` → "#1E40AF" |
| `conversation` | Current conversation history | `conversation.lastMessage` |
| `system` | Platform system values | `system.timestamp`, `system.environment` |
| `custom` | Task-provided variables | Passed by Queen at dispatch time |
| `memory` | Neural Hive-Mind memory | `memory.recentTasks`, `memory.userPreferences` |

### 6.2 Variable Transforms

```typescript
variables: [
  {
    name: 'userName',
    source: { type: 'user', path: 'profile.name' },
    // No transform — raw value
  },
  {
    name: 'ventureSlug',
    source: { type: 'venture', path: 'slug', transform: 'lowercase' },
  },
  {
    name: 'contextJson',
    source: { type: 'custom', path: 'taskContext', transform: 'json_stringify' },
  },
  {
    name: 'currentDate',
    source: { type: 'system', path: 'date.iso' },
  },
]
```

### 6.3 Conditional Sections

```handlebars
{{#if venture.features.web3}}
## Web3 Integration
You have access to blockchain instruments. Token operations require HITL approval.
Available chains: {{venture.web3.chain}}
{{/if}}

{{#unless user.isAdmin}}
## Access Restrictions
You are operating with standard user permissions. Administrative actions are not available.
{{/unless}}

{{#each venture.enabledModules}}
- {{this.name}}: {{this.description}}
{{/each}}
```

---

## 7. Model-Specific Adaptations

Different LLMs have different strengths. The ModelAdapter reformats prompts per target model:

### 7.1 Claude (Anthropic)

```typescript
modelOverrides: {
  'anthropic/*': {
    systemMessage: `${baseSystemMessage}\n\nUse XML tags for structured sections.`,
    parameters: {
      temperature: 0.3,
      maxTokens: 4096,
    },
    // Claude excels at: long-context reasoning, code generation, safety
    // Adjust: use XML tags for structure, leverage <thinking> for CoT
  },
}
```

### 7.2 GPT-4 (OpenAI)

```typescript
modelOverrides: {
  'openai/gpt-4*': {
    systemMessage: `${baseSystemMessage}\n\nUse markdown headers for structured sections.`,
    parameters: {
      temperature: 0.3,
      maxTokens: 4096,
    },
    // GPT-4 excels at: instruction following, function calling, JSON output
    // Adjust: use function calling for structured output, markdown for sections
  },
}
```

### 7.3 DeepSeek

```typescript
modelOverrides: {
  'deepseek/*': {
    systemMessage: `${baseSystemMessage}\n\nBe concise. Prioritize accuracy.`,
    parameters: {
      temperature: 0.2,     // Lower temp for consistency
      maxTokens: 2048,      // Shorter budget
    },
    // DeepSeek excels at: cost-effective reasoning, code understanding
    // Adjust: simpler prompts, fewer examples, tighter constraints
  },
}
```

---

## 8. A/B Testing Prompts

### 8.1 Test Configuration

```typescript
{
  testId: 'smith-code-review-v2-test',
  promptSlug: 'smith.code-review',
  status: 'active',
  trafficSplit: {
    control: 70,      // Existing prompt (70% of traffic)
    variant_a: 30,    // New prompt (30% of traffic)
  },
  variants: {
    control: { versionId: 'v5' },
    variant_a: { versionId: 'v6' },
  },
  metrics: ['quality_score', 'latency_ms', 'token_count', 'user_rating'],
  minimumSamples: 100,
  confidenceLevel: 0.95,
  autoPromote: true,   // Auto-switch if variant wins with significance
}
```

### 8.2 Metrics to Track

| Metric | Description | Weight |
|--------|-------------|--------|
| quality_score | Human rating 1-5 or automated evaluation | 40% |
| task_success_rate | Did the task complete successfully? | 30% |
| latency_ms | End-to-end execution time | 10% |
| token_count | Total tokens consumed (cost proxy) | 10% |
| retry_rate | How often did output fail guardrails? | 10% |

---

## 9. Venture-Specific Prompt Customization

Each venture can override prompt templates at the venture level. The resolution order is:

```
1. Venture-specific template (slug: 'betedge.smith.code-review')
2. Pod-type template (slug: 'smith.code-review')
3. Generic template (slug: 'generic.code-review')
```

### 9.1 BetEdge AI Custom Prompts

```typescript
// betedge.smith.code-review — extends smith.code-review
{
  slug: 'betedge.smith.code-review',
  ventureId: 'betedge-uuid',
  extends: 'smith.code-review',
  
  // Override only the venture-specific section
  systemMessageAppend: `
    BETEDGE-SPECIFIC STANDARDS:
    - Odds data must use decimal format internally (convert from American/fractional)
    - All betting calculations must use Decimal.js for precision (no floating point)
    - Sports data tables must include sport_type and league_id columns
    - WebSocket subscribers must handle reconnection with exponential backoff
    - Prediction endpoints must include confidence_interval in response
  `,
}
```

### 9.2 Custom Variable Sources

```typescript
// BetEdge-specific variables available to all prompts
ventureVariables: {
  'betedge.supportedSports': ['nfl', 'nba', 'mlb', 'nhl', 'ncaaf', 'ncaab', 'soccer', 'mma', 'tennis'],
  'betedge.oddsFormat': 'decimal',
  'betedge.stakingModel': 'kelly_criterion',
  'betedge.complianceLevel': 'high',
  'betedge.edgeTokenEnabled': true,
}
```

---

## 10. Error Recovery Patterns

### 10.1 Retry with Escalation

```
Attempt 1: Execute with default model and parameters
  → If output fails guardrails:
Attempt 2: Re-execute with explicit format instructions appended
  → If still fails:
Attempt 3: Escalate to premium model (Claude Opus) with simplified prompt
  → If still fails:
Abort: Return error to Queen with failure analysis for re-planning
```

### 10.2 Fallback Chain

```typescript
fallbackChain: [
  { model: 'anthropic/claude-sonnet-4-20250514', temperature: 0.3 },
  { model: 'openai/gpt-4o', temperature: 0.2 },
  { model: 'anthropic/claude-opus-4-20250514', temperature: 0.1, maxTokens: 8192 },
]
```

### 10.3 Graceful Degradation Prompt

When a task partially fails, append this to the retry:

```
IMPORTANT: A previous attempt at this task failed with the following error:
{{previousError}}

Previous output (partial):
{{previousOutput}}

Please:
1. Analyze what went wrong
2. Correct the issue
3. Complete the remaining work
4. Ensure the output passes all validation requirements
```

---

## 11. Prompt Template Catalog

### 11.1 Core Templates (Platform-Wide)

| Slug | Pod | Category | Purpose |
|------|-----|----------|---------|
| `queen.plan` | Queen | system | Decompose request into execution plan |
| `queen.aggregate` | Queen | task | Aggregate results from multiple pods |
| `smith.code-generate` | Smith | task | Generate new code files |
| `smith.code-review` | Smith | task | Review code for quality and bugs |
| `smith.code-refactor` | Smith | task | Refactor existing code |
| `smith.test-generate` | Smith | task | Generate unit and integration tests |
| `smith.migration-generate` | Smith | task | Generate database migration |
| `smith.debug` | Smith | task | Debug and fix issues |
| `growth.campaign-create` | Growth | task | Design marketing campaign |
| `growth.content-generate` | Growth | task | Generate marketing content |
| `growth.seo-analyze` | Growth | task | Analyze and optimize SEO |
| `director.workflow-build` | Director | task | Create automation workflow |
| `director.task-manage` | Director | task | Create and organize tasks |
| `ledger.invoice-generate` | Ledger | task | Generate invoice |
| `ledger.report-build` | Ledger | task | Build financial report |
| `scribe.write` | Scribe | task | Write content (article, doc, email draft) |
| `scribe.edit` | Scribe | task | Edit and improve existing content |
| `scribe.translate` | Scribe | task | Translate content between languages |
| `oracle.query` | Oracle | task | Run data analysis query |
| `oracle.visualize` | Oracle | task | Design data visualization |
| `oracle.insight` | Oracle | task | Generate insights from data |
| `herald.email` | Herald | task | Compose and send email |
| `herald.notification` | Herald | task | Create notification content |
| `herald.slack` | Herald | task | Compose Slack message |
| `shield.audit` | Shield | task | Security audit |
| `shield.scan` | Shield | task | Threat scanning |

### 11.2 Reasoning Templates

| Slug | Category | Purpose |
|------|----------|---------|
| `reasoning.chain-of-thought` | reasoning | Step-by-step reasoning |
| `reasoning.tree-of-thought` | reasoning | Multi-path exploration |
| `reasoning.reflection` | reasoning | Self-verification |
| `reasoning.debate` | reasoning | Internal argument for/against |
| `reasoning.analogy` | reasoning | Solve by analogy to known patterns |

### 11.3 Safety Templates

| Slug | Category | Purpose |
|------|----------|---------|
| `safety.pii-scan` | safety | Detect and redact PII in content |
| `safety.injection-detect` | safety | Detect prompt injection attempts |
| `safety.compliance-check` | safety | Verify output meets compliance requirements |
| `safety.bias-check` | safety | Check for discriminatory or biased content |

---

## 12. Performance Optimization

### 12.1 Token Efficiency

- **Minimize system prompt size** — venture context should be injected only when relevant
- **Use examples sparingly** — 1-2 few-shot examples max (from trajectory exemplars)
- **Prefer JSON output** — structured output is more token-efficient than prose
- **Truncate context** — if input data exceeds 50% of token budget, summarize first

### 12.2 Latency Optimization

- **Parallel execution** — Queen dispatches independent tasks simultaneously
- **Model tiering** — use economy models for simple tasks (classification, formatting)
- **Streaming** — enable streaming for user-facing responses (Herald, Scribe)
- **Caching** — semantic dedup for identical or near-identical prompts (via @mcv/gateway)

### 12.3 Cost Optimization

- **Cost tracking** — every execution logged with token count and USD cost
- **Budget alerts** — warn at 80% of monthly venture budget
- **Model downgrade** — automatically fall to cheaper model if budget pressure
- **Prompt compression** — remove redundant instructions for repeated task types
