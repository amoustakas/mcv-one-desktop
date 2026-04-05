import { apiGet, apiPost } from './client';
import type { ConnectionStatus } from '../types/oauth';

// ---------------------------------------------------------------------------
// OAuth Client API
// ---------------------------------------------------------------------------

interface OAuthStatusResponse {
  connections: ConnectionStatus[];
  health: Record<string, boolean>;
}

interface OAuthConnectResponse {
  redirectUrl: string;
}

interface OAuthTestResponse {
  success: boolean;
  provider: string;
  source: 'oauth' | 'env';
  latency?: number;
  userName?: string;
  error?: string;
}

/** Fetch OAuth connection statuses + API key health for current user */
export async function getOAuthStatus(): Promise<OAuthStatusResponse> {
  return apiGet<OAuthStatusResponse>('/api/oauth/status');
}

/** Initiate OAuth flow — returns redirect URL */
export async function initiateOAuth(provider: string): Promise<string> {
  const data = await apiGet<OAuthConnectResponse>('/api/oauth/connect', { provider });
  return data.redirectUrl;
}

/** Disconnect an OAuth provider */
export async function disconnectOAuth(provider: string): Promise<void> {
  await apiPost('/api/oauth/disconnect', { provider });
}

/** Test an OAuth connection */
export async function testOAuthConnection(provider: string): Promise<OAuthTestResponse> {
  return apiPost<OAuthTestResponse>('/api/oauth/test', { provider });
}
