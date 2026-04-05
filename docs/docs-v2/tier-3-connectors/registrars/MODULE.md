# @mcv/connectors/registrars — Domain Registrars Module

**Module:** `@mcv/connectors/registrars`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Tier:** 3 — Connector  
**Last Updated:** February 8, 2026

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Domain Lifecycle State Machine](#domain-lifecycle-state-machine)
5. [Transfer Lifecycle State Machine](#transfer-lifecycle-state-machine)
6. [Registrars Supported](#registrars-supported)
7. [Registrar-Specific Configuration Guides](#registrar-specific-configuration-guides)
8. [Dependencies](#dependencies)
9. [Constants](#constants)
10. [Environment Variables](#environment-variables)
11. [Database Schema](#database-schema)
12. [TypeScript Interfaces](#typescript-interfaces)
13. [Service Implementation](#service-implementation)
14. [DNS Record Management](#dns-record-management)
15. [SSL Certificate Provisioning](#ssl-certificate-provisioning)
16. [WHOIS & Domain Intelligence](#whois--domain-intelligence)
17. [Domain Transfers](#domain-transfers)
18. [Code Examples](#code-examples)
19. [Security Considerations](#security-considerations)
20. [DNSSEC Management](#dnssec-management)
21. [Performance Considerations](#performance-considerations)
22. [Scheduled Tasks](#scheduled-tasks)
23. [Audit Events](#audit-events)
24. [Error Codes](#error-codes)
25. [Rate Limiting](#rate-limiting)
26. [Monitoring & Observability](#monitoring--observability)
27. [Testing Strategy](#testing-strategy)
28. [Troubleshooting](#troubleshooting)
29. [Related Modules](#related-modules)
30. [Changelog](#changelog)

---

## Purpose

Provider-agnostic domain registrar integration layer for the MCV.ONE ecosystem. This module abstracts the full domain lifecycle across multiple registrar APIs — Cloudflare, AWS Route53, GoDaddy, and Namecheap — providing a unified interface for:

- **Domain availability checks** — Real-time availability with pricing, premium detection, and TLD suggestions
- **Domain registration** — Automated registration with WHOIS privacy, contact management, and auto-renewal
- **DNS record management** — Full CRUD for A, AAAA, CNAME, MX, TXT, SRV, NS, CAA, and PTR records
- **SSL/TLS certificate provisioning** — Automated issuance via Let's Encrypt (ACME) and Cloudflare Origin CA, with renewal tracking
- **WHOIS lookups** — Domain ownership intelligence, expiration tracking, and registrar history
- **Domain transfers** — Cross-registrar transfers with EPP auth code management and status tracking
- **DNSSEC management** — DS record publishing, key rotation, and validation
- **Multi-registrar orchestration** — Unified API across providers with automatic failover and cost comparison

This module is **critical infrastructure** for MCV ventures — particularly **SerpSpace** (SEO platform requiring bulk domain operations), **FullGain** (client website provisioning), and any venture that provisions domains or subdomains for its customers.

**This is the single entry point for all domain and DNS operations across the MCV.ONE platform.**

### Why a Unified Registrar Module?

Without this module, each venture would integrate directly with registrar APIs, leading to duplicated credential management, inconsistent DNS propagation handling, missed domain renewals, scattered SSL certificate tracking, and no audit trail for DNS changes. The registrars module solves all of this:

1. **Single API surface** — One interface regardless of whether the domain is at Cloudflare, Route53, GoDaddy, or Namecheap
2. **Credential vault** — All API keys and secrets stored in `@mcv/secrets` (Google Secret Manager), never in environment variables or code
3. **DNS propagation awareness** — Built-in polling, TTL management, and propagation verification
4. **SSL automation** — Zero-touch certificate issuance, renewal, and deployment
5. **Audit trail** — Every DNS change, registration, and transfer is logged for compliance and debugging
6. **Cost optimization** — Compare pricing across registrars before registration; route to cheapest provider
7. **Multi-tenant isolation** — Domains and credentials scoped per-venture with strict access controls

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Availability & Registration
export {
  checkDomainAvailability,       // Check if domain is available for registration
  checkBulkAvailability,         // Check multiple domains at once
  suggestDomains,                // AI-powered domain suggestions for a keyword
  registerDomain,                // Register a new domain
  renewDomain,                   // Renew an existing domain
  getDomain,                     // Get domain details by name or ID
  listDomains,                   // List all domains for a venture
  deleteDomain,                  // Delete/release a domain
  lockDomain,                    // Enable registrar lock (clientTransferProhibited)
  unlockDomain,                  // Disable registrar lock for transfer
} from './server/services/domain.service';

// WHOIS & Intelligence
export {
  whoisLookup,                   // Full WHOIS lookup for any domain
  getWhoisHistory,               // Historical WHOIS records
  getDomainExpiry,               // Quick expiration check
  monitorDomainExpiry,           // Set up expiry monitoring alerts
} from './server/services/whois.service';

// ═══════════════════════════════════════════════════════════════════════════════
// DNS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getDnsRecords,                 // List all DNS records for a domain
  getDnsRecord,                  // Get a single DNS record by ID
  createDnsRecord,               // Create a new DNS record
  updateDnsRecord,               // Update an existing DNS record
  deleteDnsRecord,               // Delete a DNS record
  batchUpdateDnsRecords,         // Atomic batch create/update/delete
  importDnsZone,                 // Import from BIND zone file
  exportDnsZone,                 // Export to BIND zone file
  verifyDnsPropagation,          // Check propagation across global resolvers
  flushDnsCache,                 // Purge DNS cache at provider level
} from './server/services/dns.service';

// ═══════════════════════════════════════════════════════════════════════════════
// SSL CERTIFICATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  provisionCertificate,          // Request a new SSL certificate (ACME/Cloudflare)
  renewCertificate,              // Renew an existing certificate
  revokeCertificate,             // Revoke a compromised certificate
  getCertificate,                // Get certificate details
  listCertificates,              // List certificates for a domain/venture
  getCertificateStatus,          // Check issuance/renewal status
  verifyCertificateChain,        // Validate the full certificate chain
  deployCertificate,             // Deploy cert to origin server / load balancer
} from './server/services/ssl.service';

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN TRANSFERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  initiateTransfer,              // Start domain transfer to MCV registrar
  getTransferStatus,             // Check transfer progress
  cancelTransfer,                // Cancel an in-progress transfer
  approveTransfer,               // Approve incoming transfer (losing registrar)
  rejectTransfer,                // Reject incoming transfer
  getAuthCode,                   // Get EPP auth code for outbound transfer
  listTransfers,                 // List all transfers for a venture
} from './server/services/transfer.service';

// ═══════════════════════════════════════════════════════════════════════════════
// DNSSEC
// ═══════════════════════════════════════════════════════════════════════════════

export {
  enableDnssec,                  // Enable DNSSEC for a domain
  disableDnssec,                 // Disable DNSSEC
  getDnssecStatus,               // Get current DNSSEC configuration
  rotateDnssecKeys,              // Rotate KSK/ZSK keys
  getDsRecords,                  // Get DS records for parent zone
} from './server/services/dnssec.service';

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRAR PROVIDER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  configureRegistrar,            // Configure a registrar provider for a venture
  getRegistrarConfig,            // Get registrar configuration
  removeRegistrar,               // Remove registrar (does not delete domains)
  listRegistrars,                // List configured registrars for a venture
  testRegistrarConnection,       // Validate registrar API credentials
  getRegistrarBalance,           // Check account balance / credit
} from './server/services/registrar-config.service';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULED TASKS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  checkExpiringDomains,          // Alert on domains expiring within 30/14/7/1 days
  renewAutoRenewDomains,         // Process auto-renewal queue
  refreshSslCertificates,        // Renew certificates expiring within 30 days
  syncDomainStatus,              // Sync domain status from registrar APIs
  cleanupFailedTransfers,        // Close stale/failed transfer records
  verifyDnssecHealth,            // Periodic DNSSEC validation
} from './server/tasks';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useDomainSearch } from './client/hooks/use-domain-search';
export { useDomainDetails } from './client/hooks/use-domain-details';
export { useDomainList } from './client/hooks/use-domain-list';
export { useDnsRecords } from './client/hooks/use-dns-records';
export { useSslCertificates } from './client/hooks/use-ssl-certificates';
export { useTransferStatus } from './client/hooks/use-transfer-status';
export { useRegistrarConfig } from './client/hooks/use-registrar-config';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { DomainSearchBar } from './client/components/domain-search-bar';
export { DomainRegistrationForm } from './client/components/domain-registration-form';
export { DnsRecordEditor } from './client/components/dns-record-editor';
export { DnsZoneView } from './client/components/dns-zone-view';
export { SslCertificateManager } from './client/components/ssl-certificate-manager';
export { DomainTransferWizard } from './client/components/domain-transfer-wizard';
export { WhoisPanel } from './client/components/whois-panel';
export { DomainExpiryDashboard } from './client/components/domain-expiry-dashboard';
export { RegistrarConfigPanel } from './client/components/registrar-config-panel';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export {
  domains,                       // Domain registry table schema
  dnsRecords,                    // DNS records table schema
  sslCertificates,               // SSL certificate tracking schema
  domainTransfers,               // Transfer tracking schema
  registrarCredentials,          // Registrar config schema
  domainAuditLogs,               // Domain operation audit log schema
  domainsRelations,              // Domain table relations
  dnsRecordsRelations,           // DNS records table relations
  sslCertificatesRelations,      // SSL certificate relations
  domainTransfersRelations,      // Transfer relations
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SUPPORTED_REGISTRARS,
  DNS_RECORD_TYPES,
  DOMAIN_STATUSES,
  TRANSFER_STATUSES,
  SSL_PROVIDERS,
  DEFAULT_TTL,
  MIN_TTL,
  MAX_TTL,
  DOMAIN_LOCK_STATUSES,
  ACME_CHALLENGE_TYPES,
  RATE_LIMIT_DEFAULTS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Core domain types
  Domain,
  DomainStatus,
  DomainContact,
  DomainContactSet,
  DomainRegistrationRequest,
  DomainRenewalRequest,
  DomainAvailability,
  DomainSuggestion,
  DomainPricing,

  // DNS types
  DnsRecord,
  DnsRecordType,
  DnsRecordCreateRequest,
  DnsRecordUpdateRequest,
  DnsBatchOperation,
  DnsPropagationResult,
  DnsZone,

  // SSL types
  SslCertificate,
  SslCertificateStatus,
  SslProvisionRequest,
  SslChallengeType,
  SslChallenge,
  AcmeAccount,

  // Transfer types
  TransferRequest,
  TransferStatus,
  TransferStep,

  // WHOIS types
  WhoisInfo,
  WhoisContact,
  WhoisHistory,

  // DNSSEC types
  DnssecConfig,
  DnssecDsRecord,
  DnssecKeyInfo,

  // Registrar types
  RegistrarProvider,
  RegistrarConfig,
  RegistrarBalance,
  RegistrarCapabilities,

  // Error types
  RegistrarError,
  RegistrarErrorCode,

  // Event types
  DomainEvent,
  DomainAuditEvent,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/connectors/registrars                                  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                         RegistrarService                                       │   │
│  │                                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │   Domain      │  │     DNS      │  │     SSL      │  │   Transfer   │      │   │
│  │  │   Lookup &    │  │   Record     │  │  Certificate │  │   Manager    │      │   │
│  │  │   Register    │  │   Manager    │  │  Provisioner │  │              │      │   │
│  │  │              │  │              │  │              │  │              │      │   │
│  │  │ • Avail.     │  │ • CRUD ops   │  │ • ACME v2    │  │ • EPP auth   │      │   │
│  │  │ • Register   │  │ • Batch ops  │  │ • CF Origin  │  │ • Init xfer  │      │   │
│  │  │ • Renew      │  │ • Zone file  │  │ • Auto-renew │  │ • Track      │      │   │
│  │  │ • WHOIS      │  │ • Propagate  │  │ • Revoke     │  │ • Approve    │      │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │   │
│  │         │                 │                  │                 │               │   │
│  │  ┌──────┴─────────────────┴──────────────────┴─────────────────┴──────────┐   │   │
│  │  │                    Provider Adapter Layer                                │   │   │
│  │  │                                                                         │   │   │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │   │   │
│  │  │  │ Cloudflare │ │  Route53   │ │  GoDaddy   │ │ Namecheap  │          │   │   │
│  │  │  │  Adapter   │ │  Adapter   │ │  Adapter   │ │  Adapter   │          │   │   │
│  │  │  │            │ │            │ │            │ │            │          │   │   │
│  │  │  │ • REST API │ │ • AWS SDK  │ │ • REST API │ │ • XML API  │          │   │   │
│  │  │  │ • Zones    │ │ • Hosted   │ │ • Domains  │ │ • Domains  │          │   │   │
│  │  │  │ • Origin   │ │   Zones    │ │ • DNS      │ │ • DNS      │          │   │   │
│  │  │  │   CA       │ │ • ACM      │ │ • Certs    │ │ • Transfer │          │   │   │
│  │  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │   │   │
│  │  │                                                                         │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                │   │
│  └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────┐ │
│  │  @mcv/secrets         │  │  @mcv/db (Drizzle)    │  │  @mcv/audit                │ │
│  │  (Secret Manager)     │  │  (PostgreSQL)          │  │  (Event Logging)           │ │
│  │                       │  │                        │  │                             │ │
│  │  • API keys           │  │  • domains             │  │  • domain.registered       │ │
│  │  • AWS credentials    │  │  • dns_records         │  │  • dns.record_created      │ │
│  │  • ACME accounts      │  │  • ssl_certificates    │  │  • ssl.certificate_issued  │ │
│  │  • EPP auth codes     │  │  • domain_transfers    │  │  • transfer.initiated      │ │
│  │                       │  │  • registrar_creds     │  │  • domain.renewed          │ │
│  │                       │  │  • domain_audit_logs   │  │  • dnssec.enabled          │ │
│  └──────────────────────┘  └──────────────────────┘  └────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
          ┌─────────────────────────────┼──────────────────────────────┐
          │                             │                              │
 ┌────────┴─────────┐      ┌──────────┴───────────┐     ┌────────────┴────────────┐
 │  Registrar API    │      │  Registrar API        │     │  SSL/ACME Provider      │
 │  (Cloudflare)     │      │  (Route53/GoDaddy)    │     │  (Let's Encrypt)        │
 │                   │      │                       │     │                          │
 │  api.cloudflare   │      │  route53.amazonaws    │     │  acme-v02.api.           │
 │  .com/client/v4/  │      │  .com                 │     │  letsencrypt.org         │
 │                   │      │                       │     │                          │
 │  • Zones          │      │  • HostedZones        │     │  • newAccount            │
 │  • DNS Records    │      │  • ResourceRecordSets │     │  • newOrder              │
 │  • Registrar      │      │  • Domains (R53D)     │     │  • finalize              │
 │  • Origin CA      │      │  • ACM Certificates   │     │  • certificate           │
 └───────────────────┘      └───────────────────────┘     └──────────────────────────┘
```

### Request Flow — Domain Registration

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                          DOMAIN REGISTRATION FLOW                                     │
│                                                                                       │
│  ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐ │
│  │  Client  │     │ Registrar│     │  Vault   │     │ Provider │     │  Database  │ │
│  │  (React) │     │  Service │     │ (Secrets)│     │ (e.g. CF)│     │ (Postgres) │ │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └─────┬──────┘ │
│       │                │                │                │                  │         │
│       │  1. Check      │                │                │                  │         │
│       │  availability  │                │                │                  │         │
│       │────────────────▶                │                │                  │         │
│       │                │                │                │                  │         │
│       │                │  2. Get API credentials         │                  │         │
│       │                │────────────────▶                │                  │         │
│       │                │◀────────────────                │                  │         │
│       │                │                │                │                  │         │
│       │                │  3. Query domain availability   │                  │         │
│       │                │─────────────────────────────────▶                  │         │
│       │                │◀─────────────────────────────────                  │         │
│       │                │                │                │                  │         │
│       │  4. Available  │                │                │                  │         │
│       │  + pricing     │                │                │                  │         │
│       │◀────────────────                │                │                  │         │
│       │                │                │                │                  │         │
│       │  5. Register   │                │                │                  │         │
│       │  (with contact │                │                │                  │         │
│       │   + privacy)   │                │                │                  │         │
│       │────────────────▶                │                │                  │         │
│       │                │                │                │                  │         │
│       │                │  6. Submit registration to provider                │         │
│       │                │─────────────────────────────────▶                  │         │
│       │                │◀─────────────────────────────────                  │         │
│       │                │  7. Registration confirmed       │                  │         │
│       │                │                │                │                  │         │
│       │                │  8. Create DNS zone (if applicable)               │         │
│       │                │─────────────────────────────────▶                  │         │
│       │                │◀─────────────────────────────────                  │         │
│       │                │                │                │                  │         │
│       │                │  9. Store domain record + audit  │                  │         │
│       │                │─────────────────────────────────────────────────────▶        │
│       │                │                │                │                  │         │
│       │                │  10. Provision SSL certificate (async)             │         │
│       │                │─────────────────────────────────▶ (Let's Encrypt)  │         │
│       │                │                │                │                  │         │
│       │  11. Domain    │                │                │                  │         │
│       │  registered    │                │                │                  │         │
│       │◀────────────────                │                │                  │         │
│       │                │                │                │                  │         │
│  └────┴─────┘     └────┴─────┘     └────┴─────┘     └────┴─────┘     └─────┴──────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow — DNS Update with Propagation Verification

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                     DNS UPDATE + PROPAGATION VERIFICATION                              │
│                                                                                       │
│  ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────────────────┐     │
│  │  Caller  │     │   DNS    │     │ Provider │     │   Global DNS Resolvers   │     │
│  │          │     │  Service │     │  (CF/R53)│     │   (Google/CF/Quad9)      │     │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘     └────────────┬─────────────┘     │
│       │                │                │                         │                    │
│       │  1. Update     │                │                         │                    │
│       │  DNS record    │                │                         │                    │
│       │────────────────▶                │                         │                    │
│       │                │                │                         │                    │
│       │                │  2. Submit     │                         │                    │
│       │                │  record change │                         │                    │
│       │                │────────────────▶                         │                    │
│       │                │◀────────────────                         │                    │
│       │                │                │                         │                    │
│       │                │  3. Record committed                    │                    │
│       │                │                │                         │                    │
│       │                │  4. Poll propagation (async)            │                    │
│       │                │─────────────────────────────────────────▶│                    │
│       │                │                │                         │                    │
│       │                │  5. Query 8.8.8.8, 1.1.1.1, 9.9.9.9    │                    │
│       │                │◀─────────────────────────────────────────│                    │
│       │                │                │                         │                    │
│       │                │  6. Compare responses to expected value  │                    │
│       │                │                │                         │                    │
│       │                │  ┌─────────────┴──────────────┐         │                    │
│       │                │  │ All resolvers match?        │         │                    │
│       │                │  │                             │         │                    │
│       │                │  │ YES → Mark propagated       │         │                    │
│       │                │  │ NO  → Retry after interval  │         │                    │
│       │                │  └─────────────┬──────────────┘         │                    │
│       │                │                │                         │                    │
│       │  7. Update     │                │                         │                    │
│       │  result with   │                │                         │                    │
│       │  propagation   │                │                         │                    │
│       │  status        │                │                         │                    │
│       │◀────────────────                │                         │                    │
│       │                │                │                         │                    │
│  └────┴─────┘     └────┴─────┘     └────┴─────┘     └────────────┴─────────────┘     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Domain Lifecycle State Machine

```
                    ┌──────────────────────────────────────────────────────────┐
                    │             DOMAIN STATE MACHINE                          │
                    │                                                           │
                    │         ┌───────────────┐                                │
                    │         │  (available)   │                                │
                    │         └───────┬────────┘                                │
                    │                 │                                         │
                    │                 │ registerDomain()                        │
                    │                 ▼                                         │
                    │         ┌───────────────┐                                │
                    │         │  REGISTERING   │                                │
                    │         │               │                                │
                    │         │ • Submitted to│                                │
                    │         │   provider    │                                │
                    │         │ • Pending      │                                │
                    │         │   confirmation│                                │
                    │         └───────┬────────┘                                │
                    │                 │                                         │
                    │           ┌─────┴─────┐                                  │
                    │           │           │                                   │
                    │         success     failure                               │
                    │           │           │                                   │
                    │           ▼           ▼                                   │
                    │   ┌─────────────┐ ┌──────────────┐                      │
                    │   │   ACTIVE    │ │   FAILED     │                      │
                    │   │            │ │              │                      │
                    │   │ • DNS live  │ │ • Payment    │                      │
                    │   │ • Renew OK  │ │   declined   │                      │
                    │   │ • Transfer  │ │ • Validation │                      │
                    │   │   eligible  │ │   error      │                      │
                    │   └──┬──┬──┬────┘ └──────────────┘                      │
                    │      │  │  │                                             │
                    │      │  │  │ renewDomain() / auto-renew                  │
                    │      │  │  └──────────────────────────┐                  │
                    │      │  │                             │                  │
                    │      │  │ lockDomain()           ┌────▼────┐            │
                    │      │  └────────┐               │ ACTIVE  │            │
                    │      │           ▼               │ (renewed)│            │
                    │      │   ┌─────────────┐         └─────────┘            │
                    │      │   │   LOCKED    │                                │
                    │      │   │            │                                │
                    │      │   │ • Transfer  │  unlockDomain()                │
                    │      │   │   blocked   │──────────────────▶ ACTIVE      │
                    │      │   └─────────────┘                                │
                    │      │                                                   │
                    │      │ (expiry date passes, no renewal)                  │
                    │      ▼                                                   │
                    │   ┌─────────────┐                                       │
                    │   │  EXPIRED    │                                       │
                    │   │            │                                       │
                    │   │ • Grace    │  renewDomain() (grace period)          │
                    │   │   period   │──────────────────────────▶ ACTIVE      │
                    │   │ • 30-45 day│                                       │
                    │   └──────┬─────┘                                       │
                    │          │                                               │
                    │          │ (grace period ends)                            │
                    │          ▼                                               │
                    │   ┌─────────────┐                                       │
                    │   │ REDEMPTION  │                                       │
                    │   │            │                                       │
                    │   │ • Premium   │  renewDomain() (redemption fee)       │
                    │   │   fee       │──────────────────────────▶ ACTIVE     │
                    │   │ • 30-day    │                                       │
                    │   └──────┬─────┘                                       │
                    │          │                                               │
                    │          │ (redemption ends)                              │
                    │          ▼                                               │
                    │   ┌─────────────┐                                       │
                    │   │ PENDING     │                                       │
                    │   │ DELETE      │                                       │
                    │   │            │                                       │
                    │   │ • 5-day     │                                       │
                    │   │   purge     │                                       │
                    │   │ • Unrecover-│                                       │
                    │   │   able      │                                       │
                    │   └──────┬─────┘                                       │
                    │          │                                               │
                    │          ▼                                               │
                    │   ┌─────────────┐                                       │
                    │   │  DELETED    │                                       │
                    │   │            │                                       │
                    │   │ • Released  │                                       │
                    │   │   to pool   │                                       │
                    │   │ • Terminal  │                                       │
                    │   └─────────────┘                                       │
                    │                                                          │
                    └──────────────────────────────────────────────────────────┘

    Transitions:
    ──────────────────────────────────────────────────────────────────────────
    From          To             Trigger                   Side Effects
    ──────────────────────────────────────────────────────────────────────────
    (available)   REGISTERING    registerDomain()          Provider API call
    REGISTERING   ACTIVE         Registration confirmed    DNS zone, audit log
    REGISTERING   FAILED         Payment/validation error  Audit log, alert
    ACTIVE        LOCKED         lockDomain()              Registrar lock set
    LOCKED        ACTIVE         unlockDomain()            Registrar lock cleared
    ACTIVE        ACTIVE         renewDomain()             Expiry extended, audit
    ACTIVE        EXPIRED        Auto-renew fails / none   Alert sent
    EXPIRED       ACTIVE         renewDomain() (grace)     Expiry extended
    EXPIRED       REDEMPTION     Grace period ends         Alert sent
    REDEMPTION    ACTIVE         renewDomain() ($$ fee)    Premium charge
    REDEMPTION    PENDING_DELETE Redemption period ends    Final alert
    PENDING_DEL   DELETED        5-day purge completes    Domain released
    ──────────────────────────────────────────────────────────────────────────
```

---

## Transfer Lifecycle State Machine

```
    ┌──────────────────────────────────────────────────────────────────────┐
    │                  TRANSFER STATE MACHINE                               │
    │                                                                       │
    │  ┌─────────────┐                                                     │
    │  │  (initiate)  │                                                     │
    │  └──────┬──────┘                                                     │
    │         │ initiateTransfer(domain, authCode)                          │
    │         ▼                                                             │
    │  ┌─────────────┐                                                     │
    │  │  PENDING     │                                                     │
    │  │             │──── cancelTransfer() ────▶ CANCELLED                │
    │  │ • Auth code  │                                                     │
    │  │   submitted  │                                                     │
    │  │ • Awaiting   │                                                     │
    │  │   validation │                                                     │
    │  └──────┬──────┘                                                     │
    │         │ Auth code validated                                         │
    │         ▼                                                             │
    │  ┌─────────────┐                                                     │
    │  │ AWAITING     │                                                     │
    │  │ APPROVAL     │──── rejectTransfer() ───▶ REJECTED                │
    │  │             │                                                     │
    │  │ • Losing     │                                                     │
    │  │   registrar  │                                                     │
    │  │   notified   │                                                     │
    │  └──────┬──────┘                                                     │
    │         │ approveTransfer() / auto-approve (5 days)                   │
    │         ▼                                                             │
    │  ┌─────────────┐                                                     │
    │  │ PROCESSING   │                                                     │
    │  │             │                                                     │
    │  │ • DNS xfer   │                                                     │
    │  │ • Registrar  │                                                     │
    │  │   handoff    │                                                     │
    │  └──────┬──────┘                                                     │
    │    ┌────┴─────┐                                                      │
    │    │          │                                                       │
    │  success   failure                                                    │
    │    │          │                                                       │
    │    ▼          ▼                                                       │
    │  ┌──────┐  ┌──────────┐                                             │
    │  │COMPL.│  │ FAILED   │                                             │
    │  │      │  │          │                                             │
    │  │Domain│  │ • Retry  │                                             │
    │  │at new│  │   or     │                                             │
    │  │regist│  │   cancel │                                             │
    │  └──────┘  └──────────┘                                             │
    │                                                                       │
    └──────────────────────────────────────────────────────────────────────┘
```

---

## Registrars Supported

| Registrar | Registration | DNS | SSL | Transfer | DNSSEC | WHOIS | Bulk Ops |
|-----------|-------------|-----|-----|----------|--------|-------|----------|
| **Cloudflare** | ✅ (at-cost) | ✅ | ✅ (Origin CA + LE) | ✅ | ✅ | ✅ | ✅ |
| **AWS Route53** | ✅ | ✅ | ✅ (ACM) | ✅ | ✅ | ✅ | ✅ |
| **GoDaddy** | ✅ | ✅ | ❌ (external) | ✅ | ✅ | ✅ | ✅ |
| **Namecheap** | ✅ | ✅ | ❌ (external) | ✅ | ✅ | ✅ | ✅ |

### Registrar Capability Matrix — Detailed

```
Registrar       API Base URL                                    Auth Method         Rate Limit
──────────────  ─────────────────────────────────────────────── ───────────────────  ──────────────
Cloudflare      api.cloudflare.com/client/v4                    Bearer token/API key 1200 req/5min
Route53         route53.amazonaws.com                           AWS SigV4            5 req/sec
GoDaddy         api.godaddy.com/v1                              API key + secret     60 req/min
Namecheap       api.namecheap.com/xml.response                 API key + IP whitelist 20 req/min
```

### Pricing Comparison (Common TLDs)

| TLD | Cloudflare | Route53 | GoDaddy | Namecheap |
|-----|-----------|---------|---------|-----------|
| `.com` | $9.77 | $12.00 | $12.99 | $8.88 |
| `.net` | $10.77 | $11.00 | $14.99 | $10.98 |
| `.org` | $9.93 | $12.00 | $10.99 | $9.98 |
| `.io` | $33.98 | $35.00 | $44.99 | $25.88 |
| `.dev` | $10.18 | $14.00 | $16.99 | $12.98 |

> **Note:** Cloudflare offers at-cost domain registration (no markup). Route53 charges $0.50/month per hosted zone for DNS hosting.

---

## Registrar-Specific Configuration Guides

### Cloudflare

Cloudflare is the **preferred registrar** for MCV ventures due to at-cost pricing, integrated DNS + CDN, and Origin CA certificates.

- **Auth**: API Token (scoped) or Global API Key. Scoped tokens are strongly recommended.
- **DNS Proxy**: Cloudflare's orange-cloud proxy is available. Set `proxied: true` on A/AAAA/CNAME records for CDN + DDoS protection.
- **Origin CA**: Free SSL certificates trusted only by Cloudflare's edge. Use for origin-to-edge encryption.
- **Rate limits**: 1,200 requests per 5 minutes per user. Bulk operations should use batch endpoints.
- **Registrar**: Cloudflare Registrar offers at-cost domain registration for supported TLDs.

```typescript
// Cloudflare registrar configuration
await configureRegistrar({
  ventureId: 'serpspace-venture-uuid',
  provider: 'cloudflare',
  credentials: {
    apiToken: 'cf-scoped-api-token-xxx',   // Stored in vault, never logged
    // OR legacy global key:
    // apiKey: 'cf-global-api-key',
    // email: 'admin@serpspace.com',
  },
  defaultSettings: {
    proxy: true,             // Enable Cloudflare proxy by default
    autoSsl: true,           // Auto-provision Origin CA certs
    dnssec: true,            // Enable DNSSEC on new domains
  },
});
```

### AWS Route53

Route53 provides reliable DNS hosting with AWS-native integrations and health checks.

- **Auth**: AWS IAM credentials with Route53 + ACM permissions. Use IAM roles for EC2/ECS; access keys for external.
- **Hosted Zones**: Each domain requires a hosted zone ($0.50/month). Zones contain all DNS records.
- **Health Checks**: Route53 offers DNS-level health checks for failover routing. Integrate via `@mcv/connectors/aws`.
- **ACM**: AWS Certificate Manager provides free SSL certificates for use with CloudFront, ALB, API Gateway.
- **Registrar**: Route53 Domains supports registration for 300+ TLDs.
- **Rate limits**: 5 requests/second for ChangeResourceRecordSets. Use batch changes.

```typescript
// Route53 registrar configuration
await configureRegistrar({
  ventureId: 'fullgain-venture-uuid',
  provider: 'route53',
  credentials: {
    accessKeyId: 'AKIA...',             // Stored in vault
    secretAccessKey: 'xxx...',          // Stored in vault
    region: 'us-east-1',               // Must be us-east-1 for Route53
  },
  defaultSettings: {
    hostedZoneComment: 'Managed by MCV.ONE',
    defaultTtl: 300,
  },
});
```

### GoDaddy

GoDaddy provides broad TLD support and is commonly used for existing client domains.

- **Auth**: API Key + Secret pair. Obtain from developer.godaddy.com.
- **OTE Environment**: GoDaddy provides an OTE (Operational Test Environment) for testing. Use separate credentials.
- **DNS**: GoDaddy DNS is basic. Consider transferring DNS management to Cloudflare while keeping registration at GoDaddy.
- **Rate limits**: 60 requests/minute. Bulk operations need careful batching.
- **SSL**: GoDaddy sells SSL certificates but the API coverage is limited. Prefer Let's Encrypt for automated cert provisioning.
- **Aftermarket**: GoDaddy provides aftermarket/auction domain APIs for premium domain acquisition.

```typescript
// GoDaddy registrar configuration
await configureRegistrar({
  ventureId: 'serpspace-venture-uuid',
  provider: 'godaddy',
  credentials: {
    apiKey: 'gd-api-key-xxx',           // Stored in vault
    apiSecret: 'gd-api-secret-xxx',     // Stored in vault
    environment: 'production',           // 'production' | 'ote' (test)
  },
  defaultSettings: {
    privacy: true,            // WHOIS privacy by default
    autoRenew: true,          // Auto-renew enabled
  },
});
```

### Namecheap

Namecheap offers competitive pricing and is popular for budget-conscious domain portfolios.

- **Auth**: API Key + IP whitelist. API access must be enabled in the Namecheap dashboard, and the calling IP must be whitelisted.
- **XML API**: Namecheap uses an XML-based API (not REST/JSON). The adapter handles XML ↔ JSON translation.
- **Sandbox**: Namecheap provides a sandbox at `api.sandbox.namecheap.com` for testing.
- **Rate limits**: 20 requests/minute for general API calls; 50/minute for domain search.
- **FreeDNS**: Namecheap offers FreeDNS (BasicDNS) and PremiumDNS. The adapter supports both.

```typescript
// Namecheap registrar configuration
await configureRegistrar({
  ventureId: 'betedge-venture-uuid',
  provider: 'namecheap',
  credentials: {
    apiUser: 'ncuser',                   // Namecheap username
    apiKey: 'nc-api-key-xxx',            // Stored in vault
    clientIp: '203.0.113.50',            // Whitelisted server IP
    environment: 'production',            // 'production' | 'sandbox'
  },
  defaultSettings: {
    privacy: true,
    autoRenew: true,
    dnsProvider: 'namecheap',            // 'namecheap' | 'custom'
  },
});
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.x` | Database ORM for domain/DNS/SSL records |
| `@mcv/db` | `workspace:*` | Database connection & query builder |
| `@mcv/secrets` | `workspace:*` | Google Secret Manager vault for API keys |
| `@mcv/audit` | `workspace:*` | Audit trail logging for all domain operations |
| `@mcv/events` | `workspace:*` | Domain event publishing (registration, expiry, etc.) |
| `@mcv/rate-limit` | `workspace:*` | Token bucket rate limiter per registrar |
| `zod` | `^3.22.x` | Input validation for domain names, DNS records |
| `@aws-sdk/client-route-53` | `^3.x` | AWS Route53 DNS management |
| `@aws-sdk/client-route-53-domains` | `^3.x` | AWS Route53 domain registration |
| `@aws-sdk/client-acm` | `^3.x` | AWS Certificate Manager integration |
| `acme-client` | `^5.x` | ACME v2 protocol for Let's Encrypt |
| `node:dns/promises` | `node:dns` | DNS resolution for propagation checks |
| `punycode` | `^2.x` | IDN (internationalized domain name) encoding |
| `fast-xml-parser` | `^4.x` | XML parsing for Namecheap API responses |

---

## Constants

```typescript
// @mcv/connectors/registrars/constants.ts

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPORTED REGISTRARS
// ═══════════════════════════════════════════════════════════════════════════════

export const SUPPORTED_REGISTRARS = [
  'cloudflare', 'route53', 'godaddy', 'namecheap',
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// DNS RECORD TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const DNS_RECORD_TYPES = [
  'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'CAA', 'PTR', 'SOA',
  'ALIAS', 'DNSKEY', 'DS', 'NAPTR', 'SPF', 'SSHFP', 'TLSA',
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN STATUSES
// ═══════════════════════════════════════════════════════════════════════════════

export const DOMAIN_STATUSES = [
  'registering', 'active', 'locked', 'expired',
  'redemption', 'pending_delete', 'deleted', 'failed',
  'transferring_out', 'transferring_in',
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFER STATUSES
// ═══════════════════════════════════════════════════════════════════════════════

export const TRANSFER_STATUSES = [
  'pending', 'awaiting_approval', 'processing',
  'completed', 'failed', 'cancelled', 'rejected',
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SSL PROVIDERS & CHALLENGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const SSL_PROVIDERS = [
  'letsencrypt', 'cloudflare_origin', 'aws_acm', 'custom',
] as const;

export const ACME_CHALLENGE_TYPES = [
  'http-01', 'dns-01', 'tls-alpn-01',
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TTL DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Default TTL for new DNS records: 5 minutes */
export const DEFAULT_TTL = 300;

/** Minimum TTL allowed: 1 minute (Cloudflare proxy bypasses this) */
export const MIN_TTL = 60;

/** Maximum TTL allowed: 1 week */
export const MAX_TTL = 604800;

/** TTL for propagation-sensitive operations (e.g., pre-transfer): 5 minutes */
export const PROPAGATION_TTL = 300;

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN LOCK STATUSES (EPP Status Codes)
// ═══════════════════════════════════════════════════════════════════════════════

export const DOMAIN_LOCK_STATUSES = [
  'clientTransferProhibited',
  'clientUpdateProhibited',
  'clientDeleteProhibited',
  'clientHold',
  'serverTransferProhibited',
  'serverUpdateProhibited',
  'serverDeleteProhibited',
  'serverHold',
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TIMING & POLLING
// ═══════════════════════════════════════════════════════════════════════════════

/** DNS propagation check interval: 30 seconds */
export const PROPAGATION_CHECK_INTERVAL_MS = 30 * 1000;

/** DNS propagation timeout: 10 minutes */
export const PROPAGATION_TIMEOUT_MS = 10 * 60 * 1000;

/** Maximum propagation check attempts */
export const MAX_PROPAGATION_CHECKS = 20;

/** Domain expiry alert thresholds (days before expiry) */
export const EXPIRY_ALERT_THRESHOLDS = [90, 60, 30, 14, 7, 3, 1] as const;

/** SSL certificate renewal window: 30 days before expiry */
export const SSL_RENEWAL_WINDOW_DAYS = 30;

/** Transfer auto-approve timeout: 5 days */
export const TRANSFER_AUTO_APPROVE_DAYS = 5;

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMIT DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

export const RATE_LIMIT_DEFAULTS = {
  /** Max availability checks per minute per venture */
  availabilityChecksPerMinute: 30,

  /** Max registration requests per hour per venture */
  registrationsPerHour: 10,

  /** Max DNS record changes per minute per venture */
  dnsChangesPerMinute: 60,

  /** Max WHOIS lookups per minute per venture */
  whoisLookupsPerMinute: 10,

  /** Max transfer initiations per hour per venture */
  transfersPerHour: 5,

  /** Max SSL provisioning requests per hour per venture */
  sslProvisionPerHour: 20,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL DNS RESOLVERS (for propagation verification)
// ═══════════════════════════════════════════════════════════════════════════════

export const GLOBAL_DNS_RESOLVERS = [
  { name: 'Google', ip: '8.8.8.8' },
  { name: 'Google Secondary', ip: '8.8.4.4' },
  { name: 'Cloudflare', ip: '1.1.1.1' },
  { name: 'Cloudflare Secondary', ip: '1.0.0.1' },
  { name: 'Quad9', ip: '9.9.9.9' },
  { name: 'OpenDNS', ip: '208.67.222.222' },
] as const;
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REGISTRAR_DEFAULT_PROVIDER` | No | `cloudflare` | Default registrar for new domains |
| `REGISTRAR_DEFAULT_TTL` | No | `300` | Default DNS record TTL (seconds) |
| `REGISTRAR_PROPAGATION_TIMEOUT_MS` | No | `600000` | DNS propagation check timeout (10 min) |
| `REGISTRAR_PROPAGATION_INTERVAL_MS` | No | `30000` | Propagation check polling interval (30s) |
| `REGISTRAR_SSL_RENEWAL_DAYS` | No | `30` | Days before expiry to start SSL renewal |
| `REGISTRAR_EXPIRY_CHECK_CRON` | No | `0 8 * * *` | Cron for domain expiry checks (8 AM UTC daily) |
| `REGISTRAR_SSL_RENEWAL_CRON` | No | `0 3 * * *` | Cron for SSL renewal checks (3 AM UTC daily) |
| `REGISTRAR_DOMAIN_SYNC_CRON` | No | `0 */6 * * *` | Cron for domain status sync (every 6 hours) |
| `ACME_DIRECTORY_URL` | No | `https://acme-v02.api.letsencrypt.org/directory` | ACME v2 directory URL |
| `ACME_STAGING_DIRECTORY_URL` | No | `https://acme-staging-v02.api.letsencrypt.org/directory` | ACME staging directory (for testing) |
| `ACME_ACCOUNT_EMAIL` | Yes | — | Email for Let's Encrypt account registration |
| `ACME_CHALLENGE_TYPE` | No | `dns-01` | Default ACME challenge type |
| `GCP_SECRET_MANAGER_PROJECT` | Yes | — | GCP project for Secret Manager vault |
| `WHOIS_CACHE_TTL_SECONDS` | No | `3600` | WHOIS response cache TTL (1 hour) |
| `DNS_CACHE_TTL_SECONDS` | No | `60` | DNS record cache TTL (1 minute) |

---

## Database Schema

### Proposed Schema (Design — No Implementation Yet)

The registrars module requires six tables for complete domain lifecycle management. These schemas follow the same conventions as `@mcv/db` (Drizzle ORM, PostgreSQL, UUID primary keys, timezone-aware timestamps).

### domains Table

```sql
-- Domain registry: tracks all domains managed by MCV ventures
CREATE TABLE domains (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- Domain identity
  domain_name         VARCHAR(253) NOT NULL,     -- FQDN (e.g., 'example.com')
  tld                 VARCHAR(63) NOT NULL,      -- Top-level domain (e.g., 'com')
  sld                 VARCHAR(63) NOT NULL,      -- Second-level domain (e.g., 'example')
  idn_name            VARCHAR(253),              -- Internationalized form (punycode source)

  -- Registrar info
  registrar           VARCHAR(32) NOT NULL,      -- 'cloudflare' | 'route53' | 'godaddy' | 'namecheap'
  registrar_domain_id VARCHAR(128),              -- Provider's internal domain ID
  registrar_zone_id   VARCHAR(128),              -- DNS zone ID at provider

  -- Status
  status              VARCHAR(32) NOT NULL DEFAULT 'registering',
  epp_statuses        JSONB DEFAULT '[]',        -- EPP status codes (clientTransferProhibited, etc.)

  -- Dates
  registered_at       TIMESTAMPTZ,               -- Original registration date
  expires_at          TIMESTAMPTZ,               -- Current expiration date
  last_renewed_at     TIMESTAMPTZ,               -- Last renewal date

  -- Registration settings
  auto_renew          BOOLEAN NOT NULL DEFAULT true,
  privacy_enabled     BOOLEAN NOT NULL DEFAULT true,
  locked              BOOLEAN NOT NULL DEFAULT true,
  years_registered    INTEGER NOT NULL DEFAULT 1,

  -- Contacts (JSONB for flexibility across registrars)
  contacts            JSONB,                     -- { registrant, admin, tech, billing }

  -- DNSSEC
  dnssec_enabled      BOOLEAN NOT NULL DEFAULT false,
  dnssec_ds_records   JSONB DEFAULT '[]',        -- DS records for parent zone

  -- Nameservers
  nameservers         JSONB DEFAULT '[]',        -- ['ns1.cloudflare.com', 'ns2.cloudflare.com']

  -- Pricing
  registration_price  DECIMAL(10,2),
  renewal_price       DECIMAL(10,2),
  currency            VARCHAR(3) DEFAULT 'USD',

  -- Metadata
  tags                JSONB DEFAULT '[]',        -- User-defined tags for organization
  metadata            JSONB DEFAULT '{}',        -- Provider-specific metadata

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT domains_venture_domain_unique UNIQUE (venture_id, domain_name)
);

-- Indexes
CREATE INDEX idx_domains_venture_id ON domains(venture_id);
CREATE INDEX idx_domains_status ON domains(status);
CREATE INDEX idx_domains_expires_at ON domains(expires_at);
CREATE INDEX idx_domains_registrar ON domains(registrar);
CREATE INDEX idx_domains_domain_name ON domains(domain_name);
CREATE INDEX idx_domains_tld ON domains(tld);
```

```typescript
// Drizzle ORM equivalent
export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),

  domainName: varchar('domain_name', { length: 253 }).notNull(),
  tld: varchar('tld', { length: 63 }).notNull(),
  sld: varchar('sld', { length: 63 }).notNull(),
  idnName: varchar('idn_name', { length: 253 }),

  registrar: varchar('registrar', { length: 32 }).notNull(),
  registrarDomainId: varchar('registrar_domain_id', { length: 128 }),
  registrarZoneId: varchar('registrar_zone_id', { length: 128 }),

  status: varchar('status', { length: 32 }).notNull().default('registering'),
  eppStatuses: jsonb('epp_statuses').$type<string[]>().default([]),

  registeredAt: timestamp('registered_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastRenewedAt: timestamp('last_renewed_at', { withTimezone: true }),

  autoRenew: boolean('auto_renew').notNull().default(true),
  privacyEnabled: boolean('privacy_enabled').notNull().default(true),
  locked: boolean('locked').notNull().default(true),
  yearsRegistered: integer('years_registered').notNull().default(1),

  contacts: jsonb('contacts').$type<DomainContactSet>(),
  dnssecEnabled: boolean('dnssec_enabled').notNull().default(false),
  dnssecDsRecords: jsonb('dnssec_ds_records').$type<DnssecDsRecord[]>().default([]),
  nameservers: jsonb('nameservers').$type<string[]>().default([]),

  registrationPrice: decimal('registration_price', { precision: 10, scale: 2 }),
  renewalPrice: decimal('renewal_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),

  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureDomainUnique: uniqueIndex('domains_venture_domain_unique').on(table.ventureId, table.domainName),
  ventureIdx: index('idx_domains_venture_id').on(table.ventureId),
  statusIdx: index('idx_domains_status').on(table.status),
  expiresAtIdx: index('idx_domains_expires_at').on(table.expiresAt),
  registrarIdx: index('idx_domains_registrar').on(table.registrar),
  domainNameIdx: index('idx_domains_domain_name').on(table.domainName),
  tldIdx: index('idx_domains_tld').on(table.tld),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
  venture: one(ventures, { fields: [domains.ventureId], references: [ventures.id] }),
  dnsRecords: many(dnsRecords),
  sslCertificates: many(sslCertificates),
  transfersIn: many(domainTransfers, { relationName: 'transfersIn' }),
}));
```

### dns_records Table

```sql
-- DNS records: individual records within a domain's zone
CREATE TABLE dns_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id           UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- Record identity
  record_type         VARCHAR(10) NOT NULL,      -- 'A', 'AAAA', 'CNAME', 'MX', 'TXT', etc.
  name                VARCHAR(253) NOT NULL,     -- Record name (e.g., '@', 'www', 'mail')
  content             TEXT NOT NULL,              -- Record value (IP, hostname, text, etc.)

  -- Record settings
  ttl                 INTEGER NOT NULL DEFAULT 300,
  priority            INTEGER,                    -- MX/SRV priority
  proxied             BOOLEAN DEFAULT false,      -- Cloudflare proxy (orange cloud)

  -- SRV-specific fields
  srv_weight          INTEGER,
  srv_port            INTEGER,
  srv_target          VARCHAR(253),

  -- CAA-specific fields
  caa_flags           INTEGER,
  caa_tag             VARCHAR(16),               -- 'issue', 'issuewild', 'iodef'

  -- Provider reference
  provider_record_id  VARCHAR(128),              -- Provider's record ID for updates/deletes

  -- Propagation tracking
  propagation_status  VARCHAR(16) DEFAULT 'pending', -- 'pending' | 'propagating' | 'propagated' | 'failed'
  last_propagation_check TIMESTAMPTZ,
  propagated_at       TIMESTAMPTZ,

  -- Metadata
  comment             TEXT,                       -- Human-readable note for this record
  tags                JSONB DEFAULT '[]',

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT dns_records_check_ttl CHECK (ttl >= 60 AND ttl <= 604800)
);

-- Indexes
CREATE INDEX idx_dns_records_domain_id ON dns_records(domain_id);
CREATE INDEX idx_dns_records_venture_id ON dns_records(venture_id);
CREATE INDEX idx_dns_records_type ON dns_records(record_type);
CREATE INDEX idx_dns_records_name ON dns_records(name);
CREATE INDEX idx_dns_records_propagation ON dns_records(propagation_status);
```

```typescript
// Drizzle ORM equivalent
export const dnsRecords = pgTable('dns_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: uuid('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),

  recordType: varchar('record_type', { length: 10 }).notNull(),
  name: varchar('name', { length: 253 }).notNull(),
  content: text('content').notNull(),

  ttl: integer('ttl').notNull().default(300),
  priority: integer('priority'),
  proxied: boolean('proxied').default(false),

  srvWeight: integer('srv_weight'),
  srvPort: integer('srv_port'),
  srvTarget: varchar('srv_target', { length: 253 }),

  caaFlags: integer('caa_flags'),
  caaTag: varchar('caa_tag', { length: 16 }),

  providerRecordId: varchar('provider_record_id', { length: 128 }),

  propagationStatus: varchar('propagation_status', { length: 16 }).default('pending'),
  lastPropagationCheck: timestamp('last_propagation_check', { withTimezone: true }),
  propagatedAt: timestamp('propagated_at', { withTimezone: true }),

  comment: text('comment'),
  tags: jsonb('tags').$type<string[]>().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  domainIdx: index('idx_dns_records_domain_id').on(table.domainId),
  ventureIdx: index('idx_dns_records_venture_id').on(table.ventureId),
  typeIdx: index('idx_dns_records_type').on(table.recordType),
  nameIdx: index('idx_dns_records_name').on(table.name),
  propagationIdx: index('idx_dns_records_propagation').on(table.propagationStatus),
}));

export const dnsRecordsRelations = relations(dnsRecords, ({ one }) => ({
  domain: one(domains, { fields: [dnsRecords.domainId], references: [domains.id] }),
  venture: one(ventures, { fields: [dnsRecords.ventureId], references: [ventures.id] }),
}));
```

### ssl_certificates Table

```sql
-- SSL certificates: tracks issuance, renewal, and revocation
CREATE TABLE ssl_certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id           UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- Certificate identity
  common_name         VARCHAR(253) NOT NULL,     -- Primary domain (e.g., 'example.com')
  san_domains         JSONB DEFAULT '[]',        -- Subject Alternative Names (e.g., ['*.example.com', 'www.example.com'])

  -- Provider info
  ssl_provider        VARCHAR(32) NOT NULL,      -- 'letsencrypt' | 'cloudflare_origin' | 'aws_acm' | 'custom'
  provider_cert_id    VARCHAR(256),              -- Provider's certificate ID/ARN

  -- Certificate status
  status              VARCHAR(32) NOT NULL DEFAULT 'pending',
  -- 'pending' | 'validating' | 'issued' | 'deployed' | 'expired' | 'revoked' | 'failed'

  -- ACME challenge tracking
  challenge_type      VARCHAR(16),               -- 'http-01' | 'dns-01' | 'tls-alpn-01'
  challenge_token     TEXT,                      -- Challenge token (stored encrypted)
  challenge_response  TEXT,                      -- Challenge response value

  -- Certificate data (PEM, stored in vault)
  cert_pem_resource   TEXT,                      -- Vault resource name for certificate PEM
  key_pem_resource    TEXT,                      -- Vault resource name for private key PEM
  chain_pem_resource  TEXT,                      -- Vault resource name for CA chain PEM
  fullchain_pem_resource TEXT,                   -- Vault resource name for fullchain PEM

  -- Validity dates
  issued_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  last_renewed_at     TIMESTAMPTZ,

  -- Revocation
  revoked_at          TIMESTAMPTZ,
  revoke_reason       TEXT,

  -- Auto-renewal
  auto_renew          BOOLEAN NOT NULL DEFAULT true,
  renewal_attempts    INTEGER NOT NULL DEFAULT 0,
  last_renewal_error  TEXT,

  -- Certificate fingerprints
  fingerprint_sha256  VARCHAR(95),               -- SHA-256 fingerprint
  serial_number       VARCHAR(128),              -- Certificate serial number

  -- Metadata
  metadata            JSONB DEFAULT '{}',

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ssl_certs_domain_id ON ssl_certificates(domain_id);
CREATE INDEX idx_ssl_certs_venture_id ON ssl_certificates(venture_id);
CREATE INDEX idx_ssl_certs_status ON ssl_certificates(status);
CREATE INDEX idx_ssl_certs_expires_at ON ssl_certificates(expires_at);
CREATE INDEX idx_ssl_certs_provider ON ssl_certificates(ssl_provider);
```

```typescript
// Drizzle ORM equivalent
export const sslCertificates = pgTable('ssl_certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: uuid('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),

  commonName: varchar('common_name', { length: 253 }).notNull(),
  sanDomains: jsonb('san_domains').$type<string[]>().default([]),

  sslProvider: varchar('ssl_provider', { length: 32 }).notNull(),
  providerCertId: varchar('provider_cert_id', { length: 256 }),

  status: varchar('status', { length: 32 }).notNull().default('pending'),

  challengeType: varchar('challenge_type', { length: 16 }),
  challengeToken: text('challenge_token'),
  challengeResponse: text('challenge_response'),

  certPemResource: text('cert_pem_resource'),
  keyPemResource: text('key_pem_resource'),
  chainPemResource: text('chain_pem_resource'),
  fullchainPemResource: text('fullchain_pem_resource'),

  issuedAt: timestamp('issued_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastRenewedAt: timestamp('last_renewed_at', { withTimezone: true }),

  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokeReason: text('revoke_reason'),

  autoRenew: boolean('auto_renew').notNull().default(true),
  renewalAttempts: integer('renewal_attempts').notNull().default(0),
  lastRenewalError: text('last_renewal_error'),

  fingerprintSha256: varchar('fingerprint_sha256', { length: 95 }),
  serialNumber: varchar('serial_number', { length: 128 }),

  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  domainIdx: index('idx_ssl_certs_domain_id').on(table.domainId),
  ventureIdx: index('idx_ssl_certs_venture_id').on(table.ventureId),
  statusIdx: index('idx_ssl_certs_status').on(table.status),
  expiresAtIdx: index('idx_ssl_certs_expires_at').on(table.expiresAt),
  providerIdx: index('idx_ssl_certs_provider').on(table.sslProvider),
}));

export const sslCertificatesRelations = relations(sslCertificates, ({ one }) => ({
  domain: one(domains, { fields: [sslCertificates.domainId], references: [domains.id] }),
  venture: one(ventures, { fields: [sslCertificates.ventureId], references: [ventures.id] }),
}));
```

### domain_transfers Table

```sql
-- Domain transfers: tracks inbound and outbound domain transfers
CREATE TABLE domain_transfers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id           UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- Transfer direction
  direction           VARCHAR(8) NOT NULL,       -- 'inbound' | 'outbound'

  -- Registrars involved
  source_registrar    VARCHAR(32) NOT NULL,       -- Losing registrar
  target_registrar    VARCHAR(32) NOT NULL,       -- Gaining registrar

  -- Auth code (stored in vault)
  auth_code_resource  TEXT,                       -- Vault resource name for EPP auth code

  -- Status tracking
  status              VARCHAR(32) NOT NULL DEFAULT 'pending',
  current_step        VARCHAR(64),                -- Human-readable current step
  steps_completed     JSONB DEFAULT '[]',         -- Array of completed step objects

  -- Provider references
  source_transfer_id  VARCHAR(128),               -- Transfer ID at source registrar
  target_transfer_id  VARCHAR(128),               -- Transfer ID at target registrar

  -- Dates
  initiated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,

  -- Error tracking
  error_code          VARCHAR(64),
  error_message       TEXT,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  max_retries         INTEGER NOT NULL DEFAULT 3,

  -- Initiated by
  initiated_by        UUID,                       -- User who initiated the transfer

  -- Metadata
  metadata            JSONB DEFAULT '{}',

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transfers_domain_id ON domain_transfers(domain_id);
CREATE INDEX idx_transfers_venture_id ON domain_transfers(venture_id);
CREATE INDEX idx_transfers_status ON domain_transfers(status);
CREATE INDEX idx_transfers_direction ON domain_transfers(direction);
CREATE INDEX idx_transfers_initiated_at ON domain_transfers(initiated_at);
```

```typescript
// Drizzle ORM equivalent
export const domainTransfers = pgTable('domain_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: uuid('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),

  direction: varchar('direction', { length: 8 }).notNull(),
  sourceRegistrar: varchar('source_registrar', { length: 32 }).notNull(),
  targetRegistrar: varchar('target_registrar', { length: 32 }).notNull(),

  authCodeResource: text('auth_code_resource'),

  status: varchar('status', { length: 32 }).notNull().default('pending'),
  currentStep: varchar('current_step', { length: 64 }),
  stepsCompleted: jsonb('steps_completed').$type<TransferStep[]>().default([]),

  sourceTransferId: varchar('source_transfer_id', { length: 128 }),
  targetTransferId: varchar('target_transfer_id', { length: 128 }),

  initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),

  errorCode: varchar('error_code', { length: 64 }),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),

  initiatedBy: uuid('initiated_by'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  domainIdx: index('idx_transfers_domain_id').on(table.domainId),
  ventureIdx: index('idx_transfers_venture_id').on(table.ventureId),
  statusIdx: index('idx_transfers_status').on(table.status),
  directionIdx: index('idx_transfers_direction').on(table.direction),
  initiatedAtIdx: index('idx_transfers_initiated_at').on(table.initiatedAt),
}));

export const domainTransfersRelations = relations(domainTransfers, ({ one }) => ({
  domain: one(domains, { fields: [domainTransfers.domainId], references: [domains.id] }),
  venture: one(ventures, { fields: [domainTransfers.ventureId], references: [ventures.id] }),
}));
```

### registrar_credentials Table

```sql
-- Registrar credentials: per-venture registrar API configurations
CREATE TABLE registrar_credentials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- Provider identity
  provider            VARCHAR(32) NOT NULL,      -- 'cloudflare' | 'route53' | 'godaddy' | 'namecheap'

  -- Credential references (stored in vault)
  credential_resource TEXT NOT NULL,             -- Vault resource name for API credentials JSON

  -- Provider-specific metadata
  account_id          VARCHAR(128),              -- Provider account ID
  account_email       VARCHAR(255),              -- Account email for notifications

  -- Default settings for this registrar
  default_settings    JSONB DEFAULT '{}',        -- { proxy: true, autoSsl: true, privacy: true, ... }

  -- Health check
  is_enabled          BOOLEAN NOT NULL DEFAULT true,
  last_health_check   TIMESTAMPTZ,
  health_status       VARCHAR(16) DEFAULT 'unknown', -- 'healthy' | 'degraded' | 'down' | 'unknown'
  last_error          TEXT,

  -- Usage tracking
  domains_count       INTEGER NOT NULL DEFAULT 0,
  api_calls_today     INTEGER NOT NULL DEFAULT 0,
  last_api_call       TIMESTAMPTZ,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT reg_creds_venture_provider_unique UNIQUE (venture_id, provider)
);

-- Indexes
CREATE INDEX idx_reg_creds_venture_id ON registrar_credentials(venture_id);
CREATE INDEX idx_reg_creds_provider ON registrar_credentials(provider);
CREATE INDEX idx_reg_creds_health ON registrar_credentials(health_status);
```

### domain_audit_logs Table

```sql
-- Domain audit logs: immutable trail of all domain operations
CREATE TABLE domain_audit_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id),

  -- What happened
  action              VARCHAR(64) NOT NULL,      -- 'domain.registered', 'dns.record_created', etc.
  resource_type       VARCHAR(32) NOT NULL,      -- 'domain' | 'dns_record' | 'ssl_certificate' | 'transfer'
  resource_id         UUID NOT NULL,             -- ID of affected resource

  -- Who did it
  user_id             UUID,                      -- Human user (null for system/automated)
  actor_type          VARCHAR(16) NOT NULL DEFAULT 'user', -- 'user' | 'system' | 'cron' | 'api'
  ip_address          INET,

  -- What changed
  changes             JSONB,                     -- { before: {...}, after: {...} }
  details             JSONB DEFAULT '{}',        -- Additional context

  -- Provider interaction
  registrar           VARCHAR(32),               -- Which registrar was involved
  provider_request_id VARCHAR(128),              -- Provider's request/transaction ID
  provider_response   JSONB,                     -- Raw provider response (sanitized)

  -- Status
  success             BOOLEAN NOT NULL DEFAULT true,
  error_code          VARCHAR(64),
  error_message       TEXT,

  -- Timing
  duration_ms         INTEGER,                   -- Operation duration

  -- Timestamps (no updated_at — audit logs are immutable)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (optimized for audit queries)
CREATE INDEX idx_audit_venture_id ON domain_audit_logs(venture_id);
CREATE INDEX idx_audit_action ON domain_audit_logs(action);
CREATE INDEX idx_audit_resource ON domain_audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON domain_audit_logs(created_at);
CREATE INDEX idx_audit_user_id ON domain_audit_logs(user_id);
CREATE INDEX idx_audit_venture_created ON domain_audit_logs(venture_id, created_at DESC);
```

### Entity Relationship Diagram

```
┌──────────────────────┐       ┌──────────────────────┐
│   ventures           │       │   users              │
│   ──────────         │       │   ─────              │
│   id (PK)            │       │   id (PK)            │
└──────────┬───────────┘       └──────────┬───────────┘
           │                              │
    ┌──────┼────────────┐                 │
    │      │            │                 │
    │      ▼            ▼                 │
    │  ┌────────────┐ ┌────────────────┐  │
    │  │ registrar_ │ │ domain_audit_  │  │
    │  │ credentials│ │ logs           │◀─┘
    │  │            │ │                │
    │  │ PK: id     │ │ PK: id        │
    │  │ FK: venture│ │ FK: venture    │
    │  │ UK: venture│ │ FK: user       │
    │  │   +provider│ │ IX: action     │
    │  └────────────┘ │ IX: resource   │
    │                 │ IX: created_at │
    │                 └────────────────┘
    │
    ▼
┌────────────────────┐
│   domains          │
│   ───────          │
│   PK: id           │
│   FK: venture_id   │
│   UK: venture+name │
│   IX: status       │
│   IX: expires_at   │
│   IX: registrar    │
│   IX: domain_name  │
└──┬────┬────┬───────┘
   │    │    │
   │    │    │ 1:N
   │    │    ▼
   │    │ ┌──────────────────┐
   │    │ │ domain_transfers │
   │    │ │                  │
   │    │ │ PK: id           │
   │    │ │ FK: domain_id    │
   │    │ │ FK: venture_id   │
   │    │ │ IX: status       │
   │    │ │ IX: direction    │
   │    │ └──────────────────┘
   │    │
   │    │ 1:N
   │    ▼
   │ ┌──────────────────┐
   │ │ ssl_certificates │
   │ │                  │
   │ │ PK: id           │
   │ │ FK: domain_id    │
   │ │ FK: venture_id   │
   │ │ IX: status       │
   │ │ IX: expires_at   │
   │ │ IX: provider     │
   │ └──────────────────┘
   │
   │ 1:N
   ▼
┌──────────────────┐
│ dns_records      │
│                  │
│ PK: id           │
│ FK: domain_id    │
│ FK: venture_id   │
│ IX: record_type  │
│ IX: name         │
│ IX: propagation  │
└──────────────────┘
```

---

## TypeScript Interfaces

```typescript
// @mcv/connectors/registrars/types.ts

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRAR PROVIDER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type RegistrarProvider = 'cloudflare' | 'route53' | 'godaddy' | 'namecheap';

export interface RegistrarConfig {
  provider: RegistrarProvider;
  credentialResource: string;            // Vault resource name
  accountId?: string;
  accountEmail?: string;
  defaultSettings: RegistrarDefaultSettings;
  isEnabled: boolean;
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
}

export interface RegistrarDefaultSettings {
  proxy?: boolean;                       // Cloudflare proxy (orange cloud)
  autoSsl?: boolean;                     // Auto-provision SSL on registration
  privacy?: boolean;                     // WHOIS privacy by default
  autoRenew?: boolean;                   // Auto-renew domains
  dnssec?: boolean;                      // Enable DNSSEC on new domains
  defaultTtl?: number;                   // Default DNS record TTL
  dnsProvider?: string;                  // DNS hosting provider if different from registrar
}

export interface RegistrarCapabilities {
  registration: boolean;
  dns: boolean;
  ssl: boolean;
  transfer: boolean;
  dnssec: boolean;
  whois: boolean;
  bulkOps: boolean;
  proxy: boolean;                        // CDN/DDoS proxy (Cloudflare-specific)
}

export interface RegistrarBalance {
  provider: RegistrarProvider;
  balance: number;
  currency: string;
  hasSufficientFunds: boolean;
  lastUpdated: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type DomainStatus =
  | 'registering' | 'active' | 'locked' | 'expired'
  | 'redemption' | 'pending_delete' | 'deleted' | 'failed'
  | 'transferring_out' | 'transferring_in';

export interface Domain {
  id: string;
  ventureId: string;
  domainName: string;
  tld: string;
  sld: string;
  idnName?: string;

  registrar: RegistrarProvider;
  registrarDomainId?: string;
  registrarZoneId?: string;

  status: DomainStatus;
  eppStatuses: string[];

  registeredAt?: Date;
  expiresAt?: Date;
  lastRenewedAt?: Date;

  autoRenew: boolean;
  privacyEnabled: boolean;
  locked: boolean;
  yearsRegistered: number;

  contacts?: DomainContactSet;
  dnssecEnabled: boolean;
  nameservers: string[];

  registrationPrice?: number;
  renewalPrice?: number;
  currency: string;

  tags: string[];
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

export interface DomainContact {
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;                         // E.164 format (e.g., '+14155551234')
  fax?: string;
  address1: string;
  address2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;                       // ISO 3166-1 alpha-2 (e.g., 'US', 'CA')
}

export interface DomainContactSet {
  registrant: DomainContact;
  admin?: DomainContact;                 // Defaults to registrant if not provided
  tech?: DomainContact;                  // Defaults to registrant if not provided
  billing?: DomainContact;               // Defaults to registrant if not provided
}

export interface DomainRegistrationRequest {
  ventureId: string;
  domainName: string;
  registrar?: RegistrarProvider;         // Uses default if not specified
  years?: number;                        // Default: 1
  autoRenew?: boolean;                   // Default: true
  privacy?: boolean;                     // Default: true
  contacts: DomainContactSet;
  nameservers?: string[];                // Use registrar defaults if not provided
  autoSsl?: boolean;                     // Auto-provision SSL certificate
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DomainRenewalRequest {
  domainId: string;
  years?: number;                        // Default: 1
}

export interface DomainAvailability {
  domainName: string;
  available: boolean;
  premium: boolean;                      // Premium/aftermarket domain
  price?: DomainPricing;
  registrar: RegistrarProvider;
  tld: string;
  restrictions?: string[];               // Registration restrictions (e.g., 'requires local presence')
}

export interface DomainPricing {
  registration: number;
  renewal: number;
  transfer: number;
  currency: string;
  premiumPrice?: number;                 // Premium domain price (if applicable)
}

export interface DomainSuggestion {
  domainName: string;
  available: boolean;
  price?: DomainPricing;
  relevanceScore: number;               // 0-1, how relevant to the search query
  source: 'tld_variation' | 'keyword' | 'ai_suggestion';
}

// ═══════════════════════════════════════════════════════════════════════════════
// DNS RECORD TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type DnsRecordType =
  | 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV'
  | 'NS' | 'CAA' | 'PTR' | 'SOA' | 'ALIAS'
  | 'DNSKEY' | 'DS' | 'NAPTR' | 'SPF' | 'SSHFP' | 'TLSA';

export interface DnsRecord {
  id: string;
  domainId: string;
  recordType: DnsRecordType;
  name: string;                          // '@' for root, 'www', 'mail', etc.
  content: string;                       // Value (IP, hostname, text, etc.)
  ttl: number;
  priority?: number;                     // MX/SRV priority
  proxied?: boolean;                     // Cloudflare proxy

  // SRV-specific
  srvWeight?: number;
  srvPort?: number;
  srvTarget?: string;

  // CAA-specific
  caaFlags?: number;
  caaTag?: string;

  providerRecordId?: string;
  propagationStatus: 'pending' | 'propagating' | 'propagated' | 'failed';
  propagatedAt?: Date;

  comment?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DnsRecordCreateRequest {
  domainId: string;
  recordType: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;                          // Default: 300
  priority?: number;
  proxied?: boolean;
  comment?: string;
  tags?: string[];

  // SRV-specific
  srvWeight?: number;
  srvPort?: number;
  srvTarget?: string;

  // CAA-specific
  caaFlags?: number;
  caaTag?: string;
}

export interface DnsRecordUpdateRequest {
  recordId: string;
  content?: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
  comment?: string;
  tags?: string[];
}

export interface DnsBatchOperation {
  creates?: DnsRecordCreateRequest[];
  updates?: DnsRecordUpdateRequest[];
  deletes?: string[];                    // Record IDs to delete
}

export interface DnsPropagationResult {
  recordId: string;
  domainName: string;
  recordType: DnsRecordType;
  expectedValue: string;
  resolvers: DnsPropagationResolverResult[];
  fullyPropagated: boolean;
  checkedAt: Date;
}

export interface DnsPropagationResolverResult {
  resolver: string;
  resolverName: string;
  actualValue: string | null;
  matches: boolean;
  latencyMs: number;
}

export interface DnsZone {
  domainId: string;
  domainName: string;
  records: DnsRecord[];
  soa?: DnsRecord;
  exportedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SSL CERTIFICATE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SslCertificateStatus =
  | 'pending' | 'validating' | 'issued' | 'deployed'
  | 'expired' | 'revoked' | 'failed';

export type SslProviderType = 'letsencrypt' | 'cloudflare_origin' | 'aws_acm' | 'custom';

export type SslChallengeType = 'http-01' | 'dns-01' | 'tls-alpn-01';

export interface SslCertificate {
  id: string;
  domainId: string;
  commonName: string;
  sanDomains: string[];
  sslProvider: SslProviderType;
  providerCertId?: string;
  status: SslCertificateStatus;
  challengeType?: SslChallengeType;
  issuedAt?: Date;
  expiresAt?: Date;
  lastRenewedAt?: Date;
  autoRenew: boolean;
  fingerprintSha256?: string;
  serialNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SslProvisionRequest {
  domainId: string;
  provider?: SslProviderType;            // Default: 'letsencrypt'
  challengeType?: SslChallengeType;      // Default: 'dns-01'
  sanDomains?: string[];                 // Additional domains (e.g., '*.example.com')
  autoRenew?: boolean;                   // Default: true
  keyType?: 'rsa2048' | 'rsa4096' | 'ec256' | 'ec384';  // Default: 'ec256'
}

export interface SslChallenge {
  type: SslChallengeType;
  domain: string;
  token: string;
  keyAuthorization: string;
  dnsRecordName?: string;               // For dns-01: '_acme-challenge.example.com'
  dnsRecordValue?: string;              // For dns-01: TXT record value
  httpPath?: string;                    // For http-01: '/.well-known/acme-challenge/{token}'
  httpContent?: string;                 // For http-01: file content
}

export interface AcmeAccount {
  accountUrl: string;
  email: string;
  createdAt: Date;
  kid: string;                           // Key identifier
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TransferStatusType =
  | 'pending' | 'awaiting_approval' | 'processing'
  | 'completed' | 'failed' | 'cancelled' | 'rejected';

export interface TransferRequest {
  domainId: string;
  targetRegistrar: RegistrarProvider;
  authCode: string;                      // EPP auth code
  contacts?: DomainContactSet;           // Override contacts for target registrar
  autoRenew?: boolean;
  privacy?: boolean;
}

export interface TransferStatus {
  id: string;
  domainId: string;
  domainName: string;
  direction: 'inbound' | 'outbound';
  sourceRegistrar: RegistrarProvider;
  targetRegistrar: RegistrarProvider;
  status: TransferStatusType;
  currentStep: string;
  stepsCompleted: TransferStep[];
  initiatedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface TransferStep {
  step: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  completedAt?: Date;
  details?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHOIS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WhoisInfo {
  domainName: string;
  registrar: string;
  registrarUrl?: string;
  registrarWhoisServer?: string;
  status: string[];                      // EPP status codes
  nameservers: string[];
  creationDate?: Date;
  expirationDate?: Date;
  updatedDate?: Date;
  registrant?: WhoisContact;
  admin?: WhoisContact;
  tech?: WhoisContact;
  dnssec: boolean;
  rawText: string;                       // Raw WHOIS response
}

export interface WhoisContact {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
}

export interface WhoisHistory {
  domainName: string;
  records: WhoisHistoryRecord[];
}

export interface WhoisHistoryRecord {
  checkedAt: Date;
  registrar: string;
  expirationDate?: Date;
  nameservers: string[];
  status: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// DNSSEC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DnssecConfig {
  enabled: boolean;
  algorithm: number;                     // DNSSEC algorithm number (e.g., 13 = ECDSAP256SHA256)
  digestType: number;                    // Digest type (e.g., 2 = SHA-256)
  dsRecords: DnssecDsRecord[];
  keyTag: number;
  flags: number;                         // 256 = ZSK, 257 = KSK
  publicKey: string;
}

export interface DnssecDsRecord {
  keyTag: number;
  algorithm: number;
  digestType: number;
  digest: string;
}

export interface DnssecKeyInfo {
  keyTag: number;
  algorithm: number;
  flags: number;
  publicKey: string;
  createdAt: Date;
  expiresAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type RegistrarErrorCode =
  | 'DOMAIN_NOT_AVAILABLE'
  | 'DOMAIN_NOT_FOUND'
  | 'DOMAIN_ALREADY_REGISTERED'
  | 'DOMAIN_LOCKED'
  | 'DOMAIN_EXPIRED'
  | 'INVALID_DOMAIN_NAME'
  | 'INVALID_TLD'
  | 'INVALID_CONTACT'
  | 'INVALID_NAMESERVERS'
  | 'DNS_RECORD_NOT_FOUND'
  | 'DNS_RECORD_CONFLICT'
  | 'DNS_PROPAGATION_TIMEOUT'
  | 'DNS_ZONE_NOT_FOUND'
  | 'SSL_PROVISION_FAILED'
  | 'SSL_CHALLENGE_FAILED'
  | 'SSL_CERTIFICATE_NOT_FOUND'
  | 'SSL_RENEWAL_FAILED'
  | 'TRANSFER_AUTH_CODE_INVALID'
  | 'TRANSFER_NOT_ELIGIBLE'
  | 'TRANSFER_ALREADY_IN_PROGRESS'
  | 'TRANSFER_CANCELLED'
  | 'TRANSFER_REJECTED'
  | 'REGISTRAR_NOT_CONFIGURED'
  | 'REGISTRAR_API_ERROR'
  | 'REGISTRAR_RATE_LIMITED'
  | 'REGISTRAR_AUTH_FAILED'
  | 'REGISTRAR_INSUFFICIENT_FUNDS'
  | 'WHOIS_LOOKUP_FAILED'
  | 'DNSSEC_NOT_SUPPORTED'
  | 'DNSSEC_VALIDATION_FAILED'
  | 'VAULT_ERROR'
  | 'RATE_LIMITED';

export class RegistrarError extends Error {
  constructor(
    public code: RegistrarErrorCode,
    message: string,
    public details?: Record<string, unknown>,
    public httpStatus?: number
  ) {
    super(message);
    this.name = 'RegistrarError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DomainEvent {
  type: DomainEventType;
  ventureId: string;
  domainId: string;
  domainName: string;
  registrar: RegistrarProvider;
  userId?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export type DomainEventType =
  | 'domain.registered' | 'domain.renewed' | 'domain.expired'
  | 'domain.locked' | 'domain.unlocked' | 'domain.deleted'
  | 'dns.record_created' | 'dns.record_updated' | 'dns.record_deleted'
  | 'dns.batch_updated' | 'dns.propagated'
  | 'ssl.certificate_issued' | 'ssl.certificate_renewed' | 'ssl.certificate_revoked'
  | 'ssl.certificate_expired' | 'ssl.challenge_completed'
  | 'transfer.initiated' | 'transfer.approved' | 'transfer.completed'
  | 'transfer.failed' | 'transfer.cancelled'
  | 'dnssec.enabled' | 'dnssec.disabled' | 'dnssec.keys_rotated';

export interface DomainAuditEvent {
  ventureId: string;
  action: string;
  resourceType: 'domain' | 'dns_record' | 'ssl_certificate' | 'transfer' | 'registrar_config';
  resourceId: string;
  userId?: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  details: Record<string, unknown>;
}
```

---

## Service Implementation

```typescript
// @mcv/connectors/registrars/services/domain.service.ts
import { db, eq, and, lt, sql, desc, inArray } from '@mcv/db';
import { domains, dnsRecords, registrarCredentials, domainAuditLogs } from '../schema';
import { SecretManagerService } from '@mcv/secrets';
import { auditLog } from '@mcv/audit';
import { eventBus } from '@mcv/events';
import {
  DEFAULT_TTL, SUPPORTED_REGISTRARS,
} from '../constants';
import type {
  RegistrarProvider, DomainRegistrationRequest, DomainAvailability,
  Domain, DomainPricing, RegistrarConfig,
} from '../types';
import { RegistrarError } from '../types';
import { getAdapter } from '../adapters';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class DomainService {
  private secretManager: SecretManagerService;

  constructor(secretManager?: SecretManagerService) {
    this.secretManager = secretManager ?? new SecretManagerService();
  }

  // ─── AVAILABILITY ───────────────────────────────────────────────────────────

  /**
   * Check if a domain name is available for registration.
   * Queries the configured registrar's API for real-time availability and pricing.
   *
   * @param ventureId - The venture checking availability
   * @param domainName - Fully qualified domain name (e.g., 'example.com')
   * @param registrar - Optional specific registrar to check (uses default if omitted)
   * @returns Availability status with pricing information
   *
   * @throws {RegistrarError} INVALID_DOMAIN_NAME — domain format is invalid
   * @throws {RegistrarError} REGISTRAR_NOT_CONFIGURED — no registrar configured
   * @throws {RegistrarError} REGISTRAR_API_ERROR — provider API returned an error
   */
  async checkAvailability(
    ventureId: string,
    domainName: string,
    registrar?: RegistrarProvider
  ): Promise<DomainAvailability> {
    // Validate domain name
    this.validateDomainName(domainName);

    const config = await this.getRegistrarConfig(ventureId, registrar);
    const adapter = await this.getProviderAdapter(config);

    const result = await adapter.checkAvailability(domainName);

    await auditLog({
      ventureId,
      action: 'domain.availability_checked',
      resourceType: 'domain',
      resourceId: domainName,
      details: {
        domainName,
        available: result.available,
        registrar: config.provider,
        premium: result.premium,
      },
    });

    return result;
  }

  // ─── REGISTRATION ──────────────────────────────────────────────────────────

  /**
   * Register a new domain name.
   * Creates the domain at the registrar, sets up a DNS zone, and optionally
   * provisions an SSL certificate.
   *
   * @param request - Registration parameters including domain, contacts, and options
   * @returns The newly created domain record
   *
   * @throws {RegistrarError} DOMAIN_NOT_AVAILABLE — domain is already taken
   * @throws {RegistrarError} DOMAIN_ALREADY_REGISTERED — already in MCV database
   * @throws {RegistrarError} INVALID_CONTACT — contact information validation failed
   * @throws {RegistrarError} REGISTRAR_INSUFFICIENT_FUNDS — account balance too low
   * @throws {RegistrarError} REGISTRAR_API_ERROR — provider returned an error
   */
  async registerDomain(request: DomainRegistrationRequest): Promise<Domain> {
    const {
      ventureId, domainName, contacts,
      registrar: registrarOverride,
      years = 1, autoRenew = true, privacy = true,
      autoSsl = true, tags = [], metadata = {},
    } = request;

    // Validate domain name
    this.validateDomainName(domainName);

    // Parse TLD and SLD
    const parts = domainName.split('.');
    const tld = parts.slice(1).join('.');
    const sld = parts[0];

    // Check if already registered in our system
    const existing = await db.query.domains.findFirst({
      where: and(eq(domains.ventureId, ventureId), eq(domains.domainName, domainName)),
    });
    if (existing) {
      throw new RegistrarError('DOMAIN_ALREADY_REGISTERED', `Domain ${domainName} is already registered`, undefined, 409);
    }

    // Get registrar config
    const config = await this.getRegistrarConfig(ventureId, registrarOverride);
    const adapter = await this.getProviderAdapter(config);

    // Verify availability before attempting registration
    const availability = await adapter.checkAvailability(domainName);
    if (!availability.available) {
      throw new RegistrarError('DOMAIN_NOT_AVAILABLE', `Domain ${domainName} is not available`, { pricing: availability.price }, 409);
    }

    // Create initial domain record (status: registering)
    const [domainRecord] = await db.insert(domains).values({
      ventureId,
      domainName,
      tld,
      sld,
      registrar: config.provider,
      status: 'registering',
      autoRenew,
      privacyEnabled: privacy,
      locked: true,
      yearsRegistered: years,
      contacts,
      registrationPrice: availability.price?.registration,
      renewalPrice: availability.price?.renewal,
      currency: availability.price?.currency ?? 'USD',
      tags,
      metadata,
    }).returning();

    try {
      // Submit registration to provider
      const result = await adapter.registerDomain({
        domainName,
        years,
        autoRenew,
        privacy,
        contacts,
        nameservers: request.nameservers,
      });

      // Update with provider IDs and activation
      await db.update(domains).set({
        status: 'active',
        registrarDomainId: result.domainId,
        registrarZoneId: result.zoneId,
        registeredAt: new Date(),
        expiresAt: result.expiresAt,
        nameservers: result.nameservers ?? [],
        updatedAt: new Date(),
      }).where(eq(domains.id, domainRecord.id));

      // Audit log
      await auditLog({
        ventureId,
        action: 'domain.registered',
        resourceType: 'domain',
        resourceId: domainRecord.id,
        details: {
          domainName,
          registrar: config.provider,
          years,
          privacy,
          price: availability.price?.registration,
        },
      });

      // Emit event
      eventBus.emit('domain.registered', {
        type: 'domain.registered',
        ventureId,
        domainId: domainRecord.id,
        domainName,
        registrar: config.provider,
        timestamp: new Date(),
        details: { years, price: availability.price?.registration },
      });

      // Auto-provision SSL if requested
      if (autoSsl) {
        // Fire and forget — SSL provisioning is async
        this.provisionSslAsync(ventureId, domainRecord.id, domainName).catch(err => {
          console.warn(`Auto-SSL provisioning failed for ${domainName}:`, err);
        });
      }

      // Return updated domain
      return this.getDomainById(ventureId, domainRecord.id);
    } catch (error) {
      // Registration failed — update status
      await db.update(domains).set({
        status: 'failed',
        metadata: { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' },
        updatedAt: new Date(),
      }).where(eq(domains.id, domainRecord.id));

      throw error;
    }
  }

  // ─── RENEWAL ────────────────────────────────────────────────────────────────

  /**
   * Renew a domain for additional years.
   *
   * @param ventureId - The venture owning the domain
   * @param domainId - UUID of the domain to renew
   * @param years - Number of years to renew (default: 1)
   * @returns Updated domain with new expiration date
   *
   * @throws {RegistrarError} DOMAIN_NOT_FOUND — domain doesn't exist
   * @throws {RegistrarError} REGISTRAR_INSUFFICIENT_FUNDS — insufficient balance
   */
  async renewDomain(ventureId: string, domainId: string, years: number = 1): Promise<Domain> {
    const domain = await this.getDomainById(ventureId, domainId);
    const config = await this.getRegistrarConfig(ventureId, domain.registrar);
    const adapter = await this.getProviderAdapter(config);

    const result = await adapter.renewDomain(domain.registrarDomainId!, years);

    await db.update(domains).set({
      expiresAt: result.newExpiresAt,
      lastRenewedAt: new Date(),
      status: 'active',
      updatedAt: new Date(),
    }).where(eq(domains.id, domainId));

    await auditLog({
      ventureId,
      action: 'domain.renewed',
      resourceType: 'domain',
      resourceId: domainId,
      details: { domainName: domain.domainName, years, newExpiresAt: result.newExpiresAt },
    });

    eventBus.emit('domain.renewed', {
      type: 'domain.renewed',
      ventureId,
      domainId,
      domainName: domain.domainName,
      registrar: domain.registrar,
      timestamp: new Date(),
      details: { years, newExpiresAt: result.newExpiresAt },
    });

    return this.getDomainById(ventureId, domainId);
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  private validateDomainName(domain: string): void {
    const domainRegex = /^(?!-)([a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$/;
    if (!domainRegex.test(domain)) {
      throw new RegistrarError('INVALID_DOMAIN_NAME', `Invalid domain name: ${domain}`, undefined, 400);
    }
  }

  private async getRegistrarConfig(
    ventureId: string,
    registrar?: RegistrarProvider
  ): Promise<RegistrarConfig> {
    const provider = registrar ?? (process.env.REGISTRAR_DEFAULT_PROVIDER as RegistrarProvider) ?? 'cloudflare';

    const config = await db.query.registrarCredentials.findFirst({
      where: and(
        eq(registrarCredentials.ventureId, ventureId),
        eq(registrarCredentials.provider, provider),
        eq(registrarCredentials.isEnabled, true),
      ),
    });

    if (!config) {
      throw new RegistrarError(
        'REGISTRAR_NOT_CONFIGURED',
        `Registrar '${provider}' is not configured for this venture`,
        { provider },
        404,
      );
    }

    return {
      provider: config.provider as RegistrarProvider,
      credentialResource: config.credentialResource,
      accountId: config.accountId ?? undefined,
      accountEmail: config.accountEmail ?? undefined,
      defaultSettings: (config.defaultSettings as RegistrarDefaultSettings) ?? {},
      isEnabled: config.isEnabled,
      healthStatus: (config.healthStatus as RegistrarConfig['healthStatus']) ?? 'unknown',
    };
  }

  private async getProviderAdapter(config: RegistrarConfig) {
    const credentials = await this.secretManager.getSecret(config.credentialResource);
    return getAdapter(config.provider, JSON.parse(credentials));
  }

  private async getDomainById(ventureId: string, domainId: string): Promise<Domain> {
    const record = await db.query.domains.findFirst({
      where: and(eq(domains.id, domainId), eq(domains.ventureId, ventureId)),
    });
    if (!record) {
      throw new RegistrarError('DOMAIN_NOT_FOUND', 'Domain not found', undefined, 404);
    }
    return record as unknown as Domain;
  }

  private async provisionSslAsync(ventureId: string, domainId: string, domainName: string): Promise<void> {
    const { provisionCertificate } = await import('./ssl.service');
    await provisionCertificate({
      domainId,
      provider: 'letsencrypt',
      challengeType: 'dns-01',
      sanDomains: [`*.${domainName}`],
      autoRenew: true,
    });
  }
}

// Singleton instance
export const domainService = new DomainService();

// Convenience exports
export const checkDomainAvailability = domainService.checkAvailability.bind(domainService);
export const registerDomain = domainService.registerDomain.bind(domainService);
export const renewDomain = domainService.renewDomain.bind(domainService);
```

---

## DNS Record Management

```typescript
// @mcv/connectors/registrars/services/dns.service.ts

export class DnsService {
  /**
   * Create a new DNS record for a domain.
   * Submits the record to the registrar/DNS provider and tracks propagation.
   */
  async createRecord(
    ventureId: string,
    request: DnsRecordCreateRequest
  ): Promise<DnsRecord> {
    const domain = await this.getDomain(ventureId, request.domainId);
    const adapter = await this.getAdapter(ventureId, domain.registrar);

    // Validate record
    this.validateDnsRecord(request);

    // Submit to provider
    const providerResult = await adapter.createDnsRecord(
      domain.registrarZoneId!,
      {
        type: request.recordType,
        name: request.name,
        content: request.content,
        ttl: request.ttl ?? DEFAULT_TTL,
        priority: request.priority,
        proxied: request.proxied,
      },
    );

    // Store in database
    const [record] = await db.insert(dnsRecords).values({
      domainId: request.domainId,
      ventureId,
      recordType: request.recordType,
      name: request.name,
      content: request.content,
      ttl: request.ttl ?? DEFAULT_TTL,
      priority: request.priority,
      proxied: request.proxied ?? false,
      providerRecordId: providerResult.id,
      propagationStatus: 'pending',
      comment: request.comment,
      tags: request.tags ?? [],
      srvWeight: request.srvWeight,
      srvPort: request.srvPort,
      srvTarget: request.srvTarget,
      caaFlags: request.caaFlags,
      caaTag: request.caaTag,
    }).returning();

    // Start propagation check (async)
    this.checkPropagationAsync(record.id, domain.domainName, request);

    await auditLog({
      action: 'dns.record.created',
      resourceType: 'dns_record',
      resourceId: record.id,
      ventureId,
      metadata: { domainId: request.domainId, recordType: request.recordType },
    });

    return record;
  }
}
```

---

## Security Considerations

### Credential Management
- **EPP auth codes** encrypted at rest with AES-256-GCM, auto-expire after transfer
- **API keys** stored in `@mcv/secrets` vault, never in DB columns
- **Credential resolution chain**: Venture vault → System vault → Environment → Config

### Multi-Tenant Isolation
- All queries scoped by `ventureId` — enforced at service layer and RLS policies
- Domain ownership verified on every mutation
- Cross-venture domain transfers require super-admin approval

### DNS Security
- **DNSSEC** support with DS record management
- **CAA records** enforced for SSL certificate authorities
- Input validation prevents DNS rebinding and zone takeover attacks
- SSRF protection on webhook URLs and redirect targets

### Rate Limiting
- Per-venture: 100 registrar API calls/minute
- Per-domain: 10 DNS mutations/minute
- Per-IP: 20 WHOIS lookups/minute (provider limits)

---

## Performance Considerations

| Operation | Target | P99 |
|-----------|--------|-----|
| Domain availability check | < 500ms | 1.2s |
| DNS record CRUD | < 200ms | 500ms |
| Domain registration | < 3s | 8s |
| Transfer initiation | < 2s | 5s |
| WHOIS lookup | < 1s | 3s |
| SSL certificate provision | < 5s | 15s |
| Bulk DNS import (100 records) | < 10s | 30s |

### Optimization Strategies
1. **DNS record caching** — 5-minute TTL in Redis for read-heavy operations
2. **Batch API calls** — Group DNS mutations by domain for fewer provider round-trips
3. **Async propagation checks** — Non-blocking background jobs for DNS propagation monitoring
4. **Provider connection pooling** — Reuse HTTP clients per registrar
5. **WHOIS result caching** — Cache parsed WHOIS for 1 hour (stale-while-revalidate)

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `domain.registered` | admin | New domain registered |
| `domain.renewed` | system | Domain auto-renewed or manually renewed |
| `domain.expired` | system | Domain expired (renewal missed) |
| `domain.transferred.initiated` | admin | Outbound transfer started |
| `domain.transferred.completed` | system | Transfer completed at new registrar |
| `domain.transferred.cancelled` | admin | Transfer cancelled |
| `domain.locked` | admin | Transfer lock enabled |
| `domain.unlocked` | admin | Transfer lock disabled |
| `dns.record.created` | admin | DNS record added |
| `dns.record.updated` | admin | DNS record modified |
| `dns.record.deleted` | admin | DNS record removed |
| `dns.bulk.imported` | admin | Bulk DNS import completed |
| `dns.propagation.confirmed` | system | DNS propagation verified globally |
| `ssl.certificate.provisioned` | system | SSL cert issued via Let's Encrypt/provider |
| `ssl.certificate.renewed` | system | SSL cert auto-renewed |
| `ssl.certificate.expired` | system | SSL cert expiration (renewal failed) |
| `whois.privacy.enabled` | admin | WHOIS privacy proxy activated |
| `whois.privacy.disabled` | admin | WHOIS privacy proxy removed |
| `registrar.credentials.rotated` | admin | API credentials updated |
| `nameserver.changed` | admin | Nameservers updated for domain |
| `dnssec.enabled` | admin | DNSSEC activated |
| `dnssec.disabled` | admin | DNSSEC deactivated |
| `auto_renewal.toggled` | admin | Auto-renewal setting changed |

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `DOMAIN_NOT_FOUND` | 404 | Domain not in database | Verify domain ID exists |
| `DOMAIN_UNAVAILABLE` | 409 | Domain already registered | Try alternate domain |
| `DOMAIN_LOCKED` | 423 | Domain has transfer lock | Unlock before transfer |
| `DNS_RECORD_CONFLICT` | 409 | Duplicate record exists | Delete existing or update |
| `DNS_PROPAGATION_TIMEOUT` | 504 | Propagation check timed out | Retry after 5 minutes |
| `PROVIDER_AUTH_FAILED` | 401 | Registrar API auth failure | Rotate credentials in vault |
| `PROVIDER_RATE_LIMITED` | 429 | Registrar API rate limit hit | Retry with exponential backoff |
| `PROVIDER_UNAVAILABLE` | 503 | Registrar API down | Retry or failover to secondary |
| `EPP_AUTH_INVALID` | 403 | Invalid transfer auth code | Request new code from registrar |
| `TRANSFER_NOT_ELIGIBLE` | 422 | Domain too new or recently transferred | Wait 60+ days |
| `SSL_PROVISION_FAILED` | 500 | Certificate issuance failed | Check DNS, retry |
| `INVALID_NAMESERVER` | 422 | Nameserver format invalid | Use valid FQDN |
| `WHOIS_LOOKUP_FAILED` | 502 | WHOIS query failed | Retry, check TLD support |
| `DNSSEC_CONFIG_ERROR` | 422 | Invalid DNSSEC parameters | Verify DS record values |
| `ZONE_FILE_PARSE_ERROR` | 422 | Zone file import failed | Validate BIND format |
| `VENTURE_QUOTA_EXCEEDED` | 429 | Domain limit per venture reached | Upgrade plan or remove domains |
| `BULK_OPERATION_PARTIAL` | 207 | Some records in bulk op failed | Check individual error details |
| `RENEWAL_PAYMENT_FAILED` | 402 | Renewal billing failed | Update payment method |
| `REGISTRAR_NOT_SUPPORTED` | 422 | TLD not supported by provider | Use supported registrar |
| `DOMAIN_PREMIUM_PRICE` | 402 | Premium domain pricing applies | Confirm premium pricing |

---

## Testing Notes

### Unit Tests
```typescript
describe('RegistrarService', () => {
  it('checks domain availability across providers');
  it('registers domain with correct provider');
  it('handles transfer lock/unlock lifecycle');
  it('validates DNS record types and values');
  it('enforces venture domain quotas');
});

describe('DnsService', () => {
  it('creates all supported record types');
  it('prevents duplicate CNAME at apex');
  it('applies email presets correctly');
  it('handles bulk import with rollback');
});
```

### Integration Tests
```typescript
describe('Domain Lifecycle', () => {
  it('register → configure DNS → enable SSL → transfer');
  it('handles concurrent DNS mutations safely');
  it('verifies propagation across global resolvers');
});
```

---

*Last updated: February 8, 2026*