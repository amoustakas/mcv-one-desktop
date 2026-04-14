import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}


// ---------------------------------------------------------------------------
// LinkedIn API v2 — profile, posts, connections, companies, shares
// Uses LinkedIn OAuth 2.0 token with OpenID Connect
// ---------------------------------------------------------------------------

const LI_API = 'https://api.linkedin.com/v2';

async function liFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${LI_API}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `LinkedIn API ${res.status}`);
  }
  return res.json();
}

async function liPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${LI_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `LinkedIn API ${res.status}`);
  }
  if (res.status === 201) return { success: true, location: res.headers.get('x-restli-id') };
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try {
    const result = await getProviderToken(userId, 'linkedin');
    token = result.token;
  } catch {
    return res.status(500).json({ error: 'LinkedIn not connected. Add in Settings > Integrations.' });
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Profile ──
      case 'me': {
        const profile = await liFetch('/userinfo', token);
        return res.json(profile);
      }

      case 'my-profile': {
        const profile = await liFetch('/me', token, {
          projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
        });
        return res.json(profile);
      }

      // ── Posts / Shares ──
      case 'create-post': {
        const { text, visibility = 'PUBLIC' } = req.body;
        if (!text) return res.status(400).json({ error: 'text required' });

        // Get person URN
        const me = await liFetch('/userinfo', token);
        const personUrn = `urn:li:person:${me.sub}`;

        return res.json(await liPost('/ugcPosts', token, {
          author: personUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': visibility },
        }));
      }

      case 'my-posts': {
        const me = await liFetch('/userinfo', token);
        const personUrn = `urn:li:person:${me.sub}`;
        return res.json(await liFetch('/ugcPosts', token, {
          q: 'authors',
          authors: `List(${encodeURIComponent(personUrn)})`,
          count: '10',
        }));
      }

      // ── Connections ──
      case 'connection-count': {
        const data = await liFetch('/connections', token, { q: 'viewer', start: '0', count: '0' });
        return res.json({ total: data._total ?? 0 });
      }

      // ── Company Pages ──
      case 'get-company': {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: 'companyId required' });
        return res.json(await liFetch(`/organizations/${companyId}`, token, {
          projection: '(id,name,description,vanityName,logoV2,staffCountRange,industries,websiteUrl)',
        }));
      }

      case 'company-followers': {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: 'companyId required' });
        return res.json(await liFetch(`/organizationalEntityFollowerStatistics`, token, {
          q: 'organizationalEntity',
          organizationalEntity: `urn:li:organization:${companyId}`,
        }));
      }

      // ── Share Stats ──
      case 'share-stats': {
        const { shareId } = req.query;
        if (!shareId) return res.status(400).json({ error: 'shareId required' });
        return res.json(await liFetch('/socialActions/' + encodeURIComponent(shareId as string), token));
      }

      // ── Delete Post ──
      case 'delete-post': {
        const { postUrn } = req.body;
        if (!postUrn) return res.status(400).json({ error: 'postUrn required' });
        const r = await fetch(`${LI_API}/ugcPosts/${encodeURIComponent(postUrn)}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0' },
        });
        return res.json({ deleted: r.ok });
      }

      // ── Ads: Ad Accounts ──
      case 'list-ad-accounts': {
        const me = await liFetch('/userinfo', token);
        return res.json(await liFetch('/adAccountsV2', token, { q: 'search', 'search.status.values[0]': 'ACTIVE', count: '25' }));
      }

      // ── Ads: Campaigns ──
      case 'list-ad-campaigns': {
        const { accountId: adAcct } = req.query;
        if (!adAcct) return res.status(400).json({ error: 'accountId required' });
        return res.json(await liFetch('/adCampaignsV2', token, { q: 'search', 'search.account.values[0]': `urn:li:sponsoredAccount:${adAcct}`, count: '25' }));
      }

      case 'create-ad-campaign': {
        const { accountId: adAcct, name: campName, objective = 'BRAND_AWARENESS', status: campStatus = 'DRAFT', dailyBudget } = req.body;
        if (!adAcct || !campName) return res.status(400).json({ error: 'accountId and name required' });
        return res.json(await liPost('/adCampaignsV2', token, {
          account: `urn:li:sponsoredAccount:${adAcct}`, name: campName,
          objectiveType: objective, status: campStatus, type: 'SPONSORED_UPDATES',
          dailyBudget: dailyBudget ? { amount: String(dailyBudget), currencyCode: 'USD' } : undefined,
        }));
      }

      // ── Ads: Creatives ──
      case 'list-ad-creatives': {
        const { campaignId } = req.query;
        if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
        return res.json(await liFetch('/adCreativesV2', token, { q: 'search', 'search.campaign.values[0]': `urn:li:sponsoredCampaign:${campaignId}`, count: '25' }));
      }

      // ── Ads: Analytics ──
      case 'ad-analytics': {
        const { accountId: adAcct, campaignId, dateRange = 'last_30_days', granularity = 'DAILY' } = req.query;
        const pivot = campaignId ? `&campaigns[0]=urn:li:sponsoredCampaign:${campaignId}` : '';
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await liFetch(`/adAnalyticsV2?q=analytics&pivot=CAMPAIGN&dateRange.start.day=${start.split('-')[2]}&dateRange.start.month=${start.split('-')[1]}&dateRange.start.year=${start.split('-')[0]}&dateRange.end.day=${end.split('-')[2]}&dateRange.end.month=${end.split('-')[1]}&dateRange.end.year=${end.split('-')[0]}&timeGranularity=${granularity}${pivot}&accounts[0]=urn:li:sponsoredAccount:${adAcct}`, token));
      }

      // ── Profile Analytics ──
      case 'profile-views': {
        const me = await liFetch('/userinfo', token);
        return res.json(await liFetch('/networkSizes/' + encodeURIComponent(`urn:li:person:${me.sub}`) + '?edgeType=CompanyFollowedByMember', token));
      }

      // ── Organization Admin ──
      case 'list-admin-orgs': {
        const me = await liFetch('/userinfo', token);
        return res.json(await liFetch('/organizationalEntityAcls', token, {
          q: 'roleAssignee', role: 'ADMINISTRATOR', state: 'APPROVED',
          projection: '(elements*(organizationalTarget~(id,name,vanityName)))',
        }));
      }

      // ── Organization Posts ──
      case 'org-posts': {
        const { orgId } = req.query;
        if (!orgId) return res.status(400).json({ error: 'orgId required' });
        return res.json(await liFetch('/ugcPosts', token, {
          q: 'authors', authors: `List(${encodeURIComponent(`urn:li:organization:${orgId}`)})`, count: '10',
        }));
      }

      // ── Overview ──
      case 'overview': {
        const profile = await liFetch('/userinfo', token);
        return res.json({
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          sub: profile.sub,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
