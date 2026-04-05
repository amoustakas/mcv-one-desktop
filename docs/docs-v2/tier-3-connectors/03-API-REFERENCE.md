# @mcv/connectors — API Reference
## Tier 3: External Integrations

**Package:** `@mcv/connectors`  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Core Exports

```typescript
// OAuth
export { initiateOAuth, handleCallback, refreshToken } from './oauth';
export { getOAuthConnection, revokeConnection } from './oauth';

// Google
export { GoogleClient, GoogleCalendar, GoogleDrive, Gmail } from './google';

// GitHub
export { GitHubClient, GitHubRepos, GitHubIssues } from './github';

// Payments
export { StripeClient, createPayment, createSubscription } from './payments';

// Voice/SMS
export { TwilioClient, sendSms, makeCall } from './voice';

// Email
export { EmailClient, sendEmail, sendBulkEmail } from './email';

// Webhooks
export { registerWebhook, handleWebhook, verifySignature } from './webhooks';

// Accounting
export { QuickBooksClient, syncInvoices } from './accounting';
```

---

## OAuth API

### initiateOAuth

```typescript
function initiateOAuth(options: {
  provider: 'google' | 'github' | 'microsoft' | 'slack';
  scopes: string[];
  redirectUri: string;
  state?: string;
  ventureId: string;
}): Promise<{ url: string; state: string }>
```

### handleCallback

```typescript
function handleCallback(options: {
  provider: string;
  code: string;
  state: string;
}): Promise<{
  connection: OAuthConnection;
  tokens: { accessToken: string; refreshToken?: string };
}>
```

### getOAuthConnection

```typescript
function getOAuthConnection(
  ventureId: string,
  provider: string,
  userId?: string
): Promise<OAuthConnection | null>
```

---

## Google API

### GoogleCalendar

```typescript
class GoogleCalendar {
  constructor(connection: OAuthConnection);
  
  listCalendars(): Promise<Calendar[]>;
  listEvents(calendarId: string, options?: ListEventsOptions): Promise<Event[]>;
  createEvent(calendarId: string, event: EventInput): Promise<Event>;
  updateEvent(calendarId: string, eventId: string, event: EventInput): Promise<Event>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
}
```

### GoogleDrive

```typescript
class GoogleDrive {
  constructor(connection: OAuthConnection);
  
  listFiles(options?: ListFilesOptions): Promise<DriveFile[]>;
  getFile(fileId: string): Promise<DriveFile>;
  uploadFile(file: Buffer, metadata: FileMetadata): Promise<DriveFile>;
  downloadFile(fileId: string): Promise<Buffer>;
  deleteFile(fileId: string): Promise<void>;
  shareFile(fileId: string, email: string, role: 'reader' | 'writer'): Promise<void>;
}
```

### Gmail

```typescript
class Gmail {
  constructor(connection: OAuthConnection);
  
  listMessages(options?: ListMessagesOptions): Promise<Message[]>;
  getMessage(messageId: string): Promise<MessageDetails>;
  sendMessage(message: SendMessageInput): Promise<Message>;
  watchMailbox(options: WatchOptions): Promise<WatchResponse>;
}
```

---

## GitHub API

### GitHubRepos

```typescript
class GitHubRepos {
  constructor(connection: OAuthConnection);
  
  list(options?: { org?: string }): Promise<Repository[]>;
  get(owner: string, repo: string): Promise<Repository>;
  listBranches(owner: string, repo: string): Promise<Branch[]>;
  listCommits(owner: string, repo: string, options?: CommitOptions): Promise<Commit[]>;
  createWebhook(owner: string, repo: string, config: WebhookConfig): Promise<Webhook>;
}
```

### GitHubIssues

```typescript
class GitHubIssues {
  constructor(connection: OAuthConnection);
  
  list(owner: string, repo: string, options?: IssueOptions): Promise<Issue[]>;
  create(owner: string, repo: string, issue: IssueInput): Promise<Issue>;
  update(owner: string, repo: string, number: number, issue: IssueInput): Promise<Issue>;
  addComment(owner: string, repo: string, number: number, body: string): Promise<Comment>;
}
```

---

## Payments API (Stripe)

### createPayment

```typescript
function createPayment(options: {
  amount: number;           // In cents
  currency: string;         // ISO currency code
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  captureMethod?: 'automatic' | 'manual';
}): Promise<Payment>
```

### createSubscription

```typescript
function createSubscription(options: {
  customerId: string;
  priceId: string;
  quantity?: number;
  trialDays?: number;
  metadata?: Record<string, string>;
}): Promise<Subscription>
```

---

## Voice/SMS API (Twilio)

### sendSms

```typescript
function sendSms(options: {
  to: string;               // E.164 format
  from?: string;            // Twilio number
  body: string;
  mediaUrl?: string[];
}): Promise<SmsMessage>
```

### makeCall

```typescript
function makeCall(options: {
  to: string;
  from?: string;
  twiml?: string;           // TwiML instructions
  url?: string;             // TwiML webhook URL
  record?: boolean;
}): Promise<Call>
```

---

## Email API

### sendEmail

```typescript
function sendEmail(options: {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Attachment[];
  replyTo?: string;
}): Promise<EmailResult>
```

---

## Webhook API

### registerWebhook

```typescript
function registerWebhook(options: {
  provider: string;
  events: string[];
  url: string;
  secret?: string;
}): Promise<WebhookRegistration>
```

### handleWebhook

```typescript
function handleWebhook(
  provider: string,
  request: { headers: Headers; body: unknown },
  handlers: Record<string, (payload: unknown) => Promise<void>>
): Promise<void>
```

---

## Types

```typescript
interface OAuthConnection {
  id: string;
  provider: string;
  ventureId: string;
  userId?: string;
  scopes: string[];
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  profile?: ProviderProfile;
  createdAt: Date;
  updatedAt: Date;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  customerId?: string;
  paymentMethodId?: string;
  metadata: Record<string, string>;
  createdAt: Date;
}

interface Subscription {
  id: string;
  customerId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}
```

---

*@mcv/connectors — API Reference*
