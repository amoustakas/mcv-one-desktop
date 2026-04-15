// @ts-nocheck
import type { AgentDefinition, AgentSession, AgentModel } from './types';
import { MODEL_IDS as ModelIds } from './types';
import { AgentOrchestrator, type OrchestratorCallbacks, type OrchestratorResult } from '../kits/orchestrator';
import type { KitInstance, KitExecutionContext, UploadedFile } from '../kits/types';
import type { ChatMessage } from '../claude';
import { getVenture } from '../ventures';
import { useDeviceStore } from '../../stores/devices';
import { usePresenceStore } from '../../stores/presence';
import { useNAOSStore } from '../../stores/naos';

interface RunConfig {
  agent: AgentDefinition;
  messages: ChatMessage[];
  ventureId: string;
  conversationId: string;
  userId: string;
  kits: KitInstance[];
  callbacks: OrchestratorCallbacks;
  maxToolRounds?: number;
  files?: UploadedFile[];
  /** Optional Fabric audit callback; threaded into the orchestrator's tool-dispatch adapter. */
  onToolCallAudit?: (kitId: string, toolName: string) => void;
}

export class AgentRuntime {
  /** Filter kits by agent's allowlist/denylist */
  scopeKits(agent: AgentDefinition, allKits: KitInstance[]): KitInstance[] {
    const { kitAllowlist, kitDenylist } = agent.capabilities;

    let filtered = allKits;

    // If allowlist is non-empty, only include those kits
    if (kitAllowlist.length > 0) {
      const allowSet = new Set(kitAllowlist);
      filtered = filtered.filter((k) => allowSet.has(k.manifest.id));
    }

    // Always exclude denied kits
    if (kitDenylist.length > 0) {
      const denySet = new Set(kitDenylist);
      filtered = filtered.filter((k) => !denySet.has(k.manifest.id));
    }

    return filtered;
  }

  /** Resolve the agent's system prompt template with real context */
  resolvePrompt(agent: AgentDefinition, ventureId: string): string {
    let prompt = agent.systemPromptTemplate;

    // Venture context
    const venture = getVenture(ventureId);
    if (venture) {
      const ventureBlock = `## Active Venture: ${venture.name}\n\n${venture.systemPrompt}\n`;
      prompt = prompt.replace('{{venture_context}}', ventureBlock);
    } else {
      prompt = prompt.replace('{{venture_context}}', '');
    }

    // Memory context (Phase 2 — empty for now)
    prompt = prompt.replace('{{memory_context}}', '');

    // Device context
    try {
      const deviceState = useDeviceStore.getState();
      const connected = Object.values(deviceState.devices).filter((d) => d.status === 'connected');
      if (connected.length > 0) {
        let deviceBlock = '## Connected Devices\n\n';
        for (const d of connected) {
          deviceBlock += `- **${d.name}** (${d.class}) — ${d.capabilities.join(', ')}\n`;
        }
        const profile = deviceState.activeProfileId ? deviceState.profiles[deviceState.activeProfileId] : null;
        if (profile) {
          deviceBlock += `\nActive device profile: **${profile.name}**\n`;
        }
        prompt = prompt.replace('{{device_context}}', deviceBlock);
      } else {
        prompt = prompt.replace('{{device_context}}', '');
      }
    } catch {
      prompt = prompt.replace('{{device_context}}', '');
    }

    // User context
    try {
      const presence = usePresenceStore.getState().ownPresence;
      if (presence) {
        let userBlock = '## User Context\n\n';
        userBlock += `- **Status:** ${presence.status} (${presence.statusText})\n`;
        userBlock += `- **Device:** ${presence.deviceType} (${presence.screenClass})\n`;
        userBlock += `- **Location:** ${presence.city || 'Unknown'}, ${presence.timezone}\n`;
        userBlock += `- **Venture:** ${presence.activeVenture}\n`;
        prompt = prompt.replace('{{user_context}}', userBlock);
      } else {
        prompt = prompt.replace('{{user_context}}', '');
      }
    } catch {
      prompt = prompt.replace('{{user_context}}', '');
    }

    return prompt;
  }

  /** Main entry point — run an agent with scoped kits and resolved prompt */
  async run(config: RunConfig): Promise<OrchestratorResult> {
    const { agent, messages, ventureId, conversationId, userId, kits, callbacks, files } = config;

    // Scope kits to this agent's capabilities
    const scopedKits = this.scopeKits(agent, kits);

    // Resolve the prompt template
    const systemPrompt = this.resolvePrompt(agent, ventureId);

    // Resolve model ID
    const modelId = ModelIds[agent.model];

    // Track session
    const sessionId = `${agent.id}-${Date.now()}`;
    const session: AgentSession = {
      id: sessionId,
      agentId: agent.id,
      ventureId,
      conversationId,
      startedAt: Date.now(),
      toolCallCount: 0,
      tokenCount: { input: 0, output: 0 },
      status: 'active',
    };
    useNAOSStore.getState().startSession(session);

    // Create orchestrator with scoped config
    const orchestrator = new AgentOrchestrator({
      kits: scopedKits,
      ventureId,
      systemPrompt,
      context: {
        userId,
        ventureId,
        conversationId,
        fetch: globalThis.fetch,
      },
      model: modelId,
      onToolCallAudit: config.onToolCallAudit,
    });

    const maxRounds = config.maxToolRounds ?? agent.capabilities.maxToolRounds;

    try {
      const result = await orchestrator.processMessage(messages, callbacks, maxRounds, files);
      useNAOSStore.getState().endSession(sessionId, 'complete');
      return result;
    } catch (error) {
      useNAOSStore.getState().endSession(sessionId, 'error');
      throw error;
    }
  }
}

/** Singleton runtime instance */
export const agentRuntime = new AgentRuntime();
