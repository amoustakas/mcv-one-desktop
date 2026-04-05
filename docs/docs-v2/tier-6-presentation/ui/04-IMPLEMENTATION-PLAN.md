# @mcv/ui — Implementation Plan
## Epics, Phases & Task Breakdown

**Package:** `@mcv/ui`  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026  
**Estimated Effort:** 12–16 weeks (3–4 engineers)

---

## Executive Summary

The `@mcv/ui` package is the largest single package in the MCV.ONE SDK — 508 components across 77 directories, serving as the universal design system for every MCV application. Implementation follows a bottom-up approach: design tokens and primitives first, then atomic components, composites, domain compounds, and finally page-level patterns. Each phase produces a usable, testable increment with Storybook coverage.

---

## Implementation Phases

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          IMPLEMENTATION TIMELINE                                 │
│                                                                                  │
│  Phase 1            Phase 2            Phase 3            Phase 4               │
│  Foundation         Core Components    Compound & Domain   Patterns & Polish    │
│  (Weeks 1–3)        (Weeks 4–7)        (Weeks 8–11)        (Weeks 12–16)       │
│                                                                                  │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐            │
│  │ Tokens   │─────▶│ Buttons  │─────▶│ Tables   │─────▶│ Patterns │            │
│  │ Themes   │      │ Inputs   │      │ Charts   │      │ Testing  │            │
│  │ Radix    │      │ Feedback │      │ AI/Chat  │      │ Docs     │            │
│  │ Layout   │      │ Cards    │      │ Workflow │      │ Storybook│            │
│  └──────────┘      └──────────┘      └──────────┘      └──────────┘            │
│                                                                                  │
│  Milestone 1        Milestone 2        Milestone 3        Milestone 4           │
│  Theme system       Atomic library     Feature-complete    Production-ready     │
│  + primitives       ready              component set       + patterns           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Weeks 1–3)

### Epic 1.1: Project Scaffold & Build Pipeline

**Goal:** Initialize the package structure, configure TypeScript, set up Storybook, and establish the build toolchain.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.1.1 | Create `packages/ui` directory structure (77 category dirs) | 3h | P0 |
| 1.1.2 | Initialize `package.json` with all production and peer dependencies | 2h | P0 |
| 1.1.3 | Configure TypeScript (`tsconfig.json`) with strict mode, JSX preserve, path aliases | 2h | P0 |
| 1.1.4 | Set up barrel export (`src/index.ts`) with section-organized named exports | 3h | P0 |
| 1.1.5 | Configure Storybook 8 with React/Vite builder, dark mode addon, a11y addon | 4h | P0 |
| 1.1.6 | Set up Vitest + React Testing Library + jest-axe for component tests | 2h | P0 |
| 1.1.7 | Configure ESLint, Prettier, and Tailwind CSS v4 PostCSS pipeline | 2h | P1 |
| 1.1.8 | Add to monorepo workspace, configure `tsup` build (ESM + CJS + DTS) | 2h | P0 |
| 1.1.9 | Create CI pipeline: lint → type-check → test → build → Storybook deploy | 3h | P1 |

**Acceptance Criteria:**
- [ ] `pnpm build` produces ESM + CJS bundles with type declarations
- [ ] Storybook dev server starts and renders a placeholder story
- [ ] Vitest runs successfully with empty test suite
- [ ] Package importable by other workspace packages (`@mcv/ui`)

---

### Epic 1.2: Design Token System

**Goal:** Implement the CSS custom property token system — colors, typography, spacing, shadows, radii, motion, layout, and venture overrides.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.2.1 | Create `styles/theme.css` with 200+ color tokens (brand, semantic, venture) | 4h | P0 |
| 1.2.2 | Define typography tokens (font families, scale, weights, line heights) | 2h | P0 |
| 1.2.3 | Define spacing scale, border radii, z-index layers, breakpoints | 2h | P0 |
| 1.2.4 | Define shadow/elevation tokens and motion/transition tokens | 2h | P0 |
| 1.2.5 | Implement dark mode overrides (`.dark` class variables) | 3h | P0 |
| 1.2.6 | Implement 9 venture theme overrides via `[data-venture]` selectors | 4h | P0 |
| 1.2.7 | Define layout tokens (sidebar width, header height, module nav width) | 1h | P1 |
| 1.2.8 | Validate contrast ratios meet WCAG 2.1 AA for all token pairs | 3h | P0 |
| 1.2.9 | Write token documentation with Storybook "Docs" pages | 3h | P1 |

**Acceptance Criteria:**
- [ ] All 200+ CSS custom properties defined and importable via `@mcv/ui/styles/theme.css`
- [ ] Dark/light mode switching works via class toggle
- [ ] All 9 venture themes override primary color correctly
- [ ] All text/background combinations pass WCAG AA contrast

---

### Epic 1.3: Shared Types & Utility Layer

**Goal:** Define the shared TypeScript type system and implement core utility functions.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.3.1 | Define `shared/types.ts`: ComponentSize, SemanticColor, variants, status types | 3h | P0 |
| 1.3.2 | Define prop mixins: BaseComponentProps, LoadableProps, DisableableProps, ErrorableProps, FieldProps | 2h | P0 |
| 1.3.3 | Implement `lib/utils.ts`: `cn()` (clsx + twMerge), format utilities, string helpers | 3h | P0 |
| 1.3.4 | Implement `lib/use-outside-click.ts` hook | 1h | P1 |
| 1.3.5 | Write comprehensive unit tests for all utility functions | 3h | P0 |

**Acceptance Criteria:**
- [ ] All shared types exported and documented with JSDoc
- [ ] `cn()` correctly merges conflicting Tailwind classes
- [ ] Formatting utilities produce correct output for edge cases
- [ ] 100% test coverage on `lib/utils.ts`

---

### Epic 1.4: Radix Primitives (16 Components)

**Goal:** Wrap all Radix UI headless primitives with MCV styling, consistent APIs, and accessibility.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 1.4.1 | Dialog (Dialog, DialogContent, DialogHeader, DialogFooter, etc.) with size variants | 4h | P0 |
| 1.4.2 | AlertDialog (destructive actions) | 2h | P0 |
| 1.4.3 | Drawer (side panel with animation) | 3h | P0 |
| 1.4.4 | DropdownMenu (with keyboard navigation) | 3h | P0 |
| 1.4.5 | ContextMenu (right-click menus) | 2h | P1 |
| 1.4.6 | Tabs (horizontal tabs with indicator animation) | 3h | P0 |
| 1.4.7 | Accordion (single/multi expand, collapsible) | 2h | P0 |
| 1.4.8 | Collapsible (simple expand/collapse) | 1h | P1 |
| 1.4.9 | Breadcrumb (with overflow handling) | 2h | P0 |
| 1.4.10 | Tooltip (with delay, portal) | 2h | P0 |
| 1.4.11 | HoverCard (rich content hover) | 2h | P1 |
| 1.4.12 | Card (surface container with variants) | 2h | P0 |
| 1.4.13 | Badge (inline status/count indicator) | 1h | P0 |
| 1.4.14 | Separator (horizontal/vertical divider) | 1h | P1 |
| 1.4.15 | ScrollArea (custom scrollbars) | 2h | P1 |
| 1.4.16 | Sonner integration (toast notifications via `sonner`) | 3h | P0 |
| 1.4.17 | Write unit + accessibility tests for all 16 primitives | 8h | P0 |
| 1.4.18 | Create Storybook stories with all variants and states | 6h | P0 |

**Acceptance Criteria:**
- [ ] All 16 Radix wrappers exported with consistent MCV APIs
- [ ] Full keyboard navigation on all interactive primitives
- [ ] ARIA attributes verified via jest-axe (zero violations)
- [ ] Storybook stories demonstrate all size/variant combinations

---

## Phase 2: Core Components (Weeks 4–7)

### Epic 2.1: Typography & Brand

**Goal:** Implement semantic text components and brand assets.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.1.1 | Heading (h1–h6 with responsive sizing) | 2h | P0 |
| 2.1.2 | Text (body text with size/weight/color variants) | 2h | P0 |
| 2.1.3 | Prose (Tailwind Typography wrapper for rendered markdown/HTML) | 2h | P0 |
| 2.1.4 | Label, Caption, Kbd, GradientText | 3h | P0 |
| 2.1.5 | Logo, Wordmark, LogoMark brand components | 2h | P0 |
| 2.1.6 | Storybook stories + tests | 3h | P0 |

**Acceptance Criteria:**
- [ ] All typography components render semantic HTML elements
- [ ] Responsive font scaling works across breakpoints
- [ ] Brand components render venture-specific variants

---

### Epic 2.2: Button System

**Goal:** Implement the complete button family with all variants, states, and compositions.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.2.1 | Button (5 variants × 6 colors × 5 sizes × radius options) with `asChild` slot | 6h | P0 |
| 2.2.2 | ButtonGroup (horizontal/vertical grouping with dividers) | 2h | P0 |
| 2.2.3 | IconButton (icon-only variant with `aria-label` enforcement) | 2h | P0 |
| 2.2.4 | LoadingButton (spinner integration with placement control) | 2h | P0 |
| 2.2.5 | GradientButton (animated gradient variant) | 2h | P1 |
| 2.2.6 | Write comprehensive tests (click events, disabled state, loading, keyboard) | 4h | P0 |
| 2.2.7 | Storybook: all variants matrix, playground, docs | 3h | P0 |

**Acceptance Criteria:**
- [ ] Button supports `asChild` composition via Radix Slot
- [ ] Loading state disables interaction and shows spinner
- [ ] All variants pass accessibility audit
- [ ] 95%+ test coverage

---

### Epic 2.3: Form Components (130+ exports)

**Goal:** Build the comprehensive form system with React Hook Form integration, Zod validation, and 50+ input types.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.3.1 | Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage (RHF integration) | 6h | P0 |
| 2.3.2 | TextInput, EmailInput, PasswordInput, UrlInput | 4h | P0 |
| 2.3.3 | NumberInput, CurrencyInput, PercentageInput | 3h | P0 |
| 2.3.4 | Textarea | 2h | P0 |
| 2.3.5 | Checkbox, CheckboxGroup, Radio, RadioGroup | 4h | P0 |
| 2.3.6 | Select, Combobox, AsyncCombobox | 6h | P0 |
| 2.3.7 | Toggle, Switch | 2h | P0 |
| 2.3.8 | Slider, RangeSlider | 3h | P0 |
| 2.3.9 | DateRangePicker, SingleDatePicker, TimeInput | 6h | P0 |
| 2.3.10 | SearchInput, FilterBar, FilterChip, MultiSelectDropdown | 5h | P0 |
| 2.3.11 | TagsInput, PresetTags | 3h | P1 |
| 2.3.12 | ColorPicker, ColorSwatches | 3h | P1 |
| 2.3.13 | Rating, RatingDisplay, EmojiRating | 2h | P1 |
| 2.3.14 | Dropzone (file upload) | 3h | P0 |
| 2.3.15 | MaskedInput, PhoneInput, CreditCardInput | 4h | P1 |
| 2.3.16 | CodeInput, OTPInput | 3h | P0 |
| 2.3.17 | AddressInput | 3h | P2 |
| 2.3.18 | WizardForm, WizardStepContent, useWizard | 6h | P0 |
| 2.3.19 | AdvancedFilter (visual query builder) | 5h | P1 |
| 2.3.20 | BulkEditor, FieldArray, DependentField, AsyncFieldValidator | 6h | P1 |
| 2.3.21 | SplitForm, AccordionForm, TabbedForm layouts | 4h | P1 |
| 2.3.22 | FormValidationSummary | 2h | P1 |
| 2.3.23 | Write form integration tests (submit, validate, error display) | 8h | P0 |
| 2.3.24 | Storybook: all form components with interactive examples | 6h | P0 |

**Acceptance Criteria:**
- [ ] All form components integrate with React Hook Form via `FormField`
- [ ] Zod schema validation surfaces errors through `FormMessage`
- [ ] WizardForm supports multi-step navigation with per-step validation
- [ ] All inputs support `isDisabled`, `isReadOnly`, `isInvalid` states
- [ ] 90%+ test coverage on form components

---

### Epic 2.4: Feedback & Overlay Components

**Goal:** Implement alerts, toasts, progress indicators, confirm dialogs, and loading states.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.4.1 | Alert, InlineAlert, AlertList (info/success/warning/danger variants) | 3h | P0 |
| 2.4.2 | Toast system: showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showLoadingToast, dismissToast, showPromiseToast, showUndoToast, presetToasts | 5h | P0 |
| 2.4.3 | ConfirmDialog, DeleteConfirmDialog, UnsavedChangesDialog | 4h | P0 |
| 2.4.4 | ProgressBar, CircularProgress, StepProgress, UploadProgress | 4h | P0 |
| 2.4.5 | SuccessState, LoadingState, InlineLoading | 2h | P0 |
| 2.4.6 | Spinner, LoadingOverlay, Skeleton | 2h | P0 |
| 2.4.7 | ErrorBoundary component | 2h | P0 |
| 2.4.8 | Tests + Storybook stories | 5h | P0 |

**Acceptance Criteria:**
- [ ] Toast system works via imperative API (`showSuccessToast(...)`)
- [ ] ConfirmDialog blocks interaction until resolved
- [ ] Progress components support both determinate and indeterminate modes
- [ ] ErrorBoundary catches and displays fallback UI

---

### Epic 2.5: Card Variants & Data Display Foundations

**Goal:** Build the 60+ card variants and core data display components (StatsCard, MetricCard, KeyValue).

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 2.5.1 | ActionCard, QuickActionCard, FeatureCard, ResourceCard | 4h | P0 |
| 2.5.2 | StatCard, InfoCard, TipCard, SummaryCard | 3h | P0 |
| 2.5.3 | ProfileCard, NotificationCard, ComparisonCard, TrendCard | 4h | P0 |
| 2.5.4 | AlertCard, IntegrationCard, QuotaCard + Grid/List variants | 4h | P1 |
| 2.5.5 | StatsCard, StatsGrid, LargeStat, ComparisonStat, TrendChip | 4h | P0 |
| 2.5.6 | MetricCard, KeyValue | 2h | P0 |
| 2.5.7 | CardSkeleton, GridSkeleton, ListSkeleton, TableSkeleton | 3h | P0 |
| 2.5.8 | Tests + Storybook stories for all card types | 6h | P0 |

**Acceptance Criteria:**
- [ ] All card variants follow consistent API (`variant`, `size`, `color`, `className`)
- [ ] Cards render properly in both light and dark themes
- [ ] Grid/List layout variants for each card type
- [ ] Skeleton loading states match card dimensions

---

## Phase 3: Compound & Domain Components (Weeks 8–11)

### Epic 3.1: TanStack Table Integration & Table Patterns

**Goal:** Implement the full data table system — TanStack Table wrapper, toolbar, row actions, cell renderers, bulk actions, virtualization, tree tables.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.1.1 | TanStackTable MCV wrapper (sorting, filtering, pagination, selection) | 8h | P0 |
| 3.1.2 | createSelectionColumn, createActionsColumn factory functions | 3h | P0 |
| 3.1.3 | TableToolbar (search, filter toggles, action buttons) | 4h | P0 |
| 3.1.4 | Cell renderers: CurrencyCell, DateCell, StatusCell, BadgeCell, ProgressCell, LinkCell, TrendCell | 5h | P0 |
| 3.1.5 | RowActions (dropdown action menu per row) | 2h | P0 |
| 3.1.6 | BulkActionBar (selection-based batch operations) | 3h | P0 |
| 3.1.7 | Pagination component with page size selector | 2h | P0 |
| 3.1.8 | ColumnVisibilityToggle, SortableHeader | 3h | P1 |
| 3.1.9 | VirtualizedTable (100K+ rows via @tanstack/react-virtual) | 5h | P0 |
| 3.1.10 | TreeTable (hierarchical data with expand/collapse) | 4h | P1 |
| 3.1.11 | EditableRow, ExpandableRow | 4h | P1 |
| 3.1.12 | ColumnCustomizer, SavedViews, ExportMenu | 5h | P2 |
| 3.1.13 | Integration tests (sort, filter, paginate, select, bulk actions) | 6h | P0 |
| 3.1.14 | Storybook: complete table showcase with sample data | 4h | P0 |

**Acceptance Criteria:**
- [ ] TanStackTable renders sorted, filtered, paginated data with selection
- [ ] Virtualized mode handles 100K+ rows at 60fps
- [ ] All table sub-components composable via compound pattern
- [ ] Export menu supports CSV/JSON

---

### Epic 3.2: Charts & Visualization (Recharts)

**Goal:** Build the chart library wrapping Recharts with MCV design tokens.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.2.1 | AreaChart (gradient fills, stacking, multi-series) | 4h | P0 |
| 3.2.2 | BarChart (grouped, stacked, horizontal) | 4h | P0 |
| 3.2.3 | DonutChart, PieChart | 3h | P0 |
| 3.2.4 | Sparkline, SparklineBar, TrendSparkline, MiniSparkline | 4h | P0 |
| 3.2.5 | KpiCard, KpiGrid, SimpleKpi, CompactKpi | 4h | P0 |
| 3.2.6 | HeatmapChart, CalendarHeatmap | 4h | P1 |
| 3.2.7 | TreemapChart, ScatterChart, BubbleChart | 4h | P1 |
| 3.2.8 | Shared chart utilities (responsive container, tooltip, legend) | 3h | P0 |
| 3.2.9 | Tests + Storybook (all chart types with sample data) | 5h | P0 |

**Acceptance Criteria:**
- [ ] All charts use MCV design token colors by default
- [ ] Charts are responsive and resize with container
- [ ] Tooltips follow consistent MCV styling
- [ ] KPI cards include optional sparkline inline

---

### Epic 3.3: AI & Chat Components

**Goal:** Build AI-native interaction components — chatbot, streaming text, voice, tool calls, thinking indicators.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.3.1 | Chatbot component + useChat hook (message list, input, streaming) | 8h | P0 |
| 3.3.2 | Terminal component + useTerminal hook | 4h | P1 |
| 3.3.3 | StreamingText, TypewriterText, StreamingMarkdown, TextReveal | 4h | P0 |
| 3.3.4 | VoiceInput, VoiceButton, VoiceWaveform, VoiceTranscript, VoiceAssistant, useVoice | 6h | P1 |
| 3.3.5 | ToolCall, ToolCallList (expandable tool invocation cards) | 3h | P0 |
| 3.3.6 | ThinkingIndicator, ThinkingBubble, ProcessingIndicator | 2h | P0 |
| 3.3.7 | AIMessage, SystemMessage (styled message variants) | 2h | P0 |
| 3.3.8 | Tests + Storybook | 4h | P0 |

**Acceptance Criteria:**
- [ ] Chatbot renders streaming messages in real-time
- [ ] Voice components handle browser speech APIs gracefully (with fallbacks)
- [ ] Tool call cards expand/collapse to show args and results
- [ ] All AI components work in both light and dark themes

---

### Epic 3.4: Workflow & Project Management

**Goal:** Build the workflow canvas and project management views — Kanban, Calendar, Gantt, ListView.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.4.1 | WorkflowCanvas (zoom, pan, grid, minimap, node rendering) | 10h | P0 |
| 3.4.2 | EnhancedWorkflowNode + nodeTypeConfigs + createWorkflowNode/Edge factories | 4h | P0 |
| 3.4.3 | NodePalette (drag-to-add node sidebar) | 3h | P0 |
| 3.4.4 | KanbanBoard (drag-and-drop columns with DnD) | 6h | P0 |
| 3.4.5 | Calendar, MiniCalendar (event display, day/week/month views) | 6h | P0 |
| 3.4.6 | GanttChart (task bars, dependencies, zoom) | 8h | P1 |
| 3.4.7 | ListView, SimpleList | 3h | P0 |
| 3.4.8 | PipelineProgress, ApprovalPipeline | 3h | P1 |
| 3.4.9 | Tests + Storybook | 6h | P0 |

**Acceptance Criteria:**
- [ ] WorkflowCanvas supports node creation, connection, selection, and deletion
- [ ] KanbanBoard handles drag-and-drop between columns
- [ ] Calendar renders events and supports view switching
- [ ] GanttChart renders task dependencies and supports zoom levels

---

### Epic 3.5: Navigation, Page Composition & Identity

**Goal:** Build the navigation system, page composition primitives, and identity components.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 3.5.1 | CommandMenu + useCommandMenu (⌘K launcher) | 5h | P0 |
| 3.5.2 | PageHeader, CompactPageHeader, Breadcrumbs | 3h | P0 |
| 3.5.3 | PageSection, SectionDivider, SectionGroup | 2h | P0 |
| 3.5.4 | EmptyState, EmptyList, NoSearchResults, ErrorState, OfflineState, UnauthorizedState, WelcomeState, ComingSoonState | 4h | P0 |
| 3.5.5 | ContentShell, PageContainer, SplitLayout, GridLayout, StackLayout | 4h | P0 |
| 3.5.6 | TabbedContainer, TabbedCardGrid, StatusTabs, CategoryTabs | 3h | P0 |
| 3.5.7 | Avatar, UserCard, PermissionBadge, AgentBadge (identity) | 3h | P0 |
| 3.5.8 | DetailDrawer, SplitPaneLayout, MasterDetail (inspector) | 4h | P0 |
| 3.5.9 | Tests + Storybook | 5h | P0 |

**Acceptance Criteria:**
- [ ] CommandMenu opens with ⌘K, supports search, keyboard navigation, and grouping
- [ ] All page composition primitives compose into full page layouts
- [ ] Empty/error states provide actionable call-to-action options
- [ ] Identity components display venture-aware avatars and badges

---

## Phase 4: Patterns, Polish & Production (Weeks 12–16)

### Epic 4.1: Application Shell & Dashboard Patterns

**Goal:** Build the page-level patterns — AppShell, Sidebar, Header, Dashboard, Widget Grid.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.1.1 | AppShell (sidebar + header + content layout) | 5h | P0 |
| 4.1.2 | Sidebar (collapsible, sections, icons, active state) | 4h | P0 |
| 4.1.3 | Header (search trigger, actions, user menu) | 3h | P0 |
| 4.1.4 | WidgetGrid, WidgetContainer, useWidgetGrid (draggable dashboard) | 6h | P0 |
| 4.1.5 | MetricDashboard, SimpleDashboardGrid | 3h | P0 |
| 4.1.6 | Tests + Storybook with complete admin layout example | 4h | P0 |

**Acceptance Criteria:**
- [ ] AppShell composes Sidebar + Header + Content seamlessly
- [ ] Sidebar collapses/expands with smooth animation
- [ ] WidgetGrid supports drag-to-reorder and resize with persistence

---

### Epic 4.2: Timeline, Activity & Comments

**Goal:** Build the 100+ timeline/activity exports and comment system.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.2.1 | ActivityItem, ActivityFeed, ActivityFeedEnhanced | 4h | P0 |
| 4.2.2 | TimelineItem, Timeline (vertical layout) | 3h | P0 |
| 4.2.3 | AuditLogEntry, ChangelogItem | 3h | P0 |
| 4.2.4 | LiveFeed, EventCalendar, GanttMini | 4h | P1 |
| 4.2.5 | CollaborationStack, TimelineScrubber, PlaybackControls | 4h | P1 |
| 4.2.6 | ActivityDigest, EventClustering, CausalityTimeline, ActivityAnalytics | 6h | P2 |
| 4.2.7 | Comment, CommentThread, ReactionBar, MentionBadge, MentionList | 5h | P0 |
| 4.2.8 | Tests + Storybook | 4h | P0 |

**Acceptance Criteria:**
- [ ] Activity feed renders real-time items with user avatars and action descriptions
- [ ] Timeline supports vertical layout with alternating sides
- [ ] Comment threads support nested replies and emoji reactions
- [ ] AuditLogEntry displays before/after change diffs

---

### Epic 4.3: Onboarding, Auth UI & Domain Components

**Goal:** Build onboarding flows, authentication UI components, and domain-specific patterns.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.3.1 | TourProvider, TourTooltip, TourOverlay, useTour | 5h | P0 |
| 4.3.2 | Spotlight, MultiSpotlight, CoachMark | 3h | P0 |
| 4.3.3 | OnboardingChecklist, WelcomeModal | 3h | P0 |
| 4.3.4 | AuthCard (login/register with mode switching) | 4h | P0 |
| 4.3.5 | PINInput, VerificationCodeInput, PasswordStrengthMeter, ConfirmPasswordInput | 4h | P0 |
| 4.3.6 | ThemeToggle, ThemeSwitch, ThemeIndicator | 2h | P0 |
| 4.3.7 | ThemeCustomizerProvider, AccentColorPicker, RadiusSelector, FontScaleSelector, ThemeCustomizerPanel | 5h | P1 |
| 4.3.8 | Domain components: PipelineItem, IncidentCard, CampaignRow, MarketingMetric, ToolCard | 5h | P1 |
| 4.3.9 | Finance: CreditCard, Ticker | 2h | P2 |
| 4.3.10 | Marketing: ScrollingBanner, Testimonials | 3h | P2 |
| 4.3.11 | Tests + Storybook | 5h | P0 |

**Acceptance Criteria:**
- [ ] Product tour system highlights elements with spotlight overlay
- [ ] AuthCard supports login, register, forgot-password mode switching
- [ ] Theme customizer persists preferences to localStorage
- [ ] Domain components render venture-branded content

---

### Epic 4.4: Remaining Components & Utility

**Goal:** Implement remaining components: backgrounds, visualizations, media, utility, code, etc.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.4.1 | HeroHighlight, GridBackground, BackgroundGradient | 3h | P1 |
| 4.4.2 | Globe, Sparkles, animated visual effects | 4h | P2 |
| 4.4.3 | ImageZoom, VideoPlayer, Stories (media) | 4h | P1 |
| 4.4.4 | CodeBlock, InlineCode, syntax highlighting | 3h | P0 |
| 4.4.5 | RichTextEditor (editor) | 6h | P1 |
| 4.4.6 | Status, StatusIndicator, ActivityStatus, HealthStatus | 2h | P0 |
| 4.4.7 | RelativeTime, Timestamp, Countdown | 2h | P0 |
| 4.4.8 | CopyButton, CopyField, CopyText, CopyCodeBlock | 2h | P0 |
| 4.4.9 | KeyboardShortcut, ShortcutHint, ShortcutsPanel, commonShortcuts | 3h | P1 |
| 4.4.10 | BentoGrid, LayoutGrid (layout) | 3h | P0 |
| 4.4.11 | Banner, Announcement, FeatureAnnouncement (callout) | 2h | P1 |
| 4.4.12 | Notification system components | 3h | P1 |
| 4.4.13 | Tests + Storybook | 5h | P0 |

**Acceptance Criteria:**
- [ ] All remaining 77 directories have at least one implemented component
- [ ] Background components render performantly (GPU-accelerated)
- [ ] Editor components handle large documents without lag

---

### Epic 4.5: Testing & Quality Assurance

**Goal:** Comprehensive testing, visual regression, accessibility audit, and performance benchmarking.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.5.1 | Complete unit tests for all 508 components (target: 85%+ coverage) | 16h | P0 |
| 4.5.2 | Set up Playwright visual regression tests for key components | 8h | P0 |
| 4.5.3 | Run jest-axe accessibility audit on all interactive components | 6h | P0 |
| 4.5.4 | Bundle size analysis and optimization (tree-shaking verification) | 4h | P0 |
| 4.5.5 | Performance testing: render time, animation frame rate, virtualization throughput | 4h | P1 |
| 4.5.6 | Cross-browser testing (Chrome, Firefox, Safari, Edge) | 4h | P0 |
| 4.5.7 | Fix all discovered issues | 8h | P0 |

**Acceptance Criteria:**
- [ ] 85%+ overall test coverage
- [ ] Zero WCAG AA accessibility violations on interactive components
- [ ] Visual regression baseline established for all key components
- [ ] Bundle size under 95KB gzipped (own code, excluding peer deps)
- [ ] All components render correctly in Chrome, Firefox, Safari, Edge

---

### Epic 4.6: Documentation & Release

**Goal:** Complete Storybook documentation, JSDoc coverage, README, and publish workflow.

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| 4.6.1 | Write JSDoc comments on all 508 component exports | 8h | P0 |
| 4.6.2 | Create Storybook "Docs" pages for each component category | 6h | P0 |
| 4.6.3 | Build interactive Storybook playground with all components | 4h | P1 |
| 4.6.4 | Write README.md with quick start, installation, theming guide | 3h | P0 |
| 4.6.5 | Write CHANGELOG.md | 1h | P0 |
| 4.6.6 | Configure npm publish workflow (changesets or manual) | 2h | P1 |
| 4.6.7 | Deploy Storybook to static hosting (Vercel/Netlify) | 2h | P1 |
| 4.6.8 | Internal release announcement and migration guide | 2h | P0 |

**Acceptance Criteria:**
- [ ] All exports have JSDoc with at least one `@example`
- [ ] Storybook deployed and accessible to all team members
- [ ] README covers installation, basic usage, theming, and venture configuration
- [ ] Package published to internal npm registry

---

## Milestone Summary

| Milestone | Target Date | Key Deliverables |
|-----------|-------------|------------------|
| **M1: Foundation** | End of Week 3 | Token system, 16 Radix primitives, shared types, utilities, Storybook running |
| **M2: Core Library** | End of Week 7 | Typography, buttons, 130+ form components, feedback, 60+ cards, data display |
| **M3: Feature Complete** | End of Week 11 | Tables, charts, AI, workflow, project management, navigation, page composition |
| **M4: Production Ready** | End of Week 16 | 508 components, 85 patterns, tests, a11y audit, docs, Storybook, published |

---

## Dependencies & Blockers

### External Dependencies

| Dependency | Required For | Risk Level |
|------------|--------------|------------|
| HeroUI v2 stable | Base component primitives | Low (already in use) |
| Radix UI v1-2 | Headless accessible primitives | Low (stable) |
| Tailwind CSS v4 | Utility-first styling | Medium (v4 is new) |
| Recharts v2 | Chart components | Low (stable) |
| TanStack Table v8 | Data table engine | Low (stable) |
| Framer Motion v11 | Animations | Low (stable) |

### Internal Dependencies

| Dependency | Impact |
|------------|--------|
| `@mcv/config` | Theme CSS base import |
| `@mcv/tsconfig` | TypeScript configuration |
| `@mcv/api` (peer) | Data hooks consumed by examples and patterns |

### Potential Blockers

| Blocker | Mitigation |
|---------|------------|
| Tailwind CSS v4 migration issues | Pin to specific v4 release, test extensively |
| HeroUI API breaking changes | Lock version, wrap with stable MCV API layer |
| Bundle size exceeding budget | Aggressive tree-shaking, lazy load heavy components |
| Cross-browser CSS variable support | Test early, polyfill where necessary |
| Storybook compatibility with Tailwind v4 | Use Vite builder, custom PostCSS config |

---

## Resource Requirements

### Team

| Role | Allocation | Responsibilities |
|------|------------|------------------|
| Senior Frontend Engineer (Lead) | 100% | Architecture, primitives, complex components (tables, workflow, AI) |
| Frontend Engineer | 100% | Form system, cards, feedback, navigation, page composition |
| Frontend Engineer | 100% | Charts, timeline, onboarding, domain components, remaining categories |
| Design System Lead | 50% | Token system, Storybook docs, visual QA, accessibility audit |
| QA Engineer | 25% | Visual regression testing, cross-browser testing |

### Infrastructure

| Resource | Purpose |
|----------|---------|
| Storybook hosting (Vercel/Netlify) | Component documentation and visual review |
| Chromatic (optional) | Automated visual regression testing |
| npm private registry | Package publishing |
| CI/CD pipeline (GitHub Actions) | Automated testing and deployment |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep (new component requests) | High | Medium | Strict component spec freeze at M2; new requests queued for v1.1 |
| Inconsistent APIs across 508 components | Medium | High | Enforce shared types, PR reviews, lint rules, Storybook audit |
| Bundle size exceeding 95KB budget | Medium | Medium | Weekly bundle analysis, lazy loading for heavy components |
| Accessibility regressions | Medium | High | jest-axe in CI, mandatory a11y review on every PR |
| Tailwind v4 PostCSS instability | Low | High | Pin version, maintain fallback Tailwind v3 config |
| Performance issues in virtualized tables/charts | Low | Medium | Benchmark early, use React.memo + useMemo aggressively |

---

## Success Criteria

### Functional

- [ ] All 508 components implemented and exported
- [ ] All 77 category directories have barrel exports
- [ ] 85+ pre-built UI patterns documented in Storybook
- [ ] Theme system supports 9 ventures + custom themes
- [ ] Dark/light/system mode works across all components

### Non-Functional

- [ ] Bundle size: ≤95KB gzipped (own code, excluding peer deps)
- [ ] First render: <100ms for atomic components
- [ ] Virtualized table: 60fps scroll at 100K rows
- [ ] Storybook build: <2 minutes
- [ ] Tree-shaking: unused components excluded from production bundle

### Quality

- [ ] 85%+ test coverage (unit + integration)
- [ ] Zero WCAG 2.1 AA accessibility violations on interactive components
- [ ] Visual regression baseline for all key component states
- [ ] Cross-browser compatibility: Chrome, Firefox, Safari, Edge
- [ ] All TypeScript strict mode checks passing

---

## Post-Release

### Monitoring

- [ ] Track bundle size per release (size-limit CI check)
- [ ] Monitor Storybook deployment uptime
- [ ] Collect feedback from consuming application teams

### Iteration

- [ ] v1.1: Address feedback, add requested components, performance optimizations
- [ ] v1.2: Enhanced accessibility (AAA compliance for high-contrast mode)
- [ ] v2.0: React 19 features (use(), Server Components integration)

---

*@mcv/ui — Implementation Plan v1.0*
