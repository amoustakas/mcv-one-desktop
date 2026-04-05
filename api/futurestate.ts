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


const FS_API_URL = process.env.FUTURESTATE_API_URL || '';

// Mock data matching real FutureState Prisma schema
const MOCK_PROPERTIES = [
  {
    id: '1', name: 'King West Tower', slug: 'king-west-tower', type: 'COMMERCIAL', assetClass: 'OFFICE',
    status: 'YIELDING', tokenSymbol: 'FS-KING', tokenPrice: 52.40, totalValue: 28500000,
    tokensIssued: 544000, tokensSold: 489600, projectedYield: 7.2, capRate: 5.8, occupancyRate: 96,
    address: '401 King St W', city: 'Toronto', province: 'ON',
  },
  {
    id: '2', name: 'Distillery Lofts', slug: 'distillery-lofts', type: 'MULTI_RESIDENTIAL', assetClass: 'APARTMENT',
    status: 'FUNDING', tokenSymbol: 'FS-DIST', tokenPrice: 38.75, totalValue: 15200000,
    tokensIssued: 392000, tokensSold: 215600, projectedYield: 6.1, capRate: 4.9, occupancyRate: 92,
    address: '55 Mill St', city: 'Toronto', province: 'ON',
  },
  {
    id: '3', name: 'Liberty Village Hub', slug: 'liberty-village-hub', type: 'MIXED_USE', assetClass: 'MIXED',
    status: 'UPCOMING', tokenSymbol: 'FS-LIB', tokenPrice: 25.00, totalValue: 42000000,
    tokensIssued: 1680000, tokensSold: 0, projectedYield: 8.5, capRate: 6.3, occupancyRate: 0,
    address: '171 East Liberty St', city: 'Toronto', province: 'ON',
  },
  {
    id: '4', name: 'Vaughan Logistics Park', slug: 'vaughan-logistics', type: 'INDUSTRIAL', assetClass: 'WAREHOUSE',
    status: 'YIELDING', tokenSymbol: 'FS-VLP', tokenPrice: 61.20, totalValue: 34800000,
    tokensIssued: 568000, tokensSold: 568000, projectedYield: 9.1, capRate: 7.2, occupancyRate: 100,
    address: '8200 Jane St', city: 'Vaughan', province: 'ON',
  },
];

const MOCK_PORTFOLIO = {
  totalInvested: 127500,
  currentValue: 143200,
  totalYieldEarned: 8340,
  unclaimedYield: 1240,
  holdingCount: 3,
  holdings: [
    { propertyId: '1', propertyName: 'King West Tower', tokenAmount: 500, avgPrice: 50.00, currentPrice: 52.40, yieldEarned: 4200, unclaimedYield: 620 },
    { propertyId: '2', propertyName: 'Distillery Lofts', tokenAmount: 1000, avgPrice: 37.50, currentPrice: 38.75, yieldEarned: 2140, unclaimedYield: 380 },
    { propertyId: '4', propertyName: 'Vaughan Logistics Park', tokenAmount: 400, avgPrice: 58.75, currentPrice: 61.20, yieldEarned: 2000, unclaimedYield: 240 },
  ],
};

const MOCK_STATS = {
  totalAUM: 120500000,
  totalInvestors: 742,
  propertiesListed: 4,
  propertiesYielding: 2,
  totalYieldDistributed: 2840000,
  avgYield: 7.7,
};

async function proxyFetch(path: string) {
  if (!FS_API_URL) return null;
  const res = await fetch(`${FS_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action as string;

  try {
    switch (action) {
      case 'properties': {
        const live = await proxyFetch('/api/properties');
        return res.json(live || { data: MOCK_PROPERTIES });
      }
      case 'portfolio': {
        const live = await proxyFetch('/api/portfolio');
        return res.json(live || { data: MOCK_PORTFOLIO });
      }
      case 'stats': {
        const live = await proxyFetch('/api/dashboard');
        return res.json(live || { data: MOCK_STATS });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
