import {
  AgentOrchestrator as SdkAgentOrchestrator,
  type OrchestratorAdapters,
  type OrchestratorCallbacks,
  type OrchestratorResult,
  type ChatMessage,
  type ToolCallEvent,
} from '@mcv/kits-sdk/orchestrator';
import type { KitInstance, KitExecutionContext } from './types';
import { streamMessageWithTools } from '../claude';
import { flightRecorder } from '../telemetry/flight-recorder';
import { contextCacheManager } from '../google/context-cache-manager';
import { hybridComputeRouter } from '../google/hybrid-compute';
import { hitlGate } from '../hitl/intercept-gate';
import { searchKits } from './registry-client';
import { notifyToolError } from './kit-notifications';
import { usePresenceStore } from '../../stores/presence';
import { useDeviceStore } from '../../stores/devices';

// ---------------------------------------------------------------------------
// App-bound AgentOrchestrator — wires the SDK orchestrator to MCV Desktop's
// concrete services (Claude streamer, FlightRecorder telemetry, Gemini
// context cache, hybrid compute router, HITL gate, registry, notifications,
// device/presence injection).
//
// Existing callers (AegisChat, naos/runtime) instantiate with the original
// 5-arg config — adapters are pre-bound here.

const appAdapters: OrchestratorAdapters = {
  streamer: {
    stream: (messages, systemPrompt, tools, toolExecutor, callbacks, maxToolRounds, model) =>
      streamMessageWithTools(messages, systemPrompt, tools, toolExecutor, callbacks, maxToolRounds, model),
  },
  telemetry: {
    addStep: (type, description, data, durationMs) =>
      flightRecorder.addStep(type as Parameters<typeof flightRecorder.addStep>[0], description, data, durationMs),
    recordToolDispatch: (kitId, toolName) => flightRecorder.recordToolDispatch(kitId, toolName),
    recordToolResult: (kitId, toolName, success, durationMs) =>
      flightRecorder.recordToolResult(kitId, toolName, success, durationMs),
  },
  cache: {
    getOrCreateCache: (payload) => contextCacheManager.getOrCreateCache(payload),
  },
  hybrid: {
    shouldUseCloud: (toolCall) => hybridComputeRouter.shouldUseCloud(toolCall),
    executeCloud: (toolCall, action) =>
      hybridComputeRouter.executeCloud(toolCall, action as Parameters<typeof hybridComputeRouter.executeCloud>[1]),
  },
  hitl: {
    shouldIntercept: (kit) => hitlGate.shouldIntercept(kit),
    requestApproval: (kit, toolCall) => hitlGate.requestApproval(kit, toolCall),
  },
  registry: {
    searchKits: async (query) => {
      const results = await searchKits(query);
      return results.map((r) => ({
        kit_id: r.kit_id,
        name: r.name,
        version: r.version,
        description: r.description,
        downloads: r.downloads,
      }));
    },
  },
  onToolError: (kitName, toolName, error, ventureId) => {
    notifyToolError(kitName, toolName, error, ventureId);
  },
  systemPromptEnricher: (currentPrompt) => {
    let prompt = currentPrompt;

    // Inject connected device context
    try {
      const deviceState = useDeviceStore.getState();
      const deviceList = Object.values(deviceState.devices);
      const connected = deviceList.filter((d) => d.status === 'connected');
      if (connected.length > 0) {
        prompt += '\n\n## Connected Devices\n\n';
        prompt += 'The user has the following physical devices and agent sessions connected:\n\n';
        for (const d of connected) {
          prompt += `- **${d.name}** (${d.class}) — capabilities: ${d.capabilities.join(', ')}\n`;

          // Enrich app-instance entries with screen & mobile details
          if (d.class === 'app-instance' && d.metadata) {
            const meta = d.metadata as Record<string, unknown>;
            if (meta.screenIndex !== undefined) {
              prompt += `    Screen ${(meta.screenIndex as number) + 1}: ${meta.screenResolution as string} (${meta.screenClass as string})`;
              if (meta.orientation) prompt += ` [${meta.orientation as string}]`;
              prompt += '\n';
            }
            // Mobile-specific info
            if (meta.deviceType === 'phone' || meta.deviceType === 'tablet') {
              const parts: string[] = [];
              if (meta.batteryLevel !== undefined) {
                parts.push(`battery: ${meta.batteryLevel as number}%${meta.batteryCharging ? ' (charging)' : ''}`);
              }
              if (meta.networkType) parts.push(`network: ${meta.networkType as string}`);
              if (parts.length > 0) prompt += `    Mobile: ${parts.join(', ')}\n`;
            }
          }
        }

        // Screen layout summary
        const appInstances = connected.filter((d) => d.class === 'app-instance');
        if (appInstances.length > 0) {
          const screenCount = new Set(
            appInstances
              .map((d) => (d.metadata as Record<string, unknown>).screenLabel)
              .filter(Boolean),
          ).size;
          if (screenCount > 1) {
            prompt += `\nScreen layout: ${screenCount} screens across ${appInstances.length} instance(s).\n`;
          }
        }

        // Active device profile
        const activeProfile = deviceState.activeProfileId
          ? deviceState.profiles[deviceState.activeProfileId]
          : null;
        if (activeProfile) {
          prompt += `\nActive device profile: **${activeProfile.name}**`;
          if (activeProfile.description) prompt += ` — ${activeProfile.description}`;
          if (activeProfile.ventureId) prompt += ` (venture: ${activeProfile.ventureId})`;
          // Summarize what the profile controls
          const mappingCount = activeProfile.mappings?.length ?? 0;
          const hasStreamDeck = (activeProfile.streamDeckPages?.length ?? 0) > 0;
          const hasAudio = !!activeProfile.audioRouting;
          const controls: string[] = [];
          if (mappingCount > 0) controls.push(`${mappingCount} mappings`);
          if (hasStreamDeck) controls.push('Stream Deck pages');
          if (hasAudio) controls.push('audio routing');
          if (activeProfile.goxlrPreset) controls.push(`GoXLR preset: ${activeProfile.goxlrPreset}`);
          if (controls.length > 0) prompt += ` | Controls: ${controls.join(', ')}`;
          prompt += '\n';
        }

        prompt += '\nYou can control these devices using the device-hub kit tools (list_devices, send_device_command, etc.). ';
        prompt += 'Proactively suggest device configurations when relevant to the user\'s workflow.\n';
      }
    } catch { /* device store not available */ }

    // Inject user presence context (if available)
    try {
      const presence = usePresenceStore.getState().ownPresence;
      if (presence) {
        prompt += '\n\n## Current User Context\n\n';
        prompt += `- **Status:** ${presence.status} (${presence.statusText})\n`;
        prompt += `- **Device:** ${presence.deviceType} (${presence.screenClass})\n`;
        prompt += `- **Location:** ${presence.city || 'Unknown'}, ${presence.timezone}\n`;
        prompt += `- **Role:** ${presence.role} (${presence.accessTier})\n`;
        prompt += `- **Venture:** ${presence.activeVenture}\n`;
        prompt += '\nAdapt your responses to the user\'s current state and device. ';
        prompt += 'On smaller screens, prefer concise card-based responses. ';
        prompt += 'If the user is in a meeting or on a call, keep responses brief.\n';
      }
    } catch { /* presence store not available */ }

    return prompt;
  },
};

export class AgentOrchestrator extends SdkAgentOrchestrator {
  constructor(config: {
    kits: KitInstance[];
    ventureId: string;
    systemPrompt: string;
    context: KitExecutionContext;
    model?: string;
  }) {
    super({ ...config, adapters: appAdapters });
  }
}

// Preserve backward-compatible re-exports for existing call sites.
export type { OrchestratorCallbacks, OrchestratorResult, ChatMessage, ToolCallEvent };
