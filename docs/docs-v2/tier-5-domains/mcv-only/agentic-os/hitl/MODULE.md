# @mcv/agentic-os/hitl

> **Tier 5 — Domain Module (MCV-Only)**
> Human-in-the-Loop approval and oversight system for agentic workflows.

**Status:** Active
**Since:** 0.9.0
**Maintainer:** MCV Core — Agentic OS Team
**License:** MCV-Only (Proprietary)

---

## Purpose

Autonomous agents are powerful — but unchecked autonomy is dangerous. The **hitl** module (Human-in-the-Loop) is the safety valve that sits between agent intent and real-world consequence. When an agent wants to send an email, initiate a payment, deploy infrastructure, or take any action with irreversible side effects, hitl intercepts the request, evaluates it against configurable policies, and either auto-approves it (if policy permits), or routes it to a human reviewer for explicit approval or rejection. This is not a bottleneck — it is a trust boundary.

hitl implements a complete approval lifecycle: agents submit action requests annotated with confidence scores and contextual metadata; the system evaluates those requests against tenant-specific approval policies that encode risk thresholds, dollar-amount limits, action-type classifications, and agent trust levels; requests that exceed policy boundaries enter prioritized review queues with SLA tracking and escalation timers; human reviewers receive real-time notifications (email, push, Slack, webhooks), inspect the request with full context, and render an approval or rejection decision with reasoning; the decision is recorded in an immutable audit trail, and the originating agent (via the queen orchestrator) is unblocked to either execute or abort. The entire flow is designed to be fast, transparent, and auditable.

Beyond binary approve/reject, hitl supports nuanced workflows: multi-step approval chains where sensitive actions require sign-off from multiple reviewers; delegation of approval authority so managers can empower trusted team members; graduated trust where agents that consistently produce good results can have their auto-approval thresholds raised over time; batch review interfaces for high-volume queues; and confidence-based escalation where the agent's own uncertainty signal triggers human review before the action is even proposed. hitl is not just oversight — it is a trust-building framework that lets organizations safely expand agent autonomy as confidence grows.

---

## Exports

```typescript
// @mcv/agentic-os/hitl — Public API

// ── Core Service ─────────────────────────────────────────────
export { HITLService }                    from './service/hitl-service';
export { createHITLService }              from './service/hitl-service';
export type { HITLServiceConfig }         from './service/hitl-service';

// ── Approval Requests ────────────────────────────────────────
export { submitForApproval }              from './requests/submit';
export { getApprovalRequest }             from './requests/get';
export { listApprovalRequests }           from './requests/list';
export { cancelApprovalRequest }          from './requests/cancel';
export { retryApprovalRequest }           from './requests/retry';
export type { ApprovalRequest }           from './requests/types';
export type { ApprovalRequestInput }      from './requests/types';
export type { ApprovalRequestFilter }     from './requests/types';
export type { ApprovalRequestStatus }     from './requests/types';

// ── Approval Decisions ───────────────────────────────────────
export { approveRequest }                 from './decisions/approve';
export { rejectRequest }                  from './decisions/reject';
export { requestChanges }                 from './decisions/request-changes';
export { batchDecide }                    from './decisions/batch';
export type { ApprovalDecision }          from './decisions/types';
export type { DecisionReason }            from './decisions/types';
export type { BatchDecisionInput }        from './decisions/types';
export type { BatchDecisionResult }       from './decisions/types';

// ── Approval Policies ────────────────────────────────────────
export { createApprovalPolicy }           from './policies/create';
export { updateApprovalPolicy }           from './policies/update';
export { deleteApprovalPolicy }           from './policies/delete';
export { listApprovalPolicies }           from './policies/list';
export { evaluateAgainstPolicies }        from './policies/evaluate';
export type { ApprovalPolicy }            from './policies/types';
export type { PolicyCondition }           from './policies/types';
export type { PolicyAction }              from './policies/types';
export type { PolicyEvaluation }          from './policies/types';
export type { RiskLevel }                 from './policies/types';

// ── Review Queues ────────────────────────────────────────────
export { getReviewQueue }                 from './queues/get';
export { assignReviewer }                 from './queues/assign';
export { unassignReviewer }               from './queues/unassign';
export { reassignReviewer }               from './queues/reassign';
export { getQueueStats }                  from './queues/stats';
export type { ReviewQueue }               from './queues/types';
export type { ReviewAssignment }          from './queues/types';
export type { QueueStats }               from './queues/types';
export type { QueuePriority }            from './queues/types';

// ── Escalation ───────────────────────────────────────────────
export { createEscalationRule }           from './escalation/create';
export { updateEscalationRule }           from './escalation/update';
export { deleteEscalationRule }           from './escalation/delete';
export { listEscalationRules }            from './escalation/list';
export { triggerEscalation }              from './escalation/trigger';
export type { EscalationRule }            from './escalation/types';
export type { EscalationTrigger }         from './escalation/types';
export type { EscalationTarget }          from './escalation/types';

// ── Delegation ───────────────────────────────────────────────
export { delegateAuthority }              from './delegation/delegate';
export { revokeAuthority }                from './delegation/revoke';
export { listDelegations }                from './delegation/list';
export { checkDelegation }                from './delegation/check';
export type { DelegationGrant }           from './delegation/types';
export type { DelegationScope }           from './delegation/types';

// ── Confidence & Trust ───────────────────────────────────────
export { evaluateConfidence }             from './confidence/evaluate';
export { updateTrustScore }               from './confidence/trust';
export { getTrustScore }                  from './confidence/trust';
export { getConfidenceThreshold }         from './confidence/threshold';
export { setConfidenceThreshold }         from './confidence/threshold';
export type { ConfidenceScore }           from './confidence/types';
export type { TrustProfile }             from './confidence/types';
export type { ConfidenceThreshold }      from './confidence/types';

// ── Notifications ────────────────────────────────────────────
export { sendApprovalNotification }       from './notifications/send';
export { configureNotificationChannel }   from './notifications/configure';
export { listNotificationChannels }       from './notifications/list';
export type { NotificationChannel }       from './notifications/types';
export type { NotificationPreference }    from './notifications/types';
export type { NotificationPayload }       from './notifications/types';

// ── Audit Trail ──────────────────────────────────────────────
export { getAuditTrail }                  from './audit/trail';
export { getAuditEntry }                  from './audit/entry';
export { exportAuditLog }                 from './audit/export';
export type { AuditEntry }               from './audit/types';
export type { AuditFilter }             from './audit/types';
export type { AuditExportFormat }        from './audit/types';

// ── tRPC Router ──────────────────────────────────────────────
export { hitlRouter }                     from './trpc/router';
export type { HITLRouterInputs }         from './trpc/router';
export type { HITLRouterOutputs }        from './trpc/router';

// ── Redpanda Events ──────────────────────────────────────────
export { HITLEventProducer }              from './events/producer';
export { HITLEventConsumer }              from './events/consumer';
export type { HITLEvent }                from './events/types';
export type { HITLEventType }            from './events/types';

// ── Constants ────────────────────────────────────────────────
export { HITL_DEFAULTS }                  from './constants';
export { HITL_ERROR_CODES }               from './constants';
export { HITL_RISK_LEVELS }               from './constants';
export { HITL_QUEUE_PRIORITIES }          from './constants';
```

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           HITL — Approval Lifecycle                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Agent    │───▶│  Confidence   │───▶│   Policy     │───▶│  Auto-Approve?   │  │
│  │ (Scout)   │    │  Evaluation   │    │  Evaluation  │    │                  │  │
│  └──────────┘    └───────────────┘    └──────────────┘    └────────┬─────────┘  │
│       │                                                        │       │        │
│       │                                              ┌─────────┘       │        │
│       │                                              │ YES             │ NO     │
│       │                                              ▼                 ▼        │
│       │                                    ┌──────────────┐  ┌──────────────┐   │
│       │                                    │   Execute     │  │  Approval    │   │
│       │                                    │   Action      │  │  Queue       │   │
│       │                                    └──────────────┘  └──────┬───────┘   │
│       │                                              ▲              │           │
│       │                                              │    ┌─────────▼────────┐  │
│       │                                              │    │  Notification    │  │
│       │                                              │    │  (Email/Slack/   │  │
│       │                                              │    │   Push/Webhook)  │  │
│       │                                              │    └─────────┬────────┘  │
│       │                                              │              │           │
│       │                                              │    ┌─────────▼────────┐  │
│       │                                              │    │  Human Review    │  │
│       │                                              │    │  ┌────┐ ┌─────┐  │  │
│       │                                              │    │  │ ✓  │ │  ✗  │  │  │
│       │                                              │    │  └──┬─┘ └──┬──┘  │  │
│       │                                              │    └─────┼──────┼─────┘  │
│       │                                              │          │      │        │
│       │                                     APPROVED─┘          │      │        │
│       │                                                         │      │        │
│       │                                              ┌──────────▼──────▼─────┐  │
│       │                                              │    Audit Trail        │  │
│       │                                              │    (Immutable Log)    │  │
│       │                                              └───────────────────────┘  │
│       │                                                                         │
│       │    ┌────────────────────────────────────────────────────────┐            │
│       │    │              Escalation Engine                         │            │
│       └───▶│  • SLA breach → escalate to senior reviewer           │            │
│            │  • Low confidence → auto-route to human               │            │
│            │  • Repeated rejections → flag agent for retraining    │            │
│            │  • Timeout → notify manager + reassign                │            │
│            └────────────────────────────────────────────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Integration with Queen & Scouts

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   Queen (Orchestrator)                                                     │
│   ┌──────────────────────────────────────────────────────────┐             │
│   │  Task Pipeline                                           │             │
│   │                                                          │             │
│   │  step_1 ──▶ step_2 ──▶ [ HITL GATE ] ──▶ step_3        │             │
│   │                              │                           │             │
│   │                              │  pipeline.pause()         │             │
│   │                              │                           │             │
│   └──────────────────────────────┼───────────────────────────┘             │
│                                  │                                         │
│                                  ▼                                         │
│   ┌──────────────────────────────────────────────────────────┐             │
│   │  hitl.submitForApproval({                                │             │
│   │    action: 'send_email',                                 │             │
│   │    agentId: scout.id,                                    │             │
│   │    payload: { to, subject, body },                       │             │
│   │    confidence: 0.72,                                     │             │
│   │    pipelineId: queen.currentPipeline.id,                 │             │
│   │    stepId: 'step_2_result',                              │             │
│   │  })                                                      │             │
│   └──────────────────────────────┬───────────────────────────┘             │
│                                  │                                         │
│                                  ▼                                         │
│   ┌─────────────────┐    ┌──────────────┐    ┌────────────────────┐        │
│   │  Redpanda        │◀──│  HITL Core   │──▶│  Supabase          │        │
│   │  (Events)        │    │              │    │  (Persistence)     │        │
│   └────────┬────────┘    └──────────────┘    └────────────────────┘        │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────────────────────────────────────┐                          │
│   │  Notification Fanout                         │                          │
│   │  ├── Email (SendGrid/SES)                    │                          │
│   │  ├── Slack (webhook)                         │                          │
│   │  ├── Push (FCM/APNs)                         │                          │
│   │  └── In-App (WebSocket)                      │                          │
│   └─────────────────────────────────────────────┘                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Request State Machine

```
                    ┌───────────┐
                    │  PENDING   │◀────────── submitForApproval()
                    └─────┬─────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
                ▼         ▼         ▼
         ┌───────────┐ ┌──────┐ ┌────────────┐
         │AUTO_APPROVED│ │QUEUED│ │ ESCALATED  │
         └─────┬─────┘ └──┬───┘ └─────┬──────┘
               │           │           │
               │     ┌─────▼─────┐     │
               │     │ ASSIGNED  │◀────┘
               │     └─────┬─────┘
               │           │
               │     ┌─────┼──────────┐
               │     │     │          │
               │     ▼     ▼          ▼
               │  ┌──────┐ ┌────────┐ ┌──────────────┐
               │  │APPROVED│ │REJECTED│ │CHANGES_NEEDED│
               │  └──┬───┘ └───┬────┘ └──────┬───────┘
               │     │         │              │
               ▼     ▼         ▼              │
          ┌───────────────┐ ┌──────────┐      │
          │   EXECUTED    │ │ ABORTED  │      │
          └───────────────┘ └──────────┘      │
               ▲                              │
               └───── (resubmit) ◀────────────┘

          ┌───────────┐
          │ CANCELLED  │◀── cancelApprovalRequest() (from any non-terminal state)
          └───────────┘

          ┌───────────┐
          │  EXPIRED   │◀── SLA timeout with no escalation target
          └───────────┘
```

---

## Core Interfaces

### HITLService

The primary service facade. All hitl operations flow through this interface.

```typescript
interface HITLServiceConfig {
  /** Supabase client for persistence */
  supabase: SupabaseClient;
  /** Redpanda producer for event streaming */
  eventProducer: HITLEventProducer;
  /** Tenant ID for RLS scoping */
  tenantId: string;
  /** Default SLA timeout in milliseconds (default: 4 hours) */
  defaultSlaMs?: number;
  /** Enable auto-approval for trusted agents (default: true) */
  enableAutoApproval?: boolean;
  /** Maximum batch size for batch operations (default: 100) */
  maxBatchSize?: number;
  /** Confidence threshold below which all requests require review (default: 0.5) */
  globalConfidenceFloor?: number;
}

interface HITLService {
  // ── Request Lifecycle ──
  submit(input: ApprovalRequestInput): Promise<ApprovalRequest>;
  get(requestId: string): Promise<ApprovalRequest | null>;
  list(filter: ApprovalRequestFilter): Promise<PaginatedResult<ApprovalRequest>>;
  cancel(requestId: string, reason: string): Promise<ApprovalRequest>;
  retry(requestId: string): Promise<ApprovalRequest>;

  // ── Decisions ──
  approve(requestId: string, decision: DecisionInput): Promise<ApprovalDecision>;
  reject(requestId: string, decision: DecisionInput): Promise<ApprovalDecision>;
  requestChanges(requestId: string, decision: DecisionInput): Promise<ApprovalDecision>;
  batchDecide(input: BatchDecisionInput): Promise<BatchDecisionResult>;

  // ── Policies ──
  createPolicy(policy: ApprovalPolicyInput): Promise<ApprovalPolicy>;
  updatePolicy(policyId: string, updates: Partial<ApprovalPolicyInput>): Promise<ApprovalPolicy>;
  deletePolicy(policyId: string): Promise<void>;
  listPolicies(filter?: PolicyFilter): Promise<ApprovalPolicy[]>;
  evaluate(request: ApprovalRequestInput): Promise<PolicyEvaluation>;

  // ── Queues ──
  getQueue(queueId?: string): Promise<ReviewQueue>;
  assignReviewer(requestId: string, reviewerId: string): Promise<ReviewAssignment>;
  unassignReviewer(assignmentId: string): Promise<void>;
  reassign(assignmentId: string, newReviewerId: string): Promise<ReviewAssignment>;
  getQueueStats(): Promise<QueueStats>;

  // ── Escalation ──
  createEscalationRule(rule: EscalationRuleInput): Promise<EscalationRule>;
  updateEscalationRule(ruleId: string, updates: Partial<EscalationRuleInput>): Promise<EscalationRule>;
  deleteEscalationRule(ruleId: string): Promise<void>;
  listEscalationRules(): Promise<EscalationRule[]>;

  // ── Delegation ──
  delegate(grant: DelegationGrantInput): Promise<DelegationGrant>;
  revoke(grantId: string): Promise<void>;
  listDelegations(userId?: string): Promise<DelegationGrant[]>;
  checkDelegation(userId: string, actionType: string): Promise<boolean>;

  // ── Confidence & Trust ──
  evaluateConfidence(agentId: string, action: string, context: Record<string, unknown>): Promise<ConfidenceScore>;
  getTrustScore(agentId: string): Promise<TrustProfile>;
  updateTrustScore(agentId: string, feedback: TrustFeedback): Promise<TrustProfile>;

  // ── Audit ──
  getAuditTrail(filter: AuditFilter): Promise<PaginatedResult<AuditEntry>>;
  exportAuditLog(filter: AuditFilter, format: AuditExportFormat): Promise<ReadableStream>;

  // ── Notifications ──
  configureNotification(channel: NotificationChannelInput): Promise<NotificationChannel>;
  listNotificationChannels(): Promise<NotificationChannel[]>;

  // ── Lifecycle ──
  start(): Promise<void>;
  stop(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
}
```

### ApprovalRequest

```typescript
type ApprovalRequestStatus =
  | 'pending'
  | 'auto_approved'
  | 'queued'
  | 'assigned'
  | 'escalated'
  | 'approved'
  | 'rejected'
  | 'changes_needed'
  | 'executed'
  | 'aborted'
  | 'cancelled'
  | 'expired';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface ApprovalRequest {
  /** Unique request identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** ID of the agent that submitted the request */
  agentId: string;
  /** Human-readable agent name */
  agentName: string;
  /** Pipeline ID in queen orchestrator (if applicable) */
  pipelineId: string | null;
  /** Step ID within the pipeline */
  stepId: string | null;
  /** Action type identifier (e.g., 'send_email', 'make_payment', 'deploy') */
  actionType: string;
  /** Human-readable title for the request */
  title: string;
  /** Detailed description of what the agent wants to do */
  description: string;
  /** The action payload — what will be executed if approved */
  payload: Record<string, unknown>;
  /** Agent's self-reported confidence score (0.0 — 1.0) */
  confidence: number;
  /** Computed risk level based on policy evaluation */
  riskLevel: RiskLevel;
  /** Current request status */
  status: ApprovalRequestStatus;
  /** Priority in the review queue */
  priority: QueuePriority;
  /** Monetary value of the action (if applicable, in cents) */
  monetaryValueCents: number | null;
  /** Currency code (ISO 4217) */
  currency: string | null;
  /** IDs of required approvers (for multi-approver chains) */
  requiredApproverIds: string[];
  /** IDs of approvers who have already approved */
  currentApproverIds: string[];
  /** Number of approvals still needed */
  approvalsRemaining: number;
  /** SLA deadline — request should be reviewed before this time */
  slaDueAt: Date;
  /** Whether the SLA has been breached */
  slaBreached: boolean;
  /** The policy that matched this request */
  matchedPolicyId: string | null;
  /** Tags for categorization and filtering */
  tags: string[];
  /** Contextual metadata from the agent */
  metadata: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** When the request was assigned to a reviewer */
  assignedAt: Date | null;
  /** When the decision was made */
  decidedAt: Date | null;
  /** When the action was executed (post-approval) */
  executedAt: Date | null;
  /** ID of the currently assigned reviewer */
  assignedReviewerId: string | null;
  /** The final decision (if decided) */
  decision: ApprovalDecision | null;
  /** Number of times this request has been escalated */
  escalationCount: number;
}

interface ApprovalRequestInput {
  /** Action type identifier */
  actionType: string;
  /** Human-readable title */
  title: string;
  /** Detailed description */
  description: string;
  /** Action payload */
  payload: Record<string, unknown>;
  /** Agent's confidence score (0.0 — 1.0) */
  confidence: number;
  /** Agent ID (auto-set from context if not provided) */
  agentId?: string;
  /** Pipeline ID for queen integration */
  pipelineId?: string;
  /** Step ID within the pipeline */
  stepId?: string;
  /** Monetary value in cents (if applicable) */
  monetaryValueCents?: number;
  /** Currency code (ISO 4217) */
  currency?: string;
  /** Explicit priority override */
  priority?: QueuePriority;
  /** Tags for categorization */
  tags?: string[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Custom SLA duration override in milliseconds */
  slaMs?: number;
}

interface ApprovalRequestFilter {
  status?: ApprovalRequestStatus | ApprovalRequestStatus[];
  actionType?: string | string[];
  agentId?: string;
  assignedReviewerId?: string;
  riskLevel?: RiskLevel | RiskLevel[];
  priority?: QueuePriority | QueuePriority[];
  slaBreached?: boolean;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: 'createdAt' | 'priority' | 'slaDueAt' | 'confidence';
  orderDir?: 'asc' | 'desc';
}
```

### ApprovalPolicy

```typescript
type PolicyConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'matches_regex';

interface PolicyCondition {
  /** Field to evaluate (supports dot notation for nested fields) */
  field: string;
  /** Comparison operator */
  operator: PolicyConditionOperator;
  /** Value to compare against */
  value: unknown;
}

type PolicyActionType =
  | 'auto_approve'
  | 'require_approval'
  | 'require_multi_approval'
  | 'block'
  | 'escalate';

interface PolicyAction {
  /** What to do when conditions match */
  type: PolicyActionType;
  /** Number of approvers required (for require_multi_approval) */
  requiredApprovers?: number;
  /** Specific approver role IDs */
  approverRoleIds?: string[];
  /** Specific approver user IDs */
  approverUserIds?: string[];
  /** Custom SLA override in milliseconds */
  slaMs?: number;
  /** Priority override */
  priority?: QueuePriority;
  /** Escalation target (for escalate action) */
  escalationTarget?: string;
  /** Message to include with the action */
  message?: string;
}

interface ApprovalPolicy {
  /** Unique policy identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** Human-readable policy name */
  name: string;
  /** Policy description */
  description: string;
  /** Whether the policy is currently active */
  enabled: boolean;
  /** Evaluation priority — lower numbers evaluate first */
  priority: number;
  /** Conditions that must ALL be true for this policy to match (AND logic) */
  conditions: PolicyCondition[];
  /** Action to take when conditions match */
  action: PolicyAction;
  /** Optional: only apply to specific action types */
  actionTypes: string[] | null;
  /** Optional: only apply to specific agent IDs */
  agentIds: string[] | null;
  /** Optional: minimum risk level to trigger */
  minimumRiskLevel: RiskLevel | null;
  /** Optional: minimum monetary value in cents to trigger */
  minimumValueCents: number | null;
  /** Optional: confidence range — policy applies when confidence is in [min, max] */
  confidenceRange: { min: number; max: number } | null;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** ID of the user who created the policy */
  createdBy: string;
}

interface PolicyEvaluation {
  /** The request that was evaluated */
  requestInput: ApprovalRequestInput;
  /** The policy that matched (null if no policy matched — falls to default) */
  matchedPolicy: ApprovalPolicy | null;
  /** The resulting action */
  action: PolicyAction;
  /** Computed risk level */
  riskLevel: RiskLevel;
  /** Whether auto-approval is permitted */
  autoApproved: boolean;
  /** Human-readable explanation of the evaluation */
  explanation: string;
  /** All policies that were evaluated, in order */
  evaluatedPolicies: Array<{
    policy: ApprovalPolicy;
    matched: boolean;
    reason: string;
  }>;
}
```

### ReviewQueue

```typescript
type QueuePriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

interface ReviewQueue {
  /** Queue identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** Queue name */
  name: string;
  /** Total items in queue */
  totalItems: number;
  /** Items awaiting assignment */
  unassignedItems: number;
  /** Items currently being reviewed */
  inReviewItems: number;
  /** Items with breached SLA */
  slaBreachedItems: number;
  /** Queue items (paginated) */
  items: ApprovalRequest[];
  /** Available reviewers */
  availableReviewers: ReviewerInfo[];
}

interface ReviewAssignment {
  /** Assignment identifier */
  id: string;
  /** The approval request being reviewed */
  requestId: string;
  /** The assigned reviewer's user ID */
  reviewerId: string;
  /** Reviewer display name */
  reviewerName: string;
  /** When the assignment was made */
  assignedAt: Date;
  /** Whether the reviewer has viewed the request */
  viewed: boolean;
  /** When the reviewer first viewed the request */
  viewedAt: Date | null;
  /** Assignment notes */
  notes: string | null;
}

interface ReviewerInfo {
  /** User ID */
  userId: string;
  /** Display name */
  name: string;
  /** Roles */
  roles: string[];
  /** Current assigned review count */
  activeAssignments: number;
  /** Maximum concurrent assignments */
  maxAssignments: number;
  /** Whether the reviewer is currently available */
  available: boolean;
  /** Average review time in milliseconds */
  avgReviewTimeMs: number;
  /** Approval rate (0.0 — 1.0) */
  approvalRate: number;
}

interface QueueStats {
  /** Total pending requests */
  totalPending: number;
  /** Breakdown by status */
  byStatus: Record<ApprovalRequestStatus, number>;
  /** Breakdown by risk level */
  byRiskLevel: Record<RiskLevel, number>;
  /** Breakdown by priority */
  byPriority: Record<QueuePriority, number>;
  /** Breakdown by action type */
  byActionType: Record<string, number>;
  /** Average time from submission to decision (ms) */
  avgDecisionTimeMs: number;
  /** Median time from submission to decision (ms) */
  medianDecisionTimeMs: number;
  /** P95 decision time (ms) */
  p95DecisionTimeMs: number;
  /** Current SLA compliance rate (0.0 — 1.0) */
  slaComplianceRate: number;
  /** Number of currently breached SLAs */
  activeSlaBreaches: number;
  /** Auto-approval rate (0.0 — 1.0) */
  autoApprovalRate: number;
  /** Rejection rate (0.0 — 1.0) */
  rejectionRate: number;
  /** Stats time window */
  windowStart: Date;
  windowEnd: Date;
}
```

### EscalationRule

```typescript
type EscalationTriggerType =
  | 'sla_breach'
  | 'confidence_below'
  | 'repeated_rejection'
  | 'monetary_threshold'
  | 'risk_level'
  | 'unassigned_timeout'
  | 'reviewer_timeout'
  | 'manual';

interface EscalationTrigger {
  /** What triggers the escalation */
  type: EscalationTriggerType;
  /** Threshold value (interpretation depends on type) */
  threshold: number;
  /** Time window for time-based triggers (in milliseconds) */
  timeWindowMs?: number;
  /** Additional conditions */
  conditions?: PolicyCondition[];
}

type EscalationTargetType =
  | 'user'
  | 'role'
  | 'manager'
  | 'on_call'
  | 'external_webhook';

interface EscalationTarget {
  /** Target type */
  type: EscalationTargetType;
  /** Target identifier (user ID, role ID, webhook URL) */
  targetId: string;
  /** Notification channels to use for this target */
  notificationChannels: string[];
  /** Whether to auto-assign to this target */
  autoAssign: boolean;
}

interface EscalationRule {
  /** Rule identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** Human-readable rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Whether the rule is active */
  enabled: boolean;
  /** Trigger conditions */
  trigger: EscalationTrigger;
  /** Escalation targets — tried in order */
  targets: EscalationTarget[];
  /** Maximum number of escalation levels */
  maxEscalations: number;
  /** Cool-down period between escalations (ms) */
  cooldownMs: number;
  /** Optional: only apply to specific action types */
  actionTypes: string[] | null;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}
```

### ApprovalDecision

```typescript
type DecisionType = 'approved' | 'rejected' | 'changes_needed';

interface DecisionReason {
  /** Free-text reasoning */
  text: string;
  /** Structured reason code (optional) */
  code?: string;
  /** Whether the reason should be visible to the agent */
  visibleToAgent: boolean;
}

interface ApprovalDecision {
  /** Decision identifier */
  id: string;
  /** The approval request this decision belongs to */
  requestId: string;
  /** Decision type */
  type: DecisionType;
  /** ID of the reviewer who made the decision */
  reviewerId: string;
  /** Reviewer display name */
  reviewerName: string;
  /** Decision reasoning */
  reason: DecisionReason;
  /** Conditions attached to the approval (e.g., "approved but lower the amount") */
  conditions: string[];
  /** Modified payload (if the reviewer adjusted the action) */
  modifiedPayload: Record<string, unknown> | null;
  /** Time spent reviewing (milliseconds) */
  reviewDurationMs: number;
  /** Whether this was an auto-approval */
  isAutoApproval: boolean;
  /** Whether this was via delegation */
  isDelegated: boolean;
  /** Original delegator (if delegated) */
  delegatorId: string | null;
  /** Whether this was part of a batch decision */
  isBatchDecision: boolean;
  /** Batch ID (if batch) */
  batchId: string | null;
  /** Decision timestamp */
  decidedAt: Date;
}

interface DecisionInput {
  /** Decision reasoning */
  reason: string;
  /** Structured reason code (optional) */
  reasonCode?: string;
  /** Whether the reason should be visible to the agent */
  reasonVisibleToAgent?: boolean;
  /** Conditions for conditional approvals */
  conditions?: string[];
  /** Modified payload (if adjusting the action) */
  modifiedPayload?: Record<string, unknown>;
}

interface BatchDecisionInput {
  /** IDs of requests to decide on */
  requestIds: string[];
  /** Decision to apply to all */
  type: DecisionType;
  /** Shared reasoning */
  reason: string;
  /** Structured reason code */
  reasonCode?: string;
  /** Whether to skip requests that can't be decided (vs. failing the whole batch) */
  skipInvalid?: boolean;
}

interface BatchDecisionResult {
  /** Batch identifier */
  batchId: string;
  /** Total requests in batch */
  total: number;
  /** Successfully decided */
  succeeded: number;
  /** Failed to decide */
  failed: number;
  /** Skipped (if skipInvalid was true) */
  skipped: number;
  /** Individual results */
  results: Array<{
    requestId: string;
    success: boolean;
    decision?: ApprovalDecision;
    error?: string;
  }>;
}
```

### DelegationGrant

```typescript
interface DelegationScope {
  /** Action types this delegation covers (null = all) */
  actionTypes: string[] | null;
  /** Maximum risk level the delegate can approve */
  maxRiskLevel: RiskLevel;
  /** Maximum monetary value in cents the delegate can approve (null = unlimited) */
  maxValueCents: number | null;
  /** Maximum number of approvals under this delegation (null = unlimited) */
  maxApprovals: number | null;
}

interface DelegationGrant {
  /** Grant identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** User granting the delegation */
  delegatorId: string;
  /** User receiving the delegation */
  delegateId: string;
  /** Scope of the delegation */
  scope: DelegationScope;
  /** Human-readable reason for delegation */
  reason: string;
  /** When the delegation becomes active */
  activeFrom: Date;
  /** When the delegation expires (null = no expiry) */
  expiresAt: Date | null;
  /** Whether the delegation is currently active */
  active: boolean;
  /** Number of approvals made under this delegation */
  approvalsUsed: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Revocation timestamp (if revoked) */
  revokedAt: Date | null;
}
```

### TrustProfile & Confidence

```typescript
interface ConfidenceScore {
  /** Overall confidence (0.0 — 1.0) */
  overall: number;
  /** Breakdown by factor */
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    explanation: string;
  }>;
  /** Whether this confidence level requires human review */
  requiresReview: boolean;
  /** The applicable threshold that was checked */
  threshold: ConfidenceThreshold;
  /** Recommendation */
  recommendation: 'auto_approve' | 'review_suggested' | 'review_required' | 'block';
}

interface TrustProfile {
  /** Agent identifier */
  agentId: string;
  /** Tenant scope */
  tenantId: string;
  /** Overall trust score (0.0 — 1.0) */
  trustScore: number;
  /** Total actions submitted */
  totalSubmissions: number;
  /** Total auto-approved actions */
  totalAutoApproved: number;
  /** Total manually approved actions */
  totalManuallyApproved: number;
  /** Total rejected actions */
  totalRejected: number;
  /** Approval rate (0.0 — 1.0) */
  approvalRate: number;
  /** Trust score trend (positive = improving) */
  trend: number;
  /** Per-action-type trust breakdown */
  actionTrust: Record<string, {
    trustScore: number;
    submissions: number;
    approvals: number;
    rejections: number;
  }>;
  /** Last trust score update */
  updatedAt: Date;
  /** Trust score history (last 30 data points) */
  history: Array<{
    score: number;
    timestamp: Date;
  }>;
}

interface ConfidenceThreshold {
  /** Threshold identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** Action type this threshold applies to (null = global default) */
  actionType: string | null;
  /** Agent ID this threshold applies to (null = all agents) */
  agentId: string | null;
  /** Confidence below this → always require review */
  reviewRequiredBelow: number;
  /** Confidence above this → eligible for auto-approval (subject to policy) */
  autoApproveAbove: number;
  /** Confidence below this → block entirely */
  blockBelow: number;
  /** Last update */
  updatedAt: Date;
}

type TrustFeedback = {
  /** The approval request ID this feedback is for */
  requestId: string;
  /** Outcome of the action */
  outcome: 'success' | 'failure' | 'partial';
  /** Impact on trust score (-1.0 to 1.0) */
  impact: number;
  /** Optional notes */
  notes?: string;
};
```

### NotificationChannel

```typescript
type NotificationChannelType =
  | 'email'
  | 'slack'
  | 'push'
  | 'webhook'
  | 'in_app'
  | 'sms';

interface NotificationChannel {
  /** Channel identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** Channel type */
  type: NotificationChannelType;
  /** Channel name */
  name: string;
  /** Whether the channel is enabled */
  enabled: boolean;
  /** Channel-specific configuration */
  config: Record<string, unknown>;
  /** Which events trigger notifications on this channel */
  events: HITLEventType[];
  /** Priority filter — only notify for these priorities or higher */
  minimumPriority: QueuePriority;
  /** Quiet hours (no notifications during these times) */
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    timezone: string;
  } | null;
  /** Creation timestamp */
  createdAt: Date;
}

interface NotificationPayload {
  /** Event type */
  event: HITLEventType;
  /** The approval request (summary) */
  request: Pick<ApprovalRequest, 'id' | 'title' | 'actionType' | 'riskLevel' | 'priority' | 'agentName' | 'confidence'>;
  /** Recipient user IDs */
  recipientIds: string[];
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Action URL (deep link to review UI) */
  actionUrl: string;
  /** Whether this is an escalation notification */
  isEscalation: boolean;
  /** Timestamp */
  timestamp: Date;
}
```

### AuditEntry

```typescript
type AuditAction =
  | 'request_submitted'
  | 'request_auto_approved'
  | 'request_queued'
  | 'request_assigned'
  | 'request_viewed'
  | 'request_approved'
  | 'request_rejected'
  | 'request_changes_requested'
  | 'request_cancelled'
  | 'request_expired'
  | 'request_executed'
  | 'request_aborted'
  | 'request_escalated'
  | 'request_reassigned'
  | 'policy_created'
  | 'policy_updated'
  | 'policy_deleted'
  | 'delegation_granted'
  | 'delegation_revoked'
  | 'trust_score_updated'
  | 'escalation_triggered'
  | 'batch_decision';

interface AuditEntry {
  /** Audit entry identifier */
  id: string;
  /** Tenant scope */
  tenantId: string;
  /** Action that was audited */
  action: AuditAction;
  /** ID of the user or agent that performed the action */
  actorId: string;
  /** Actor type */
  actorType: 'user' | 'agent' | 'system';
  /** Actor display name */
  actorName: string;
  /** The approval request ID (if applicable) */
  requestId: string | null;
  /** The policy ID (if applicable) */
  policyId: string | null;
  /** Human-readable description of the action */
  description: string;
  /** Previous state (for state transitions) */
  previousState: Record<string, unknown> | null;
  /** New state (for state transitions) */
  newState: Record<string, unknown> | null;
  /** Additional metadata */
  metadata: Record<string, unknown>;
  /** IP address of the actor */
  ipAddress: string | null;
  /** User agent of the actor */
  userAgent: string | null;
  /** Timestamp */
  createdAt: Date;
}

interface AuditFilter {
  action?: AuditAction | AuditAction[];
  actorId?: string;
  actorType?: 'user' | 'agent' | 'system';
  requestId?: string;
  policyId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

type AuditExportFormat = 'json' | 'csv' | 'jsonl';
```

---

## Database Schemas

All tables are scoped to `agentic_os` schema and enforce multi-tenant row-level security via `tenant_id`.

### approval_requests

```typescript
import { pgSchema, pgTable, uuid, text, varchar, integer, bigint, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const agenticOs = pgSchema('agentic_os');

// ── Enums ────────────────────────────────────────────────────

export const approvalRequestStatusEnum = agenticOs.enum('approval_request_status', [
  'pending',
  'auto_approved',
  'queued',
  'assigned',
  'escalated',
  'approved',
  'rejected',
  'changes_needed',
  'executed',
  'aborted',
  'cancelled',
  'expired',
]);

export const riskLevelEnum = agenticOs.enum('risk_level', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const queuePriorityEnum = agenticOs.enum('queue_priority', [
  'low',
  'normal',
  'high',
  'urgent',
  'critical',
]);

// ── approval_requests ────────────────────────────────────────

export const approvalRequests = agenticOs.table('approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  agentId: varchar('agent_id', { length: 255 }).notNull(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  pipelineId: uuid('pipeline_id'),
  stepId: varchar('step_id', { length: 255 }),
  actionType: varchar('action_type', { length: 255 }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),
  confidence: integer('confidence_bps').notNull(), // basis points: 0–10000
  riskLevel: riskLevelEnum('risk_level').notNull().default('medium'),
  status: approvalRequestStatusEnum('status').notNull().default('pending'),
  priority: queuePriorityEnum('priority').notNull().default('normal'),
  monetaryValueCents: bigint('monetary_value_cents', { mode: 'number' }),
  currency: varchar('currency', { length: 3 }),
  requiredApproverIds: jsonb('required_approver_ids').notNull().$type<string[]>().default([]),
  currentApproverIds: jsonb('current_approver_ids').notNull().$type<string[]>().default([]),
  approvalsRemaining: integer('approvals_remaining').notNull().default(1),
  matchedPolicyId: uuid('matched_policy_id'),
  slaDueAt: timestamp('sla_due_at', { withTimezone: true }).notNull(),
  slaBreached: boolean('sla_breached').notNull().default(false),
  tags: jsonb('tags').notNull().$type<string[]>().default([]),
  metadata: jsonb('metadata').notNull().$type<Record<string, unknown>>().default({}),
  assignedReviewerId: uuid('assigned_reviewer_id'),
  escalationCount: integer('escalation_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  executedAt: timestamp('executed_at', { withTimezone: true }),
});

// Indexes
// CREATE INDEX idx_approval_requests_tenant_status ON agentic_os.approval_requests (tenant_id, status);
// CREATE INDEX idx_approval_requests_tenant_action ON agentic_os.approval_requests (tenant_id, action_type);
// CREATE INDEX idx_approval_requests_assigned ON agentic_os.approval_requests (assigned_reviewer_id) WHERE assigned_reviewer_id IS NOT NULL;
// CREATE INDEX idx_approval_requests_sla ON agentic_os.approval_requests (sla_due_at) WHERE status IN ('queued', 'assigned', 'escalated');
// CREATE INDEX idx_approval_requests_pipeline ON agentic_os.approval_requests (pipeline_id) WHERE pipeline_id IS NOT NULL;
// CREATE INDEX idx_approval_requests_agent ON agentic_os.approval_requests (tenant_id, agent_id);
```

### approval_policies

```typescript
export const approvalPolicies = agenticOs.table('approval_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  enabled: boolean('enabled').notNull().default(true),
  priority: integer('priority').notNull().default(100),
  conditions: jsonb('conditions').notNull().$type<PolicyCondition[]>(),
  action: jsonb('action').notNull().$type<PolicyAction>(),
  actionTypes: jsonb('action_types').$type<string[]>(),
  agentIds: jsonb('agent_ids').$type<string[]>(),
  minimumRiskLevel: riskLevelEnum('minimum_risk_level'),
  minimumValueCents: bigint('minimum_value_cents', { mode: 'number' }),
  confidenceRange: jsonb('confidence_range').$type<{ min: number; max: number }>(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_approval_policies_tenant ON agentic_os.approval_policies (tenant_id, enabled, priority);
// CREATE UNIQUE INDEX idx_approval_policies_name ON agentic_os.approval_policies (tenant_id, name);
```

### review_assignments

```typescript
export const reviewAssignments = agenticOs.table('review_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  requestId: uuid('request_id').notNull().references(() => approvalRequests.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewer_id').notNull(),
  reviewerName: varchar('reviewer_name', { length: 255 }).notNull(),
  viewed: boolean('viewed').notNull().default(false),
  viewedAt: timestamp('viewed_at', { withTimezone: true }),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// Indexes
// CREATE INDEX idx_review_assignments_reviewer ON agentic_os.review_assignments (reviewer_id, active);
// CREATE INDEX idx_review_assignments_request ON agentic_os.review_assignments (request_id, active);
// CREATE UNIQUE INDEX idx_review_assignments_unique ON agentic_os.review_assignments (request_id, reviewer_id) WHERE active = true;
```

### escalation_rules

```typescript
export const escalationRules = agenticOs.table('escalation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  enabled: boolean('enabled').notNull().default(true),
  trigger: jsonb('trigger').notNull().$type<EscalationTrigger>(),
  targets: jsonb('targets').notNull().$type<EscalationTarget[]>(),
  maxEscalations: integer('max_escalations').notNull().default(3),
  cooldownMs: bigint('cooldown_ms', { mode: 'number' }).notNull().default(900_000), // 15 minutes
  actionTypes: jsonb('action_types').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_escalation_rules_tenant ON agentic_os.escalation_rules (tenant_id, enabled);
```

### approval_decisions

```typescript
export const approvalDecisions = agenticOs.table('approval_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  requestId: uuid('request_id').notNull().references(() => approvalRequests.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'approved' | 'rejected' | 'changes_needed'
  reviewerId: uuid('reviewer_id').notNull(),
  reviewerName: varchar('reviewer_name', { length: 255 }).notNull(),
  reasonText: text('reason_text').notNull(),
  reasonCode: varchar('reason_code', { length: 100 }),
  reasonVisibleToAgent: boolean('reason_visible_to_agent').notNull().default(true),
  conditions: jsonb('conditions').notNull().$type<string[]>().default([]),
  modifiedPayload: jsonb('modified_payload').$type<Record<string, unknown>>(),
  reviewDurationMs: bigint('review_duration_ms', { mode: 'number' }).notNull(),
  isAutoApproval: boolean('is_auto_approval').notNull().default(false),
  isDelegated: boolean('is_delegated').notNull().default(false),
  delegatorId: uuid('delegator_id'),
  isBatchDecision: boolean('is_batch_decision').notNull().default(false),
  batchId: uuid('batch_id'),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_approval_decisions_request ON agentic_os.approval_decisions (request_id);
// CREATE INDEX idx_approval_decisions_reviewer ON agentic_os.approval_decisions (tenant_id, reviewer_id);
// CREATE INDEX idx_approval_decisions_batch ON agentic_os.approval_decisions (batch_id) WHERE batch_id IS NOT NULL;
```

### approval_history (Audit Trail)

```typescript
export const approvalHistory = agenticOs.table('approval_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  actorId: varchar('actor_id', { length: 255 }).notNull(),
  actorType: varchar('actor_type', { length: 50 }).notNull(), // 'user' | 'agent' | 'system'
  actorName: varchar('actor_name', { length: 255 }).notNull(),
  requestId: uuid('request_id'),
  policyId: uuid('policy_id'),
  description: text('description').notNull(),
  previousState: jsonb('previous_state').$type<Record<string, unknown>>(),
  newState: jsonb('new_state').$type<Record<string, unknown>>(),
  metadata: jsonb('metadata').notNull().$type<Record<string, unknown>>().default({}),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE INDEX idx_approval_history_tenant ON agentic_os.approval_history (tenant_id, created_at DESC);
// CREATE INDEX idx_approval_history_request ON agentic_os.approval_history (request_id) WHERE request_id IS NOT NULL;
// CREATE INDEX idx_approval_history_actor ON agentic_os.approval_history (tenant_id, actor_id);
// CREATE INDEX idx_approval_history_action ON agentic_os.approval_history (tenant_id, action);
```

### delegation_grants

```typescript
export const delegationGrants = agenticOs.table('delegation_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  delegatorId: uuid('delegator_id').notNull(),
  delegateId: uuid('delegate_id').notNull(),
  scope: jsonb('scope').notNull().$type<DelegationScope>(),
  reason: text('reason').notNull(),
  activeFrom: timestamp('active_from', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  active: boolean('active').notNull().default(true),
  approvalsUsed: integer('approvals_used').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

// Indexes
// CREATE INDEX idx_delegation_grants_delegate ON agentic_os.delegation_grants (delegate_id, active);
// CREATE INDEX idx_delegation_grants_delegator ON agentic_os.delegation_grants (delegator_id, active);
```

### confidence_thresholds

```typescript
export const confidenceThresholds = agenticOs.table('confidence_thresholds', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  actionType: varchar('action_type', { length: 255 }),
  agentId: varchar('agent_id', { length: 255 }),
  reviewRequiredBelow: integer('review_required_below_bps').notNull().default(7000), // 0.70
  autoApproveAbove: integer('auto_approve_above_bps').notNull().default(9500),       // 0.95
  blockBelow: integer('block_below_bps').notNull().default(2000),                     // 0.20
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Indexes
// CREATE UNIQUE INDEX idx_confidence_thresholds_unique
//   ON agentic_os.confidence_thresholds (tenant_id, COALESCE(action_type, ''), COALESCE(agent_id, ''));
```

### trust_profiles

```typescript
export const trustProfiles = agenticOs.table('trust_profiles', {
  agentId: varchar('agent_id', { length: 255 }).notNull(),
  tenantId: uuid('tenant_id').notNull(),
  trustScore: integer('trust_score_bps').notNull().default(5000), // 0.50 starting trust
  totalSubmissions: integer('total_submissions').notNull().default(0),
  totalAutoApproved: integer('total_auto_approved').notNull().default(0),
  totalManuallyApproved: integer('total_manually_approved').notNull().default(0),
  totalRejected: integer('total_rejected').notNull().default(0),
  actionTrust: jsonb('action_trust').notNull().$type<Record<string, {
    trustScore: number;
    submissions: number;
    approvals: number;
    rejections: number;
  }>>().default({}),
  history: jsonb('history').notNull().$type<Array<{ score: number; timestamp: string }>>().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: { columns: [table.tenantId, table.agentId] },
}));
```

### Row-Level Security

```sql
-- Enable RLS on all hitl tables
ALTER TABLE agentic_os.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_os.approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_os.review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_os.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_os.approval_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_os.approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_os.delegation_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_os.confidence_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_os.trust_profiles ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (applied to all tables)
-- Example for approval_requests:
CREATE POLICY tenant_isolation ON agentic_os.approval_requests
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Reviewer access: can only see requests assigned to them or unassigned in their queue
CREATE POLICY reviewer_access ON agentic_os.approval_requests
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      assigned_reviewer_id = current_setting('app.user_id')::uuid
      OR assigned_reviewer_id IS NULL
      OR current_setting('app.user_role') = 'admin'
    )
  );

-- Audit trail: append-only (no UPDATE or DELETE)
CREATE POLICY audit_append_only ON agentic_os.approval_history
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- No UPDATE/DELETE policies on approval_history = effectively immutable
```

### Relations

```typescript
export const approvalRequestRelations = relations(approvalRequests, ({ one, many }) => ({
  decision: one(approvalDecisions, {
    fields: [approvalRequests.id],
    references: [approvalDecisions.requestId],
  }),
  assignments: many(reviewAssignments),
  matchedPolicy: one(approvalPolicies, {
    fields: [approvalRequests.matchedPolicyId],
    references: [approvalPolicies.id],
  }),
  auditEntries: many(approvalHistory),
}));

export const approvalDecisionRelations = relations(approvalDecisions, ({ one }) => ({
  request: one(approvalRequests, {
    fields: [approvalDecisions.requestId],
    references: [approvalRequests.id],
  }),
}));

export const reviewAssignmentRelations = relations(reviewAssignments, ({ one }) => ({
  request: one(approvalRequests, {
    fields: [reviewAssignments.requestId],
    references: [approvalRequests.id],
  }),
}));

export const approvalHistoryRelations = relations(approvalHistory, ({ one }) => ({
  request: one(approvalRequests, {
    fields: [approvalHistory.requestId],
    references: [approvalRequests.id],
  }),
  policy: one(approvalPolicies, {
    fields: [approvalHistory.policyId],
    references: [approvalPolicies.id],
  }),
}));
```

---

## Code Examples

### 1. Submit an Action for Approval

```typescript
import { createHITLService } from '@mcv/agentic-os/hitl';
import { createSupabaseClient } from '@mcv/supabase';
import { createEventProducer } from '@mcv/agentic-os/hitl/events';

// ── Initialize the HITL service ──────────────────────────────

const supabase = createSupabaseClient();
const producer = await createEventProducer({ brokers: ['localhost:9092'] });

const hitl = createHITLService({
  supabase,
  eventProducer: producer,
  tenantId: 'tenant_abc123',
  defaultSlaMs: 4 * 60 * 60 * 1000, // 4 hours
  enableAutoApproval: true,
  globalConfidenceFloor: 0.5,
});

await hitl.start();

// ── Submit an email-sending action for approval ──────────────

const request = await hitl.submit({
  actionType: 'send_email',
  title: 'Send follow-up email to client',
  description: [
    'Agent wants to send a follow-up email to john@acme.com',
    'regarding the Q4 proposal discussion from last week.',
    'Email contains pricing information.',
  ].join(' '),
  payload: {
    to: 'john@acme.com',
    subject: 'Re: Q4 Proposal — Updated Pricing',
    body: 'Hi John, following up on our discussion...',
    cc: ['manager@ourcompany.com'],
    attachments: ['q4-proposal-v2.pdf'],
  },
  confidence: 0.82,
  agentId: 'scout_email_drafter',
  pipelineId: 'pipeline_xyz',
  stepId: 'draft_and_send',
  tags: ['email', 'client-communication', 'pricing'],
  metadata: {
    clientId: 'acme_corp',
    dealValue: 250_000,
    previousInteractions: 12,
  },
});

console.log(`Request ${request.id} created with status: ${request.status}`);
// → "Request abc-123 created with status: queued"
// (or "auto_approved" if policy allows)

// ── Check the result ─────────────────────────────────────────

const updated = await hitl.get(request.id);
if (updated?.status === 'auto_approved') {
  console.log('Auto-approved! Agent can proceed.');
} else if (updated?.status === 'queued') {
  console.log(`Queued for review. SLA due at: ${updated.slaDueAt}`);
}
```

### 2. Configure Approval Policies

```typescript
// ── Policy: Auto-approve low-risk emails from trusted agents ─

const autoApproveEmails = await hitl.createPolicy({
  name: 'Auto-approve routine emails',
  description: 'Emails with high confidence from trusted agents are auto-approved',
  enabled: true,
  priority: 10, // Lower = evaluated first
  conditions: [
    { field: 'confidence', operator: 'greater_than_or_equal', value: 0.90 },
  ],
  action: {
    type: 'auto_approve',
    message: 'Auto-approved: high confidence routine email',
  },
  actionTypes: ['send_email'],
  minimumRiskLevel: null, // applies to any risk level
  minimumValueCents: null,
  confidenceRange: { min: 0.90, max: 1.0 },
});

// ── Policy: Require manager approval for payments over $1000 ─

const largePaymentPolicy = await hitl.createPolicy({
  name: 'Large payment review',
  description: 'Payments over $1,000 require manager approval',
  enabled: true,
  priority: 5,
  conditions: [
    { field: 'monetaryValueCents', operator: 'greater_than', value: 100_000 },
  ],
  action: {
    type: 'require_approval',
    approverRoleIds: ['role_finance_manager'],
    slaMs: 2 * 60 * 60 * 1000, // 2 hours
    priority: 'high',
  },
  actionTypes: ['make_payment', 'initiate_transfer'],
  minimumRiskLevel: null,
  minimumValueCents: 100_000, // $1,000.00
  confidenceRange: null,
});

// ── Policy: Block all deployments below 0.7 confidence ───────

const blockUncertainDeploys = await hitl.createPolicy({
  name: 'Block uncertain deployments',
  description: 'Deployments with confidence below 0.7 are blocked entirely',
  enabled: true,
  priority: 1, // Highest priority — evaluated first
  conditions: [
    { field: 'confidence', operator: 'less_than', value: 0.70 },
  ],
  action: {
    type: 'block',
    message: 'Deployment blocked: agent confidence too low. Requires manual initiation.',
  },
  actionTypes: ['deploy_production', 'deploy_staging'],
  minimumRiskLevel: null,
  minimumValueCents: null,
  confidenceRange: { min: 0, max: 0.70 },
});

// ── Policy: Critical actions require dual approval ───────────

const dualApprovalPolicy = await hitl.createPolicy({
  name: 'Dual approval for critical actions',
  description: 'Critical-risk actions require sign-off from two separate approvers',
  enabled: true,
  priority: 2,
  conditions: [
    { field: 'riskLevel', operator: 'equals', value: 'critical' },
  ],
  action: {
    type: 'require_multi_approval',
    requiredApprovers: 2,
    approverRoleIds: ['role_senior_reviewer', 'role_admin'],
    slaMs: 1 * 60 * 60 * 1000, // 1 hour — critical = fast SLA
    priority: 'critical',
  },
  actionTypes: null, // applies to ALL action types
  minimumRiskLevel: 'critical',
  minimumValueCents: null,
  confidenceRange: null,
});

// ── List all active policies ─────────────────────────────────

const policies = await hitl.listPolicies({ enabled: true });
console.log(`${policies.length} active policies:`);
for (const p of policies) {
  console.log(`  [${p.priority}] ${p.name} → ${p.action.type}`);
}
// Output:
//   [1] Block uncertain deployments → block
//   [2] Dual approval for critical actions → require_multi_approval
//   [5] Large payment review → require_approval
//   [10] Auto-approve routine emails → auto_approve
```

### 3. Process Review Queue & Make Decisions

```typescript
// ── Get queue statistics ─────────────────────────────────────

const stats = await hitl.getQueueStats();
console.log(`Queue overview:
  Pending: ${stats.totalPending}
  By priority: ${JSON.stringify(stats.byPriority)}
  SLA compliance: ${(stats.slaComplianceRate * 100).toFixed(1)}%
  Avg decision time: ${(stats.avgDecisionTimeMs / 1000 / 60).toFixed(1)} min
  Active SLA breaches: ${stats.activeSlaBreaches}
`);

// ── Get the review queue ─────────────────────────────────────

const queue = await hitl.getQueue();
console.log(`${queue.totalItems} items in queue (${queue.slaBreachedItems} SLA breached)`);

// ── Assign a reviewer to the next urgent item ────────────────

const urgentItems = await hitl.list({
  status: ['queued'],
  priority: ['urgent', 'critical'],
  orderBy: 'slaDueAt',
  orderDir: 'asc',
  pageSize: 1,
});

if (urgentItems.data.length > 0) {
  const item = urgentItems.data[0];
  const assignment = await hitl.assignReviewer(item.id, 'user_reviewer_001');
  console.log(`Assigned ${item.title} to ${assignment.reviewerName}`);
}

// ── Approve a request with reasoning ─────────────────────────

const decision = await hitl.approve('request_abc123', {
  reason: 'Email content looks appropriate. Pricing matches the approved quote from last week.',
  reasonCode: 'content_verified',
  reasonVisibleToAgent: true,
  conditions: ['Remove the CC to manager — client prefers direct communication'],
  modifiedPayload: {
    // Reviewer can adjust the payload before approving
    to: 'john@acme.com',
    subject: 'Re: Q4 Proposal — Updated Pricing',
    body: 'Hi John, following up on our discussion...',
    cc: [], // Removed CC per reviewer decision
    attachments: ['q4-proposal-v2.pdf'],
  },
});

console.log(`Decision: ${decision.type} by ${decision.reviewerName}`);
console.log(`Review took ${(decision.reviewDurationMs / 1000).toFixed(0)}s`);

// ── Reject a request ─────────────────────────────────────────

const rejection = await hitl.reject('request_def456', {
  reason: 'Payment amount exceeds the approved budget for this quarter. Need finance VP sign-off.',
  reasonCode: 'budget_exceeded',
  reasonVisibleToAgent: true,
});

console.log(`Rejected: ${rejection.reason.text}`);
```

### 4. Batch Approve Multiple Requests

```typescript
// ── Get all low-risk pending emails ──────────────────────────

const lowRiskEmails = await hitl.list({
  status: ['queued', 'assigned'],
  actionType: ['send_email'],
  riskLevel: ['low'],
  orderBy: 'createdAt',
  orderDir: 'asc',
  pageSize: 50,
});

console.log(`Found ${lowRiskEmails.data.length} low-risk emails pending review`);

// ── Batch approve them all ───────────────────────────────────

if (lowRiskEmails.data.length > 0) {
  const result = await hitl.batchDecide({
    requestIds: lowRiskEmails.data.map(r => r.id),
    type: 'approved',
    reason: 'Batch approved: low-risk routine emails from trusted agents',
    reasonCode: 'batch_routine_approval',
    skipInvalid: true, // Skip any that have already been decided
  });

  console.log(`Batch result:
    Total: ${result.total}
    Succeeded: ${result.succeeded}
    Failed: ${result.failed}
    Skipped: ${result.skipped}
    Batch ID: ${result.batchId}
  `);

  // Check for any failures
  const failures = result.results.filter(r => !r.success);
  if (failures.length > 0) {
    console.warn('Some requests failed:');
    for (const f of failures) {
      console.warn(`  ${f.requestId}: ${f.error}`);
    }
  }
}

// ── Batch reject suspicious requests ─────────────────────────

const suspiciousRequests = await hitl.list({
  status: ['queued'],
  tags: ['flagged', 'suspicious'],
  pageSize: 20,
});

if (suspiciousRequests.data.length > 0) {
  const rejectResult = await hitl.batchDecide({
    requestIds: suspiciousRequests.data.map(r => r.id),
    type: 'rejected',
    reason: 'Batch rejected: flagged as suspicious by security review',
    reasonCode: 'security_review_rejected',
    skipInvalid: false, // Fail the whole batch if any individual fails
  });

  console.log(`Rejected ${rejectResult.succeeded} suspicious requests`);
}
```

### 5. Escalation Flow

```typescript
// ── Create escalation rules ──────────────────────────────────

// Rule 1: Escalate to senior reviewer if SLA breached
const slaRule = await hitl.createEscalationRule({
  name: 'SLA breach escalation',
  description: 'Escalate to senior reviewer when SLA is breached',
  enabled: true,
  trigger: {
    type: 'sla_breach',
    threshold: 1, // After 1 SLA breach (i.e., immediately on breach)
    timeWindowMs: 0,
  },
  targets: [
    {
      type: 'role',
      targetId: 'role_senior_reviewer',
      notificationChannels: ['slack', 'email'],
      autoAssign: true,
    },
    {
      type: 'manager',
      targetId: 'role_team_lead',
      notificationChannels: ['push', 'slack', 'email'],
      autoAssign: false,
    },
  ],
  maxEscalations: 3,
  cooldownMs: 15 * 60 * 1000, // 15 minutes between escalation levels
  actionTypes: null, // All action types
});

// Rule 2: Auto-escalate low-confidence submissions
const confidenceRule = await hitl.createEscalationRule({
  name: 'Low confidence auto-escalation',
  description: 'Immediately escalate to human when agent confidence is very low',
  enabled: true,
  trigger: {
    type: 'confidence_below',
    threshold: 0.40,
  },
  targets: [
    {
      type: 'on_call',
      targetId: 'oncall_schedule_primary',
      notificationChannels: ['push', 'slack'],
      autoAssign: true,
    },
  ],
  maxEscalations: 1,
  cooldownMs: 0,
  actionTypes: null,
});

// Rule 3: Flag agent for review after repeated rejections
const rejectionRule = await hitl.createEscalationRule({
  name: 'Repeated rejection flag',
  description: 'Alert admin if an agent gets 5+ rejections in 24 hours',
  enabled: true,
  trigger: {
    type: 'repeated_rejection',
    threshold: 5,
    timeWindowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  targets: [
    {
      type: 'role',
      targetId: 'role_admin',
      notificationChannels: ['email', 'slack'],
      autoAssign: false,
    },
    {
      type: 'external_webhook',
      targetId: 'https://hooks.ourcompany.com/agent-review',
      notificationChannels: [],
      autoAssign: false,
    },
  ],
  maxEscalations: 1,
  cooldownMs: 4 * 60 * 60 * 1000, // 4 hours — don't spam
  actionTypes: null,
});

// Rule 4: Escalate unassigned high-priority requests
const unassignedRule = await hitl.createEscalationRule({
  name: 'Unassigned urgent escalation',
  description: 'Escalate urgent/critical requests that sit unassigned for 15 minutes',
  enabled: true,
  trigger: {
    type: 'unassigned_timeout',
    threshold: 1,
    timeWindowMs: 15 * 60 * 1000, // 15 minutes
    conditions: [
      { field: 'priority', operator: 'in', value: ['urgent', 'critical'] },
    ],
  },
  targets: [
    {
      type: 'on_call',
      targetId: 'oncall_schedule_primary',
      notificationChannels: ['push', 'sms'],
      autoAssign: true,
    },
  ],
  maxEscalations: 2,
  cooldownMs: 10 * 60 * 1000,
  actionTypes: null,
});

console.log('Escalation rules configured:');
const rules = await hitl.listEscalationRules();
for (const r of rules) {
  console.log(`  • ${r.name} (${r.trigger.type}) → ${r.targets.length} target(s)`);
}
```

### 6. Delegation & Trust Management

```typescript
// ── Delegate approval authority ──────────────────────────────

// Manager going on vacation — delegate to team lead
const delegation = await hitl.delegate({
  delegatorId: 'user_manager_001',
  delegateId: 'user_team_lead_002',
  scope: {
    actionTypes: ['send_email', 'make_payment'],
    maxRiskLevel: 'high', // Can approve up to high risk (not critical)
    maxValueCents: 500_000, // Up to $5,000
    maxApprovals: null, // Unlimited during delegation period
  },
  reason: 'PTO coverage — Feb 10-17, 2026',
  activeFrom: new Date('2026-02-10T00:00:00Z'),
  expiresAt: new Date('2026-02-17T23:59:59Z'),
});

console.log(`Delegation granted: ${delegation.id}`);

// ── Check if a user has delegated authority ──────────────────

const canApprovePayment = await hitl.checkDelegation(
  'user_team_lead_002',
  'make_payment',
);
console.log(`Team lead can approve payments: ${canApprovePayment}`);

// ── Manage agent trust scores ────────────────────────────────

// Get an agent's trust profile
const trust = await hitl.getTrustScore('scout_email_drafter');
console.log(`Agent trust profile:
  Overall trust: ${(trust.trustScore * 100).toFixed(1)}%
  Total submissions: ${trust.totalSubmissions}
  Approval rate: ${(trust.approvalRate * 100).toFixed(1)}%
  Trend: ${trust.trend > 0 ? '↑ improving' : '↓ declining'}
`);

// Provide feedback after action execution
await hitl.updateTrustScore('scout_email_drafter', {
  requestId: 'request_abc123',
  outcome: 'success',
  impact: 0.02, // Slight positive trust bump
  notes: 'Email was well-received, client responded positively',
});

// ── Configure per-action confidence thresholds ───────────────

await hitl.setConfidenceThreshold({
  actionType: 'make_payment',
  agentId: null, // Applies to all agents
  reviewRequiredBelow: 0.85, // Payments need higher confidence
  autoApproveAbove: 0.98,    // Very high bar for auto-approve
  blockBelow: 0.40,          // Block uncertain payment attempts
});

await hitl.setConfidenceThreshold({
  actionType: 'send_email',
  agentId: 'scout_email_drafter', // Specific to this agent
  reviewRequiredBelow: 0.70, // Lower bar — trusted email agent
  autoApproveAbove: 0.90,
  blockBelow: 0.20,
});
```

### 7. Integration with Queen Orchestrator

```typescript
import { createQueenPipeline } from '@mcv/agentic-os/queen';
import { createHITLGate } from '@mcv/agentic-os/hitl';

// ── Define a pipeline with HITL gates ────────────────────────

const pipeline = createQueenPipeline({
  id: 'client_outreach',
  name: 'Client Outreach Workflow',
  steps: [
    {
      id: 'research',
      type: 'scout',
      scoutId: 'scout_researcher',
      config: { query: 'research {clientName} recent news' },
    },
    {
      id: 'draft_email',
      type: 'scout',
      scoutId: 'scout_email_drafter',
      config: { template: 'outreach_followup' },
      dependsOn: ['research'],
    },
    {
      // HITL gate — pipeline pauses here until approved
      id: 'approve_email',
      type: 'hitl_gate',
      config: createHITLGate({
        actionType: 'send_email',
        titleTemplate: 'Approve outreach email to {{clientName}}',
        descriptionTemplate: 'Review the drafted email before sending to {{clientName}}',
        payloadFrom: 'draft_email.output', // Pull payload from previous step's output
        confidenceFrom: 'draft_email.confidence',
        tags: ['outreach', 'automated'],
        // If auto-approved, skip the gate entirely
        onAutoApprove: 'continue',
        // If rejected, abort the pipeline
        onReject: 'abort',
        // If changes requested, re-run draft step with feedback
        onChangesRequested: {
          action: 'retry_step',
          stepId: 'draft_email',
          injectFeedback: true,
        },
        // Timeout: if no decision in 8 hours, cancel
        timeoutMs: 8 * 60 * 60 * 1000,
        onTimeout: 'cancel',
      }),
      dependsOn: ['draft_email'],
    },
    {
      id: 'send_email',
      type: 'scout',
      scoutId: 'scout_email_sender',
      config: { useApprovedPayload: true },
      dependsOn: ['approve_email'],
    },
    {
      id: 'log_crm',
      type: 'scout',
      scoutId: 'scout_crm_logger',
      config: { action: 'log_interaction' },
      dependsOn: ['send_email'],
    },
  ],
});

// ── Execute the pipeline ─────────────────────────────────────

const execution = await pipeline.execute({
  inputs: { clientName: 'Acme Corp', clientEmail: 'john@acme.com' },
});

// Pipeline runs steps 1-2, then pauses at the HITL gate
console.log(`Pipeline ${execution.id} status: ${execution.status}`);
// → "Pipeline pipe_123 status: waiting_for_approval"

// ── Listen for pipeline completion ───────────────────────────

execution.on('completed', (result) => {
  console.log('Pipeline completed successfully!');
  console.log(`Email sent to: ${result.steps.send_email.output.to}`);
});

execution.on('aborted', (reason) => {
  console.log(`Pipeline aborted: ${reason}`);
});

execution.on('hitl_decision', (event) => {
  console.log(`HITL decision for step ${event.stepId}: ${event.decision.type}`);
  if (event.decision.modifiedPayload) {
    console.log('Reviewer modified the payload — using updated version');
  }
});
```

### 8. Real-Time Notifications Configuration

```typescript
// ── Configure Slack notifications ────────────────────────────

await hitl.configureNotification({
  type: 'slack',
  name: 'Engineering approvals channel',
  enabled: true,
  config: {
    webhookUrl: process.env.SLACK_HITL_WEBHOOK_URL,
    channel: '#agent-approvals',
    username: 'HITL Bot',
    iconEmoji: ':robot_face:',
    // Custom Slack block template
    template: 'approval_request_rich',
  },
  events: [
    'request_queued',
    'request_escalated',
    'sla_breach',
  ],
  minimumPriority: 'normal',
  quietHours: {
    enabled: true,
    startHour: 22, // 10 PM
    endHour: 7,    // 7 AM
    timezone: 'America/Toronto',
  },
});

// ── Configure push notifications for urgent items ────────────

await hitl.configureNotification({
  type: 'push',
  name: 'Urgent mobile push',
  enabled: true,
  config: {
    provider: 'fcm', // Firebase Cloud Messaging
    serviceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH,
    // Topic-based delivery for approver role
    topic: 'hitl_urgent_approvals',
  },
  events: [
    'request_escalated',
    'sla_breach',
  ],
  minimumPriority: 'urgent', // Only urgent and critical
  quietHours: null, // No quiet hours for urgent
});

// ── Configure webhook for external systems ───────────────────

await hitl.configureNotification({
  type: 'webhook',
  name: 'PagerDuty integration',
  enabled: true,
  config: {
    url: 'https://events.pagerduty.com/v2/enqueue',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    authToken: process.env.PAGERDUTY_ROUTING_KEY,
    retryCount: 3,
    retryDelayMs: 5000,
    timeoutMs: 10_000,
  },
  events: ['sla_breach'],
  minimumPriority: 'critical',
  quietHours: null,
});

// ── Configure email digest ───────────────────────────────────

await hitl.configureNotification({
  type: 'email',
  name: 'Daily approval digest',
  enabled: true,
  config: {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    fromAddress: 'hitl@yourcompany.com',
    fromName: 'HITL System',
    templateId: 'tmpl_approval_digest',
    // Batch notifications into a digest
    digestMode: true,
    digestIntervalMs: 30 * 60 * 1000, // 30 min digest batches
  },
  events: [
    'request_queued',
    'request_assigned',
    'sla_breach',
  ],
  minimumPriority: 'low',
  quietHours: {
    enabled: true,
    startHour: 20,
    endHour: 8,
    timezone: 'America/Toronto',
  },
});
```

### 9. Audit Trail & Compliance

```typescript
// ── Query the audit trail ────────────────────────────────────

const trail = await hitl.getAuditTrail({
  requestId: 'request_abc123',
  page: 1,
  pageSize: 50,
});

console.log(`Audit trail for request_abc123 (${trail.total} entries):`);
for (const entry of trail.data) {
  console.log(`  [${entry.createdAt.toISOString()}] ${entry.action}`);
  console.log(`    by ${entry.actorName} (${entry.actorType})`);
  console.log(`    ${entry.description}`);
}

// Example output:
// [2026-02-08T10:00:00Z] request_submitted
//   by scout_email_drafter (agent)
//   Agent submitted email action for approval (confidence: 0.82)
// [2026-02-08T10:00:01Z] request_queued
//   by system (system)
//   Request queued — matched policy "Large payment review"
// [2026-02-08T10:05:30Z] request_assigned
//   by system (system)
//   Assigned to reviewer Jane Smith
// [2026-02-08T10:05:35Z] request_viewed
//   by Jane Smith (user)
//   Reviewer opened request for review
// [2026-02-08T10:12:15Z] request_approved
//   by Jane Smith (user)
//   Approved with modifications — removed CC recipient

// ── Export audit log for compliance ──────────────────────────

const exportStream = await hitl.exportAuditLog(
  {
    createdAfter: new Date('2026-01-01'),
    createdBefore: new Date('2026-02-01'),
  },
  'csv',
);

// Stream to file
const fs = await import('fs');
const writeStream = fs.createWriteStream('/reports/hitl-audit-jan-2026.csv');
exportStream.pipe(writeStream);

writeStream.on('finish', () => {
  console.log('Audit export complete');
});

// ── Query by actor ───────────────────────────────────────────

const userActions = await hitl.getAuditTrail({
  actorId: 'user_reviewer_001',
  action: ['request_approved', 'request_rejected'],
  createdAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
});

console.log(`Reviewer actions (last 7 days): ${userActions.total}`);
const approvals = userActions.data.filter(e => e.action === 'request_approved').length;
const rejections = userActions.data.filter(e => e.action === 'request_rejected').length;
console.log(`  Approvals: ${approvals}, Rejections: ${rejections}`);
```

### 10. Redpanda Event Streaming

```typescript
import { HITLEventConsumer, HITLEventProducer } from '@mcv/agentic-os/hitl';

// ── Produce events (done internally by HITLService) ──────────

const producer = new HITLEventProducer({
  brokers: [process.env.REDPANDA_BROKER!],
  topic: 'hitl.events',
  clientId: 'hitl-service',
});

await producer.connect();

// Events are produced automatically by the service, but you can also emit custom events:
await producer.emit({
  type: 'request_submitted',
  tenantId: 'tenant_abc123',
  requestId: 'request_xyz',
  timestamp: new Date(),
  payload: {
    actionType: 'send_email',
    agentId: 'scout_email_drafter',
    confidence: 0.82,
    riskLevel: 'medium',
  },
});

// ── Consume events (for building dashboards, integrations) ───

const consumer = new HITLEventConsumer({
  brokers: [process.env.REDPANDA_BROKER!],
  topic: 'hitl.events',
  groupId: 'hitl-dashboard',
  clientId: 'hitl-dashboard-consumer',
});

await consumer.connect();

consumer.on('request_submitted', async (event) => {
  console.log(`New approval request: ${event.requestId}`);
  // Update real-time dashboard
  await dashboard.addPendingRequest(event);
});

consumer.on('request_approved', async (event) => {
  console.log(`Request approved: ${event.requestId}`);
  // Notify the queen orchestrator to resume the pipeline
  await queen.resumePipeline(event.payload.pipelineId, {
    decision: 'approved',
    modifiedPayload: event.payload.modifiedPayload,
  });
});

consumer.on('request_rejected', async (event) => {
  console.log(`Request rejected: ${event.requestId}`);
  await queen.abortPipeline(event.payload.pipelineId, {
    reason: event.payload.reason,
  });
});

consumer.on('sla_breach', async (event) => {
  console.log(`SLA BREACH: ${event.requestId}`);
  // Trigger PagerDuty, update metrics, etc.
  await metrics.increment('hitl.sla_breaches');
});

consumer.on('request_escalated', async (event) => {
  console.log(`Escalated: ${event.requestId} → level ${event.payload.escalationLevel}`);
});

// ── Event types emitted by HITL ──────────────────────────────

type HITLEventType =
  | 'request_submitted'
  | 'request_auto_approved'
  | 'request_queued'
  | 'request_assigned'
  | 'request_viewed'
  | 'request_approved'
  | 'request_rejected'
  | 'request_changes_requested'
  | 'request_cancelled'
  | 'request_expired'
  | 'request_executed'
  | 'request_aborted'
  | 'request_escalated'
  | 'request_reassigned'
  | 'sla_breach'
  | 'sla_warning'        // 80% of SLA elapsed
  | 'batch_decision'
  | 'policy_changed'
  | 'trust_score_changed'
  | 'delegation_changed';
```

---

## Error Codes

All hitl errors extend `HITLError` with a structured error code, HTTP-friendly status, and contextual details.

```typescript
import { HITLError } from '@mcv/agentic-os/hitl';

class HITLError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
}
```

| Code | Status | Description |
|------|--------|-------------|
| `HITL_REQUEST_NOT_FOUND` | 404 | Approval request with the given ID does not exist or is not accessible |
| `HITL_REQUEST_ALREADY_DECIDED` | 409 | Request has already been approved, rejected, or cancelled — cannot decide again |
| `HITL_REQUEST_NOT_DECIDABLE` | 409 | Request is in a state that cannot receive a decision (e.g., pending policy evaluation, expired) |
| `HITL_REQUEST_CANCELLED` | 410 | Request was cancelled before a decision was made |
| `HITL_REQUEST_EXPIRED` | 410 | Request expired due to SLA timeout with no escalation path |
| `HITL_POLICY_CONFLICT` | 409 | Policy name already exists for this tenant, or conflicting policy conditions detected |
| `HITL_POLICY_NOT_FOUND` | 404 | Approval policy with the given ID does not exist |
| `HITL_POLICY_BLOCK` | 403 | Action blocked by policy — agent confidence or action type is prohibited |
| `HITL_UNAUTHORIZED_REVIEWER` | 403 | User does not have the required role or delegation to approve this request |
| `HITL_DELEGATION_EXPIRED` | 403 | Delegation grant has expired or been revoked |
| `HITL_DELEGATION_SCOPE_EXCEEDED` | 403 | Action exceeds the scope of the delegation (risk level, value, or action type) |
| `HITL_DELEGATION_LIMIT_REACHED` | 403 | Delegation has reached its maximum number of approvals |
| `HITL_BATCH_TOO_LARGE` | 400 | Batch size exceeds the configured maximum (default: 100) |
| `HITL_BATCH_PARTIAL_FAILURE` | 207 | Some requests in the batch failed — check individual results |
| `HITL_CONFIDENCE_TOO_LOW` | 422 | Agent confidence is below the block threshold — action cannot proceed |
| `HITL_INVALID_CONFIDENCE` | 400 | Confidence score must be between 0.0 and 1.0 |
| `HITL_ESCALATION_LIMIT` | 429 | Maximum escalation levels reached for this request |
| `HITL_NOTIFICATION_FAILED` | 502 | Failed to deliver notification via configured channel |
| `HITL_QUEUE_ASSIGNMENT_CONFLICT` | 409 | Request is already assigned to another reviewer |
| `HITL_REVIEWER_OVERLOADED` | 429 | Reviewer has reached their maximum concurrent assignment limit |
| `HITL_AUDIT_EXPORT_TOO_LARGE` | 413 | Audit export would exceed maximum size — narrow the date range |
| `HITL_TENANT_MISMATCH` | 403 | Request belongs to a different tenant than the current session |
| `HITL_INVALID_POLICY_CONDITION` | 400 | Policy condition references an invalid field or uses an unsupported operator |
| `HITL_MULTI_APPROVAL_INCOMPLETE` | 202 | Approval recorded but additional approvers are still required |

---

## Security

### Authentication & Authorization

All hitl endpoints require authenticated sessions via Supabase Auth. Authorization is layered:

1. **Tenant isolation** — RLS policies ensure no cross-tenant data access. Every query is scoped to `tenant_id`.
2. **Role-based access** — Approver capabilities are gated by roles:
   - `hitl:viewer` — Can view approval requests and queue stats (read-only)
   - `hitl:reviewer` — Can be assigned to requests and make decisions
   - `hitl:manager` — Can configure policies, escalation rules, and delegations
   - `hitl:admin` — Full access including audit export and trust management
3. **Delegation checks** — Before processing a decision, hitl verifies the reviewer either has direct authority or a valid delegation grant that covers the request's action type, risk level, and monetary value.
4. **Agent identity** — Agent IDs are verified against the queen orchestrator's registry. Spoofed agent submissions are rejected.

### Data Protection

- **Payload encryption** — Sensitive payloads (payments, PII-containing emails) can be encrypted at rest using per-tenant encryption keys. Enable via `HITL_ENCRYPT_PAYLOADS=true`.
- **Audit immutability** — The `approval_history` table has no UPDATE or DELETE RLS policies. Once written, audit entries cannot be modified or removed through the application layer.
- **PII masking** — When exposing request details to non-assigned reviewers or in notifications, PII fields can be automatically masked based on configurable patterns.
- **Decision non-repudiation** — All decisions are cryptographically signed with the reviewer's session token hash, providing a non-repudiation trail.

### Rate Limiting

- **Submission rate** — Agents are limited to 100 submissions per minute per tenant (configurable via `HITL_AGENT_RATE_LIMIT`).
- **Decision rate** — Reviewers are limited to 60 decisions per minute to prevent automated batch abuse.
- **API rate limits** — Standard tRPC rate limiting applies (see `@mcv/api-gateway` config).

### Input Validation

- All inputs are validated via Zod schemas before processing
- Payload sizes are limited to 1MB by default (`HITL_MAX_PAYLOAD_SIZE`)
- SQL injection protection via Drizzle ORM parameterized queries
- XSS protection on rendered description/reason fields in the review UI
- Regex conditions in policies are validated and limited to prevent ReDoS

### Notification Security

- Webhook URLs are validated (HTTPS only, no private IP ranges)
- Slack/email tokens are stored encrypted in the notification_channels table
- Notification payloads are sanitized before delivery — no raw payload data in notifications by default
- Rate limiting on notification delivery to prevent amplification attacks

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HITL_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |
| `HITL_REDPANDA_BROKERS` | Yes | — | Comma-separated Redpanda broker addresses |
| `HITL_REDPANDA_TOPIC` | No | `hitl.events` | Redpanda topic for HITL events |
| `HITL_DEFAULT_SLA_MS` | No | `14400000` (4h) | Default SLA timeout in milliseconds |
| `HITL_SLA_WARNING_PERCENT` | No | `80` | Percentage of SLA elapsed before warning event |
| `HITL_ENABLE_AUTO_APPROVAL` | No | `true` | Whether auto-approval is enabled globally |
| `HITL_GLOBAL_CONFIDENCE_FLOOR` | No | `0.5` | Confidence below this always requires human review |
| `HITL_MAX_BATCH_SIZE` | No | `100` | Maximum number of requests in a batch operation |
| `HITL_MAX_PAYLOAD_SIZE` | No | `1048576` (1MB) | Maximum payload size in bytes |
| `HITL_AGENT_RATE_LIMIT` | No | `100` | Max submissions per minute per agent |
| `HITL_REVIEWER_RATE_LIMIT` | No | `60` | Max decisions per minute per reviewer |
| `HITL_ENCRYPT_PAYLOADS` | No | `false` | Enable at-rest encryption for sensitive payloads |
| `HITL_ENCRYPTION_KEY` | Cond. | — | Encryption key (required if `HITL_ENCRYPT_PAYLOADS=true`) |
| `HITL_ESCALATION_CHECK_INTERVAL_MS` | No | `60000` (1m) | How often to check for escalation triggers |
| `HITL_SLA_CHECK_INTERVAL_MS` | No | `30000` (30s) | How often to check for SLA breaches |
| `HITL_TRUST_SCORE_DECAY_RATE` | No | `0.001` | Daily trust score decay rate (encourages continued activity) |
| `HITL_TRUST_SCORE_INITIAL` | No | `0.50` | Initial trust score for new agents |
| `HITL_NOTIFICATION_RETRY_COUNT` | No | `3` | Number of retries for failed notifications |
| `HITL_NOTIFICATION_RETRY_DELAY_MS` | No | `5000` | Delay between notification retries |
| `HITL_LOG_LEVEL` | No | `info` | Logging level (debug, info, warn, error) |
| `HITL_DIGEST_INTERVAL_MS` | No | `1800000` (30m) | Email digest batching interval |
| `SLACK_HITL_WEBHOOK_URL` | No | — | Slack webhook URL for notifications |
| `SENDGRID_API_KEY` | No | — | SendGrid API key for email notifications |
| `FCM_SERVICE_ACCOUNT_PATH` | No | — | Path to Firebase Cloud Messaging service account JSON |
| `PAGERDUTY_ROUTING_KEY` | No | — | PagerDuty routing key for critical escalations |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/supabase` | Database client, RLS context, Auth |
| `@mcv/agentic-os/queen` | Pipeline integration — pause/resume on approval gates |
| `@mcv/agentic-os/scouts` | Agent identity verification, confidence scores |
| `@mcv/trpc` | API router and type-safe endpoints |
| `@mcv/events` | Redpanda client wrapper for event streaming |
| `@mcv/auth` | Session management, role verification |
| `@mcv/crypto` | Payload encryption, decision signing |
| `@mcv/notifications` | Multi-channel notification delivery |
| `@mcv/logging` | Structured logging |
| `@mcv/metrics` | Prometheus metrics for queue stats, SLA tracking |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.x` | Database ORM and schema definitions |
| `zod` | `^3.22.x` | Input validation for all request/policy schemas |
| `kafkajs` | `^2.2.x` | Redpanda/Kafka client for event streaming |
| `cron` | `^3.1.x` | Scheduled SLA/escalation checks |
| `nanoid` | `^5.0.x` | Short ID generation for batch IDs |
| `date-fns` | `^3.x` | Date arithmetic for SLA calculations |
| `pino` | `^8.x` | Structured logging |

---

## Testing

### Unit Tests

```bash
pnpm test packages/agentic-os/hitl
```

Key unit test areas:

- **Policy evaluation engine** — Tests all condition operators, priority ordering, edge cases (no matching policy falls to default, overlapping conditions, disabled policies skipped)
- **State machine transitions** — Verifies all valid state transitions and rejects invalid ones (e.g., cannot approve an already-rejected request)
- **Confidence scoring** — Tests threshold evaluation, boundary conditions (exactly at threshold), and the interaction between global floor and per-action thresholds
- **Trust score calculations** — Verifies trust score updates, decay rates, per-action-type breakdown, and history tracking
- **Delegation validation** — Tests scope checking (action type, risk level, monetary value), expiration, revocation, and approval count limits
- **Batch decision logic** — Tests partial failures, skipInvalid behavior, atomicity guarantees, and batch size limits
- **SLA calculations** — Tests SLA computation from policies, custom overrides, breach detection, and warning thresholds

### Integration Tests

```bash
pnpm test:integration packages/agentic-os/hitl
```

Integration tests run against a real Supabase instance (local via `supabase start`) and a Redpanda container:

- **Full approval lifecycle** — Submit → queue → assign → review → decide → execute, verifying database state at each step
- **Multi-tenant isolation** — Verifies that tenant A cannot see or interact with tenant B's requests, policies, or audit trail
- **Escalation engine** — Tests SLA breach detection, escalation target notification, and multi-level escalation with cooldowns
- **Queen pipeline integration** — Tests that pipeline correctly pauses at HITL gates, resumes on approval, and aborts on rejection
- **Notification delivery** — Tests Slack webhook, email (via mock SMTP), and push notification delivery
- **Concurrent access** — Tests that simultaneous reviewers don't conflict, and that batch operations handle race conditions

### Load Tests

```bash
pnpm test:load packages/agentic-os/hitl
```

- **Throughput** — Target: 1000 submissions/second per tenant with < 100ms p99 latency
- **Queue depth** — Tests behavior with 10,000+ pending items — pagination, stats accuracy, assignment performance
- **Notification fanout** — Tests delivery performance when a single event triggers 50+ notifications across channels

### Test Fixtures

```typescript
import { createTestHITLService, createTestRequest, createTestPolicy } from '@mcv/agentic-os/hitl/testing';

// Quick setup for tests
const { hitl, cleanup } = await createTestHITLService({
  tenantId: 'test_tenant',
  // Uses in-memory event store instead of Redpanda
  useInMemoryEvents: true,
});

// Create a test request with sensible defaults
const request = await createTestRequest(hitl, {
  actionType: 'send_email',
  confidence: 0.85,
  // All other fields have reasonable defaults
});

// Create a test policy
const policy = await createTestPolicy(hitl, {
  name: 'Test auto-approve',
  action: { type: 'auto_approve' },
  conditions: [{ field: 'confidence', operator: 'greater_than', value: 0.90 }],
});

// Cleanup after test
await cleanup();
```

### Mocking Guidance

For unit tests that don't need database access:

```typescript
import { createMockHITLService } from '@mcv/agentic-os/hitl/testing';
import { vi } from 'vitest';

const mockHitl = createMockHITLService();

// Override specific methods
mockHitl.submit.mockResolvedValue({
  id: 'mock_request_1',
  status: 'queued',
  // ... other fields
});

// Verify calls
expect(mockHitl.submit).toHaveBeenCalledWith(
  expect.objectContaining({
    actionType: 'send_email',
    confidence: expect.any(Number),
  }),
);
```

---

## Performance Considerations

### Queue Optimization

The approval queue is the hottest path in hitl. Key optimizations:

- **Indexed queries** — All queue queries use composite indexes on `(tenant_id, status)` with additional indexes on `priority`, `sla_due_at`, and `assigned_reviewer_id`
- **Materialized stats** — Queue statistics are computed incrementally via Redpanda event consumers, not via expensive aggregate queries. Stats are cached with a 5-second TTL.
- **Pagination** — All list endpoints use cursor-based pagination for consistent performance regardless of queue depth.
- **Connection pooling** — Supabase connection pool is configured with a dedicated pool for hitl queries (default: 10 connections).

### Event Streaming

- **Partitioning** — Redpanda topic is partitioned by `tenant_id` to ensure ordered processing per tenant while allowing parallel processing across tenants.
- **Consumer groups** — Notification consumers use separate consumer groups so that Slack, email, and push notifications are processed independently.
- **Backpressure** — If a notification channel is slow, backpressure prevents event loss — events are buffered in Redpanda until the consumer catches up.

### SLA & Escalation Checks

- **Polling interval** — SLA checks run every 30 seconds by default. This is a balance between timeliness and database load.
- **Batch processing** — Each SLA check processes up to 500 pending requests per batch, using a single query with `WHERE sla_due_at < NOW() AND sla_breached = false`.
- **Escalation deduplication** — Escalation events include a deduplication key to prevent duplicate escalations during clock skew or retry scenarios.

---

## Metrics

hitl exposes Prometheus-compatible metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `hitl_requests_submitted_total` | Counter | Total approval requests submitted |
| `hitl_requests_decided_total` | Counter | Total decisions made (labels: type, auto) |
| `hitl_requests_pending` | Gauge | Current number of pending requests |
| `hitl_decision_duration_seconds` | Histogram | Time from submission to decision |
| `hitl_review_duration_seconds` | Histogram | Time from assignment to decision |
| `hitl_sla_breaches_total` | Counter | Total SLA breaches |
| `hitl_sla_compliance_ratio` | Gauge | Current SLA compliance rate |
| `hitl_escalations_total` | Counter | Total escalation events |
| `hitl_auto_approval_ratio` | Gauge | Ratio of auto-approved vs. total decided |
| `hitl_queue_depth` | Gauge | Current queue depth by priority |
| `hitl_notification_sent_total` | Counter | Notifications sent (labels: channel, event) |
| `hitl_notification_failed_total` | Counter | Failed notification deliveries |
| `hitl_batch_size` | Histogram | Size of batch decision operations |
| `hitl_trust_score_updates_total` | Counter | Trust score update events |
| `hitl_policy_evaluations_total` | Counter | Policy evaluations performed |

---

## Glossary

| Term | Definition |
|------|------------|
| **Approval Request** | A formal request from an agent to perform a side-effecting action, submitted for policy evaluation and potential human review |
| **Auto-Approval** | When a request meets all policy criteria (confidence, risk, trust) and is approved without human intervention |
| **Confidence Score** | A 0.0–1.0 value representing the agent's self-assessed certainty that its proposed action is correct |
| **Delegation** | Temporary transfer of approval authority from one user to another, with scoped limits |
| **Escalation** | The process of routing a request to a higher-authority reviewer when initial review doesn't happen within SLA or other trigger conditions are met |
| **HITL Gate** | A step in a queen pipeline that pauses execution until a human approval decision is rendered |
| **Policy** | A configurable rule that determines how approval requests of a given type/risk/value should be handled |
| **Review Queue** | The prioritized list of pending approval requests waiting for human review |
| **Risk Level** | A classification (low/medium/high/critical) assigned to requests based on policy evaluation |
| **SLA** | Service Level Agreement — the time window within which a request should receive a decision |
| **Trust Profile** | A per-agent record tracking historical approval rates and confidence calibration |
| **Trust Score** | A 0.0–1.0 value representing the system's confidence in an agent's judgment, based on historical decision outcomes |

---

*Last updated: 2026-02-08*
*Module version: 0.9.0*
*Schema version: 1*
