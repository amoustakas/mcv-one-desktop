// @mcv/capital-sdk — EdgeIQ Capital primitives.
// SPEC-EQC-001. Cap-table + investor + round + commitment + launchpad.

export * from './types';
export * from './waterfall';
export { createRoundsService, mapRoundRow } from './rounds-service';
export type { RoundsService, RoundsServiceOptions, ListRoundsFilters } from './rounds-service';
export { createCommitmentsService, mapCommitmentRow } from './commitments-service';
export type { CommitmentsService, CommitmentsServiceOptions, ListCommitmentsFilters } from './commitments-service';
export { createContactsService, mapInvestorRow } from './contacts-service';
export type { ContactsService, ContactsServiceOptions, ListInvestorsFilters } from './contacts-service';
export { createOrganizationsService, mapOrgRow } from './organizations-service';
export type { OrganizationsService, OrganizationsServiceOptions } from './organizations-service';
export { createDocumentsService, mapDocumentRow } from './documents-service';
export type { DocumentsService, DocumentsServiceOptions } from './documents-service';
export { createActivitiesService, mapActivityRow } from './activities-service';
export type { ActivitiesService, ActivitiesServiceOptions, ListActivitiesFilters } from './activities-service';
export { createDashboardService } from './dashboard-service';
export type { DashboardService, DashboardServiceOptions } from './dashboard-service';
export { createContentIntegrationService } from './content-integration';
export type {
  ContentIntegrationService, ContentIntegrationServiceOptions,
  RoundContentRole, CapitalContentType, RoundContentLink, RoundContentEntry,
  CapitalContentRow, CreateRoundContentInput, ContentVisibility, ContentStatus,
} from './content-integration';
export { createCapitalEngine } from './create-capital-engine';
export type { CapitalEngine, CapitalEngineOpts } from './create-capital-engine';

export const MCV_CAPITAL_SDK_VERSION = '0.1.0' as const;
