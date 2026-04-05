import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// TikTok API — user info, videos, analytics, business center, ads
// Covers TikTok for Business + Creator APIs
// ---------------------------------------------------------------------------

const TT_API = 'https://open.tiktokapis.com/v2';
const TT_BUSINESS = 'https://business-api.tiktok.com/open_api/v1.3';
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '';
const ADVERTISER_ID = process.env.TIKTOK_ADVERTISER_ID || '';

async function ttFetch(url: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}${qs ? '?' + qs : ''}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `TikTok ${res.status}`); }
  return res.json();
}

async function ttBizFetch(path: string, params: Record<string, string> = {}) {
  if (!ACCESS_TOKEN) throw new Error('TIKTOK_ACCESS_TOKEN not configured');
  const qs = new URLSearchParams({ ...params, access_token: ACCESS_TOKEN }).toString();
  const res = await fetch(`${TT_BUSINESS}${path}?${qs}`);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `TikTok ${res.status}`); }
  return res.json();
}

async function ttBizPost(path: string, body: unknown) {
  if (!ACCESS_TOKEN) throw new Error('TIKTOK_ACCESS_TOKEN not configured');
  const res = await fetch(`${TT_BUSINESS}${path}?access_token=${ACCESS_TOKEN}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `TikTok ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── User Info (Creator API) ──
      case 'user-info':
        return res.json(await ttFetch(`${TT_API}/user/info/`, ACCESS_TOKEN, { fields: 'open_id,union_id,avatar_url,display_name,bio_description,follower_count,following_count,likes_count,video_count,is_verified' }));

      // ── Videos ──
      case 'list-videos': {
        const { maxCount = '20' } = req.query;
        return res.json(await ttBizPost('/user/video/list/', { business_id: ADVERTISER_ID, max_count: Number(maxCount) }));
      }

      // ── Ads: Campaigns ──
      case 'list-campaigns': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/campaign/get/', { advertiser_id: advId, page_size: '20' }));
      }

      case 'campaign-metrics': {
        const { campaignIds, startDate, endDate } = req.body;
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const end = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await ttBizPost('/report/integrated/get/', {
          advertiser_id: advId,
          report_type: 'BASIC', data_level: 'AUCTION_CAMPAIGN',
          dimensions: ['campaign_id', 'stat_time_day'],
          metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions', 'cost_per_conversion'],
          start_date: start, end_date: end,
          filters: campaignIds ? [{ field_name: 'campaign_ids', filter_type: 'IN', filter_value: JSON.stringify(campaignIds) }] : undefined,
          page_size: 50,
        }));
      }

      // ── Ads: Ad Groups ──
      case 'list-ad-groups': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/adgroup/get/', { advertiser_id: advId, page_size: '20' }));
      }

      // ── Ads: Creatives ──
      case 'list-ads': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/ad/get/', { advertiser_id: advId, page_size: '20' }));
      }

      // ── Audiences ──
      case 'list-audiences': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/dmp/custom_audience/list/', { advertiser_id: advId, page_size: '20' }));
      }

      // ── Account Report ──
      case 'account-report': {
        const advId = (req.body?.advertiserId || ADVERTISER_ID) as string;
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await ttBizPost('/report/integrated/get/', {
          advertiser_id: advId,
          report_type: 'BASIC', data_level: 'AUCTION_ADVERTISER',
          dimensions: ['stat_time_day'],
          metrics: ['spend', 'impressions', 'clicks', 'ctr', 'conversions', 'reach'],
          start_date: start, end_date: end,
          page_size: 31,
        }));
      }

      // ── Advertiser Info ──
      case 'advertiser-info': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/advertiser/info/', { advertiser_ids: `["${advId}"]` }));
      }

      // ── Pixel / Events ──
      case 'list-pixels': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/pixel/list/', { advertiser_id: advId }));
      }

      // ── Overview ──
      case 'overview':
        return res.json({
          configured: !!ACCESS_TOKEN,
          advertiser_id: ADVERTISER_ID || 'not set',
          endpoints: ['user-info', 'list-videos', 'list-campaigns', 'campaign-metrics', 'list-ad-groups', 'list-ads', 'list-audiences', 'account-report', 'advertiser-info', 'list-pixels'],
        });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
