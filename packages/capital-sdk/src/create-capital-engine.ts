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

export interface CapitalEngine {
  rounds: RoundsService;
  commitments: CommitmentsService;
  contacts: ContactsService;
  organizations: OrganizationsService;
  documents: DocumentsService;
  activities: ActivitiesService;
  dashboard: DashboardService;
  content: ContentIntegrationService;
}

export interface CapitalEngineOpts {
  supabase: SupabaseClient | null;
}

export function createCapitalEngine({ supabase }: CapitalEngineOpts): CapitalEngine {
  return {
    rounds: createRoundsService({ supabase }),
    commitments: createCommitmentsService({ supabase }),
    contacts: createContactsService({ supabase }),
    organizations: createOrganizationsService({ supabase }),
    documents: createDocumentsService({ supabase }),
    activities: createActivitiesService({ supabase }),
    dashboard: createDashboardService({ supabase }),
    content: createContentIntegrationService({ supabase }),
  };
}
