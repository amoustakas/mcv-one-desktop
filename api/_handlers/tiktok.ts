import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
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
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
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

      // ── CRUD: Campaigns ──
      case 'create-campaign': {
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const { campaignName, objectiveType = 'TRAFFIC', budget, budgetMode = 'BUDGET_MODE_DAY' } = req.body;
        if (!campaignName) return res.status(400).json({ error: 'campaignName required' });
        return res.json(await ttBizPost('/campaign/create/', { advertiser_id: advId, campaign_name: campaignName, objective_type: objectiveType, budget, budget_mode: budgetMode }));
      }

      case 'update-campaign': {
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const { campaignId, campaignName, budget, status: campStatus } = req.body;
        if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
        const body: Record<string, unknown> = { advertiser_id: advId, campaign_id: campaignId };
        if (campaignName) body.campaign_name = campaignName;
        if (budget) body.budget = budget;
        if (campStatus) body.operation_status = campStatus;
        return res.json(await ttBizPost('/campaign/update/', body));
      }

      // ── CRUD: Ad Groups ──
      case 'create-ad-group': {
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const { campaignId, adgroupName, budget, optimizationGoal, placements = ['PLACEMENT_TIKTOK'] } = req.body;
        if (!campaignId || !adgroupName) return res.status(400).json({ error: 'campaignId and adgroupName required' });
        return res.json(await ttBizPost('/adgroup/create/', { advertiser_id: advId, campaign_id: campaignId, adgroup_name: adgroupName, budget, optimization_goal: optimizationGoal, placements }));
      }

      case 'update-ad-group': {
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const { adgroupId, adgroupName, budget, status: agStatus } = req.body;
        if (!adgroupId) return res.status(400).json({ error: 'adgroupId required' });
        const body: Record<string, unknown> = { advertiser_id: advId, adgroup_id: adgroupId };
        if (adgroupName) body.adgroup_name = adgroupName;
        if (budget) body.budget = budget;
        if (agStatus) body.operation_status = agStatus;
        return res.json(await ttBizPost('/adgroup/update/', body));
      }

      // ── CRUD: Ads ──
      case 'create-ad': {
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const { adgroupId, adName, creatives } = req.body;
        if (!adgroupId || !adName || !creatives) return res.status(400).json({ error: 'adgroupId, adName, creatives required' });
        return res.json(await ttBizPost('/ad/create/', { advertiser_id: advId, adgroup_id: adgroupId, ad_name: adName, creatives }));
      }

      case 'update-ad-status': {
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const { adIds, status: adStatus } = req.body;
        if (!adIds || !adStatus) return res.status(400).json({ error: 'adIds and status required' });
        return res.json(await ttBizPost('/ad/status/update/', { advertiser_id: advId, ad_ids: adIds, operation_status: adStatus }));
      }

      // ── Targeting ──
      case 'list-interest-categories': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/tool/interest_category/', { advertiser_id: advId }));
      }

      case 'list-action-categories': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/tool/action_category/', { advertiser_id: advId }));
      }

      // ── Pixel / Events ──
      case 'list-pixels': {
        const advId = (req.query.advertiserId || ADVERTISER_ID) as string;
        return res.json(await ttBizFetch('/pixel/list/', { advertiser_id: advId }));
      }

      case 'create-pixel': {
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const { pixelName } = req.body;
        if (!pixelName) return res.status(400).json({ error: 'pixelName required' });
        return res.json(await ttBizPost('/pixel/create/', { advertiser_id: advId, pixel_name: pixelName }));
      }

      // ── Ad-Level Report ──
      case 'ad-report': {
        const advId = req.body.advertiserId || ADVERTISER_ID;
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await ttBizPost('/report/integrated/get/', {
          advertiser_id: advId, report_type: 'BASIC', data_level: 'AUCTION_AD',
          dimensions: ['ad_id', 'stat_time_day'],
          metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions'],
          start_date: start, end_date: end, page_size: 50,
        }));
      }

      // ── Overview ──
      case 'overview':
        return res.json({
          configured: !!ACCESS_TOKEN, advertiser_id: ADVERTISER_ID || 'not set',
          capabilities: ['CRUD campaigns', 'CRUD ad groups', 'CRUD ads', 'targeting', 'pixels', 'reports', 'audiences'],
        });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
