import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Meta Marketing API v21.0 — campaigns, ad sets, ads, audiences, insights, pages
// Covers Facebook Ads, Instagram Ads, and audience management
// ---------------------------------------------------------------------------

const GRAPH = 'https://graph.facebook.com/v21.0';
const TOKEN = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '';
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || '';

async function metaFetch(path: string, params: Record<string, string> = {}) {
  params.access_token = TOKEN;
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GRAPH}${path}?${qs}`);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Meta ${res.status}`); }
  return res.json();
}

async function metaPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${GRAPH}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: TOKEN }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Meta ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!TOKEN) return res.status(500).json({ error: 'META_ACCESS_TOKEN not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const accountId = ((req.query.accountId || req.body?.accountId || AD_ACCOUNT_ID) as string);

  try {
    switch (action) {
      // ── Campaigns ──
      case 'list-campaigns':
        return res.json(await metaFetch(`/act_${accountId}/campaigns`, { fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time', limit: '25' }));

      case 'campaign-insights': {
        const { campaignId, datePreset = 'last_30d' } = req.query;
        if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
        return res.json(await metaFetch(`/${campaignId}/insights`, { fields: 'impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,conversions,actions', date_preset: datePreset as string }));
      }

      // ── Ad Sets ──
      case 'list-ad-sets':
        return res.json(await metaFetch(`/act_${accountId}/adsets`, { fields: 'id,name,status,daily_budget,targeting,optimization_goal,bid_amount,campaign_id', limit: '25' }));

      case 'ad-set-insights': {
        const { adSetId, datePreset = 'last_30d' } = req.query;
        if (!adSetId) return res.status(400).json({ error: 'adSetId required' });
        return res.json(await metaFetch(`/${adSetId}/insights`, { fields: 'impressions,clicks,ctr,cpc,spend,reach,conversions,actions', date_preset: datePreset as string }));
      }

      // ── Ads ──
      case 'list-ads':
        return res.json(await metaFetch(`/act_${accountId}/ads`, { fields: 'id,name,status,creative,adset_id,campaign_id,created_time', limit: '25' }));

      case 'ad-insights': {
        const { adId, datePreset = 'last_30d' } = req.query;
        if (!adId) return res.status(400).json({ error: 'adId required' });
        return res.json(await metaFetch(`/${adId}/insights`, { fields: 'impressions,clicks,ctr,cpc,spend,reach,conversions,actions,cost_per_action_type', date_preset: datePreset as string }));
      }

      // ── Audiences ──
      case 'list-audiences':
        return res.json(await metaFetch(`/act_${accountId}/customaudiences`, { fields: 'id,name,approximate_count,subtype,delivery_status', limit: '25' }));

      case 'list-saved-audiences':
        return res.json(await metaFetch(`/act_${accountId}/saved_audiences`, { fields: 'id,name,approximate_count,targeting', limit: '25' }));

      // ── Account Insights ──
      case 'account-insights': {
        const { datePreset = 'last_30d', breakdown } = req.query;
        const params: Record<string, string> = { fields: 'impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,conversions,cost_per_action_type', date_preset: datePreset as string };
        if (breakdown) params.breakdowns = breakdown as string; // age, gender, platform_position, etc.
        return res.json(await metaFetch(`/act_${accountId}/insights`, params));
      }

      // ── Pages ──
      case 'list-pages':
        return res.json(await metaFetch('/me/accounts', { fields: 'id,name,category,fan_count,verification_status' }));

      case 'page-insights': {
        const { pageId, metric = 'page_impressions,page_engaged_users,page_fans', period = 'day' } = req.query;
        if (!pageId) return res.status(400).json({ error: 'pageId required' });
        return res.json(await metaFetch(`/${pageId}/insights`, { metric: metric as string, period: period as string }));
      }

      // ── Instagram ──
      case 'instagram-account': {
        const { pageId } = req.query;
        if (!pageId) return res.status(400).json({ error: 'pageId required' });
        return res.json(await metaFetch(`/${pageId}`, { fields: 'instagram_business_account{id,username,followers_count,media_count,biography,profile_picture_url}' }));
      }

      case 'instagram-media': {
        const { igAccountId, limit: mediaLimit = '20' } = req.query;
        if (!igAccountId) return res.status(400).json({ error: 'igAccountId required' });
        return res.json(await metaFetch(`/${igAccountId}/media`, { fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink', limit: mediaLimit as string }));
      }

      case 'instagram-insights': {
        const { igAccountId, metric = 'impressions,reach,profile_views,follower_count', period = 'day' } = req.query;
        if (!igAccountId) return res.status(400).json({ error: 'igAccountId required' });
        return res.json(await metaFetch(`/${igAccountId}/insights`, { metric: metric as string, period: period as string }));
      }

      // ── Ad Account ──
      case 'account-info':
        return res.json(await metaFetch(`/act_${accountId}`, { fields: 'id,name,account_status,currency,timezone_name,balance,amount_spent,business_name' }));

      case 'overview': {
        const [account, insights] = await Promise.all([
          metaFetch(`/act_${accountId}`, { fields: 'name,currency,amount_spent,balance' }),
          metaFetch(`/act_${accountId}/insights`, { fields: 'impressions,clicks,spend,reach', date_preset: 'last_7d' }).catch(() => ({})),
        ]);
        const row = insights.data?.[0];
        return res.json({
          account: account.name, currency: account.currency,
          total_spent: account.amount_spent, balance: account.balance,
          impressions_7d: row?.impressions, clicks_7d: row?.clicks,
          spend_7d: row?.spend, reach_7d: row?.reach,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
