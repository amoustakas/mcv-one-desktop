import type {
  KitInstance,
  KitToolSchema,
  KitToolHandler,
  KitExecutionContext,
  ToolCallResult,
} from './types';

// Built-in kits
import { manifest as githubManifest, handlers as githubHandlers } from './builtin/github-kit';
import { manifest as tasksManifest, handlers as tasksHandlers } from './builtin/tasks-kit';
import { manifest as docsManifest, handlers as docsHandlers } from './builtin/docs-kit';
import { manifest as crmManifest, handlers as crmHandlers } from './builtin/crm-kit';
import { manifest as vercelManifest, handlers as vercelHandlers } from './builtin/vercel-kit';
import { manifest as geminiManifest, handlers as geminiHandlers } from './builtin/gemini-kit';
import { manifest as notionManifest, handlers as notionHandlers } from './builtin/notion-kit';
import { manifest as driveManifest, handlers as driveHandlers } from './builtin/drive-kit';
import { manifest as localManifest, handlers as localHandlers } from './builtin/local-server-kit';

// ---------------------------------------------------------------------------
// Local Kit Registry
// ---------------------------------------------------------------------------

function kit(manifest: KitInstance['manifest'], handlers: KitInstance['handlers']): KitInstance {
  return { manifest, handlers, status: 'loaded', source: 'builtin', loadedAt: Date.now() };
}

const builtinKits: KitInstance[] = [
  kit(githubManifest, githubHandlers),
  kit(tasksManifest, tasksHandlers),
  kit(docsManifest, docsHandlers),
  kit(crmManifest, crmHandlers),
  kit(vercelManifest, vercelHandlers),
  kit(geminiManifest, geminiHandlers),
  kit(notionManifest, notionHandlers),
  kit(driveManifest, driveHandlers),
  kit(localManifest, localHandlers),
];

/** Returns all built-in kit instances */
export function getBuiltinKits(): KitInstance[] {
  return builtinKits;
}

/** Get all tool schemas available for a given venture */
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

/** Find which kit owns a given tool name */
export function findKitForTool(kits: KitInstance[], toolName: string): KitInstance | undefined {
  return kits.find(
    (kit) => kit.status === 'loaded' && kit.manifest.tools.some((t) => t.name === toolName),
  );
}

/** Get the handler function for a tool */
export function getToolHandler(kits: KitInstance[], toolName: string): KitToolHandler | undefined {
  const kit = findKitForTool(kits, toolName);
  return kit?.handlers[toolName];
}

/** Execute a tool by name with the given input and context */
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

/** Build the kit instructions string to append to the system prompt */
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
