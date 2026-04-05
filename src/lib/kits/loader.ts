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
import { manifest as n8nManifest, handlers as n8nHandlers } from './builtin/n8n-kit';
import { manifest as cloudflareManifest, handlers as cloudflareHandlers } from './builtin/cloudflare-kit';
import { manifest as dockerManifest, handlers as dockerHandlers } from './builtin/docker-kit';
import { manifest as workflowManifest, handlers as workflowHandlers } from './builtin/workflow-kit';
import { manifest as stripeManifest, handlers as stripeHandlers } from './builtin/stripe-kit';
import { manifest as slackManifest, handlers as slackHandlers } from './builtin/slack-kit';
import { manifest as twilioManifest, handlers as twilioHandlers } from './builtin/twilio-kit';
import { manifest as plaidManifest, handlers as plaidHandlers } from './builtin/plaid-kit';
import { manifest as linearManifest, handlers as linearHandlers } from './builtin/linear-kit';
import { manifest as discordManifest, handlers as discordHandlers } from './builtin/discord-kit';
import { manifest as youtubeManifest, handlers as youtubeHandlers } from './builtin/youtube-kit';
import { manifest as twitterManifest, handlers as twitterHandlers } from './builtin/twitter-kit';
import { manifest as linkedinManifest, handlers as linkedinHandlers } from './builtin/linkedin-kit';
import { manifest as gmailManifest, handlers as gmailHandlers } from './builtin/gmail-kit';
import { manifest as twitchManifest, handlers as twitchHandlers } from './builtin/twitch-kit';
import { manifest as elevenlabsManifest, handlers as elevenlabsHandlers } from './builtin/elevenlabs-kit';
import { manifest as vapiManifest, handlers as vapiHandlers } from './builtin/vapi-kit';
import { manifest as gcalManifest, handlers as gcalHandlers } from './builtin/google-calendar-kit';
import { manifest as gdriveManifest, handlers as gdriveHandlers } from './builtin/google-drive-kit';
import { manifest as gsheetsManifest, handlers as gsheetsHandlers } from './builtin/google-sheets-kit';
import { manifest as gaManifest, handlers as gaHandlers } from './builtin/google-analytics-kit';
import { manifest as gscManifest, handlers as gscHandlers } from './builtin/google-search-console-kit';
import { manifest as deepgramManifest, handlers as deepgramHandlers } from './builtin/deepgram-kit';
import { manifest as whatsappManifest, handlers as whatsappHandlers } from './builtin/whatsapp-kit';
import { manifest as messengerManifest, handlers as messengerHandlers } from './builtin/messenger-kit';
import { manifest as telegramManifest, handlers as telegramHandlers } from './builtin/telegram-kit';
import { manifest as sendgridManifest, handlers as sendgridHandlers } from './builtin/sendgrid-kit';
import { manifest as resendManifest, handlers as resendHandlers } from './builtin/resend-kit';
import { manifest as figmaManifest, handlers as figmaHandlers } from './builtin/figma-kit';
import { manifest as openaiManifest, handlers as openaiHandlers } from './builtin/openai-kit';
import { manifest as upstashManifest, handlers as upstashHandlers } from './builtin/upstash-kit';
import { manifest as calendlyManifest, handlers as calendlyHandlers } from './builtin/calendly-kit';
import { manifest as sentryManifest, handlers as sentryHandlers } from './builtin/sentry-kit';
import { manifest as hubspotManifest, handlers as hubspotHandlers } from './builtin/hubspot-kit';
import { manifest as lmstudioManifest, handlers as lmstudioHandlers } from './builtin/lmstudio-kit';
import { manifest as claudeManifest, handlers as claudeHandlers } from './builtin/claude-kit';
import { manifest as campaignsManifest, handlers as campaignsHandlers } from './builtin/campaigns-kit';
import { manifest as futurestateManifest, handlers as futurestateHandlers } from './builtin/futurestate-kit';
import { manifest as memoryManifest, handlers as memoryHandlers } from './builtin/memory-kit';
import { manifest as pipelineManifest, handlers as pipelineHandlers } from './builtin/pipeline-kit';
import { manifest as teamManifest, handlers as teamHandlers } from './builtin/team-kit';
import { manifest as treasuryManifest, handlers as treasuryHandlers } from './builtin/treasury-kit';
import { manifest as venturesManifest, handlers as venturesHandlers } from './builtin/ventures-kit';
import { manifest as commsSyncManifest, handlers as commsSyncHandlers } from './builtin/comms-sync-kit';
import { manifest as storageSupabaseManifest, handlers as storageSupabaseHandlers } from './builtin/storage-supabase-kit';
import { manifest as storageLocalManifest, handlers as storageLocalHandlers } from './builtin/storage-local-kit';
import { manifest as storageGdriveManifest, handlers as storageGdriveHandlers } from './builtin/storage-gdrive-kit';
import { manifest as storageAiManifest, handlers as storageAiHandlers } from './builtin/storage-ai-kit';
import { manifest as googleRagManifest, handlers as googleRagHandlers } from './builtin/google-rag-kit';
import { manifest as adStudioManifest, handlers as adStudioHandlers } from './builtin/ad-studio-kit';
import {
  manifest as mcpBridgeManifest,
  handlers as mcpBridgeHandlers,
  getMcpTools,
  getMcpHandlers,
} from './builtin/mcp-bridge-kit';
import { manifest as deviceManifest, handlers as deviceHandlers } from './builtin/device-kit';
import { manifest as ledgerManifest, handlers as ledgerHandlers } from './builtin/ledger-kit';
import { manifest as msTeamsManifest, handlers as msTeamsHandlers } from './builtin/microsoft-teams-kit';
import { manifest as msOutlookManifest, handlers as msOutlookHandlers } from './builtin/microsoft-outlook-kit';
import { manifest as msOnedriveManifest, handlers as msOnedriveHandlers } from './builtin/microsoft-onedrive-kit';
import { manifest as msSharepointManifest, handlers as msSharepointHandlers } from './builtin/microsoft-sharepoint-kit';
import { manifest as msEntraManifest, handlers as msEntraHandlers } from './builtin/microsoft-entra-kit';
// Google AI Studio kits
import { manifest as veoStudioManifest, handlers as veoStudioHandlers } from './builtin/veo-studio-kit';
import { manifest as voiceAiManifest, handlers as voiceAiHandlers } from './builtin/voice-ai-kit';
import { manifest as imagenStudioManifest, handlers as imagenStudioHandlers } from './builtin/imagen-studio-kit';
import { manifest as creativeToolsManifest, handlers as creativeToolsHandlers } from './builtin/creative-tools-kit';
// Ads, Search & Social kits
import { manifest as bingManifest, handlers as bingHandlers } from './builtin/bing-kit';
import { manifest as googleAdsManifest, handlers as googleAdsHandlers } from './builtin/google-ads-kit';
import { manifest as msAdsManifest, handlers as msAdsHandlers } from './builtin/microsoft-ads-kit';
import { manifest as metaAdsManifest, handlers as metaAdsHandlers } from './builtin/meta-ads-kit';
import { manifest as tiktokManifest, handlers as tiktokHandlers } from './builtin/tiktok-kit';
import { manifest as gtmManifest, handlers as gtmHandlers } from './builtin/google-tag-manager-kit';
import { manifest as paymentsManifest, handlers as paymentsHandlers } from './builtin/payments-kit';

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
  kit(n8nManifest, n8nHandlers),
  kit(cloudflareManifest, cloudflareHandlers),
  kit(dockerManifest, dockerHandlers),
  kit(workflowManifest, workflowHandlers),
  kit(stripeManifest, stripeHandlers),
  kit(slackManifest, slackHandlers),
  kit(twilioManifest, twilioHandlers),
  kit(plaidManifest, plaidHandlers),
  kit(linearManifest, linearHandlers),
  kit(discordManifest, discordHandlers),
  kit(youtubeManifest, youtubeHandlers),
  kit(twitterManifest, twitterHandlers),
  kit(linkedinManifest, linkedinHandlers),
  kit(gmailManifest, gmailHandlers),
  kit(twitchManifest, twitchHandlers),
  kit(elevenlabsManifest, elevenlabsHandlers),
  kit(vapiManifest, vapiHandlers),
  kit(gcalManifest, gcalHandlers),
  kit(gdriveManifest, gdriveHandlers),
  kit(gsheetsManifest, gsheetsHandlers),
  kit(gaManifest, gaHandlers),
  kit(gscManifest, gscHandlers),
  kit(deepgramManifest, deepgramHandlers),
  kit(whatsappManifest, whatsappHandlers),
  kit(messengerManifest, messengerHandlers),
  kit(telegramManifest, telegramHandlers),
  kit(sendgridManifest, sendgridHandlers),
  kit(resendManifest, resendHandlers),
  kit(figmaManifest, figmaHandlers),
  kit(openaiManifest, openaiHandlers),
  kit(upstashManifest, upstashHandlers),
  kit(calendlyManifest, calendlyHandlers),
  kit(sentryManifest, sentryHandlers),
  kit(hubspotManifest, hubspotHandlers),
  kit(lmstudioManifest, lmstudioHandlers),
  kit(claudeManifest, claudeHandlers),
  kit(campaignsManifest, campaignsHandlers),
  kit(futurestateManifest, futurestateHandlers),
  kit(memoryManifest, memoryHandlers),
  kit(pipelineManifest, pipelineHandlers),
  kit(teamManifest, teamHandlers),
  kit(treasuryManifest, treasuryHandlers),
  kit(venturesManifest, venturesHandlers),
  kit(commsSyncManifest, commsSyncHandlers),
  kit(storageSupabaseManifest, storageSupabaseHandlers),
  kit(storageLocalManifest, storageLocalHandlers),
  kit(storageGdriveManifest, storageGdriveHandlers),
  kit(storageAiManifest, storageAiHandlers),
  kit(googleRagManifest, googleRagHandlers),
  kit(adStudioManifest, adStudioHandlers),
  kit(mcpBridgeManifest, mcpBridgeHandlers),
  kit(deviceManifest, deviceHandlers),
  kit(ledgerManifest, ledgerHandlers),
  kit(msTeamsManifest, msTeamsHandlers),
  kit(msOutlookManifest, msOutlookHandlers),
  kit(msOnedriveManifest, msOnedriveHandlers),
  kit(msSharepointManifest, msSharepointHandlers),
  kit(msEntraManifest, msEntraHandlers),
  // Google AI Studio kits
  kit(veoStudioManifest, veoStudioHandlers),
  kit(voiceAiManifest, voiceAiHandlers),
  kit(imagenStudioManifest, imagenStudioHandlers),
  kit(creativeToolsManifest, creativeToolsHandlers),
  // Ads, Search & Social
  kit(bingManifest, bingHandlers),
  kit(googleAdsManifest, googleAdsHandlers),
  kit(msAdsManifest, msAdsHandlers),
  kit(metaAdsManifest, metaAdsHandlers),
  kit(tiktokManifest, tiktokHandlers),
  kit(gtmManifest, gtmHandlers),
  kit(paymentsManifest, paymentsHandlers),
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

/** Refresh the MCP Bridge Kit's tools and handlers in the kit list */
export function refreshMcpBridgeKit(kits: KitInstance[]): void {
  const bridgeKit = kits.find((k) => k.manifest.id === 'mcp-bridge');
  if (!bridgeKit) return;

  // Rebuild dynamic tools and handlers
  bridgeKit.manifest = {
    ...bridgeKit.manifest,
    tools: getMcpTools(),
  };
  bridgeKit.handlers = getMcpHandlers();
}
