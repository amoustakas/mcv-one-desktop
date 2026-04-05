// ---------------------------------------------------------------------------
// OAuth Integration Types
// ---------------------------------------------------------------------------

export type OAuthProvider =
  | 'github' | 'google' | 'notion' | 'cloudflare'
  | 'stripe' | 'slack' | 'discord' | 'linear' | 'figma';

export interface OAuthConnection {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  scopes: string[];
  provider_user_id: string;
  provider_user_name: string;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  updated_at: string;
}

export interface ConnectionStatus {
  provider: OAuthProvider | string;
  connected: boolean;
  userName?: string;
  scopes?: string[];
  status?: 'active' | 'expired' | 'revoked';
  expiresAt?: string;
}

export interface OAuthProviderConfig {
  provider: OAuthProvider;
  name: string;
  description: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  userInfoUrl: string;
  clientIdEnvVar: string;
  clientSecretEnvVar: string;
}

/** Provider configurations — used by connect and callback endpoints */
export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  github: {
    provider: 'github',
    name: 'GitHub',
    description: 'Repository access, commits, pull requests, and code browsing',
    scopes: ['repo', 'read:org', 'read:user'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    revokeUrl: undefined, // GitHub doesn't have a standard revoke endpoint
    userInfoUrl: 'https://api.github.com/user',
    clientIdEnvVar: 'GITHUB_OAUTH_CLIENT_ID',
    clientSecretEnvVar: 'GITHUB_OAUTH_CLIENT_SECRET',
  },
  google: {
    provider: 'google',
    name: 'Google',
    description: 'Drive, Calendar, Gmail, Analytics, Search Console',
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientIdEnvVar: 'GOOGLE_OAUTH_CLIENT_ID',
    clientSecretEnvVar: 'GOOGLE_OAUTH_CLIENT_SECRET',
  },
  notion: {
    provider: 'notion',
    name: 'Notion',
    description: 'Workspace sync, databases, pages, and content import',
    scopes: [], // Notion OAuth doesn't use scopes in the auth URL
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    revokeUrl: undefined,
    userInfoUrl: 'https://api.notion.com/v1/users/me',
    clientIdEnvVar: 'NOTION_OAUTH_CLIENT_ID',
    clientSecretEnvVar: 'NOTION_OAUTH_CLIENT_SECRET',
  },
  cloudflare: {
    provider: 'cloudflare',
    name: 'Cloudflare',
    description: 'Workers, KV storage, R2 buckets, D1 databases, DNS',
    scopes: ['account:read', 'zone:read', 'worker:read'],
    authUrl: 'https://dash.cloudflare.com/oauth2/authorize',
    tokenUrl: 'https://dash.cloudflare.com/oauth2/token',
    revokeUrl: undefined,
    userInfoUrl: 'https://api.cloudflare.com/client/v4/user',
    clientIdEnvVar: 'CLOUDFLARE_OAUTH_CLIENT_ID',
    clientSecretEnvVar: 'CLOUDFLARE_OAUTH_CLIENT_SECRET',
  },
  stripe: {
    provider: 'stripe',
    name: 'Stripe',
    description: 'Payments, subscriptions, invoicing, revenue analytics',
    scopes: ['read_write'],
    authUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    revokeUrl: 'https://connect.stripe.com/oauth/deauthorize',
    userInfoUrl: 'https://api.stripe.com/v1/account',
    clientIdEnvVar: 'STRIPE_CLIENT_ID',
    clientSecretEnvVar: 'STRIPE_SECRET_KEY',
  },
  slack: {
    provider: 'slack',
    name: 'Slack',
    description: 'Team messaging, channels, notifications, bot integration',
    scopes: ['channels:read', 'chat:write', 'users:read', 'team:read'],
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    revokeUrl: 'https://slack.com/api/auth.revoke',
    userInfoUrl: 'https://slack.com/api/auth.test',
    clientIdEnvVar: 'SLACK_CLIENT_ID',
    clientSecretEnvVar: 'SLACK_CLIENT_SECRET',
  },
  discord: {
    provider: 'discord',
    name: 'Discord',
    description: 'Community servers, channels, roles, bot management',
    scopes: ['identify', 'guilds', 'guilds.members.read'],
    authUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    revokeUrl: 'https://discord.com/api/oauth2/token/revoke',
    userInfoUrl: 'https://discord.com/api/users/@me',
    clientIdEnvVar: 'DISCORD_CLIENT_ID',
    clientSecretEnvVar: 'DISCORD_CLIENT_SECRET',
  },
  linear: {
    provider: 'linear',
    name: 'Linear',
    description: 'Issue tracking, project management, sprint planning',
    scopes: ['read', 'write'],
    authUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    revokeUrl: 'https://api.linear.app/oauth/revoke',
    userInfoUrl: 'https://api.linear.app/graphql',
    clientIdEnvVar: 'LINEAR_CLIENT_ID',
    clientSecretEnvVar: 'LINEAR_CLIENT_SECRET',
  },
  figma: {
    provider: 'figma',
    name: 'Figma',
    description: 'Design files, components, prototypes, design tokens',
    scopes: ['files:read'],
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://api.figma.com/v1/oauth/token',
    revokeUrl: undefined,
    userInfoUrl: 'https://api.figma.com/v1/me',
    clientIdEnvVar: 'FIGMA_CLIENT_ID',
    clientSecretEnvVar: 'FIGMA_CLIENT_SECRET',
  },
};

/** Services that only support API key auth (no OAuth) */
export interface ApiKeyService {
  name: string;
  description: string;
  envKey: string;
  category: IntegrationCategory;
  docsUrl: string;
}

export const API_KEY_SERVICES: ApiKeyService[] = [
  { name: 'Claude API', envKey: 'ANTHROPIC_API_KEY', description: 'AI chat, reasoning, and code generation', category: 'ai', docsUrl: 'https://docs.anthropic.com' },
  { name: 'Deepgram', envKey: 'DEEPGRAM_API_KEY', description: 'Speech-to-text transcription', category: 'voice', docsUrl: 'https://developers.deepgram.com' },
  { name: 'ElevenLabs', envKey: 'ELEVENLABS_API_KEY', description: 'Text-to-speech voice synthesis', category: 'voice', docsUrl: 'https://elevenlabs.io/docs' },
  { name: 'Google AI', envKey: 'GOOGLE_AI_KEY', description: 'Gemini Pro, Flash, Imagen, embeddings', category: 'ai', docsUrl: 'https://ai.google.dev/docs' },
  { name: 'Google Maps', envKey: 'GOOGLE_MAPS_KEY', description: 'Places, geocoding, directions', category: 'data', docsUrl: 'https://developers.google.com/maps' },
  { name: 'Vercel', envKey: 'VERCEL_TOKEN', description: 'Deployment status and project management', category: 'devops', docsUrl: 'https://vercel.com/docs' },
  { name: 'n8n', envKey: 'N8N_API_KEY', description: 'Workflow automation — 400+ integrations', category: 'automation', docsUrl: 'https://docs.n8n.io' },
  { name: 'Twilio', envKey: 'TWILIO_AUTH_TOKEN', description: 'SMS, voice, WhatsApp, video — programmable communications', category: 'communications', docsUrl: 'https://www.twilio.com/docs' },
  { name: 'SendGrid', envKey: 'SENDGRID_API_KEY', description: 'Transactional & marketing email delivery', category: 'communications', docsUrl: 'https://docs.sendgrid.com' },
  { name: 'Resend', envKey: 'RESEND_API_KEY', description: 'Modern email API for developers', category: 'communications', docsUrl: 'https://resend.com/docs' },
  { name: 'Plaid', envKey: 'PLAID_SECRET', description: 'Banking data, account linking, financial connections', category: 'finance', docsUrl: 'https://plaid.com/docs' },
  { name: 'Upstash', envKey: 'UPSTASH_REDIS_REST_TOKEN', description: 'Serverless Redis, Kafka, QStash — edge-ready data', category: 'infrastructure', docsUrl: 'https://upstash.com/docs' },
  { name: 'OpenAI', envKey: 'OPENAI_API_KEY', description: 'GPT-4, DALL-E, Whisper — alternative AI provider', category: 'ai', docsUrl: 'https://platform.openai.com/docs' },
];

// ---------------------------------------------------------------------------
// Enterprise Integration State Machine
// ---------------------------------------------------------------------------

/** Connection lifecycle states */
export type ConnectionFlowState =
  | 'disconnected'       // No connection exists
  | 'initiating'         // User clicked Connect, redirecting to provider
  | 'authenticating'     // OAuth flow in progress at provider
  | 'exchanging'         // Callback received, exchanging code for token
  | 'active'             // Token stored, connection live
  | 'refreshing'         // Token expired, auto-refresh in progress
  | 'degraded'           // Intermittent failures, but token exists
  | 'expired'            // Token expired, refresh failed
  | 'revoked'            // User or provider revoked access
  | 'error';             // Unrecoverable error

/** Token source provenance */
export type TokenSource = 'oauth' | 'env' | 'inherited' | 'manual';

/** Enriched connection with full metadata for the enterprise UI */
export interface EnrichedConnection {
  provider: OAuthProvider | string;
  name: string;
  description: string;
  category: IntegrationCategory;

  // Connection state
  flowState: ConnectionFlowState;
  connected: boolean;

  // Identity
  userName?: string;
  userAvatar?: string;
  providerId?: string;

  // Token provenance
  tokenSource: TokenSource;
  tokenSourceLabel: string; // e.g., "Vercel Env → mcv-one-desktop (production)"
  scopes: string[];
  grantedScopes?: string[]; // What was actually granted vs requested

  // Lifecycle
  connectedAt?: string;
  lastUsedAt?: string;
  lastRefreshedAt?: string;
  expiresAt?: string;
  refreshable: boolean;

  // Health
  lastTestResult?: { success: boolean; latencyMs: number; testedAt: string };
  errorMessage?: string;
  consecutiveFailures: number;

  // Consumption — which features/kits use this integration
  consumers: string[];

  // Metadata
  docsUrl?: string;
  configuredVia: 'settings' | 'env' | 'api';
  favorite: boolean;
}

/** Integration categories for tabbed/grouped UI */
export type IntegrationCategory =
  | 'source-control'   // GitHub, Linear
  | 'productivity'     // Google Workspace, Notion
  | 'infrastructure'   // Cloudflare, Vercel, Upstash
  | 'ai'              // Claude, Gemini, OpenAI
  | 'voice'           // Deepgram, ElevenLabs
  | 'data'            // Google Maps, analytics
  | 'automation'      // n8n
  | 'devops'          // Vercel, CI/CD
  | 'communications'  // Twilio, SendGrid, Resend, Slack
  | 'finance'         // Stripe, Plaid
  | 'design'          // Figma
  | 'community';      // Discord

/** Category display metadata */
export const CATEGORY_META: Record<IntegrationCategory, { label: string; icon: string; order: number }> = {
  'source-control': { label: 'Source Control', icon: 'GitBranch', order: 0 },
  'productivity': { label: 'Productivity', icon: 'Layout', order: 1 },
  'ai': { label: 'AI & Intelligence', icon: 'Zap', order: 2 },
  'finance': { label: 'Finance & Payments', icon: 'Wallet', order: 3 },
  'communications': { label: 'Communications', icon: 'MessageSquare', order: 4 },
  'infrastructure': { label: 'Infrastructure', icon: 'Cloud', order: 5 },
  'devops': { label: 'DevOps', icon: 'Radio', order: 6 },
  'voice': { label: 'Voice & Audio', icon: 'Mic', order: 7 },
  'data': { label: 'Data Services', icon: 'Database', order: 8 },
  'automation': { label: 'Automation', icon: 'Workflow', order: 9 },
  'design': { label: 'Design', icon: 'Palette', order: 10 },
  'community': { label: 'Community', icon: 'Users', order: 11 },
};

/** Provider → category mapping */
export const PROVIDER_CATEGORIES: Record<string, IntegrationCategory> = {
  github: 'source-control',
  google: 'productivity',
  notion: 'productivity',
  cloudflare: 'infrastructure',
  stripe: 'finance',
  slack: 'communications',
  discord: 'community',
  linear: 'source-control',
  figma: 'design',
};

/** Which kits/features consume each provider */
export const PROVIDER_CONSUMERS: Record<string, string[]> = {
  // OAuth providers
  github: ['GitHub Operations Kit', 'Forge View', 'Engineering Dashboard', 'Pipeline View'],
  google: ['Gemini Kit', 'Drive Kit', 'Docs Hub', 'AI Studio', 'Calendar Sync'],
  notion: ['Notion Kit', 'Docs Hub', 'Knowledge Base'],
  cloudflare: ['Cloudflare Kit', 'Ops Panel', 'DNS Management', 'Workers Deploy'],
  stripe: ['Treasury View', 'Revenue Analytics', 'Subscription Management', 'CRM Deals'],
  slack: ['Notifications', 'Team Alerts', 'Agent Reports', 'War Room'],
  discord: ['Community Management', 'WarForge Integration', 'mcv.gg Bot'],
  linear: ['Task Management', 'Sprint Planning', 'Engineering Dashboard'],
  figma: ['Design System Sync', 'Asset Library', 'Component Preview'],
  // API key services
  'Claude API': ['Aegis Chat', 'Agent Orchestrator', 'All Kit Tool Calls'],
  'Deepgram': ['Voice Input (STT)', 'Aegis Chat Mic'],
  'ElevenLabs': ['Voice Output (TTS)', 'Aegis Chat Speak'],
  'Google AI': ['Gemini Kit', 'Context Caching', 'File Bridge', 'Hybrid Compute'],
  'Google Maps': ['Gemini Kit (Places)', 'Geocoding'],
  'Vercel': ['Vercel Kit', 'Deployment Dashboard', 'Ops Panel'],
  'n8n': ['n8n Kit', 'Workflow Automation'],
  'Twilio': ['SMS Notifications', 'Voice Calls', 'WhatsApp', 'CRM Outreach'],
  'SendGrid': ['Email Campaigns', 'Transactional Email', 'Growth Automation'],
  'Resend': ['Developer Email', 'Transactional Notifications'],
  'Plaid': ['Bank Account Linking', 'Financial Data', 'Treasury Dashboard', 'Futurestate RWA'],
  'Upstash': ['Edge Cache', 'Rate Limiting', 'Queue Processing'],
  'OpenAI': ['Alternative AI Provider', 'DALL-E Images', 'Whisper Transcription'],
};
