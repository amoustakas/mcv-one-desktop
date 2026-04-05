import { getProviderToken } from './_oauth-helper';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Microsoft Advertising API — campaigns, ad groups, keywords, budgets, reports
// Uses Bing Ads API v13 (REST)
// ---------------------------------------------------------------------------

const MSADS_API = 'https://campaign.api.bingads.microsoft.com/Api/Advertiser/V13';
const DEVELOPER_TOKEN = process.env.MICROSOFT_ADS_DEVELOPER_TOKEN || '';
const ACCOUNT_ID = process.env.MICROSOFT_ADS_ACCOUNT_ID || '';
const CUSTOMER_ID = process.env.MICROSOFT_ADS_CUSTOMER_ID || '';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const t = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function msAdsFetch(service: string, operation: string, body: unknown, token: string) {
  const res = await fetch(`${MSADS_API}/${service}/${operation}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      DeveloperToken: DEVELOPER_TOKEN,
      CustomerId: CUSTOMER_ID,
      AccountId: ACCOUNT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.Message || `Microsoft Ads ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!DEVELOPER_TOKEN) return res.status(500).json({ error: 'MICROSOFT_ADS_DEVELOPER_TOKEN not configured' });

  let token: string;
  try { token = (await getProviderToken(userId, 'microsoft')).token; }
  catch { return res.status(500).json({ error: 'Microsoft not connected.' }); }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'list-campaigns':
        return res.json(await msAdsFetch('CampaignManagement', 'GetCampaignsByAccountId', { AccountId: ACCOUNT_ID }, token));

      case 'get-campaign': {
        const { campaignId } = req.body;
        if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
        return res.json(await msAdsFetch('CampaignManagement', 'GetCampaignsByIds', { AccountId: ACCOUNT_ID, CampaignIds: [campaignId] }, token));
      }

      case 'list-ad-groups': {
        const { campaignId } = req.query;
        if (!campaignId) return res.status(400).json({ error: 'campaignId required' });
        return res.json(await msAdsFetch('CampaignManagement', 'GetAdGroupsByCampaignId', { CampaignId: campaignId }, token));
      }

      case 'list-ads': {
        const { adGroupId } = req.query;
        if (!adGroupId) return res.status(400).json({ error: 'adGroupId required' });
        return res.json(await msAdsFetch('CampaignManagement', 'GetAdsByAdGroupId', { AdGroupId: adGroupId, AdTypes: ['ResponsiveSearchAd', 'ExpandedTextAd'] }, token));
      }

      case 'list-keywords': {
        const { adGroupId } = req.query;
        if (!adGroupId) return res.status(400).json({ error: 'adGroupId required' });
        return res.json(await msAdsFetch('CampaignManagement', 'GetKeywordsByAdGroupId', { AdGroupId: adGroupId }, token));
      }

      case 'list-budgets':
        return res.json(await msAdsFetch('CampaignManagement', 'GetBudgetsByIds', { BudgetIds: null }, token));

      case 'account-performance': {
        const { startDate, endDate } = req.body;
        const end = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await msAdsFetch('Reporting', 'SubmitGenerateReport', {
          ReportRequest: {
            Format: 'Tsv',
            ReportName: 'AccountPerformance',
            Time: { CustomDateRangeStart: { Day: Number(start.split('-')[2]), Month: Number(start.split('-')[1]), Year: Number(start.split('-')[0]) }, CustomDateRangeEnd: { Day: Number(end.split('-')[2]), Month: Number(end.split('-')[1]), Year: Number(end.split('-')[0]) } },
            Columns: ['AccountName', 'Impressions', 'Clicks', 'Ctr', 'AverageCpc', 'Spend', 'Conversions'],
            Scope: { AccountIds: [ACCOUNT_ID] },
          },
        }, token));
      }

      case 'overview':
        return res.json({ configured: !!(DEVELOPER_TOKEN && ACCOUNT_ID), account_id: ACCOUNT_ID, customer_id: CUSTOMER_ID });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
