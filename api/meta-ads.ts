import { requireAuth } from './_auth.js';
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

      // ── CRUD: Campaigns ──
      case 'create-campaign': {
        const { name, objective = 'OUTCOME_AWARENESS', status = 'PAUSED', daily_budget, lifetime_budget, special_ad_categories = [] } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        const body: Record<string, unknown> = { name, objective, status, special_ad_categories };
        if (daily_budget) body.daily_budget = daily_budget;
        if (lifetime_budget) body.lifetime_budget = lifetime_budget;
        return res.json(await metaPost(`/act_${accountId}/campaigns`, body));
      }

      case 'update-campaign': {
        const { campaignId, name: cName, status: cStatus, daily_budget: cBudget } = req.body;
        if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
        const body: Record<string, unknown> = {};
        if (cName) body.name = cName;
        if (cStatus) body.status = cStatus;
        if (cBudget) body.daily_budget = cBudget;
        return res.json(await metaPost(`/${campaignId}`, body));
      }

      // ── CRUD: Ad Sets ──
      case 'create-ad-set': {
        const { campaignId, name: asName, daily_budget: asBudget, optimization_goal = 'REACH', billing_event = 'IMPRESSIONS', targeting, status: asStatus = 'PAUSED', start_time, end_time } = req.body;
        if (!campaignId || !asName) return res.status(400).json({ error: 'campaignId and name required' });
        const body: Record<string, unknown> = { campaign_id: campaignId, name: asName, optimization_goal, billing_event, status: asStatus };
        if (asBudget) body.daily_budget = asBudget;
        if (targeting) body.targeting = targeting;
        if (start_time) body.start_time = start_time;
        if (end_time) body.end_time = end_time;
        return res.json(await metaPost(`/act_${accountId}/adsets`, body));
      }

      case 'update-ad-set': {
        const { adSetId, name: usName, status: usStatus, daily_budget: usBudget, targeting: usTargeting } = req.body;
        if (!adSetId) return res.status(400).json({ error: 'adSetId required' });
        const body: Record<string, unknown> = {};
        if (usName) body.name = usName;
        if (usStatus) body.status = usStatus;
        if (usBudget) body.daily_budget = usBudget;
        if (usTargeting) body.targeting = usTargeting;
        return res.json(await metaPost(`/${adSetId}`, body));
      }

      // ── CRUD: Ads ──
      case 'create-ad': {
        const { adSetId, name: adName, creative, status: adStatus = 'PAUSED' } = req.body;
        if (!adSetId || !adName || !creative) return res.status(400).json({ error: 'adSetId, name, creative required' });
        return res.json(await metaPost(`/act_${accountId}/ads`, { adset_id: adSetId, name: adName, creative, status: adStatus }));
      }

      case 'update-ad': {
        const { adId, name: uaName, status: uaStatus } = req.body;
        if (!adId) return res.status(400).json({ error: 'adId required' });
        const body: Record<string, unknown> = {};
        if (uaName) body.name = uaName;
        if (uaStatus) body.status = uaStatus;
        return res.json(await metaPost(`/${adId}`, body));
      }

      // ── Creatives ──
      case 'list-creatives':
        return res.json(await metaFetch(`/act_${accountId}/adcreatives`, { fields: 'id,name,title,body,image_url,thumbnail_url,object_story_spec', limit: '25' }));

      // ── Pixels ──
      case 'list-pixels':
        return res.json(await metaFetch(`/act_${accountId}/adspixels`, { fields: 'id,name,code,creation_time,last_fired_time,is_created_by_business' }));

      case 'get-pixel-stats': {
        const { pixelId } = req.query;
        if (!pixelId) return res.status(400).json({ error: 'pixelId required' });
        return res.json(await metaFetch(`/${pixelId}/stats`, {}));
      }

      // ── Lookalike Audiences ──
      case 'create-lookalike': {
        const { sourceAudienceId, country, ratio = '0.01' } = req.body;
        if (!sourceAudienceId || !country) return res.status(400).json({ error: 'sourceAudienceId and country required' });
        return res.json(await metaPost(`/act_${accountId}/customaudiences`, {
          subtype: 'LOOKALIKE', origin_audience_id: sourceAudienceId,
          lookalike_spec: JSON.stringify({ country, ratio: Number(ratio), type: 'similarity' }),
        }));
      }

      // ── Lead Forms ──
      case 'list-lead-forms': {
        const { pageId } = req.query;
        if (!pageId) return res.status(400).json({ error: 'pageId required' });
        return res.json(await metaFetch(`/${pageId}/leadgen_forms`, { fields: 'id,name,status,leads_count,created_time' }));
      }

      case 'get-leads': {
        const { formId, limit: leadLimit = '25' } = req.query;
        if (!formId) return res.status(400).json({ error: 'formId required' });
        return res.json(await metaFetch(`/${formId}/leads`, { limit: leadLimit as string }));
      }

      // ── Catalog / Product Sets ──
      case 'list-catalogs':
        return res.json(await metaFetch(`/act_${accountId}/owned_product_catalogs`, { fields: 'id,name,product_count' }));

      case 'catalog-products': {
        const { catalogId, limit: prodLimit = '25' } = req.query;
        if (!catalogId) return res.status(400).json({ error: 'catalogId required' });
        return res.json(await metaFetch(`/${catalogId}/products`, { fields: 'id,name,price,image_url,url,availability', limit: prodLimit as string }));
      }

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
