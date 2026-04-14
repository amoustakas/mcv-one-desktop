import { useCallback, useRef } from 'react';
import { useToast } from '../components/Toasts';
import { getBuiltinKits, executeKitTool, getToolsForVenture } from '../lib/kits/loader';
import { useVoiceSession } from '../stores/voice-session';
import type { KitExecutionContext, KitToolSchema } from '../lib/kits/types';
import type { LiveServerToolCall } from '@google/genai';

// ---------------------------------------------------------------------------
// Voice Kit Bridge
// Bridges the Gemini Live API ↔ MCV Kit System.
//
// When Gemini's Live API calls a function:
//  1. We receive LiveServerToolCall
//  2. We look up the kit handler by tool name
//  3. Execute via executeKitTool with a proper KitExecutionContext
//  4. Send the result back to Live API via sendToolResponse
//  5. Track everything in useVoiceSession store
//
// This turns the Voice Studio into a fully-capable voice agent that can
// execute ALL 90+ kit tools during a voice conversation.
// ---------------------------------------------------------------------------

/**
 * Convert a kit tool schema to the Gemini Live API function declaration format.
 * Live API uses uppercase type names (OBJECT, STRING, NUMBER, etc.)
 */
export function kitToolsToLiveDeclarations(tools: KitToolSchema[]) {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'OBJECT' as const,
      properties: Object.fromEntries(
        Object.entries(t.input_schema.properties || {}).map(([key, val]) => {
          const v = val as Record<string, unknown>;
          const rawType = String(v.type || 'string').toUpperCase();
          // Live API accepts OBJECT, STRING, NUMBER, INTEGER, BOOLEAN, ARRAY
          const type = ['OBJECT', 'STRING', 'NUMBER', 'INTEGER', 'BOOLEAN', 'ARRAY'].includes(rawType)
            ? rawType
            : 'STRING';
          return [
            key,
            { type, description: String(v.description || '') },
          ];
        }),
      ),
      required: t.input_schema.required || [],
    },
  }));
}

/**
 * Get ALL available kit tools formatted for Gemini Live API.
 */
export function getAllVoiceTools(ventureId: string = 'mcv'): Array<{ functionDeclarations: ReturnType<typeof kitToolsToLiveDeclarations> }> {
  const kits = getBuiltinKits();
  const tools = getToolsForVenture(kits, ventureId);
  // Live API has practical limits — cap at ~50 tools to prevent prompt bloat
  const capped = tools.slice(0, 50);
  return [{ functionDeclarations: kitToolsToLiveDeclarations(capped) }];
}

interface VoiceKitBridgeOptions {
  sendToolResponse: (id: string, name: string, response: unknown) => void;
  ventureId?: string;
}

export function useVoiceKitBridge({ sendToolResponse, ventureId = 'mcv' }: VoiceKitBridgeOptions) {
  const { addToast } = useToast();
  const voiceStore = useVoiceSession();
  const executingRef = useRef<Set<string>>(new Set());

  const handleToolCall = useCallback(async (call: LiveServerToolCall) => {
    const fns = call.functionCalls ?? [];
    const kits = getBuiltinKits();

    for (const fn of fns) {
      const fnId = fn.id ?? crypto.randomUUID();
      const fnName = fn.name ?? 'unknown';
      const fnArgs = (fn.args ?? {}) as Record<string, unknown>;

      // Avoid duplicate execution
      if (executingRef.current.has(fnId)) continue;
      executingRef.current.add(fnId);

      // Track in voice session store
      voiceStore.addToolCall({
        id: fnId,
        name: fnName,
        args: fnArgs,
        status: 'executing',
        timestamp: new Date(),
      });

      addToast({ type: 'info', message: `Voice agent executing: ${fnName}` });

      // Build execution context
      const ctx: KitExecutionContext = {
        userId: 'voice-session',
        ventureId,
        conversationId: 'voice',
        fetch: globalThis.fetch.bind(globalThis),
      };

      try {
        const result = await executeKitTool(kits, fnName, fnArgs, ctx);

        // Update store
        voiceStore.updateToolCall(fnId, {
          status: result.success ? 'done' : 'error',
          result: result.data,
        });

        // Send response back to Gemini Live
        sendToolResponse(fnId, fnName, {
          success: result.success,
          data: result.data,
          summary: (result.displayMarkdown || '').slice(0, 500),
          error: result.error,
        });

        if (!result.success) {
          addToast({ type: 'warning', message: `${fnName}: ${result.error || 'failed'}` });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Tool execution failed';
        voiceStore.updateToolCall(fnId, { status: 'error', result: { error: message } });
        sendToolResponse(fnId, fnName, { success: false, error: message });
        addToast({ type: 'error', message: `${fnName} failed: ${message}` });
      } finally {
        executingRef.current.delete(fnId);
      }
    }
  }, [sendToolResponse, ventureId, addToast, voiceStore]);

  return { handleToolCall };
}
