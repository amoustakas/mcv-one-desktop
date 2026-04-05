// ---------------------------------------------------------------------------
// OAuth Integration Types
// ---------------------------------------------------------------------------

export type OAuthProvider = 'github' | 'google' | 'notion' | 'cloudflare';

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
};

/** Services that only support API key auth (no OAuth) */
export interface ApiKeyService {
  name: string;
  description: string;
  envKey: string;
}

export const API_KEY_SERVICES: ApiKeyService[] = [
  { name: 'Claude API', envKey: 'ANTHROPIC_API_KEY', description: 'AI chat, reasoning, and code generation' },
  { name: 'Deepgram', envKey: 'DEEPGRAM_API_KEY', description: 'Speech-to-text transcription' },
  { name: 'ElevenLabs', envKey: 'ELEVENLABS_API_KEY', description: 'Text-to-speech voice synthesis' },
  { name: 'Google AI', envKey: 'GOOGLE_AI_KEY', description: 'Gemini Pro, Flash, Imagen, embeddings' },
  { name: 'Google Maps', envKey: 'GOOGLE_MAPS_KEY', description: 'Places, geocoding, directions' },
  { name: 'Vercel', envKey: 'VERCEL_TOKEN', description: 'Deployment status and project management' },
  { name: 'n8n', envKey: 'N8N_API_KEY', description: 'Workflow automation — 400+ integrations' },
];
