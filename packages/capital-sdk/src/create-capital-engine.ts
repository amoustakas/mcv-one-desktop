// @mcv/capital-sdk/create-capital-engine — top-level bundle factory.
// One call wires all 6 services. Subpath imports remain available for tree-shaken usage.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createRoundsService, type RoundsService } from './rounds-service';
import { createCommitmentsService, type CommitmentsService } from './commitments-service';
import { createContactsService, type ContactsService } from './contacts-service';
import { createOrganizationsService, type OrganizationsService } from './organizations-service';
import { createDocumentsService, type DocumentsService } from './documents-service';
import { createActivitiesService, type ActivitiesService } from './activities-service';
import { createDashboardService, type DashboardService } from './dashboard-service';
import { createContentIntegrationService, type ContentIntegrationService } from './content-integration';
import { createDistributionsService, type DistributionsService, type LedgerAdapterLike, type PaymentRouterLike } from './distributions-service';
import {
  createNotificationsBridge, type NotificationsBridge,
  createVenturesBridge, type VenturesBridge,
} from './ecosystem-bridges';

export interface CapitalEngine {
  rounds: RoundsService;
  commitments: CommitmentsService;
  contacts: ContactsService;
  organizations: OrganizationsService;
  documents: DocumentsService;
  activities: ActivitiesService;
  dashboard: DashboardService;
  content: ContentIntegrationService;
  distributions: DistributionsService;
  notifications: NotificationsBridge;
  ventures: VenturesBridge;
}

export interface CapitalEngineOpts {
  supabase: SupabaseClient | null;
  /** Optional LedgerAdapter — when passed, distributions + commitments post journal entries. */
  ledger?: LedgerAdapterLike | null;
  /** Optional PaymentRouter — when passed, distributions route payouts via the shared router. */
  paymentRouter?: PaymentRouterLike | null;
  /** Default cash account code for ledger posts. */
  cashAccountCode?: string;
  /** Default source account code (retained earnings / equity / interest expense). */
  sourceAccountCode?: string;
}

export function createCapitalEngine(opts: CapitalEngineOpts): CapitalEngine {
  const { supabase, ledger, paymentRouter, cashAccountCode, sourceAccountCode } = opts;
  return {
    rounds: createRoundsService({ supabase }),
    commitments: createCommitmentsService({ supabase }),
    contacts: createContactsService({ supabase }),
    organizations: createOrganizationsService({ supabase }),
    documents: createDocumentsService({ supabase }),
    activities: createActivitiesService({ supabase }),
    dashboard: createDashboardService({ supabase }),
    content: createContentIntegrationService({ supabase }),
    distributions: createDistributionsService({
      supabase,
      ledger: ledger ?? null,
      paymentRouter: paymentRouter ?? null,
      cashAccountCode,
      sourceAccountCode,
    }),
    notifications: createNotificationsBridge(supabase),
    ventures: createVenturesBridge(supabase),
  };
}
