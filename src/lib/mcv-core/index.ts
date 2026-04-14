// MCV Core Triangle — unified client factory.
//
// Usage:
//   import { createCoreTriangle } from '@/lib/mcv-core';
//   const core = createCoreTriangle({
//     getAuthToken: async () => (await getToken()) ?? null,
//     ventureId: activeVenture,
//     baseUrls: {
//       identity: import.meta.env.VITE_MCV_CORE_IDENTITY_URL,
//       fabric:   import.meta.env.VITE_MCV_CORE_FABRIC_URL,
//       intelligence: import.meta.env.VITE_MCV_CORE_INTELLIGENCE_URL,
//     },
//   });
//   const session = await core.identity.session();
//   if (session.ok) { ... } else { /* fallback to Clerk+Supabase */ }

import type { CoreServiceConfig } from './types';
import { createIdentityClient, type IdentityClient } from './identity';
import { createFabricClient, type FabricClient } from './fabric';
import { createIntelligenceClient, type IntelligenceClient } from './intelligence';

export * from './types';
export * from './identity';
export * from './fabric';
export * from './intelligence';

export interface CoreTriangleConfig {
  getAuthToken: () => Promise<string | null>;
  ventureId?: string;
  timeoutMs?: number;
  logger?: CoreServiceConfig['logger'];
  baseUrls: {
    identity: string;
    fabric: string;
    intelligence: string;
  };
}

export interface CoreTriangle {
  identity: IdentityClient;
  fabric: FabricClient;
  intelligence: IntelligenceClient;
  /** Check each service's health in parallel */
  ping(): Promise<{
    identity: boolean;
    fabric: boolean;
    intelligence: boolean;
  }>;
}

export function createCoreTriangle(config: CoreTriangleConfig): CoreTriangle {
  const shared = {
    getAuthToken: config.getAuthToken,
    ventureId: config.ventureId,
    timeoutMs: config.timeoutMs,
    logger: config.logger,
  };

  const identity = createIdentityClient({ ...shared, baseUrl: config.baseUrls.identity });
  const fabric = createFabricClient({ ...shared, baseUrl: config.baseUrls.fabric });
  const intelligence = createIntelligenceClient({ ...shared, baseUrl: config.baseUrls.intelligence });

  return {
    identity,
    fabric,
    intelligence,
    ping: async () => {
      const [i, f, n] = await Promise.all([identity.ping(), fabric.ping(), intelligence.ping()]);
      return { identity: i.ok, fabric: f.ok, intelligence: n.ok };
    },
  };
}
