import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Google Ads API v17 — campaigns, ad groups, ads, keywords, budgets, reports
// Uses Google Ads REST API with OAuth token
// ---------------------------------------------------------------------------

const GADS_API = 'https://googleads.googleapis.com/v17';
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID || '';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const t = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function gadsQuery(customerId: string, query: string, token: string) {
  const cid = customerId.replace(/-/g, '');
  const res = await fetch(`${GADS_API}/customers/${cid}/googleAds:searchStream`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'developer-token': DEVELOPER_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Google Ads ${res.status}`); }
  return res.json();
}

async function gadsMutate(customerId: string, operations: unknown[], token: string) {
  const cid = customerId.replace(/-/g, '');
  const res = await fetch(`${GADS_API}/customers/${cid}/googleAds:mutate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'developer-token': DEVELOPER_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutateOperations: operations }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Google Ads mutate ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!DEVELOPER_TOKEN) return res.status(500).json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN not configured' });

  let token: string;
  try { token = (await getProviderToken(userId, 'google')).token; }
  catch { return res.status(500).json({ error: 'Google not connected.' }); }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const customerId = ((req.query.customerId || req.body?.customerId || CUSTOMER_ID) as string).replace(/-/g, '');

  try {
    switch (action) {
      case 'list-campaigns':
        return res.json(await gadsQuery(customerId, `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.status != 'REMOVED' ORDER BY metrics.impressions DESC LIMIT 25`, token));

      case 'campaign-performance': {
        const { dateRange = 'LAST_30_DAYS' } = req.query;
        return res.json(await gadsQuery(customerId, `SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.cost_per_conversion FROM campaign WHERE segments.date DURING ${dateRange} AND campaign.status = 'ENABLED' ORDER BY metrics.cost_micros DESC LIMIT 20`, token));
      }

      case 'list-ad-groups':
        return res.json(await gadsQuery(customerId, `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.campaign, metrics.impressions, metrics.clicks, metrics.cost_micros FROM ad_group WHERE ad_group.status != 'REMOVED' ORDER BY metrics.impressions DESC LIMIT 25`, token));

      case 'list-ads':
        return res.json(await gadsQuery(customerId, `SELECT ad_group_ad.ad.id, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.status, metrics.impressions, metrics.clicks, metrics.ctr FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED' ORDER BY metrics.impressions DESC LIMIT 25`, token));

      case 'list-keywords':
        return res.json(await gadsQuery(customerId, `SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED' ORDER BY metrics.impressions DESC LIMIT 30`, token));

      case 'budget-summary':
        return res.json(await gadsQuery(customerId, `SELECT campaign_budget.name, campaign_budget.amount_micros, campaign_budget.total_amount_micros, campaign_budget.status, campaign_budget.delivery_method FROM campaign_budget LIMIT 20`, token));

      case 'account-summary':
        return res.json(await gadsQuery(customerId, `SELECT metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros, metrics.conversions, metrics.cost_per_conversion, metrics.average_cpc FROM customer WHERE segments.date DURING LAST_30_DAYS`, token));

      case 'search-terms':
        return res.json(await gadsQuery(customerId, `SELECT search_term_view.search_term, metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros, metrics.conversions FROM search_term_view WHERE segments.date DURING LAST_30_DAYS ORDER BY metrics.impressions DESC LIMIT 30`, token));

      case 'custom-query': {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'GAQL query required' });
        return res.json(await gadsQuery(customerId, query, token));
      }

      // ── CRUD: Campaigns ──
      case 'create-campaign': {
        const { name, budget_micros, channel_type = 'SEARCH', status = 'PAUSED' } = req.body;
        if (!name || !budget_micros) return res.status(400).json({ error: 'name and budget_micros required' });
        const budgetOp = { campaignBudgetOperation: { create: { name: `${name} Budget`, amountMicros: String(budget_micros), deliveryMethod: 'STANDARD' } } };
        const campOp = { campaignOperation: { create: { name, status, advertisingChannelType: channel_type, campaignBudget: `customers/${customerId}/campaignBudgets/-1`, manualCpc: {} } } };
        return res.json(await gadsMutate(customerId, [budgetOp, campOp], token));
      }

      case 'update-campaign': {
        const { resourceName, status: campStatus, name: campName } = req.body;
        if (!resourceName) return res.status(400).json({ error: 'resourceName required' });
        const update: Record<string, unknown> = { resourceName };
        if (campStatus) update.status = campStatus;
        if (campName) update.name = campName;
        return res.json(await gadsMutate(customerId, [{ campaignOperation: { update, updateMask: Object.keys(update).filter(k => k !== 'resourceName').join(',') } }], token));
      }

      case 'pause-campaign': {
        const { resourceName } = req.body;
        if (!resourceName) return res.status(400).json({ error: 'resourceName required' });
        return res.json(await gadsMutate(customerId, [{ campaignOperation: { update: { resourceName, status: 'PAUSED' }, updateMask: 'status' } }], token));
      }

      case 'enable-campaign': {
        const { resourceName } = req.body;
        if (!resourceName) return res.status(400).json({ error: 'resourceName required' });
        return res.json(await gadsMutate(customerId, [{ campaignOperation: { update: { resourceName, status: 'ENABLED' }, updateMask: 'status' } }], token));
      }

      // ── CRUD: Ad Groups ──
      case 'create-ad-group': {
        const { campaignResourceName, name: agName, cpc_bid_micros = '1000000', status: agStatus = 'ENABLED' } = req.body;
        if (!campaignResourceName || !agName) return res.status(400).json({ error: 'campaignResourceName and name required' });
        return res.json(await gadsMutate(customerId, [{ adGroupOperation: { create: { name: agName, campaign: campaignResourceName, status: agStatus, cpcBidMicros: String(cpc_bid_micros), type: 'SEARCH_STANDARD' } } }], token));
      }

      // ── CRUD: Keywords ──
      case 'add-keyword': {
        const { adGroupResourceName, keyword, matchType = 'BROAD' } = req.body;
        if (!adGroupResourceName || !keyword) return res.status(400).json({ error: 'adGroupResourceName and keyword required' });
        return res.json(await gadsMutate(customerId, [{ adGroupCriterionOperation: { create: { adGroup: adGroupResourceName, status: 'ENABLED', keyword: { text: keyword, matchType } } } }], token));
      }

      case 'remove-keyword': {
        const { resourceName } = req.body;
        if (!resourceName) return res.status(400).json({ error: 'resourceName required' });
        return res.json(await gadsMutate(customerId, [{ adGroupCriterionOperation: { remove: resourceName } }], token));
      }

      // ── Audiences ──
      case 'list-audiences':
        return res.json(await gadsQuery(customerId, `SELECT user_list.id, user_list.name, user_list.size_for_search, user_list.type, user_list.membership_status FROM user_list ORDER BY user_list.name LIMIT 50`, token));

      // ── Conversions ──
      case 'list-conversions':
        return res.json(await gadsQuery(customerId, `SELECT conversion_action.id, conversion_action.name, conversion_action.type, conversion_action.status, conversion_action.category FROM conversion_action WHERE conversion_action.status = 'ENABLED' LIMIT 30`, token));

      // ── Recommendations ──
      case 'list-recommendations':
        return res.json(await gadsQuery(customerId, `SELECT recommendation.type, recommendation.impact, recommendation.campaign FROM recommendation WHERE recommendation.dismissed = FALSE LIMIT 20`, token));

      // ── Change History ──
      case 'change-history': {
        const { dateRange = 'LAST_7_DAYS' } = req.query;
        return res.json(await gadsQuery(customerId, `SELECT change_event.change_date_time, change_event.change_resource_type, change_event.user_email, change_event.client_type, change_event.old_resource, change_event.new_resource FROM change_event WHERE segments.date DURING ${dateRange} ORDER BY change_event.change_date_time DESC LIMIT 25`, token));
      }

      // ── Ad Extensions ──
      case 'list-extensions':
        return res.json(await gadsQuery(customerId, `SELECT asset.id, asset.name, asset.type, asset.final_urls, asset.resource_name FROM asset WHERE asset.type IN ('SITELINK', 'CALLOUT', 'STRUCTURED_SNIPPET', 'CALL', 'PRICE') LIMIT 30`, token));

      // ── Geo Performance ──
      case 'geo-performance': {
        const { dateRange = 'LAST_30_DAYS' } = req.query;
        return res.json(await gadsQuery(customerId, `SELECT geographic_view.country_criterion_id, geographic_view.location_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM geographic_view WHERE segments.date DURING ${dateRange} ORDER BY metrics.impressions DESC LIMIT 25`, token));
      }

      // ── Device Performance ──
      case 'device-performance':
        return res.json(await gadsQuery(customerId, `SELECT segments.device, metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING LAST_30_DAYS AND campaign.status = 'ENABLED'`, token));

      case 'overview': {
        const d = await gadsQuery(customerId, `SELECT metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM customer WHERE segments.date DURING LAST_7_DAYS`, token);
        const row = d?.[0]?.results?.[0];
        return res.json({
          impressions_7d: row?.metrics?.impressions,
          clicks_7d: row?.metrics?.clicks,
          cost_7d: row?.metrics?.costMicros ? (Number(row.metrics.costMicros) / 1e6).toFixed(2) : '0',
          conversions_7d: row?.metrics?.conversions,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
