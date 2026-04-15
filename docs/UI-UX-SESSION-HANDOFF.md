# UI/UX Session Hand-off

This doc catalogs every UI deliverable from the multi-day UI/UX upgrade
push. It's the entry point for any future session continuing this work
(or a new contributor onboarding to the design system).

## TL;DR

- **34 primitives** in `src/components/ui/` (started at 18)
- **9 lazy-loaded enterprise detail dialogs** across Commerce, Compliance, Creator, Contact Center
- **Command Center** rebuilt as a live financial cockpit (12 widget surfaces, real data via `/api/commerce-metrics`)
- **Cross-surface navigation graph** wired (TopCustomers→CRM, Notification→source, palette→settings, venture chips→workspaces)
- **BulkActionBar pattern** load-bearing on 6 surfaces (Invoices, Tasks, CRM Contacts/Deals/Accounts)
- **Settings unified** — search across all sections, scope toggle (global/per-venture), inline API keys, registered settings discoverable from Command Palette
- **Tasks + CRM Deals** support HTML5 native drag-and-drop between status/stage columns
- **AuditLog** has CSV export + date-range filter (compliance-ready)
- **Foundation tokens**: elevation scale, z-index map, density modes, form-state, breakpoints, motion, high-contrast, colorblind palette, reduced-motion respect

## Primitive library — `src/components/ui/`

Always import from `'../components/ui'` (barrel export). 34 primitives:

**Layout & shell**
- `PageShell` — top-level view wrapper (auto-applies `slideUp` motion)
- `PageHeader` — title + icon + loading + refresh + action slot
- `SectionCard` — titled card with optional icon/action/footer
- `GlassCard` — neural/elevated/default variants
- `GridLayout` — responsive grid with col + gap props
- `Toolbar` — left/center/right slot toolbar (`sticky`, `dense` variants)
- `Tabs` — horizontal tab bar with counts

**Form controls**
- `Button` — primary/secondary/ghost/danger × sm/md/lg, `loading` spinner, `icon` slot
- `Input` — base text input
- `Select<T>` — keyboard-nav dropdown (used in modals/forms)
- `Combobox<T>` — searchable, virtualized
- `Switch` — labelled toggle (sm/md)
- `Toggle` + `ToggleGroup` — pressable button(s)
- `Slider` — value display, formatValue, min/max/step
- `DatePicker` — styled `<input type=date>` with min/max + clearable + dark color-scheme
- `ChipInput` — tag input (Enter/comma/Tab to commit, paste-split, dedupe, normalize, validate)
- `FormField` — label + hint + error wrapper

**Overlays**
- `Modal` — portal-based with focus trap + esc/backdrop close
- `Dialog` — Modal + header/body/footer composition; `ConfirmDialog` and `DialogActions` exports
- `Sheet` — bottom-sheet for mobile (or right drawer)
- `Tooltip` — auto-positioned, delay
- `Popover` — auto-positioned, click-outside, esc-close

**Feedback**
- `Toast` system (existing — `useToast` hook returns `{ toast(type, msg) }`)
- `EmptyState` — icon + title + description
- `Skeleton` — loading shimmer
- `Badge` — color, size, variant (solid/outline/dot)

**Data**
- `DataTable` — sortable, filterable, paginated table
- `TableToolbar` — toolbar + search + filters
- `Pagination` — page controls
- `FilterBuilder` — composable AND/OR query builder
- `BulkActionBar` — floating/inline bar for bulk row actions (see `BulkAction` type export)

**KPI**
- `StatCard` — icon + label + value + trend
- `KpiCard` — bigger, optional sparkline
- `WidgetContainer` — draggable widget shell

## Detail dialog catalog (all lazy-loaded via `lazyRetry`)

| Dialog | Module | Pattern blueprint for |
|---|---|---|
| `InvoiceDetailDialog` | `commerce/` | Line items + totals + timeline + payments |
| `LoanDetailDialog` | `commerce/` | Amortization schedule (real math) + repayment form |
| `CreditDetailDialog` | `commerce/` | Ledger table + Issue/Revoke/Transfer actions |
| `RoyaltyAgreementDetailDialog` | `creator/` | Splits editor with live 100% validation + distribution history + Tags chip input |
| `EscrowDetailDialog` | `creator/` | Milestones + release/dispute workflow + DatePicker for due dates |
| `FraudRuleDetailDialog` | `compliance/` | 6 trigger types + 4 actions + risk slider + recent hits + draft/dirty/save pattern |
| `NexusAlertDetailDialog` | `compliance/` | Threshold progress bars + registration deadline + status workflow |
| `DunningCampaignDetailDialog` | `compliance/` | Step editor (email/SMS/voice/letter) + active invocations + cron status (last/next run + Run Now) |
| `ConversationDetailDialog` | `contact-center/` | Unified SMS+Voice+note thread with reply bar |

All save handlers stub to `console.log` — wire to store mutations once
backend mutation APIs land. Most dialog onSave handlers accept the full
draft object, so wiring is one-liner per handler.

**Update (2026-04-15):** All 9 detail dialogs are now wired to stores +
toasts. Backing API surface is partial — see table below for what's
optimistic vs. server-persisted.

| Dialog | Wiring | Persistence |
|---|---|---|
| `InvoiceDetailDialog` | `useCommerceStore.sendInvoice` / `recordInvoicePayment` | server ✓ |
| `LoanDetailDialog` | `useCommerceStore.disburseLoan` / `recordRepayment` | server ✓ |
| `CreditDetailDialog` | `grantCredit` (raw fetch) | server ✓ |
| `ConversationDetailDialog` | `useTwilio.sendSms` / `makeCall` | server ✓ |
| `DunningCampaignDetailDialog` | `useComplianceStore.saveDunningCampaign` / `triggerDunningRun` | server ✓ |
| `RoyaltyAgreementDetailDialog` (new) | `useCreatorStore.createRoyaltyAgreement` | server ✓ |
| `RoyaltyAgreementDetailDialog` (update) | `useCreatorStore.updateRoyaltyAgreement` → POST `update-agreement` (top-level fields; splits stay non-editable, surfaced via warning toast) | server ✓ (partial) |
| `EscrowDetailDialog` (release/approve milestone) | `useCreatorStore.approveMilestone` + auto `releaseEscrow` when all approved | server ✓ |
| `EscrowDetailDialog` (save) | `useCreatorStore.updateEscrowAgreement` → POST `update-escrow` (amount/expires_at/notes; milestones via approve/dispute) | server ✓ (partial) |
| `EscrowDetailDialog` (dispute) | `useCreatorStore.disputeMilestone` → POST `dispute-milestone` (sets milestone.status='disputed', flips agreement.status='disputed', stashes reason in metadata) | server ✓ |
| `FraudRuleDetailDialog` (new) | `useComplianceStore.upsertFraudRule` → POST `create-fraud-rule` | server ✓ |
| `FraudRuleDetailDialog` (update) | POST `update-fraud-rule` (full or partial) | server ✓ |
| `FraudRuleDetailDialog` (toggle) | POST `update-fraud-rule` with `enabled` only — optimistic flip + rollback | server ✓ |
| `FraudRuleDetailDialog` (delete) | POST `delete-fraud-rule` — optimistic remove + restore on failure | server ✓ |
| `NexusAlertDetailDialog` (acknowledge/register/exempt) | `useComplianceStore.updateNexusStatus` | local (needs migration for `nexus_alert_status` column) |

**Invoice PDF download wired end-to-end (client-side).** `InvoiceDetailDialog`
"Download PDF" button now opens a print-ready HTML invoice in a new
window via `src/lib/invoice-print.ts` and auto-triggers the browser's
print dialog. Users save as PDF from there. Implementation uses a Blob
URL via `URL.createObjectURL` for proper document loading. The HTML
template includes line items, totals with tax/balance breakdown, payment
history, status pill, and brand-color accent — works offline and respects
venture branding when the brand prop is supplied. When a real
`/api/invoice-pdf` endpoint ships with server-side PDF generation and
signed download URLs, swap the call site without touching the dialog.

**Review moderation wired end-to-end.** `CommerceReviews` Approve/Reject
buttons call `useCommerceSurfaceStore.moderateReview` → POST
`moderate-review` (new action in `commerce-surface.ts`). The handler does
a soft moderation (status flip + `moderated_at` + `moderator_note`) so
rejected reviews stay queryable rather than getting deleted. Store
removes the row from the moderation queue and merges the updated row
into the approved-reviews list — no refetch needed.

**AssetTierGraph "Add asset manually" no longer console.logs.** Routes
the user to Settings → Integrations (the canonical asset onboarding
surface) with a toast that tells them where they're going. One less
button-that-does-nothing in the venture detail view.

**Native prompt() retired in 4 spots.** All in-app data entry now goes
through proper `Dialog` primitives:

- `CommerceCreditsView` Grant Credit (was 3 sequential `prompt()` calls
  for customer / amount / note → single Dialog with FormField + validation)
- `CommerceLoansView` row-level repayment (was a `prompt()` → routes the
  user into `LoanDetailDialog` which already has a proper amount input
  + payment history context)
- `CRMView` bulk Add Tag / Change Type / Change Account Type (was
  `window.prompt()` calls → unified `bulkPrompt` state + one Dialog
  that switches Input vs Select by mode; type changes get a colored-dot
  Select instead of free-text "must be one of these strings" validation)

**Dispute reason loop closed.** When a milestone is disputed via
`EscrowDetailDialog`, the reason now persists to `escrow_milestones.metadata`
server-side (see `dispute-milestone` action). On reopen, the dialog
renders an inline red-bordered banner under the disputed milestone showing
the reason + `timeAgo(disputed_at)`. Required adding `metadata` to the
canonical `EscrowMilestoneSchema` and threading it through `mapEscrowRow`
in the creator store.

**Bulk-action void:** `CommerceInvoicesView` "Void" bulk action wires
to `useCommerceStore.voidInvoice` → POST `void-invoice` (soft status
flip; full ledger reversal goes through `InvoiceEngine.voidInvoice`
when wired from server-side flows). Skips paid/already-voided
invoices server-side and reports counts in the toast.

**TopCustomers expand → real recent orders:** the inline expand panel
on `TopCustomersCard` now renders a `RecentOrdersList` sub-component
that fires `useCustomerRecentOrders(ventureId, customerId, 5)` only
when the row is expanded — fan-out across all 10 cards stays at zero
requests until a user expands one. Backed by new `list-customer-orders`
action on `/api/commerce`.

The "local" rows surface as `info`/`warning` toasts that explicitly call
out the missing endpoint, so users see the change reflected and know it's
not yet persisted.

## Command Center widget catalog — `src/components/command-center/`

| Widget | Data source | Notes |
|---|---|---|
| `SystemHealthCard` | Live ping of `/api/health` etc + `performance.memory` | Ping interval 30s; heap is Chrome-only |
| `AlertManagementPanel` | `useAttentionItems` + `useCommandCenter` snooze/resolve | Severity filters + clear-resolved counter |
| `VentureRollupGrid` | `useAllVentureMetrics` + `useAllVentureTimeseries` | 7 cards with sparkline + ±% trend + quick-jump chips (Commerce/CRM/Financials/Signals) |
| `CashflowMicroPanel` | `cashflow.inflow/outflow/net` from snapshot | Portfolio "river bar" + per-venture split |
| `OrderStatusGrid` | `orders.by_status` per venture | Mini-donut per active venture + fulfillment-rate badge |
| `CohortGrid` | `useCommerceCohorts` (action=cohort) | Heatmap by signup month, cyan-intensity scaling |
| `AgentActivityFeed` | `window.dispatchEvent(new CustomEvent('mcv:agent-event'))` | Loose-coupled event bus; persists last 50 to localStorage |
| `QuickActionsPalette` | `useCommandCenter.quickActions` | Drag-to-reorder, edit mode toggle |
| `TopCustomersCard` | `top_customers` aggregate from snapshots | Cross-venture dedupe by email; click to expand inline; double-click → CRM |

## Cross-surface navigation graph

| From | Action | To | Mechanism |
|---|---|---|---|
| TopCustomers card | Click row | CRM contact detail | `sessionStorage['mcv-crm-jumpto-email']` |
| Notification | Click | source view | `SOURCE_VIEW_MAP` (10 source→ViewId mappings) |
| CommandPalette | Type setting name | Settings (highlighted) | `?tab=&setting=` URL deep-link |
| VentureRollupCard | Quick-jump chip | Venture's commerce/CRM/financials/signals | `switchToVenture + setView` |
| Command Center → any view | Click | Direct navigation | Standard `setView` |

## Keyboard shortcuts (single source of truth: `App.tsx` line ~537)

| Keys | Action |
|---|---|
| `Cmd/Ctrl + K` | Command Palette |
| `Cmd/Ctrl + /` | Toggle Chat |
| `Cmd/Ctrl + N` | Quick Capture |
| `Cmd/Ctrl + \` | Toggle Split View |
| `Cmd/Ctrl + ,` | Open Settings (mac convention) |
| `Cmd/Ctrl + 1-8` | Jump to Global view |
| `Cmd/Ctrl + Shift + 1-9` | Switch Venture |
| `Alt + 1-3` | Workspace Preset |
| `Alt + ←/→` | History Back/Forward |
| `Esc` | Close overlays |

When adding a new shortcut, update **both**:
1. The handler in `App.tsx`
2. The `SHORTCUTS` array in `CommandPalette.tsx` (footer hints)
3. The `shortcuts` array in `SettingsView.tsx` (Shortcuts section)

## BulkActionBar usage pattern (proven on 6 surfaces)

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const actions: BulkAction[] = [
  { id: 'archive', label: 'Archive', icon: <Archive size={12} />, onRun: async (ids) => {…} },
  { id: 'delete', label: 'Delete', icon: <Trash2 size={12} />, danger: true, confirm: true, onRun: async (ids) => {…} },
];

// In the table header:
<input type="checkbox" indeterminate={…} checked={…} onChange={…} />

// In each row:
<input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggle(id)} />

// Mounted at the table footer or page bottom:
<BulkActionBar
  selectedIds={selectedIds}
  onClear={() => setSelectedIds([])}
  actions={actions}
  totalCount={visibleRows.length}
  onSelectAll={() => setSelectedIds(visibleRows.map((r) => r.id))}
  placement="floating"  // or "inline"
  label={(n) => `${n} item${n === 1 ? '' : 's'} selected`}
/>
```

Surfaces using it: Invoices, Tasks, CRM Contacts, CRM Deals, CRM Accounts.

## CSV export pattern (proven on 4 surfaces)

```tsx
const rows = items.filter((i) => selectedIds.includes(i.id))
  .map((i) => [i.field1, i.field2, …]
    .map((v) => `"${String(v).replace(/"/g, '""')}"`)  // RFC 4180 quote escape
    .join(','));
const csv = ['"Header1","Header2",…', ...rows].join('\n');
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `<surface>-export-${new Date().toISOString().slice(0, 10)}.csv`;
document.body.appendChild(a); a.click(); document.body.removeChild(a);
URL.revokeObjectURL(url);
```

Surfaces: Invoices, CRM Contacts, CRM Accounts, AuditLog.

## HTML5 drag-and-drop pattern (Tasks + CRM Deals)

```tsx
const [draggingId, setDraggingId] = useState<string | null>(null);
const [dropTarget, setDropTarget] = useState<string | null>(null);

// Card:
<div
  draggable
  onDragStart={(e) => { setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; }}
  onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
  className={isDragging ? 'card-dragging' : ''}
/>

// Column:
<div
  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget(colId); }}
  onDragLeave={(e) => { if (e.currentTarget === e.target) setDropTarget(null); }}
  onDrop={() => handleDrop(colId)}
  className={dropTarget === colId ? 'col-droptarget' : ''}
/>
```

## Settings registry — `src/lib/settings/registry.ts`

Every user-facing setting registered here becomes:
1. **Searchable** in the Settings global search bar
2. **Discoverable** from the Command Palette (`Cmd+K` → setting name)
3. **Deep-linkable** via `?tab=<section>&setting=<id>`
4. **Scopable** to global vs per-venture (resolved through `useVentureOverrides`)

When adding a new setting, register it here AND wire its UI in the
appropriate section function in `SettingsView.tsx`.

## Ventures + per-venture overrides

- `useGoogleWorkspaceStore` — Gmail labels / Calendar IDs / Drive folders / GA4 / Search Console (per-venture, persisted)
- `useVentureOverrides` — generic id-based override store (notifications, AI model, max tokens, TTS voice, 2FA, IP allowlist, SOC 2)
- `useLocalApiKeys` — local API key overrides (dev convenience only — security warning visible in UI)

## Snooze infrastructure (shared between Alerts + Notifications)

`useCommandCenter.snoozeAlert(id, hours)` writes to a persisted map.
`isAlertActive(id)` returns false until the snooze expires.
Used by `AlertManagementPanel` (Command Center) and `NotificationCenter`.

## What I skipped/deferred and why

| Surface | Why |
|---|---|
| `AegisChat.tsx` | 877 LOC + `@ts-nocheck` — active iteration territory |
| `MemoryView.tsx` (1111 LOC) | Active backend RAG churn — schema in flight |
| `KnowledgeHubView.tsx` (764 LOC) | Same as Memory |
| `CommerceFulfillment.tsx`, `CommerceOrders.tsx`, `CommerceCustomers.tsx`, `CommerceSubscriptions.tsx` | All `@ts-nocheck` — active commerce backend work |
| `CommsHub.tsx` | Pre-existing motion import errors (parallel session in flight) |
| `EpicDetailModal.tsx` (429 LOC) | Active epic-system iteration; audit notes in commit `269d071` |

## Branch context

We've been committing to `triangle-integration` (parallel session switched
mid-flight). Last UI commit on this branch was the 5-in-1 closeout. When
that branch merges to master, all UI work merges with it.

## Key build state (as of hand-off)

- `npx tsc --noEmit` → **EXIT 0** (clean) for every commit
- `npm run build` (full pipeline) currently blocked at `tsc -b` step by
  pre-existing parallel-session work-in-flight:
  - `packages/core-triangle/src/types.ts` — `erasableSyntaxOnly` config conflict
  - `packages/payments-sdk/src/processors/solana.ts` — BigNumber type collision
  - `src/views/CommsHub.tsx` — missing motion import
  - `src/views/Checkout.tsx` — `venture_id` vs `ventureId` mismatch
  - `src/components/ventures/AssetTierGraph.tsx` + `VentureSocialsPanel.tsx` — lucide icon renames
- None of these are UI/UX work. When they resolve, the build pipeline
  picks up everything cleanly via `lazyRetry` chunk hashing.

## Wire-up opportunities for the next session

The top-level "TODO connect this" items, ranked by user-value:

1. **Wire detail-dialog save handlers** to store mutations now that backend
   has shipped tables + realtime invalidation. One-liner per handler.
   Easiest first: `FraudRuleDetailDialog.onSave` → `useComplianceStore.upsertFraudRule`
2. **Connect `Run Now` for dunning** to the cron endpoint that landed in
   `adfe0c1`. Already POSTs to `/api/dunning-cron/run` — just verify
   the route name matches.
3. **TopCustomers expand → real recent orders** instead of synthesized AOV.
   Backend has order data per customer; just needs an endpoint
   `?customer_id=…` to return last N orders.
4. **Memory + Knowledge freshness indicators** once their schemas stabilize.
   Pattern: `last_indexed_at` field → `timeAgo()` → freshness pill.
5. **Notification snooze persistence to backend** — currently in localStorage
   only via `useCommandCenter`. For multi-device sync, the snoozed-until
   timestamps should be persisted to a `notifications.snoozed_until`
   column.

## Suggested next-session priorities

If the next session has 1 hour:
- Wire 1-2 save handlers end-to-end as a pattern (FraudRule first)
- Test the realtime sync loop (edit on one client → verify auto-update on another)

If the next session has 4 hours:
- All save handlers wired
- Memory + Knowledge freshness pass once stable
- Audit pass on remaining `@ts-nocheck` views and either add types or document why they're opt-out

If the next session has a full day:
- Above plus AegisChat polish (Tooltip, Switch, SectionCard swaps from the audit list)
- Build pipeline cleanup (the upstream blockers the parallel session has been carrying)
- E2E test of every detail dialog to catch any draft-pattern bugs

## Pattern compounding scoreboard

The patterns that have proven generic across multiple surfaces:

| Pattern | Surfaces using it |
|---|---|
| BulkActionBar | 6 (Invoices, Tasks, CRM Contacts/Deals/Accounts) |
| CSV export | 4 (Invoices, CRM Contacts, CRM Accounts, AuditLog) |
| HTML5 native DnD | 2 (Tasks, CRM Deals) |
| Lazy-loaded detail dialog with draft+save+dirty-check | 9 |
| Cross-surface navigation via sessionStorage handoff | 1 (TopCustomers→CRM) — pattern available for any widget→view jump |
| Snooze (id-based, persisted) | 2 (Alerts, Notifications) |
| Section-grouped search results | 1 (Settings — pattern available for any registry-backed search) |

When in doubt, copy the existing pattern. Don't introduce a new one
unless you have a clear reason — design system consistency compounds
the more you reuse.
