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
export { createDistributionsService } from './distributions-service';
export type {
  DistributionsService, DistributionsServiceOptions,
  Distribution, DistributionRecipient, CreateDistributionInput,
  DistributionType, DistributionStatus, RecipientStatus,
  LedgerAdapterLike, PaymentRouterLike,
} from './distributions-service';
export {
  createNotificationsBridge, createVenturesBridge,
  setCapitalPaymentRouter, getCapitalPaymentRouter,
} from './ecosystem-bridges';
export type {
  NotificationsBridge, NotifyInput, NotificationType, NotificationChannels,
  VenturesBridge, VentureRef,
} from './ecosystem-bridges';
export { createTaxExportService } from './tax-export';
export type {
  TaxExportService, TaxForm, TaxExportRow, TaxExportResult, ExportTaxFormInput,
} from './tax-export';
export { createCapitalEngine } from './create-capital-engine';
export type { CapitalEngine, CapitalEngineOpts } from './create-capital-engine';

// ─── v0.2 — cross-venture event contract + adapter factory ─────────────
export {
  CapitalEvent, CAPITAL_EVENT_TOPICS,
  composePublishers, nullEventPublisher,
} from './events';
export type {
  CapitalEventPublisher, CapitalEventTopic, EventActor,
} from './events';
export { createVentureAdapter } from './venture-adapter';
export type { VentureAdapter, VentureAdapterOptions, EmitOptions } from './venture-adapter';
export {
  createSupabasePublisher, createFabricPublisher,
  createConsolePublisher, createDefaultPublisher,
} from './event-publisher';
export type {
  SupabasePublisherOptions, FabricPublisherOptions,
  ConsolePublisherOptions, DefaultPublisherConfig,
} from './event-publisher';

export const MCV_CAPITAL_SDK_VERSION = '0.2.0' as const;
