// @ts-nocheck
import type { AgentDefinition } from './types';
import { builtinAgents, agentMap } from './agents';

export class AgentRegistry {
  private agents: Map<string, AgentDefinition>;

  constructor() {
    this.agents = new Map(builtinAgents.map((a) => [a.id, a]));
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /** Keyword-based intent → agent routing (Phase 1). Phase 3 will use Claude haiku classification. */
  resolveAgent(message: string, _ventureId: string): AgentDefinition {
    const lower = message.toLowerCase();

    // Engineering signals
    if (/\b(code|deploy|github|pr|pull request|build|test|commit|vercel|docker|pipeline|bug|refactor|architecture|api|endpoint|migration)\b/.test(lower)) {
      return this.agents.get('forge')!;
    }
    // Finance signals
    if (/\b(revenue|budget|payment|invoice|p&l|profit|loss|burn|runway|mrr|arr|treasury|financial|accounting|stripe|subscription|billing|cost)\b/.test(lower)) {
      return this.agents.get('ledger')!;
    }
    // Marketing signals
    if (/\b(campaign|social|growth|ads|seo|marketing|content strategy|funnel|acquisition|brand|engagement|followers|impressions|roas|cac)\b/.test(lower)) {
      return this.agents.get('herald')!;
    }
    // Data/Analytics signals
    if (/\b(analytics|data|metrics|forecast|trend|report|dashboard|insight|pattern|correlation|regression|anomaly|statistical)\b/.test(lower)) {
      return this.agents.get('oracle')!;
    }
    // Security signals
    if (/\b(security|audit|compliance|vulnerability|breach|access control|rbac|soc2|gdpr|threat|incident|firewall|encryption)\b/.test(lower)) {
      return this.agents.get('shield')!;
    }
    // Content signals
    if (/\b(document|write|docs|knowledge base|article|blog|readme|specification|content|edit|proofread|template|notion)\b/.test(lower)) {
      return this.agents.get('scribe')!;
    }
    // Operations signals
    if (/\b(task|schedule|team|workflow|deadline|sprint|standup|meeting|calendar|assign|delegate|process|operations|backlog)\b/.test(lower)) {
      return this.agents.get('director')!;
    }

    // Default: Aegis coordinator
    return this.agents.get('aegis')!;
  }
}

/** Singleton instance */
export const agentRegistry = new AgentRegistry();
