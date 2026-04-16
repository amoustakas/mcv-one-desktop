// src/lib/agents/tool-belt.ts
// Session B — agent tool-belt filter.
// An agent_persona declares kit_allowlist (required) and tool_allowlist
// (optional). The effective tool set Claude sees on behalf of an agent is
// the intersection:
//
//     allowed = tools_from_kits(kit_allowlist) ∩ tool_allowlist
//
// When tool_allowlist is null/empty we treat it as "all tools from the
// allowed kits". This module runs client-side; the server re-checks the
// tool_allowlist in api/_handlers/chat.ts as defense-in-depth.

import type { KitInstance, KitToolSchema } from '../kits/types';

export interface AgentToolBelt {
  kit_allowlist: string[];
  tool_allowlist: string[] | null;
}

/**
 * Filter a tool list to what the agent is allowed to call.
 *
 * @param tools Raw tools assembled from loaded kits for the current venture.
 * @param kits  The KitInstance array the tools came from (for tool → kit_id lookup).
 * @param agent Agent persona's kit_allowlist / tool_allowlist.
 */
export function filterToolsForAgent(
  tools: KitToolSchema[],
  kits: KitInstance[],
  agent: AgentToolBelt,
): KitToolSchema[] {
  // Build tool-name → kit-id lookup once.
  const toolToKit = new Map<string, string>();
  for (const kit of kits) {
    for (const t of kit.manifest.tools) {
      toolToKit.set(t.name, kit.manifest.id);
    }
  }

  const kitAllowed = new Set(agent.kit_allowlist);
  const toolAllowed =
    agent.tool_allowlist && agent.tool_allowlist.length > 0
      ? new Set(agent.tool_allowlist)
      : null;

  return tools.filter((t) => {
    const kitId = toolToKit.get(t.name);

    // Meta-tools (list_loaded_kits, search_kits) have no owning kit — always
    // allowed so agents can self-introspect their belt.
    if (!kitId) return true;

    if (!kitAllowed.has(kitId)) return false;
    if (toolAllowed && !toolAllowed.has(t.name)) return false;
    return true;
  });
}

/** Build the "you tried to call X but it's not in your belt" error body
 *  used by tool dispatch to hint at the right specialist. */
export function toolBeltRefusal(opts: {
  agentName: string;
  toolName: string;
  suggestedAgentHandle?: string;
}): string {
  const suggestion = opts.suggestedAgentHandle
    ? ` Try routing to ${opts.suggestedAgentHandle} — they own this tool.`
    : ' This call needs a different specialist on the roster.';
  return `${opts.agentName} doesn't have access to \`${opts.toolName}\`.${suggestion}`;
}
