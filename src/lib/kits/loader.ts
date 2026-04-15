import type { KitInstance } from './types';
import { createKitInstance } from '@mcv/kits-sdk/loader';

// Re-export the pure loader operations from the SDK so app callers like
// `import { executeKitTool, ... } from '@/lib/kits/loader'` keep working.
export {
  getToolsForVenture,
  findKitForTool,
  getToolHandler,
  executeKitTool,
  buildKitInstructions,
  createKitInstance,
} from '@mcv/kits-sdk/loader';

// Built-in kits
import { manifest as githubManifest, handlers as githubHandlers } from '@mcv/kits-sdk/builtin/github-kit';
import { manifest as tasksManifest, handlers as tasksHandlers } from '@mcv/kits-sdk/builtin/tasks-kit';
import { manifest as docsManifest, handlers as docsHandlers } from '@mcv/kits-sdk/builtin/docs-kit';
import { manifest as crmManifest, handlers as crmHandlers } from '@mcv/kits-sdk/builtin/crm-kit';
import { manifest as vercelManifest, handlers as vercelHandlers } from '@mcv/kits-sdk/builtin/vercel-kit';
import { manifest as geminiManifest, handlers as geminiHandlers } from '@mcv/kits-sdk/builtin/gemini-kit';
import { manifest as notionManifest, handlers as notionHandlers } from '@mcv/kits-sdk/builtin/notion-kit';
import { manifest as driveManifest, handlers as driveHandlers } from '@mcv/kits-sdk/builtin/drive-kit';
import { manifest as localManifest, handlers as localHandlers } from '@mcv/kits-sdk/builtin/local-server-kit';
import { manifest as n8nManifest, handlers as n8nHandlers } from '@mcv/kits-sdk/builtin/n8n-kit';
import { manifest as cloudflareManifest, handlers as cloudflareHandlers } from '@mcv/kits-sdk/builtin/cloudflare-kit';
import { manifest as dockerManifest, handlers as dockerHandlers } from '@mcv/kits-sdk/builtin/docker-kit';
import { manifest as workflowManifest, handlers as workflowHandlers } from '@mcv/kits-sdk/builtin/workflow-kit';
import { manifest as stripeManifest, handlers as stripeHandlers } from '@mcv/kits-sdk/builtin/stripe-kit';
import { manifest as slackManifest, handlers as slackHandlers } from '@mcv/kits-sdk/builtin/slack-kit';
import { manifest as twilioManifest, handlers as twilioHandlers } from '@mcv/kits-sdk/builtin/twilio-kit';
import { manifest as plaidManifest, handlers as plaidHandlers } from '@mcv/kits-sdk/builtin/plaid-kit';
import { manifest as linearManifest, handlers as linearHandlers } from '@mcv/kits-sdk/builtin/linear-kit';
import { manifest as discordManifest, handlers as discordHandlers } from '@mcv/kits-sdk/builtin/discord-kit';
import { manifest as youtubeManifest, handlers as youtubeHandlers } from '@mcv/kits-sdk/builtin/youtube-kit';
import { manifest as twitterManifest, handlers as twitterHandlers } from '@mcv/kits-sdk/builtin/twitter-kit';
import { manifest as linkedinManifest, handlers as linkedinHandlers } from '@mcv/kits-sdk/builtin/linkedin-kit';
import { manifest as gmailManifest, handlers as gmailHandlers } from '@mcv/kits-sdk/builtin/gmail-kit';
import { manifest as twitchManifest, handlers as twitchHandlers } from '@mcv/kits-sdk/builtin/twitch-kit';
import { manifest as elevenlabsManifest, handlers as elevenlabsHandlers } from '@mcv/kits-sdk/builtin/elevenlabs-kit';
import { manifest as vapiManifest, handlers as vapiHandlers } from '@mcv/kits-sdk/builtin/vapi-kit';
import { manifest as gcalManifest, handlers as gcalHandlers } from '@mcv/kits-sdk/builtin/google-calendar-kit';
import { manifest as gdriveManifest, handlers as gdriveHandlers } from '@mcv/kits-sdk/builtin/google-drive-kit';
import { manifest as gsheetsManifest, handlers as gsheetsHandlers } from '@mcv/kits-sdk/builtin/google-sheets-kit';
import { manifest as gaManifest, handlers as gaHandlers } from '@mcv/kits-sdk/builtin/google-analytics-kit';
import { manifest as gscManifest, handlers as gscHandlers } from '@mcv/kits-sdk/builtin/google-search-console-kit';
import { manifest as gtasksManifest, handlers as gtasksHandlers } from '@mcv/kits-sdk/builtin/google-tasks-kit';
import { manifest as mcpGoogleManifest, handlers as mcpGoogleHandlers } from '@mcv/kits-sdk/builtin/mcp-google-bridge';
import { manifest as automationManifest, handlers as automationHandlers } from '@mcv/kits-sdk/builtin/automation-kit';
import { manifest as naosAgentManifest, handlers as naosAgentHandlers } from './builtin/naos-agent-kit';
import { manifest as creativeAiManifest, handlers as creativeAiHandlers } from '@mcv/kits-sdk/builtin/creative-ai-kit';
import { manifest as videoAiManifest, handlers as videoAiHandlers } from '@mcv/kits-sdk/builtin/video-ai-kit';
import { manifest as aiStudioManifest, handlers as aiStudioHandlers } from '@mcv/kits-sdk/builtin/ai-studio-kit';
import { manifest as knowledgeHubManifest, handlers as knowledgeHubHandlers } from '@mcv/kits-sdk/builtin/knowledge-hub-kit';
import { manifest as deepgramManifest, handlers as deepgramHandlers } from '@mcv/kits-sdk/builtin/deepgram-kit';
import { manifest as whatsappManifest, handlers as whatsappHandlers } from '@mcv/kits-sdk/builtin/whatsapp-kit';
import { manifest as messengerManifest, handlers as messengerHandlers } from '@mcv/kits-sdk/builtin/messenger-kit';
import { manifest as telegramManifest, handlers as telegramHandlers } from '@mcv/kits-sdk/builtin/telegram-kit';
import { manifest as sendgridManifest, handlers as sendgridHandlers } from '@mcv/kits-sdk/builtin/sendgrid-kit';
import { manifest as resendManifest, handlers as resendHandlers } from '@mcv/kits-sdk/builtin/resend-kit';
import { manifest as figmaManifest, handlers as figmaHandlers } from '@mcv/kits-sdk/builtin/figma-kit';
import { manifest as openaiManifest, handlers as openaiHandlers } from '@mcv/kits-sdk/builtin/openai-kit';
import { manifest as upstashManifest, handlers as upstashHandlers } from '@mcv/kits-sdk/builtin/upstash-kit';
import { manifest as calendlyManifest, handlers as calendlyHandlers } from '@mcv/kits-sdk/builtin/calendly-kit';
import { manifest as sentryManifest, handlers as sentryHandlers } from '@mcv/kits-sdk/builtin/sentry-kit';
import { manifest as hubspotManifest, handlers as hubspotHandlers } from '@mcv/kits-sdk/builtin/hubspot-kit';
import { manifest as lmstudioManifest, handlers as lmstudioHandlers } from '@mcv/kits-sdk/builtin/lmstudio-kit';
import { manifest as claudeManifest, handlers as claudeHandlers } from '@mcv/kits-sdk/builtin/claude-kit';
import { manifest as campaignsManifest, handlers as campaignsHandlers } from '@mcv/kits-sdk/builtin/campaigns-kit';
import { manifest as futurestateManifest, handlers as futurestateHandlers } from '@mcv/kits-sdk/builtin/futurestate-kit';
import { manifest as memoryManifest, handlers as memoryHandlers } from '@mcv/kits-sdk/builtin/memory-kit';
import { manifest as pipelineManifest, handlers as pipelineHandlers } from '@mcv/kits-sdk/builtin/pipeline-kit';
import { manifest as teamManifest, handlers as teamHandlers } from '@mcv/kits-sdk/builtin/team-kit';
import { manifest as treasuryManifest, handlers as treasuryHandlers } from '@mcv/kits-sdk/builtin/treasury-kit';
import { manifest as venturesManifest, handlers as venturesHandlers } from '@mcv/kits-sdk/builtin/ventures-kit';
import { manifest as commsSyncManifest, handlers as commsSyncHandlers } from '@mcv/kits-sdk/builtin/comms-sync-kit';
import { manifest as storageSupabaseManifest, handlers as storageSupabaseHandlers } from '@mcv/kits-sdk/builtin/storage-supabase-kit';
import { manifest as storageLocalManifest, handlers as storageLocalHandlers } from '@mcv/kits-sdk/builtin/storage-local-kit';
import { manifest as storageGdriveManifest, handlers as storageGdriveHandlers } from '@mcv/kits-sdk/builtin/storage-gdrive-kit';
import { manifest as storageAiManifest, handlers as storageAiHandlers } from '@mcv/kits-sdk/builtin/storage-ai-kit';
import { manifest as googleRagManifest, handlers as googleRagHandlers } from '@mcv/kits-sdk/builtin/google-rag-kit';
import { manifest as adStudioManifest, handlers as adStudioHandlers } from './builtin/ad-studio-kit';
import { manifest as naosCommandManifest, handlers as naosCommandHandlers } from '@mcv/kits-sdk/builtin/naos-command-kit';
import {
  manifest as mcpBridgeManifest,
  handlers as mcpBridgeHandlers,
  getMcpTools,
  getMcpHandlers,
} from './builtin/mcp-bridge-kit';
import { manifest as deviceManifest, handlers as deviceHandlers } from '@mcv/kits-sdk/builtin/device-kit';
import { manifest as ledgerManifest, handlers as ledgerHandlers } from '@mcv/kits-sdk/builtin/ledger-kit';
import { manifest as msTeamsManifest, handlers as msTeamsHandlers } from '@mcv/kits-sdk/builtin/microsoft-teams-kit';
import { manifest as msOutlookManifest, handlers as msOutlookHandlers } from '@mcv/kits-sdk/builtin/microsoft-outlook-kit';
import { manifest as msOnedriveManifest, handlers as msOnedriveHandlers } from '@mcv/kits-sdk/builtin/microsoft-onedrive-kit';
import { manifest as msSharepointManifest, handlers as msSharepointHandlers } from '@mcv/kits-sdk/builtin/microsoft-sharepoint-kit';
import { manifest as msEntraManifest, handlers as msEntraHandlers } from '@mcv/kits-sdk/builtin/microsoft-entra-kit';
// Google AI Studio kits
import { manifest as veoStudioManifest, handlers as veoStudioHandlers } from '@mcv/kits-sdk/builtin/veo-studio-kit';
import { manifest as voiceAiManifest, handlers as voiceAiHandlers } from '@mcv/kits-sdk/builtin/voice-ai-kit';
import { manifest as imagenStudioManifest, handlers as imagenStudioHandlers } from '@mcv/kits-sdk/builtin/imagen-studio-kit';
import { manifest as creativeToolsManifest, handlers as creativeToolsHandlers } from '@mcv/kits-sdk/builtin/creative-tools-kit';
// Ads, Search & Social kits
import { manifest as bingManifest, handlers as bingHandlers } from '@mcv/kits-sdk/builtin/bing-kit';
import { manifest as googleAdsManifest, handlers as googleAdsHandlers } from '@mcv/kits-sdk/builtin/google-ads-kit';
import { manifest as msAdsManifest, handlers as msAdsHandlers } from '@mcv/kits-sdk/builtin/microsoft-ads-kit';
import { manifest as metaAdsManifest, handlers as metaAdsHandlers } from '@mcv/kits-sdk/builtin/meta-ads-kit';
import { manifest as tiktokManifest, handlers as tiktokHandlers } from '@mcv/kits-sdk/builtin/tiktok-kit';
import { manifest as gtmManifest, handlers as gtmHandlers } from '@mcv/kits-sdk/builtin/google-tag-manager-kit';
import { manifest as paymentsManifest, handlers as paymentsHandlers } from './builtin/payments-kit';
import { manifest as commerceManifest, handlers as commerceHandlers } from '@mcv/kits-sdk/builtin/commerce-kit';
import { manifest as commerceSurfaceManifest, handlers as commerceSurfaceHandlers } from '@mcv/kits-sdk/builtin/commerce-surface-kit';
import { manifest as financeManifest, handlers as financeHandlers } from '@mcv/kits-sdk/builtin/finance-kit';
import { manifest as creatorManifest, handlers as creatorHandlers } from '@mcv/kits-sdk/builtin/creator-kit';
import { manifest as complianceManifest, handlers as complianceHandlers } from '@mcv/kits-sdk/builtin/compliance-kit';
import { manifest as platformManifest, handlers as platformHandlers } from '@mcv/kits-sdk/builtin/platform-kit';
import { manifest as browserManifest, handlers as browserHandlers } from '@mcv/kits-sdk/builtin/browser-kit';
import { manifest as epicManifest, handlers as epicHandlers } from '@mcv/kits-sdk/builtin/epic-kit';
import { manifest as stripeConnectManifest, handlers as stripeConnectHandlers } from '@mcv/kits-sdk/builtin/stripe-connect-kit';
// Department agents (Cassandra/Atlas/Nova/Mint/Vector/Helix) + cross-cutting intelligence
import { departmentKits } from '@mcv/kits-sdk/builtin/department-kits';
import { manifest as ventureIntelManifest, handlers as ventureIntelHandlers } from '@mcv/kits-sdk/builtin/venture-intelligence-kit';

// ---------------------------------------------------------------------------
// Local Kit Registry — hardcoded builtin list lives here because the 95+
// imports above are app-specific. Pure loader operations are imported from
// @mcv/kits-sdk/loader (re-exported above for backward compatibility).
// ---------------------------------------------------------------------------

const kit = createKitInstance;

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
  kit(gtasksManifest, gtasksHandlers),
  kit(mcpGoogleManifest, mcpGoogleHandlers),
  kit(automationManifest, automationHandlers),
  kit(naosAgentManifest, naosAgentHandlers),
  kit(creativeAiManifest, creativeAiHandlers),
  kit(videoAiManifest, videoAiHandlers),
  kit(aiStudioManifest, aiStudioHandlers),
  kit(knowledgeHubManifest, knowledgeHubHandlers),
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
  kit(naosCommandManifest, naosCommandHandlers),
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
  kit(commerceManifest, commerceHandlers),
  kit(commerceSurfaceManifest, commerceSurfaceHandlers),
  kit(financeManifest, financeHandlers),
  kit(creatorManifest, creatorHandlers),
  kit(complianceManifest, complianceHandlers),
  kit(platformManifest, platformHandlers),
  // Browser & YouTube intelligence
  kit(browserManifest, browserHandlers),
  // Task/Epic pipeline (NAOS-driven flywheel)
  kit(epicManifest, epicHandlers),
  // Stripe Connect (marketplace payouts per venture)
  kit(stripeConnectManifest, stripeConnectHandlers),
  // Department agents — 6 named personalities operating over venture_docs
  ...Object.values(departmentKits).map(({ manifest, handlers }) => kit(manifest, handlers)),
  // Cross-cutting venture intelligence (consult_departments + venture_snapshot)
  kit(ventureIntelManifest, ventureIntelHandlers),
];

/** Returns all built-in kit instances */
export function getBuiltinKits(): KitInstance[] {
  return builtinKits;
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
