import { getProviderConfig, encryptToken, storeOAuthConnection } from "../_oauth-helper";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// OAuth Callback — Handles the redirect from the OAuth provider
// ---------------------------------------------------------------------------
// GET /api/oauth/callback?code=...&state=provider:userId:nonce
// Exchanges authorization code for tokens, stores encrypted in Supabase,
// then redirects back to the SPA settings page.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  // Handle provider errors (user denied, etc.)
  if (error) {
    return res.redirect(302, `/settings?tab=integrations&error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(302, '/settings?tab=integrations&error=missing_code');
  }

  // Parse state: "provider:userId:nonce"
  const [provider, userId, _nonce] = state.split(':');
  if (!provider || !userId) {
    return res.redirect(302, '/settings?tab=integrations&error=invalid_state');
  }

  try {
    const config = getProviderConfig(provider);
    const origin = `https://${req.headers.host}`;
    const callbackUrl = `${origin}/api/oauth/callback`;

    // Exchange code for tokens
    let tokenResponse: Response;

    if (provider === 'notion') {
      // Notion uses Basic auth for token exchange
      const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
        }),
      });
    } else {
      // Standard OAuth 2.0 token exchange
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      });

      tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
      });
    }

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text().catch(() => 'Token exchange failed');
      console.error(`OAuth token exchange failed for ${provider}:`, errText);
      return res.redirect(302, `/settings?tab=integrations&error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const expiresIn = tokenData.expires_in || null;

    if (!accessToken) {
      return res.redirect(302, `/settings?tab=integrations&error=no_access_token`);
    }

    // Fetch user info from provider
    let providerUserId = '';
    let providerUserName = '';
    let scopes = config.scopes;

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };

      if (provider === 'notion') {
        headers.Authorization = `Bearer ${accessToken}`;
        headers['Notion-Version'] = '2022-06-28';
      } else if (provider === 'cloudflare') {
        headers.Authorization = `Bearer ${accessToken}`;
      } else {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      // For GitHub, also need the API version header
      if (provider === 'github') {
        headers['X-GitHub-Api-Version'] = '2022-11-28';
      }

      const userRes = await fetch(config.userInfoUrl, { headers });
      if (userRes.ok) {
        const userData = await userRes.json();

        switch (provider) {
          case 'github':
            providerUserId = String(userData.id);
            providerUserName = userData.login || userData.name || '';
            break;
          case 'google':
            providerUserId = userData.id || '';
            providerUserName = userData.name || userData.email || '';
            break;
          case 'notion':
            providerUserId = tokenData.workspace_id || userData.id || '';
            providerUserName = tokenData.workspace_name || userData.name || '';
            // Notion returns bot info with workspace details
            break;
          case 'cloudflare':
            providerUserId = userData.result?.id || '';
            providerUserName = userData.result?.email || '';
            break;
        }
      }
    } catch {
      // User info fetch failed — store connection anyway
      providerUserId = 'unknown';
      providerUserName = provider;
    }

    // Parse granted scopes if provided
    if (tokenData.scope) {
      scopes = typeof tokenData.scope === 'string' ? tokenData.scope.split(/[, ]+/) : tokenData.scope;
    }

    // Store encrypted connection in Supabase
    await storeOAuthConnection(
      userId,
      provider,
      accessToken,
      refreshToken,
      expiresIn,
      scopes,
      providerUserId,
      providerUserName,
    );

    // Redirect back to SPA
    return res.redirect(302, `/settings?tab=integrations&connected=${provider}`);
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error);
    return res.redirect(302, `/settings?tab=integrations&error=callback_failed`);
  }
}
