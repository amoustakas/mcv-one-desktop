import type {
  KitInstance,
  KitToolSchema,
  KitToolHandler,
  KitExecutionContext,
  ToolCallResult,
} from './types';

// ---------------------------------------------------------------------------
// Kit Loader — pure operations over a KitInstance[] array.
// ---------------------------------------------------------------------------
//
// All functions here take the kit list as their first argument — the SDK
// never reaches out to a module-level builtin registry. Apps assemble their
// own builtin list (typically a hardcoded array of ~N kits with hardcoded
// imports) and pass it through. This keeps the SDK portable and tree-shake-
// friendly: a consumer using only 3 kits doesn't pay the import cost of 95.

/** Construct a loaded KitInstance from a manifest + handlers pair. */
export function createKitInstance(
  manifest: KitInstance['manifest'],
  handlers: KitInstance['handlers'],
  source: KitInstance['source'] = 'builtin',
): KitInstance {
  return { manifest, handlers, status: 'loaded', source, loadedAt: Date.now() };
}

/** Get all tool schemas available for a given venture (filtered by ventureScope). */
export function getToolsForVenture(kits: KitInstance[], ventureId: string): KitToolSchema[] {
  const tools: KitToolSchema[] = [];
  for (const kit of kits) {
    if (kit.status !== 'loaded') continue;
    const scope = kit.manifest.ventureScope;
    if (scope === '*' || scope.includes(ventureId)) {
      tools.push(...kit.manifest.tools);
    }
  }
  return tools;
}

/** Find which kit owns a given tool name (first match wins). */
export function findKitForTool(kits: KitInstance[], toolName: string): KitInstance | undefined {
  return kits.find(
    (kit) => kit.status === 'loaded' && kit.manifest.tools.some((t) => t.name === toolName),
  );
}

/** Get the handler function for a tool by name. */
export function getToolHandler(kits: KitInstance[], toolName: string): KitToolHandler | undefined {
  const kit = findKitForTool(kits, toolName);
  return kit?.handlers[toolName];
}

/** Execute a tool by name with the given input and context.
 *  Errors are caught and returned as `{success: false, error}`. */
export async function executeKitTool(
  kits: KitInstance[],
  toolName: string,
  input: Record<string, unknown>,
  context: KitExecutionContext,
): Promise<ToolCallResult> {
  const handler = getToolHandler(kits, toolName);
  if (!handler) {
    return { success: false, error: `No handler found for tool "${toolName}"` };
  }
  try {
    return await handler(input, context);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ─── Shared builtin-kits singleton ────────────────────────────────────────
// Apps assemble their hardcoded builtin-kits array (which typically includes
// kits that *themselves* want access to the full kit list, like the NAOS
// autonomous-agent kit). Call `setSharedBuiltinKits(kits)` once after
// assembling; consumers call `getSharedBuiltinKits()` inside handlers. This
// breaks the chicken-and-egg coupling without requiring the kit list to be
// threaded through every execution context.

let sharedBuiltinKits: KitInstance[] | null = null;

/** Register the app's assembled builtin-kits array for cross-kit access.
 *  Call once after the app's loader finishes assembling its kit list. */
export function setSharedBuiltinKits(kits: KitInstance[]): void {
  sharedBuiltinKits = kits;
}

/** Retrieve the shared builtin-kits array set via `setSharedBuiltinKits`.
 *  Returns empty array if no app has wired one yet. */
export function getSharedBuiltinKits(): KitInstance[] {
  return sharedBuiltinKits ?? [];
}

/** Build the kit instructions string to append to the system prompt.
 *  Lists each loaded, venture-scoped kit with its description and any
 *  manifest-supplied LLM instructions. */
export function buildKitInstructions(kits: KitInstance[], ventureId: string): string {
  const activeKits = kits.filter((kit) => {
    if (kit.status !== 'loaded') return false;
    const scope = kit.manifest.ventureScope;
    return scope === '*' || scope.includes(ventureId);
  });

  if (activeKits.length === 0) return '';

  let instructions = '\n\n## Available Tool Kits\n\n';
  instructions += 'You have the following tool kits loaded. Use them to fulfill user requests:\n\n';

  for (const kit of activeKits) {
    instructions += `**${kit.manifest.name}** (${kit.manifest.id} v${kit.manifest.version}): ${kit.manifest.description}\n`;
    if (kit.manifest.instructions) {
      instructions += `  ${kit.manifest.instructions}\n`;
    }
    instructions += '\n';
  }

  return instructions;
}
