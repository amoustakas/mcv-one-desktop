# @mcv/google — Google Connector Module

**Parent Package:** `@mcv/connectors`  
**Tier:** 3 (Connectors — External Integration)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `@mcv/google` module is MCV.ONE's comprehensive integration layer for the entire Google ecosystem. It provides programmatic access to **17 Google APIs** spanning Workspace administration, productivity (Docs, Sheets, Slides), communication (Gmail, Calendar), media (YouTube with full quota management), marketing (Analytics, Ads, Search Console, Tag Manager), and location services (Places, Geocoding, Directions). Every Google-dependent feature in MCV — from user provisioning and group membership sync to YouTube channel management and real-time analytics — flows through this connector.

**This is the single integration point for all Google API operations across the MCV ecosystem.**

The module is organized into three deployment targets:
- **Types** (`@mcv/google`) — Shared TypeScript interfaces and constants, safe for any environment
- **Server** (`@mcv/google/server`) — 17 service classes, authentication utilities, retry logic, quota tracking
- **Client** (`@mcv/google/client`) — 5 React hooks for admin UI integration

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PACKAGE — Types & Constants (import from '@mcv/google')
// ═══════════════════════════════════════════════════════════════════════════════

// All TypeScript interfaces (60+ types across 14 domains)
export * from './types';

// OAuth scope constants and groups
export { GOOGLE_SCOPES, SCOPE_GROUPS } from './constants/scopes';
export type { GoogleScope, ScopeGroupName } from './constants/scopes';

// Default configuration values
export { GOOGLE_DEFAULTS } from './constants/defaults';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER SERVICES (import from '@mcv/google/server')
// ═══════════════════════════════════════════════════════════════════════════════

// Workspace Administration
export { WorkspaceAdminService } from './services/workspace-admin.service';
export { UserProvisioningService } from './services/user-provisioning.service';
export { GroupService } from './services/group.service';
export { SignatureService } from './services/signature.service';

// Productivity Suite
export { DriveService } from './services/drive.service';
export { SharedDriveService } from './services/shared-drive.service';
export { DocsService } from './services/docs.service';
export { SheetsService } from './services/sheets.service';
export { SlidesService } from './services/slides.service';

// Communication
export { GmailService } from './services/gmail.service';
export { CalendarService } from './services/calendar.service';

// Media & Content
export { YouTubeService } from './services/youtube.service';

// Location & Maps
export { PlacesService } from './services/places.service';

// Marketing & Analytics
export { AnalyticsService } from './services/analytics.service';
export { SearchConsoleService } from './services/search-console.service';
export { AdsService } from './services/ads.service';
export { TagManagerService } from './services/tag-manager.service';

// YouTube Quota Tracking
export {
  YouTubeQuotaTracker,
  YouTubeQuotaExceededError,
  YOUTUBE_QUOTA_COSTS,
  QUOTA_WARNING_LEVELS,
  withQuotaTracking,
} from './services/quota-tracker';
export type {
  QuotaUsageEntry,
  QuotaSummary,
  QuotaWarningLevel,
  YouTubeOperation,
} from './services/quota-tracker';

// Retry Utilities
export {
  withGoogleRetry,
  createRetryWrapper,
  getRetryAfter,
  RETRY_DEFAULTS,
} from './utils/retry';
export type { RetryOptions } from './utils/retry';

// Authentication Utilities
export {
  createServiceAccountClient,
  createSystemServiceAccountClient,
  createOAuth2Client,
  configureClientWithTokens,
  isTokenExpiringSoon,
  refreshTokenIfNeeded,
  generateAuthUrl,
  exchangeCodeForTokens,
  revokeTokens,
  getServiceAccountConfigFromEnv,
  getOAuth2ConfigFromEnv,
} from './utils/auth';
export type {
  ServiceAccountConfig,
  OAuth2Config,
  StoredTokens,
  TokenRefreshCallback,
} from './utils/auth';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (import from '@mcv/google/client')
// ═══════════════════════════════════════════════════════════════════════════════

export { useWorkspaceUsers } from './hooks/use-workspace-users';
export type { UseWorkspaceUsersOptions, UseWorkspaceUsersReturn } from './hooks/use-workspace-users';

export { useDrive } from './hooks/use-drive';
export type { UseDriveOptions, UseDriveReturn } from './hooks/use-drive';

export { useGmail } from './hooks/use-gmail';
export type { UseGmailOptions, UseGmailReturn } from './hooks/use-gmail';

export { useCalendar } from './hooks/use-calendar';
export type { UseCalendarOptions, UseCalendarReturn } from './hooks/use-calendar';

export { useGoogleAuth } from './hooks/use-google-auth';
export type { UseGoogleAuthOptions, UseGoogleAuthReturn } from './hooks/use-google-auth';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              BUSINESS DOMAINS (Tier 5)                                │
│        @mcv/nexus     @mcv/engagement     @mcv/ventures     @mcv/agentic-os           │
└────────────────────────────────────┬─────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/google                                              │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         Types & Constants Layer                                 │  │
│  │  GOOGLE_SCOPES (40+ scopes)  │  SCOPE_GROUPS (18 presets)  │  GOOGLE_DEFAULTS   │  │
│  │  60+ TypeScript interfaces covering 14 domains                                  │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌──────────────────── SERVER SERVICES ────────────────────────────────────────────┐  │
│  │                                                                                 │  │
│  │  ┌─────────────────────── Workspace Admin ────────────────────────────┐         │  │
│  │  │  WorkspaceAdminService     UserProvisioningService                 │         │  │
│  │  │  - connectWorkspace()      - provisionUser()                       │         │  │
│  │  │  - syncWorkspace()         - suspendUser() / reactivateUser()      │         │  │
│  │  │  - listWorkspaces()        - deprovisionUser() (data transfer)     │         │  │
│  │  │  - updateWorkspace()       - syncUsers() (bulk)                    │         │  │
│  │  ├────────────────────────────────────────────────────────────────────┤         │  │
│  │  │  GroupService                       SignatureService               │         │  │
│  │  │  - createGroup()                    - createTemplate()             │         │  │
│  │  │  - addMember() / removeMember()     - applyToUsers()              │         │  │
│  │  │  - syncGroupMembers()               - renderSignature()            │         │  │
│  │  │  - linkToMumsRole() (auto-sync)     - previewTemplate()           │         │  │
│  │  └────────────────────────────────────────────────────────────────────┘         │  │
│  │                                                                                 │  │
│  │  ┌─────────────────────── Productivity Suite ─────────────────────────┐         │  │
│  │  │  DriveService          SharedDriveService                          │         │  │
│  │  │  - listFiles()         - createSharedDrive()                       │         │  │
│  │  │  - createFile()        - addPermission() / removePermission()      │         │  │
│  │  │  - uploadFile()        - listPermissions()                         │         │  │
│  │  ├────────────────────────────────────────────────────────────────────┤         │  │
│  │  │  DocsService           SheetsService           SlidesService       │         │  │
│  │  │  - createDocument()    - createSpreadsheet()   - createPresent.()  │         │  │
│  │  │  - getDocContent()     - getSheetValues()      - addSlide()        │         │  │
│  │  │  - appendToDocument()  - updateSheetValues()   - insertText()      │         │  │
│  │  │  - exportDocument()    - addConditionalFmt()   - insertImage()     │         │  │
│  │  │  - replaceText()       - createChart()         - exportPresent.()  │         │  │
│  │  └────────────────────────────────────────────────────────────────────┘         │  │
│  │                                                                                 │  │
│  │  ┌─────────────────────── Communication ──────────────────────────────┐         │  │
│  │  │  GmailService                       CalendarService                │         │  │
│  │  │  - sendEmail()                      - createEvent()                │         │  │
│  │  │  - listMessages()                   - listEvents()                 │         │  │
│  │  │  - createDraft()                    - quickAddEvent()              │         │  │
│  │  │  - modifyMessageLabels()            - getFreeBusy()                │         │  │
│  │  │  - trashMessage()                   - addConference() (Meet)       │         │  │
│  │  │                                     - watchCalendar() (webhooks)   │         │  │
│  │  └────────────────────────────────────────────────────────────────────┘         │  │
│  │                                                                                 │  │
│  │  ┌─────────────────────── Media & Content ────────────────────────────┐         │  │
│  │  │  YouTubeService (50+ methods)                                      │         │  │
│  │  │  - Channels: list, get, updateBranding                             │         │  │
│  │  │  - Videos: list, upload (1600 quota!), update, delete, rate        │         │  │
│  │  │  - Playlists: CRUD, addToPlaylist, removeFromPlaylist              │         │  │
│  │  │  - Comments: list, reply, moderate, delete                         │         │  │
│  │  │  - Live: createStream, createBroadcast, bind, transition           │         │  │
│  │  │  - Analytics: getVideoAnalytics, getTopVideos, getDemographics     │         │  │
│  │  │  - Search: searchVideos (100 quota!), searchChannels               │         │  │
│  │  │  - Captions: list, download, upload, delete                        │         │  │
│  │  ├────────────────────────────────────────────────────────────────────┤         │  │
│  │  │  YouTubeQuotaTracker (singleton)                                   │         │  │
│  │  │  - trackUsage() → per-venture daily quota accounting               │         │  │
│  │  │  - canPerformOperation() → pre-flight quota check                  │         │  │
│  │  │  - getSummary() → real-time usage dashboard                        │         │  │
│  │  │  - onWarning() → configurable threshold alerts                     │         │  │
│  │  └────────────────────────────────────────────────────────────────────┘         │  │
│  │                                                                                 │  │
│  │  ┌─────────────────────── Location & Maps ────────────────────────────┐         │  │
│  │  │  PlacesService (Places API New + Classic Maps APIs)                │         │  │
│  │  │  - autocomplete() (Places API New)                                 │         │  │
│  │  │  - getPlaceDetails() / searchNearby() / searchText()               │         │  │
│  │  │  - geocode() / reverseGeocode() (Geocoding API)                    │         │  │
│  │  │  - getDistanceMatrix() (Distance Matrix API)                       │         │  │
│  │  │  - getDirections() (Directions API)                                │         │  │
│  │  │  - validateAddress() (Address Validation API)                      │         │  │
│  │  │  - getTimezone() (Time Zone API)                                   │         │  │
│  │  └────────────────────────────────────────────────────────────────────┘         │  │
│  │                                                                                 │  │
│  │  ┌─────────────────────── Marketing & Analytics ──────────────────────┐         │  │
│  │  │  AnalyticsService         SearchConsoleService                      │         │  │
│  │  │  - runReport()            - listSites()                            │         │  │
│  │  │  - runRealtimeReport()    - querySearchAnalytics()                  │         │  │
│  │  │  - listProperties()       - submitSitemap()                        │         │  │
│  │  │  - getMetadata()          - inspectUrl()                           │         │  │
│  │  ├────────────────────────────────────────────────────────────────────┤         │  │
│  │  │  AdsService (READ-ONLY)             TagManagerService              │         │  │
│  │  │  - getCustomer()                    - listAccounts/Containers()     │         │  │
│  │  │  - listCampaigns()                  - createTag/Trigger/Variable()  │         │  │
│  │  │  - getCampaignMetrics()             - createVersion() + publish()   │         │  │
│  │  │  - executeGaql() (raw query)        - getSnippet() (embed code)    │         │  │
│  │  └────────────────────────────────────────────────────────────────────┘         │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌──────────────────── UTILITY LAYER ──────────────────────────────────────────────┐  │
│  │  Auth Utils                          Retry Utils                                │  │
│  │  - createServiceAccountClient()      - withGoogleRetry() (exp. backoff)         │  │
│  │  - createSystemServiceAccountClient  - createRetryWrapper()                     │  │
│  │  - createOAuth2Client()              - getRetryAfter()                          │  │
│  │  - configureClientWithTokens()       - RETRY_DEFAULTS { 5 retries, 1s base }   │  │
│  │  - refreshTokenIfNeeded()            - Retries: 429, 500, 502, 503, 504        │  │
│  │  - generateAuthUrl()                 - Jitter factor: 0.5                       │  │
│  │  - exchangeCodeForTokens()           - Max delay cap: 64s                       │  │
│  │  - revokeTokens()                                                               │  │
│  │  - getSystemServiceAccountConfig()   ← Vault-first, env fallback               │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌──────────────────── CLIENT HOOKS (React) ───────────────────────────────────────┐  │
│  │  useWorkspaceUsers  │  useDrive  │  useGmail  │  useCalendar  │  useGoogleAuth  │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  @mcv/db (Drizzle)  │  @mcv/secrets (Vault)  │  googleapis  │  google-auth-library  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Authentication Strategy                                   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │  PATH 1: Service Account + Domain-Wide Delegation                       │  │
│  │  Used by: Admin SDK, Gmail Settings, Drive (admin), Calendar            │  │
│  │                                                                         │  │
│  │  MCV Server                                                             │  │
│  │     │                                                                   │  │
│  │     ├─→ SecretManagerService.getSecret()                                │  │
│  │     │   └─→ GCP Secret Manager (mcv-system-google-service-account)      │  │
│  │     │                                                                   │  │
│  │     ├─→ Fallback: GOOGLE_SERVICE_ACCOUNT_EMAIL + _KEY env vars          │  │
│  │     │                                                                   │  │
│  │     ├─→ google.auth.JWT({ subject: adminEmail, scopes: [...] })         │  │
│  │     │   └─→ Impersonates domain admin for Workspace API calls           │  │
│  │     │                                                                   │  │
│  │     └─→ Google Admin SDK / Gmail API / Drive API / Calendar API         │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │  PATH 2: OAuth 2.0 User Consent                                         │  │
│  │  Used by: YouTube, Analytics, Search Console, Ads, Tag Manager           │  │
│  │                                                                         │  │
│  │  Browser  ──→  /api/auth/google  ──→  Google Consent Screen             │  │
│  │                                            │                            │  │
│  │  Browser  ←──  /api/auth/google/callback  ←┘  (authorization code)      │  │
│  │                      │                                                  │  │
│  │                      ├─→  exchangeCodeForTokens()                       │  │
│  │                      ├─→  Store tokens (DB / Vault)                     │  │
│  │                      └─→  Auto-refresh via OAuth2Client.on('tokens')    │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │  PATH 3: API Key (Public Data)                                          │  │
│  │  Used by: Places, Geocoding, Distance Matrix, Directions, YouTube       │  │
│  │           (public search only)                                          │  │
│  │                                                                         │  │
│  │  Server  ──→  fetch(url + ?key=GOOGLE_MAPS_API_KEY)                     │  │
│  │          ──→  google.youtube({ auth: GOOGLE_YOUTUBE_API_KEY })           │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Google APIs Used

| API | Auth Method | Scopes / Key | Purpose |
|-----|-------------|-------------|---------|
| **Admin SDK Directory** | Service Account (DWD) | `admin.directory.user`, `.group`, `.orgunit`, `.domain` | User/group/OU provisioning and sync |
| **Admin SDK Data Transfer** | Service Account (DWD) | `admin.datatransfer` | Data ownership transfer during deprovisioning |
| **Gmail API v1** | Service Account (DWD) | `gmail.send`, `.modify`, `.settings.basic`, `.settings.sharing` | Send/read email, signatures, labels |
| **Calendar API v3** | Service Account (DWD) | `calendar`, `calendar.events` | Events, free/busy, rooms, push notifications |
| **Drive API v3** | Service Account (DWD) | `drive`, `drive.file`, `drive.metadata` | File CRUD, shared drives, permissions |
| **Docs API v1** | Service Account (DWD) | `documents`, `drive.file` | Document creation, editing, export |
| **Sheets API v4** | Service Account (DWD) | `spreadsheets`, `drive.file` | Spreadsheet CRUD, formatting, charts |
| **Slides API v1** | Service Account (DWD) | `presentations`, `drive.file` | Presentation creation, slide manipulation |
| **Groups Settings API v1** | Service Account (DWD) | `apps.groups.settings` | Group posting/join policies |
| **YouTube Data API v3** | OAuth 2.0 / API Key | `youtube`, `.upload`, `.force-ssl` | Channels, videos, playlists, comments, live |
| **YouTube Analytics API v2** | OAuth 2.0 | `yt-analytics.readonly`, `yt-analytics-monetary.readonly` | Channel/video performance metrics |
| **Google Analytics Data API** | OAuth 2.0 | `analytics.readonly`, `analytics.edit` | GA4 reports, real-time data, properties |
| **Search Console API** | OAuth 2.0 | `webmasters`, `webmasters.readonly` | Search analytics, sitemaps, URL inspection |
| **Google Ads API v16** | OAuth 2.0 + Dev Token | `adwords` | Campaign metrics, GAQL queries (read-only) |
| **Tag Manager API v2** | OAuth 2.0 | `tagmanager.edit.containers`, `.publish`, `.readonly` | Tags, triggers, variables, versions |
| **Places API (New)** | API Key | `GOOGLE_MAPS_API_KEY` | Autocomplete, details, nearby/text search |
| **Geocoding / Distance / Directions / Timezone / Address Validation** | API Key | `GOOGLE_MAPS_API_KEY` | Location services |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `googleapis` | `^130.0.0` | Official Google API client library (Admin, Gmail, Calendar, Drive, Docs, Sheets, Slides, YouTube, Analytics, Search Console, Tag Manager) |
| `google-auth-library` | `^9.0.0` | OAuth2 and service account (JWT) authentication |
| `drizzle-orm` | `^0.30.0` | Database ORM for Drizzle (workspace, user, group tables) |
| `@mcv/db` | workspace | Shared database schema and connection |
| `@mcv/secrets` | workspace | Secret Manager for service account credentials (Vault-first) |
| `react` | `^18.0.0` | Peer dependency for client hooks |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes* | — | Service account email for domain-wide delegation |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Yes* | — | Service account private key (PEM format, `\n` escaped) |
| `GOOGLE_CLOUD_PROJECT_ID` | No | — | GCP project ID (auto-detected from service account key) |
| `GOOGLE_CLIENT_ID` | Yes† | — | OAuth client ID for user-consent flows (YouTube, Analytics, etc.) |
| `GOOGLE_CLIENT_SECRET` | Yes† | — | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | `http://localhost:3000/api/auth/google/callback` | OAuth redirect URI |
| `GOOGLE_MAPS_API_KEY` | No‡ | — | API key for Places, Geocoding, Distance Matrix, Directions |
| `GOOGLE_YOUTUBE_API_KEY` | No‡ | — | API key for public YouTube search (no auth required) |

\* Service account credentials are loaded **Vault-first** via `@mcv/secrets` (`SecretManagerService`). Environment variables serve as fallback.  
† Required only when using OAuth-based services (YouTube, Analytics, Search Console, Ads, Tag Manager).  
‡ Required only when using Maps/Places or public YouTube features.

---

## Configuration Constants

```typescript
export const GOOGLE_DEFAULTS = {
  /** Default page size for list operations */
  PAGE_SIZE: 50,

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 500,

  /** Default org unit path for new users */
  DEFAULT_ORG_UNIT: '/',

  /** Default calendar ID (primary) */
  PRIMARY_CALENDAR: 'primary',

  /** Default signature template variables */
  SIGNATURE_VARIABLES: [
    'firstName', 'lastName', 'email', 'title',
    'department', 'phone', 'venture', 'photoUrl',
  ],

  /** Sync interval in milliseconds (15 minutes) */
  SYNC_INTERVAL_MS: 15 * 60 * 1000,

  /** Maximum retries for API calls */
  MAX_RETRIES: 3,

  /** Retry delay in milliseconds */
  RETRY_DELAY_MS: 1000,
} as const;

export const RETRY_DEFAULTS = {
  MAX_RETRIES: 5,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 64000,
  JITTER_FACTOR: 0.5,
} as const;
```

---

## TypeScript Interfaces

### Workspace & User Types

```typescript
export interface WorkspaceInfo {
  id: string;
  ventureId: string;
  domain: string;
  customerId: string;
  name: string;
  status: 'active' | 'suspended' | 'pending';
  totalUsers: number;
  totalGroups: number;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt: Date | null;
}

export interface CreateWorkspaceInput {
  ventureId: string;
  domain: string;
  customerId: string;
  name: string;
  serviceAccountKeyEncrypted: string;
  adminEmail: string;
}

export interface ProvisionUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  orgUnitPath?: string;
  isAdmin?: boolean;
  changePasswordAtNextLogin?: boolean;
  recoveryEmail?: string;
  recoveryPhone?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  suspended: boolean;
  orgUnitPath: string;
  creationTime: string;
  lastLoginTime: string | null;
  thumbnailPhotoUrl: string | null;
  aliases: string[];
}

export interface SuspendUserInput {
  userId: string;
  reason?: string;
}

export interface DeprovisionUserInput {
  userId: string;
  transferToEmail?: string;
  deleteAfterTransfer?: boolean;
}

export interface WorkspaceUserListFilters {
  query?: string;
  orgUnitPath?: string;
  suspended?: boolean;
  isAdmin?: boolean;
  page?: number;
  pageSize?: number;
  orderBy?: 'email' | 'givenName' | 'familyName';
}
```

### Group Types

```typescript
export interface CreateGroupInput {
  workspaceId: string;
  ventureId?: string;
  email: string;
  name: string;
  description?: string;
  whoCanPostMessage?: 'NONE_CAN_POST' | 'ALL_MANAGERS_CAN_POST' |
    'ALL_MEMBERS_CAN_POST' | 'ALL_IN_DOMAIN_CAN_POST' | 'ANYONE_CAN_POST';
}

export interface GroupInfo {
  id: string;
  email: string;
  name: string;
  description: string | null;
  directMembersCount: number;
  adminCreated: boolean;
  aliases: string[];
}

export interface AddGroupMemberInput {
  groupId: string;
  email: string;
  role: 'MEMBER' | 'MANAGER' | 'OWNER';
}
```

### Drive & Shared Drive Types

```typescript
export interface CreateSharedDriveInput {
  workspaceId: string;
  ventureId?: string;
  name: string;
  description?: string;
  restrictions?: {
    adminManagedRestrictions?: boolean;
    copyRequiresWriterPermission?: boolean;
    domainUsersOnly?: boolean;
    driveMembersOnly?: boolean;
  };
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  createdTime: string;
  modifiedTime: string;
  owners: Array<{ email: string; displayName: string }>;
  webViewLink: string | null;
  parents: string[];
}

export interface AddDrivePermissionInput {
  driveId: string;
  email: string;
  role: 'reader' | 'commenter' | 'writer' | 'fileOrganizer' | 'organizer';
  type: 'user' | 'group' | 'domain';
}
```

### Gmail Types

```typescript
export interface SendEmailInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    content: string; // base64 encoded
  }>;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  date: string;
  body: string | null;
  hasAttachments: boolean;
}
```

### Calendar Types

```typescript
export interface CalendarEvent {
  id: string;
  calendarId: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status: 'confirmed' | 'tentative' | 'cancelled';
  organizer: { email: string; displayName?: string };
  attendees: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  recurrence: string[];
  htmlLink: string;
  created: string;
  updated: string;
}

export interface CreateEventInput {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
}
```

### YouTube Types

```typescript
export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  customUrl: string | null;
  publishedAt: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  country: string | null;
  bannerUrl: string | null;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  tags: string[];
  categoryId: string | null;
  duration: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  privacyStatus: string;
  embeddable: boolean;
  definition: string | null;
}

export interface UploadVideoInput {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
  madeForKids?: boolean;
  embeddable?: boolean;
  publicStatsViewable?: boolean;
  notifySubscribers?: boolean;
  language?: string;
}

export interface YouTubeServiceConfig {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  redirectUri?: string;
  enableQuotaTracking?: boolean;
  dailyQuotaLimit?: number;  // Default: 10,000
}
```

### Places & Location Types

```typescript
export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  formattedPhoneNumber: string | null;
  internationalPhoneNumber: string | null;
  website: string | null;
  url: string | null;
  geometry: { lat: number; lng: number };
  types: string[];
  rating: number | null;
  userRatingsTotal: number | null;
  priceLevel: number | null;
  openingHours: { weekdayText: string[]; isOpenNow: boolean | null } | null;
  reviews: PlaceReview[];
  photos: PlacePhoto[];
  addressComponents: AddressComponent[];
  businessStatus: string | null;
  utcOffset: number | null;
}

export interface DistanceMatrixResult {
  originAddresses: string[];
  destinationAddresses: string[];
  rows: {
    elements: {
      status: string;
      distance: { text: string; value: number } | null;
      duration: { text: string; value: number } | null;
      durationInTraffic: { text: string; value: number } | null;
    }[];
  }[];
}

export interface AddressValidationResult {
  valid: boolean;
  formattedAddress: string | null;
  addressComponents: AddressComponent[];
  geocode: { lat: number; lng: number } | null;
  verdict: {
    inputGranularity: string;
    validationGranularity: string;
    hasUnconfirmedComponents: boolean;
    hasInferredComponents: boolean;
  };
}
```

### Authentication Types

```typescript
export interface ServiceAccountConfig {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  tokenType?: string;
}

export type TokenRefreshCallback = (tokens: {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}) => Promise<void>;
```

### Signature Types

```typescript
export interface SignatureTemplate {
  id: string;
  workspaceId: string;
  ventureId: string | null;
  name: string;
  htmlTemplate: string;
  variables: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSignatureInput {
  workspaceId: string;
  ventureId?: string;
  name: string;
  htmlTemplate: string;
  variables?: string[];
  isDefault?: boolean;
}

export interface ApplySignatureInput {
  templateId: string;
  userIds?: string[];
  orgUnitPath?: string;
}
```

### Sync Types

```typescript
export interface GoogleSyncStatus {
  workspaceId: string;
  entityType: 'users' | 'groups' | 'drives' | 'all';
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  lastSyncAt: Date | null;
  lastError: string | null;
  syncedCount: number;
  totalCount: number;
}
```

### Quota Tracking Types

```typescript
export interface QuotaUsageEntry {
  ventureId: string;
  operation: YouTubeOperation;
  cost: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface QuotaSummary {
  ventureId: string;
  date: string;
  totalUsed: number;
  dailyLimit: number;
  remaining: number;
  percentUsed: number;
  operationBreakdown: Record<string, number>;
  lastUpdated: Date;
}

export const YOUTUBE_QUOTA_COSTS = {
  'search.list': 100,        // Only ~100 searches/day!
  'videos.list': 1,
  'videos.insert': 1600,     // Only ~6 uploads/day!
  'videos.update': 50,
  'videos.delete': 50,
  'videos.rate': 50,
  'channels.list': 1,
  'channels.update': 50,
  'playlists.list': 1,
  'playlists.insert': 50,
  'commentThreads.list': 1,
  'comments.insert': 50,
  'liveBroadcasts.insert': 50,
  'thumbnails.set': 50,
  'reports.query': 1,         // Analytics API (separate quota)
  // ... 30+ operation types
} as const;
```

---

## OAuth Scope Groups

The module defines 18 pre-built scope groups for minimal-privilege access:

```typescript
export const SCOPE_GROUPS = {
  WORKSPACE_ADMIN:       [ADMIN_DIRECTORY_USER, ADMIN_DIRECTORY_GROUP, ADMIN_DIRECTORY_ORGUNIT],
  USER_PROVISIONING:     [ADMIN_DIRECTORY_USER, ADMIN_DIRECTORY_ORGUNIT],
  GROUP_MANAGEMENT:      [ADMIN_DIRECTORY_GROUP, GROUPS_SETTINGS],
  GMAIL_SEND_ONLY:       [GMAIL_SEND],
  GMAIL_FULL:            [GMAIL_SEND, GMAIL_MODIFY, GMAIL_SETTINGS_BASIC, GMAIL_SETTINGS_SHARING],
  CALENDAR_FULL:         [CALENDAR, CALENDAR_EVENTS],
  DRIVE_FILES:           [DRIVE_FILE],
  DRIVE_FULL:            [DRIVE],
  DOCS_FULL:             [DOCUMENTS, DRIVE_FILE],
  SHEETS_FULL:           [SPREADSHEETS, DRIVE_FILE],
  SLIDES_FULL:           [PRESENTATIONS, DRIVE_FILE],
  YOUTUBE_MANAGE:        [YOUTUBE, YOUTUBE_UPLOAD],
  YOUTUBE_ANALYTICS:     [YOUTUBE_READONLY, YT_ANALYTICS_READONLY],
  ANALYTICS_READONLY:    [ANALYTICS_READONLY],
  ANALYTICS_FULL:        [ANALYTICS_READONLY, ANALYTICS_EDIT],
  SEARCH_CONSOLE_READONLY: [WEBMASTERS_READONLY],
  SEARCH_CONSOLE_FULL:   [WEBMASTERS],
  GOOGLE_ADS:            [ADWORDS],
  TAG_MANAGER_READONLY:  [TAG_MANAGER_READONLY],
  TAG_MANAGER_FULL:      [TAG_MANAGER_READONLY, TAG_MANAGER_EDIT_CONTAINERS, TAG_MANAGER_PUBLISH],
} as const;
```

---

## Database Schema

### Type Definitions

```typescript
export const googleSyncStatuses = ['idle', 'syncing', 'error'] as const;
export const googleResourceStatuses = ['active', 'suspended', 'archived'] as const;
export const googleUserStatuses = ['active', 'suspended', 'archived', 'deleted'] as const;
export const googleMemberTypes = ['USER', 'GROUP', 'EXTERNAL'] as const;
export const googleMemberRoles = ['OWNER', 'MANAGER', 'MEMBER'] as const;
export const googleMembershipSources = ['manual', 'mums_sync', 'google_sync'] as const;
```

### JSON Column Interfaces

```typescript
export interface GoogleLicenseAssignment {
  skuId: string;
  skuName: string;
  productId: string;
  assignedAt?: string;
}

export interface GoogleDriveRestrictions {
  adminManagedRestrictions?: boolean;
  copyRequiresWriterPermission?: boolean;
  domainUsersOnly?: boolean;
  driveMembersOnly?: boolean;
  sharingFoldersRequiresOrganizerPermission?: boolean;
}

export interface GoogleSignaturePlaceholder {
  key: string;
  label: string;
  defaultValue?: string;
  source?: 'user_profile' | 'venture' | 'custom';
}

export interface GoogleAuthenticationPolicy {
  enforced2sv?: boolean;
  allowedMethods?: string[];
  sessionDurationHours?: number;
  passwordMinLength?: number;
  passwordRequireSymbols?: boolean;
}

export interface GoogleDataProtectionPolicy {
  dlpEnabled?: boolean;
  driveSharing?: 'anyone' | 'domain' | 'team' | 'disabled';
  gmailAutoForwarding?: boolean;
  gmailDelegation?: boolean;
}

export interface GoogleCalendarResourceFeature {
  name: string;
  value?: string;
}
```

### Tables

#### `google_workspaces` — Workspace Connection per Venture

```typescript
export const googleWorkspaces = pgTable('google_workspaces', {
  id:            uuid('id').primaryKey().defaultRandom(),
  ventureId:     uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  customerId:    text('customer_id').notNull(),
  primaryDomain: text('primary_domain').notNull(),
  name:          text('name').notNull(),
  adminEmail:    text('admin_email').notNull(),
  credentialRef: text('credential_ref').notNull(),        // Vault reference for service account
  lastSyncAt:    timestamp('last_sync_at', { withTimezone: true }),
  syncStatus:    text('sync_status', { enum: googleSyncStatuses }).default('idle'),
  status:        text('status', { enum: googleResourceStatuses }).default('active'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
// Indexes: venture (unique), customer (unique), domain
```

#### `google_users` — Google Workspace Users

```typescript
export const googleUsers = pgTable('google_users', {
  id:                uuid('id').primaryKey().defaultRandom(),
  workspaceId:       uuid('workspace_id').references(() => googleWorkspaces.id, { onDelete: 'cascade' }),
  mumsUserId:        uuid('mums_user_id').references(() => users.id, { onDelete: 'set null' }),
  ventureId:         uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  googleUserId:      text('google_user_id').notNull(),
  primaryEmail:      text('primary_email').notNull(),
  givenName:         text('given_name'),
  familyName:        text('family_name'),
  orgUnitId:         uuid('org_unit_id').references(() => googleOrgUnits.id),
  isAdmin:           boolean('is_admin').default(false),
  isDelegatedAdmin:  boolean('is_delegated_admin').default(false),
  licenseType:       text('license_type'),
  assignedLicenses:  jsonb('assigned_licenses').$type<GoogleLicenseAssignment[]>(),
  suspended:         boolean('suspended').default(false),
  archived:          boolean('archived').default(false),
  status:            text('status', { enum: googleUserStatuses }).default('active'),
  lastLoginAt:       timestamp('last_login_at', { withTimezone: true }),
  syncedAt:          timestamp('synced_at', { withTimezone: true }),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
// Indexes: workspace, venture, google_id (unique), email (unique), mums, org_unit, status
```

#### `google_groups` — Google Groups

```typescript
export const googleGroups = pgTable('google_groups', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  workspaceId:          uuid('workspace_id').references(() => googleWorkspaces.id, { onDelete: 'cascade' }),
  ventureId:            uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  googleGroupId:        text('google_group_id').notNull(),
  email:                text('email').notNull(),
  name:                 text('name').notNull(),
  description:          text('description'),
  allowExternalMembers: boolean('allow_external_members').default(false),
  whoCanJoin:           text('who_can_join').default('INVITED_CAN_JOIN'),
  whoCanPostMessage:    text('who_can_post_message').default('ALL_MEMBERS_CAN_POST'),
  autoSync:             boolean('auto_sync').default(false),
  mumsRoleSlug:         text('mums_role_slug'),    // Auto-sync with MUMS role
  status:               text('status', { enum: googleResourceStatuses }).default('active'),
  syncedAt:             timestamp('synced_at', { withTimezone: true }),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
// Indexes: workspace, venture, google_id (unique), email (unique), status
```

#### `google_group_memberships` — Group Membership

```typescript
export const googleGroupMemberships = pgTable('google_group_memberships', {
  id:          uuid('id').primaryKey().defaultRandom(),
  groupId:     uuid('group_id').references(() => googleGroups.id, { onDelete: 'cascade' }),
  memberEmail: text('member_email').notNull(),
  memberType:  text('member_type', { enum: googleMemberTypes }).default('USER'),
  role:        text('role', { enum: googleMemberRoles }).default('MEMBER'),
  source:      text('source', { enum: googleMembershipSources }).default('manual'),
  mumsUserId:  uuid('mums_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
});
// Indexes: group, (group+email unique), email, mums
```

#### `google_shared_drives` — Shared Drives

```typescript
export const googleSharedDrives = pgTable('google_shared_drives', {
  id:            uuid('id').primaryKey().defaultRandom(),
  workspaceId:   uuid('workspace_id').references(() => googleWorkspaces.id, { onDelete: 'cascade' }),
  ventureId:     uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  googleDriveId: text('google_drive_id').notNull(),
  name:          text('name').notNull(),
  description:   text('description'),
  restrictions:  jsonb('restrictions').$type<GoogleDriveRestrictions>(),
  status:        text('status', { enum: googleResourceStatuses }).default('active'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

#### Additional Tables

- **`google_org_units`** — Organizational unit hierarchy (self-referencing `parentId`)
- **`google_signature_templates`** — HTML email signature templates with `{{variable}}` placeholders
- **`google_security_policies`** — Authentication, DLP, app access, mobile policy configurations
- **`google_calendar_resources`** — Conference rooms, buildings, capacity, features
- **`google_youtube_channels`** — YouTube channel tracking per venture (subscribers, views, videos)
- **`google_saved_places`** — Saved Google Places with geocoded coordinates

---

## Code Examples

### 1. Connect a Google Workspace and Trigger Sync

```typescript
import { WorkspaceAdminService } from '@mcv/google/server';

const workspaceAdmin = new WorkspaceAdminService(db);

// Register workspace — verifies service account delegation automatically
const workspace = await workspaceAdmin.createWorkspace({
  ventureId: 'venture-uuid',
  domain: 'acme.com',
  customerId: 'C03az79cb',
  name: 'Acme Corporation',
  serviceAccountKeyEncrypted: vaultRef,
  adminEmail: 'admin@acme.com',
});
// → Validates DWD auth and directory API access before saving

// Full sync: users + groups (paginated, 500/page)
await workspaceAdmin.syncWorkspace(workspace.id);
// → Updates syncStatus: 'idle' → 'syncing' → 'idle' (or 'error')
```

### 2. Provision and Manage Users

```typescript
import { UserProvisioningService } from '@mcv/google/server';

const userService = new UserProvisioningService(db);

// Provision new user (auto-generates 16-char password if not provided)
const user = await userService.provisionUser('venture-uuid', {
  email: 'jane.doe@acme.com',
  firstName: 'Jane',
  lastName: 'Doe',
  orgUnitPath: '/Engineering',
  changePasswordAtNextLogin: true,
  recoveryEmail: 'jane.personal@gmail.com',
});

// List users with filters and pagination
const { items, total, hasMore } = await userService.listUsers('venture-uuid', {
  query: 'engineer',
  suspended: false,
  isAdmin: false,
  page: 1,
  pageSize: 25,
});

// Suspend with reason
await userService.suspendUser(user.id, 'Leave of absence');

// Deprovision with data transfer to another user
await userService.deprovisionUser({
  userId: user.id,
  transferToEmail: 'manager@acme.com',  // Transfer Drive + Calendar data
  deleteAfterTransfer: false,            // Suspend instead of delete
});
```

### 3. Manage Groups with MUMS Role Auto-Sync

```typescript
import { GroupService } from '@mcv/google/server';

const groupService = new GroupService(db);

// Create a Google Group
const group = await groupService.createGroup({
  workspaceId: workspace.id,
  email: 'engineering@acme.com',
  name: 'Engineering Team',
  description: 'All engineering staff',
  whoCanPostMessage: 'ALL_MEMBERS_CAN_POST',
});

// Add member
await groupService.addMember({
  groupId: group.id,
  email: 'contractor@external.com',
  role: 'MEMBER',
});

// Link to MUMS role for auto-sync
await groupService.linkToMumsRole(group.id, 'engineer', true);

// Sync group members from Google → local DB
const result = await groupService.syncGroupMembers(group.id);
console.log(`Added: ${result.added}, Removed: ${result.removed}, Updated: ${result.updated}`);
```

### 4. Deploy Email Signatures Across the Organization

```typescript
import { SignatureService } from '@mcv/google/server';

const sigService = new SignatureService(db);

// Create template with variable placeholders
const template = await sigService.createTemplate({
  workspaceId: workspace.id,
  name: 'Corporate Standard 2026',
  htmlTemplate: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <strong>{{firstName}} {{lastName}}</strong><br/>
      <span style="color: #666;">{{title}} · {{department}}</span><br/>
      <a href="tel:{{phone}}">{{phone}}</a> |
      <a href="https://acme.com">acme.com</a>
    </div>
  `,
  isDefault: true,
});
// → Auto-extracts variables: firstName, lastName, title, department, phone

// Preview with sample data
const preview = await sigService.previewTemplate(template.id, {
  title: 'VP of Engineering',
  department: 'R&D',
});

// Deploy to all workspace users (rate-limited, parallel)
const result = await sigService.applyToUsers(template.id);
console.log(`Applied: ${result.applied}, Failed: ${result.failed}`);
if (result.errors.length > 0) {
  console.log('Failures:', result.errors);
}
```

### 5. Send Email and Manage Gmail

```typescript
import { GmailService } from '@mcv/google/server';

const gmail = new GmailService(db);

// Send email on behalf of a user (domain-wide delegation)
const { id, threadId } = await gmail.sendEmail({
  userId: user.id,
  to: ['client@example.com'],
  cc: ['manager@acme.com'],
  subject: 'Q1 Report',
  body: '<h1>Quarterly Report</h1><p>Please find attached...</p>',
  isHtml: true,
  attachments: [{
    filename: 'report.pdf',
    mimeType: 'application/pdf',
    content: base64EncodedPdf,
  }],
});

// List messages with Gmail search syntax
const messages = await gmail.listMessages(user.id, 'from:client@example.com is:unread');

// Create draft
const draft = await gmail.createDraft({
  userId: user.id,
  to: ['partner@example.com'],
  subject: 'Follow-up',
  body: 'Just checking in...',
});

// Label management
const labels = await gmail.listLabels(user.id);
await gmail.modifyMessageLabels(user.id, messageId, ['Label_1'], ['UNREAD']);
```

### 6. Calendar Events with Google Meet

```typescript
import { CalendarService } from '@mcv/google/server';

const calendar = new CalendarService(db);

// Create event with Google Meet link
const event = await calendar.createEvent(user.id, {
  calendarId: 'primary',
  summary: 'Sprint Planning',
  description: 'Weekly sprint planning meeting',
  location: 'Board Room A',
  start: { dateTime: '2026-02-10T10:00:00-05:00', timeZone: 'America/Toronto' },
  end: { dateTime: '2026-02-10T11:00:00-05:00', timeZone: 'America/Toronto' },
  attendees: [
    { email: 'dev1@acme.com' },
    { email: 'dev2@acme.com' },
  ],
  conferenceData: {
    createRequest: {
      requestId: crypto.randomUUID(),
      conferenceSolutionKey: { type: 'hangoutsMeet' },
    },
  },
});

// Quick add using natural language
const quickEvent = await calendar.quickAddEvent(
  user.id, 'primary', 'Lunch with Jane tomorrow at noon'
);

// Check free/busy for scheduling
const freeBusy = await calendar.getFreeBusy(
  user.id,
  '2026-02-10T09:00:00Z',
  '2026-02-10T17:00:00Z',
  ['dev1@acme.com', 'dev2@acme.com'],
);

// Set up push notifications for calendar changes
const watch = await calendar.watchCalendar(
  user.id, 'primary',
  'https://api.mcv.one/webhooks/google/calendar',
  `watch-${user.id}-${Date.now()}`,
);
```

### 7. Shared Drive Management

```typescript
import { SharedDriveService } from '@mcv/google/server';

const sharedDrives = new SharedDriveService(db);

// Create with security restrictions
const drive = await sharedDrives.createSharedDrive({
  workspaceId: workspace.id,
  ventureId: 'venture-uuid',
  name: 'Project Phoenix',
  description: 'Confidential project documentation',
  restrictions: {
    adminManagedRestrictions: true,
    domainUsersOnly: true,
    copyRequiresWriterPermission: true,
    driveMembersOnly: true,
  },
});

// Grant team access
await sharedDrives.addPermission(workspace.id, {
  driveId: drive.id,
  email: 'engineering@acme.com',
  role: 'writer',
  type: 'group',
});

// List permissions
const perms = await sharedDrives.listPermissions(workspace.id, drive.id);
// → [{ id, email: 'engineering@acme.com', role: 'writer', type: 'group' }]
```

### 8. Google Docs — Create, Edit, Export

```typescript
import { DocsService } from '@mcv/google/server';

const docs = new DocsService(db);

// Create document in a specific folder
const doc = await docs.createDocument(userEmail, {
  title: 'Meeting Notes — Feb 2026',
  content: 'Attendees: ...\n\nAgenda:\n1. Review Q1 metrics',
  folderId: sharedDriveFolderId,
});

// Append content
await docs.appendToDocument(userEmail, doc.documentId, '\n\n## Action Items\n- ...');

// Find and replace (returns count of replacements)
const { occurrencesChanged } = await docs.replaceTextInDocument(
  userEmail, doc.documentId, '{{DATE}}', 'February 8, 2026'
);

// Export as PDF
const pdfBuffer = await docs.exportDocument(userEmail, doc.documentId, 'application/pdf');

// Share with a collaborator
await docs.shareDocument(userEmail, doc.documentId, 'collaborator@acme.com', 'writer');
```

### 9. Google Sheets — Read, Write, Format, Chart

```typescript
import { SheetsService } from '@mcv/google/server';

const sheets = new SheetsService(db);

// Create spreadsheet with multiple tabs
const spreadsheet = await sheets.createSpreadsheet(userEmail, {
  title: 'Q1 Sales Report',
  sheets: [{ title: 'Revenue' }, { title: 'Expenses' }, { title: 'Summary' }],
  folderId: sharedDriveFolderId,
});

// Write data
await sheets.updateSheetValues(userEmail, spreadsheet.spreadsheetId,
  'Revenue!A1:D5',
  [
    ['Month', 'Product', 'Units', 'Revenue'],
    ['Jan', 'Widget A', '150', '45000'],
    ['Jan', 'Widget B', '200', '60000'],
    ['Feb', 'Widget A', '175', '52500'],
    ['Feb', 'Widget B', '220', '66000'],
  ],
  'USER_ENTERED',
);

// Read data back
const values = await sheets.getSheetValues(userEmail, spreadsheet.spreadsheetId, 'Revenue!A1:D5');

// Batch read multiple ranges
const batchData = await sheets.batchGetValues(userEmail, spreadsheet.spreadsheetId, [
  'Revenue!A1:D5',
  'Expenses!A1:C10',
]);

// Append rows
await sheets.appendSheetValues(userEmail, spreadsheet.spreadsheetId,
  'Revenue!A:D',
  [['Mar', 'Widget A', '190', '57000']],
);

// Export as XLSX
const xlsxBuffer = await sheets.exportSpreadsheet(
  userEmail, spreadsheet.spreadsheetId,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
);
```

### 10. YouTube — Upload, Manage, Track Quota

```typescript
import { YouTubeService, YouTubeQuotaTracker } from '@mcv/google/server';

const youtube = new YouTubeService(db, {
  enableQuotaTracking: true,
  dailyQuotaLimit: 10000,
});

// Check quota before expensive operations
const tracker = youtube.getQuotaTracker();
const summary = tracker.getSummary('venture-uuid');
console.log(`Quota: ${summary.totalUsed}/${summary.dailyLimit} (${summary.percentUsed}%)`);
console.log(`Uploads remaining: ${tracker.getOperationsRemaining('venture-uuid', 'videos.insert')}`);

// Upload video (costs 1,600 quota units!)
if (tracker.canPerformOperation('venture-uuid', 'videos.insert')) {
  const video = await youtube.uploadVideo(userId, {
    title: 'Product Launch 2026',
    description: 'Exciting new features...',
    tags: ['product', 'launch', '2026'],
    privacyStatus: 'unlisted',
    notifySubscribers: false,
    body: videoBuffer,
  });
}

// Get channel analytics
const analytics = await youtube.getChannelAnalytics(userId, 'MINE',
  ['views', 'estimatedMinutesWatched', 'subscribersGained'],
  '2026-01-01', '2026-02-08',
  ['day'],
);

// Live streaming
const stream = await youtube.createLiveStream(userId, {
  title: 'Live Product Demo',
  resolution: '1080p',
  frameRate: '30fps',
});

const broadcast = await youtube.createLiveBroadcast(userId, {
  title: 'Live Product Demo',
  scheduledStartTime: '2026-02-15T14:00:00Z',
  privacyStatus: 'public',
  enableAutoStart: true,
  enableDvr: true,
});

await youtube.bindBroadcastToStream(userId, broadcast.id, stream.id);
```

### 11. Places — Autocomplete, Details, Directions

```typescript
import { PlacesService } from '@mcv/google/server';

const places = new PlacesService(db);

// Autocomplete search (Places API New)
const predictions = await places.autocomplete({
  query: 'coffee shops near',
  location: { lat: 43.6532, lng: -79.3832 },  // Toronto
  radius: 5000,
  types: ['cafe'],
  language: 'en',
});

// Get full place details
const details = await places.getPlaceDetails(predictions[0].placeId);
console.log(`${details?.name} — ${details?.formattedAddress}`);
console.log(`Rating: ${details?.rating}/5 (${details?.userRatingsTotal} reviews)`);
console.log(`Open now: ${details?.openingHours?.isOpenNow}`);

// Nearby search
const nearbyResults = await places.searchNearby({
  location: { lat: 43.6532, lng: -79.3832 },
  radius: 1000,
  type: 'restaurant',
  openNow: true,
});

// Distance and directions
const matrix = await places.getDistanceMatrix(
  ['Toronto, ON'],
  ['Montreal, QC', 'Ottawa, ON'],
  'driving', 'metric',
);

const directions = await places.getDirections(
  'Toronto, ON', 'Montreal, QC', 'driving',
  ['Kingston, ON'],  // waypoint
  true,              // alternatives
);

// Address validation
const validation = await places.validateAddress({
  address: '123 Main St, Toronto, ON',
  regionCode: 'CA',
});
console.log(`Valid: ${validation.valid}, Formatted: ${validation.formattedAddress}`);

// Timezone lookup
const tz = await places.getTimezone(43.6532, -79.3832);
console.log(`${tz.timeZoneId}: ${tz.timeZoneName}`);
```

### 12. Google Slides — Create Presentations Programmatically

```typescript
import { SlidesService } from '@mcv/google/server';

const slides = new SlidesService(db);

// Create presentation
const presentation = await slides.createPresentation(userEmail, {
  title: 'Q1 Review Deck',
  folderId: sharedDriveFolderId,
});

// Add slides
const titleSlide = await slides.addSlide(userEmail, presentation.presentationId, 'TITLE', 0);
const contentSlide = await slides.addSlide(userEmail, presentation.presentationId, 'TITLE_AND_BODY', 1);

// Insert text and image
await slides.insertText(userEmail, presentation.presentationId, contentSlide.objectId,
  'Revenue grew 25% YoY', { bold: true, fontSize: 24, fontFamily: 'Roboto' },
);
await slides.insertImage(userEmail, presentation.presentationId, contentSlide.objectId,
  'https://charts.example.com/q1-revenue.png',
  { width: 500, height: 300 },
  { x: 100, y: 200 },
);

// Find and replace across all slides (template variable substitution)
await slides.replaceText(userEmail, presentation.presentationId, '{{QUARTER}}', 'Q1 2026');
await slides.replaceText(userEmail, presentation.presentationId, '{{COMPANY}}', 'Acme Corp');

// Export as PDF
const pdfBuffer = await slides.exportPresentation(userEmail, presentation.presentationId, 'application/pdf');
```

### 13. Authentication Setup

```typescript
import {
  createServiceAccountClient,
  createSystemServiceAccountClient,
  createOAuth2Client,
  configureClientWithTokens,
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshTokenIfNeeded,
} from '@mcv/google/server';
import { GOOGLE_SCOPES, SCOPE_GROUPS } from '@mcv/google';

// --- Service Account (Domain-Wide Delegation) ---
// Vault-first, env-fallback credential loading
const auth = await createSystemServiceAccountClient(
  'admin@acme.com',                    // Subject to impersonate
  SCOPE_GROUPS.WORKSPACE_ADMIN,        // Pre-built scope group
);
await auth.authorize();
const admin = google.admin({ version: 'directory_v1', auth });

// --- OAuth 2.0 (User Consent) ---
const oauth2 = createOAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'https://admin.mcv.one/api/auth/google/callback',
});

// Generate consent URL
const authUrl = generateAuthUrl(oauth2, SCOPE_GROUPS.YOUTUBE_MANAGE, {
  state: JSON.stringify({ userId, ventureId }),
  accessType: 'offline',
  prompt: 'consent',
});

// Handle callback
const tokens = await exchangeCodeForTokens(oauth2, authorizationCode);

// Configure client with stored tokens + auto-refresh
configureClientWithTokens(oauth2, tokens, async (newTokens) => {
  await db.update(userTokens).set({
    accessToken: newTokens.accessToken,
    expiresAt: newTokens.expiresAt,
  }).where(eq(userTokens.userId, userId));
});
```

### 14. Retry Utility

```typescript
import { withGoogleRetry, createRetryWrapper } from '@mcv/google/server';

// One-off retry
const users = await withGoogleRetry(
  () => adminClient.users.list({ customer: 'my_customer', maxResults: 500 }),
  {
    maxRetries: 5,
    baseDelay: 2000,
    onRetry: (attempt, error, delay) => {
      logger.warn(`Google API retry ${attempt}, waiting ${delay}ms: ${error.message}`);
    },
  },
);

// Create reusable wrapper for a service
const retry = createRetryWrapper({ maxRetries: 3, baseDelay: 1000 });

const groups = await retry(() => adminClient.groups.list({ customer: 'my_customer' }));
const drives = await retry(() => driveClient.drives.list({ useDomainAdminAccess: true }));
```

### 15. YouTube Quota Monitoring

```typescript
import { YouTubeQuotaTracker, YOUTUBE_QUOTA_COSTS } from '@mcv/google/server';

const tracker = YouTubeQuotaTracker.getInstance(10000);

// Set up warning alerts
tracker.onWarning(async (ventureId, level, summary) => {
  if (level === 'critical') {
    await notifyAdmin(`YouTube quota at ${summary.percentUsed}% for ${ventureId}`);
  }
  if (level === 'emergency') {
    await disableYouTubeOperations(ventureId);
  }
});

// Set custom limit for ventures with increased quota
tracker.setCustomLimit('enterprise-venture', 50000);

// Pre-flight check for batch operations
const batchOps: YouTubeOperation[] = [
  'videos.list', 'videos.list', 'videos.list',  // 3 units
  'search.list',                                  // 100 units
  'videos.insert',                                // 1,600 units
];
if (tracker.canPerformBatch('venture-id', batchOps)) {
  // Safe to proceed
}

// Get operations remaining for specific type
const uploadsLeft = tracker.getOperationsRemaining('venture-id', 'videos.insert');
console.log(`Can upload ${uploadsLeft} more videos today`);

// Cleanup old data (retain 7 days)
tracker.cleanup(7);
```

---

## Sync Engine

### Sync Strategy

| Resource | Sync Method | Frequency | Source of Truth |
|----------|-------------|-----------|-----------------|
| Users | Full paginated (500/page) | On-demand + scheduled | Google is source of truth |
| Groups | Full paginated (200/page) | On-demand + scheduled | MUMS when `autoSync` enabled |
| Group Members | Full per-group | On group sync | Google for manual groups; MUMS for auto-sync |
| Shared Drives | Full + local DB tracking | On-demand | Google is source of truth |
| YouTube Channels | Stats refresh | 24h | YouTube is source of truth |

### Sync Flow

```
syncWorkspace(id) →
  1. Mark workspace syncStatus = 'syncing'
  2. Get Admin SDK client (DWD impersonation)
  3. Paginate users (maxResults: 500)
     → Upsert each user (by googleUserId)
     → Map suspended/archived → status enum
  4. Paginate groups (maxResults: 500)
     → Upsert each group (by googleGroupId)
  5. Mark syncStatus = 'idle', update lastSyncAt
  Error → Mark syncStatus = 'error', re-throw
```

---

## Performance Considerations

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| Single user CRUD | < 1s | Direct Admin SDK API call |
| User listing (local DB) | < 200ms | PostgreSQL with indexed queries |
| Full workspace sync (1000 users) | < 5min | Paginated API calls (500/page), sequential upserts |
| Group membership sync | < 30s/group | Full member list + diff against local DB |
| Signature deployment (100 users) | < 2min | Sequential Gmail API calls per user |
| Place details lookup | < 500ms | Places API New (REST) |
| Geocoding | < 300ms | Single REST call |
| YouTube video upload | 5-60s | Depends on file size; 1,600 quota units |
| Docs/Sheets/Slides operations | < 1s | Direct API with retry |

### Google API Rate Limits

| API | Limit | Strategy |
|-----|-------|----------|
| Admin SDK Directory | 1,500 QPS per project | Sequential paginated calls |
| Gmail Settings | 250 QPS | Sequential per-user deployment |
| Drive API | 1,000 QPS | Standard calls with retry |
| Docs API | Read: 3,000/min; Write: 600/min | Exponential backoff |
| Sheets API | 300 requests/min per project | Exponential backoff |
| Slides API | Read: 3,000/min; Write: 600/min | Exponential backoff |
| YouTube Data API | 10,000 units/day | QuotaTracker pre-flight checks |
| Places API (New) | Varies by billing plan | Response caching recommended |
| Google Ads API | 15,000 requests/day | Read-only operations only |

### Retry Strategy

All Google API calls support automatic retry via `withGoogleRetry()`:

- **Retryable status codes:** 429 (Rate Limit), 500, 502, 503, 504
- **Backoff:** Exponential with jitter (`baseDelay * 2^attempt + random * 0.5`)
- **Max delay cap:** 64 seconds
- **Default retries:** 5 attempts (configurable)
- **Retry-After header:** Parsed when available for precise timing

---

## Security Considerations

1. **Vault-First Credentials:** Service account keys are loaded from GCP Secret Manager (`@mcv/secrets`) before falling back to environment variables. The `credentialRef` field in `google_workspaces` stores a vault path, never raw keys.

2. **Domain-Wide Delegation:** All Workspace admin operations impersonate a domain admin via service account JWT. The `subject` parameter controls which user is impersonated — only super admins should be configured.

3. **Minimal Scope Groups:** The 18 pre-built `SCOPE_GROUPS` ensure each service requests only the scopes it needs. No service requests blanket `https://www.googleapis.com/auth` access.

4. **Token Auto-Refresh:** OAuth2 clients are configured with `on('tokens')` listeners that persist refreshed tokens. `isTokenExpiringSoon()` checks with a 5-minute buffer.

5. **Data Residency:** MCV stores only metadata (emails, names, IDs, group memberships). No email bodies, file contents, or video data is persisted locally. The `google_users` table stores `primaryEmail` and `givenName`/`familyName` only.

6. **Google Ads Read-Only:** The `AdsService` intentionally implements **read-only operations only**. Campaign creation and budget modifications require separate approval workflows per the source code comments.

7. **Push Notification Security:** Calendar `watchCalendar()` channels use HTTPS and are verified via Google's token mechanism. Channel IDs are unique per user+calendar combination.

8. **Password Generation:** `UserProvisioningService.generateTempPassword()` creates 16-character passwords from a 71-character alphabet (uppercase, lowercase, digits, symbols). Users are forced to change on first login (`changePasswordAtNextLogin: true`).

---

## Error Handling

### Retryable Errors

| HTTP Code | Meaning | Retry Strategy |
|-----------|---------|----------------|
| 429 | Too Many Requests / Rate Limit | Exponential backoff with jitter, respects `Retry-After` header |
| 500 | Internal Server Error | Retry up to 5 times |
| 502 | Bad Gateway | Retry up to 5 times |
| 503 | Service Unavailable | Retry up to 5 times |
| 504 | Gateway Timeout | Retry up to 5 times |

### Non-Retryable Errors

| HTTP Code | Meaning | Handling |
|-----------|---------|----------|
| 400 | Bad Request | Throw immediately — invalid input |
| 401 | Unauthorized | Throw immediately — token refresh may be needed |
| 403 | Forbidden | Throw immediately — insufficient permissions or scope |
| 404 | Not Found | Return `null` for get operations; throw for mutations |
| 409 | Conflict | Throw immediately — resource already exists |

### Custom Errors

```typescript
// YouTube quota exceeded
class YouTubeQuotaExceededError extends Error {
  ventureId: string;
  operation: YouTubeOperation;
  summary: QuotaSummary;
  // Message: "YouTube quota exceeded for venture X. Operation 'videos.insert'
  //  requires 1600 units, but only 500 units remaining (9500/10000 used)."
}
```

### Error Patterns in Services

```typescript
// All services follow this 404 pattern for get operations:
async getUser(userId: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await admin.users.get({ userKey: userId });
    return mapToUserInfo(response.data);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 404) {
      return null;  // Not found → return null
    }
    throw error;    // Everything else → re-throw
  }
}
```

---

## Audit Events

| Event | Trigger | Details Logged |
|-------|---------|----------------|
| `google.workspace.connected` | `createWorkspace()` | domain, customerId, adminEmail |
| `google.workspace.synced` | `syncWorkspace()` completes | userCount, groupCount, duration |
| `google.workspace.sync_failed` | `syncWorkspace()` errors | error message |
| `google.user.provisioned` | `provisionUser()` | email, orgUnitPath, ventureId |
| `google.user.suspended` | `suspendUser()` | email, reason |
| `google.user.reactivated` | `reactivateUser()` | email |
| `google.user.deprovisioned` | `deprovisionUser()` | email, transferToEmail, deleteAfterTransfer |
| `google.user.deleted` | `deleteUser()` | email |
| `google.group.created` | `createGroup()` | email, whoCanPostMessage |
| `google.group.member.added` | `addMember()` | groupEmail, memberEmail, role |
| `google.group.member.removed` | `removeMember()` | groupEmail, memberEmail |
| `google.group.linked_to_mums` | `linkToMumsRole()` | groupEmail, mumsRoleSlug, autoSync |
| `google.group.synced` | `syncGroupMembers()` | added, removed, updated |
| `google.drive.created` | `createSharedDrive()` | name, restrictions |
| `google.drive.permission.added` | `addPermission()` | driveId, email, role |
| `google.signature.deployed` | `applyToUsers()` | templateName, applied, failed |
| `google.email.sent` | `sendEmail()` | from, to, subject |
| `google.calendar.event.created` | `createEvent()` | summary, calendarId, attendees |
| `google.calendar.watch.started` | `watchCalendar()` | calendarId, webhookUrl |
| `google.youtube.quota.warning` | Quota threshold crossed | ventureId, percentUsed, level |
| `google.youtube.video.uploaded` | `uploadVideo()` | title, quotaCost: 1600 |
| `google.places.details.fetched` | `getPlaceDetails()` | placeId |

---

## Client Hooks

### `useWorkspaceUsers`

Manages Google Workspace user listing with filters, pagination, and CRUD operations.

```typescript
const {
  users,              // GoogleUserInfo[]
  total,              // Total count
  hasMore,            // Pagination flag
  isLoading,          // Loading state
  error,              // Error message or null
  filters,            // { query, suspended, isAdmin, page }
  setQuery,           // Filter by name/email
  setSuspendedFilter, // Filter suspended users
  setAdminFilter,     // Filter admin users
  setPage,            // Navigate pages
  loadUsers,          // Fetch users for a venture
  provisionUser,      // Create new user
  suspendUser,        // Suspend a user
  reactivateUser,     // Reactivate a user
} = useWorkspaceUsers({
  listFn: (input) => trpc.google.users.list.query(input),
  provisionFn: (input) => trpc.google.users.provision.mutate(input),
  suspendFn: (input) => trpc.google.users.suspend.mutate(input),
  reactivateFn: (input) => trpc.google.users.reactivate.mutate(input),
});
```

### `useGoogleAuth`

Manages the OAuth 2.0 consent flow for services requiring user authorization.

```typescript
const {
  isAuthenticated,   // Boolean
  isLoading,         // Loading state
  error,             // Error message
  scopes,            // Granted scopes
  startAuth,         // Redirect to Google consent
  handleCallback,    // Exchange code for tokens
  revoke,            // Disconnect Google account
  checkAuth,         // Verify token validity
} = useGoogleAuth({
  getAuthUrlFn: (input) => trpc.google.auth.getUrl.query(input),
  exchangeCodeFn: (input) => trpc.google.auth.exchange.mutate(input),
  revokeFn: (input) => trpc.google.auth.revoke.mutate(input),
  checkFn: (input) => trpc.google.auth.check.query(input),
});
```

### Additional Hooks

- **`useDrive`** — File listing, upload, delete operations with loading/error state
- **`useGmail`** — Email listing, search, send with pagination
- **`useCalendar`** — Event listing, creation, RSVP with date range filtering

---

## Related Documentation

- [OAuth Connector](../oauth/MODULE.md) — Token persistence and multi-provider OAuth management
- [Email Connector](../email/MODULE.md) — SMTP-based email delivery (separate from Gmail API)
- [Identity — Users (Tier 1)](../../tier-1-identity/users/MODULE.md) — MUMS user records linked via `google_users.mumsUserId`
- [Identity — Permissions (Tier 1)](../../tier-1-identity/permissions/MODULE.md) — MUMS roles linked via `google_groups.mumsRoleSlug`
- [AI Gateway (Tier 4)](../../tier-4-intelligence/gateway/MODULE.md) — AI features that consume Google data (analytics, content generation)
- [Ventures (Tier 2)](../../tier-2-operations/ventures/MODULE.md) — Venture records that own Google Workspaces
