# ADR-007: AI Provider Strategy (OpenRouter Gateway)

**Status:** APPROVED
**Date:** March 10, 2026
**Deciders:** Architecture Team, AI Team
**Context:**
MCV.ONE is an "AI-first" platform where the Neural Hive-Mind powers all modules. The platform needs access to multiple LLM providers (Claude, GPT-4, DeepSeek, Gemini) with automatic fallback, cost management, and per-venture configuration.

**Problem:**
1. **Provider lock-in:** Direct integration with Anthropic/OpenAI APIs creates single-provider dependency.
2. **Cost management:** Different models have wildly different cost/quality tradeoffs.
3. **Reliability:** Any single provider can have outages — need automatic fallback.
4. **Venture-specific:** BetEdge needs sports-optimized prompts; Full Gain needs business-focused responses.

**Decision:**
We use **OpenRouter** as the primary LLM gateway, with a custom `@mcv/gateway` package that adds MCV-specific routing logic, caching, and fallback chains.

**Architecture:**
```
App → @mcv/gateway → OpenRouter API → [Claude | GPT-4 | DeepSeek | Gemini]
         │
         ├── Model selection (per-venture config)
         ├── Fallback chain (primary → secondary → tertiary)
         ├── Cost tracking (per-venture, per-module budgets)
         ├── Response caching (semantic dedup)
         └── Rate limiting (per-venture quotas)
```

**Default Model Chain:**
```typescript
const DEFAULT_CHAIN = {
  primary: 'anthropic/claude-sonnet-4-20250514',
  secondary: 'openai/gpt-4o',
  tertiary: 'deepseek/deepseek-chat',
};

const COST_OPTIMIZED_CHAIN = {
  primary: 'deepseek/deepseek-chat',
  secondary: 'anthropic/claude-haiku-4-5-20251001',
  tertiary: 'openai/gpt-4o-mini',
};
```

**Per-Venture Configuration:**
```typescript
// Stored in venture_settings table
{
  ventureId: 'betedge-uuid',
  ai: {
    defaultChain: 'DEFAULT_CHAIN',
    monthlyBudget: 500, // USD
    allowedModels: ['claude-*', 'gpt-4*'],
    customSystemPrompt: 'You are a sports analytics expert...',
  }
}
```

**Consequences:**
- Positive: No vendor lock-in, automatic failover, cost visibility per venture, model experimentation
- Negative: OpenRouter adds a middleware hop (~50ms latency), dependency on OpenRouter availability
- Mitigation: Direct API keys as fallback if OpenRouter is down; `@mcv/gateway` abstracts the routing
