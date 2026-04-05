# @mcv/ui — Enterprise Design System & Component Library

**Parent Package:** @mcv/ui  
**Tier:** 6 (Presentation Layer — UI)  
**Classification:** PUBLISHABLE  
**Version:** 0.1.0  
**Last Updated:** February 8, 2026

---

## Purpose

`@mcv/ui` is the comprehensive design system and component library powering every user-facing pixel in the MCV.ONE ecosystem. Built on HeroUI, Radix UI, Tailwind CSS v4, and Framer Motion, it delivers **508 components** across **77 category directories** — spanning primitives, form controls, data visualization, navigation, feedback, AI interaction, workflow orchestration, and domain-specific patterns. Every MCV application — from Super Admin to venture-specific frontends — consumes this package for a unified, accessible, and themeable user experience.

**This is the face of MCV.ONE — every pixel, interaction, and animation flows from this package.**

### What It Does

- Provides a complete, enterprise-grade React component library with TypeScript-first APIs
- Implements a token-based design system with CSS custom properties for consistent theming
- Supports venture-specific branding via data attributes and runtime theme customization
- Exports AI-native components (chatbot, streaming text, voice, tool calls, thinking indicators)
- Delivers data-heavy components (TanStack Table, Recharts charts, KPI dashboards, virtualized lists)
- Offers form composition with React Hook Form + Zod integration, wizard forms, and field arrays
- Includes workflow canvas, project management views (Kanban, Gantt, Calendar), and pipeline patterns
- Ships 85+ pre-built UI patterns for auth, dashboards, commerce, onboarding, and settings flows
- Ensures WCAG 2.1 AA accessibility via Radix primitives and semantic HTML
- Optimizes bundle size through tree-shaking, code splitting, and `'use client'` boundaries

### What It Does NOT Do

- Does not manage application state — state management is handled by consuming applications
- Does not perform API calls directly — data fetching hooks live in `@mcv/api`
- Does not implement business logic — domain rules belong in tier-3 and tier-4 packages
- Does not handle routing — Next.js App Router handles navigation in consuming applications
- Does not bundle its own icons — uses `lucide-react` as the icon system

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  MCV APPLICATIONS                                        │
│                                                                                          │
│  super-admin  │  venture-admin  │  betedge.app  │  serpspace.com  │  the-forge  │ ...  │
│                                                                                          │
└────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                         │ imports
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    @mcv/ui                                               │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         COMPONENT LAYER (508 components)                           │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │  Layer 5: PAGE PATTERNS                                                     │   │  │
│  │  │  AppShell, Sidebar, Header, PageHeader, EmptyState, ContentShell            │   │  │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤   │  │
│  │  │  Layer 4: DOMAIN COMPOUNDS                                                  │   │  │
│  │  │  Chatbot, WorkflowCanvas, MetricDashboard, WidgetGrid, KanbanBoard,         │   │  │
│  │  │  GanttChart, TanStackTable, CommandMenu, TourProvider, WizardForm           │   │  │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤   │  │
│  │  │  Layer 3: COMPOSITE COMPONENTS                                              │   │  │
│  │  │  ActionCard, StatCard, AreaChart, FilterBar, CommentThread, Timeline,        │   │  │
│  │  │  ActivityFeed, DetailDrawer, BulkActionBar, Pagination, TabContainer        │   │  │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤   │  │
│  │  │  Layer 2: ATOMIC COMPONENTS                                                 │   │  │
│  │  │  Button, Input, Badge, Avatar, Chip, Alert, Checkbox, Select, Slider,       │   │  │
│  │  │  Toggle, Radio, Rating, Tag, Tooltip, Popover, Spinner, Skeleton            │   │  │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤   │  │
│  │  │  Layer 1: PRIMITIVES (Radix + HeroUI)                                       │   │  │
│  │  │  Dialog, AlertDialog, Drawer, DropdownMenu, ContextMenu, Tabs,              │   │  │
│  │  │  Accordion, Collapsible, Breadcrumb, Tooltip, HoverCard, ScrollArea,        │   │  │
│  │  │  Separator, Card, Badge, Sonner (Toast)                                     │   │  │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤   │  │
│  │  │  Layer 0: DESIGN TOKENS & THEME                                             │   │  │
│  │  │  CSS Custom Properties (colors, typography, spacing, shadows, radii,        │   │  │
│  │  │  transitions, z-indices, breakpoints), venture themes, dark/light modes     │   │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          STYLING LAYER                                             │  │
│  │                                                                                    │  │
│  │  Tailwind CSS v4  +  clsx/twMerge (cn utility)  +  class-variance-authority       │  │
│  │  CSS Custom Properties  +  data-[venture] attribute theming                        │  │
│  │  Framer Motion animations  +  Radix data-state transitions                        │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          UTILITY LAYER                                             │  │
│  │                                                                                    │  │
│  │  cn() (clsx + twMerge)  │  formatCurrency()  │  formatCompact()  │  debounce()   │  │
│  │  formatRelativeTime()   │  generateId()       │  getStatusColor() │  sleep()      │  │
│  │  useOutsideClick()      │  truncate()         │  slugToTitle()    │  isClient     │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ depends on
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               EXTERNAL DEPENDENCIES                                     │
│                                                                                          │
│  @heroui/* (32 pkgs)  │  @radix-ui/* (10 pkgs)  │  tailwindcss v4  │  framer-motion   │
│  @tanstack/react-table │  recharts               │  lucide-react    │  react-hook-form  │
│  class-variance-auth   │  clsx + tailwind-merge   │  sonner (toast)  │  next-themes      │
│  @hookform/resolvers   │  zod (peer)              │  next (peer)     │  react 18/19      │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Composition Flow

```
  User Application
        │
        │  import { Button, DataTable, Chatbot, AreaChart } from '@mcv/ui'
        │
        ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                     @mcv/ui barrel export                     │
  │                     (src/index.ts)                            │
  │                                                               │
  │  Re-exports from 77 category directories with                 │
  │  explicit named exports to avoid conflicts                    │
  │  (e.g., Kbd from typography, not from primitives)             │
  └───────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┬──────────────┐
        ▼         ▼         ▼              ▼
  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
  │  form/   │ │  ai/   │ │ charts/  │ │ table/   │
  │          │ │        │ │          │ │          │
  │ 50 files │ │ 7 tsx  │ │ 7 tsx    │ │ 14 tsx   │
  │ 130+     │ │ 20+    │ │ 25+     │ │ 40+      │
  │ exports  │ │exports │ │ exports  │ │ exports  │
  └──────────┘ └────────┘ └──────────┘ └──────────┘
        │         │         │              │
        └─────────┼─────────┼──────────────┘
                  │         │
                  ▼         ▼
          ┌──────────────────────────┐
          │    shared/types.ts       │
          │    lib/utils.ts          │
          │    styles/theme.css      │
          │                          │
          │  ComponentSize, Semantic  │
          │  Color, cn(), format*()  │
          │  CSS custom properties   │
          └──────────────────────────┘
```

---

## Exports

The barrel export (`src/index.ts`) is organized into **20 major sections** with explicit named exports to avoid symbol conflicts across the 77 category modules. Below is the complete export map:

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  AuthCard,                   // Login/register card with mode switching
  PINInput,                   // PIN entry input
  VerificationCodeInput,      // Multi-digit verification code
  PasswordStrengthMeter,      // Visual password strength indicator
  ConfirmPasswordInput,       // Password + confirmation field pair
  analyzePassword,            // Password analysis utility
  // Types: AuthMode, AuthFormData, AuthCardProps, PINInputProps,
  //        VerificationCodeInputProps, PasswordStrengthMeterProps,
  //        ConfirmPasswordInputProps, PasswordStrengthLevel,
  //        PasswordRequirement, PasswordAnalysis
} from './auth';
export * from './auth/split-layout';

// ═══════════════════════════════════════════════════════════════════════════════
// BRANDING COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './brand';      // Logo, Wordmark, brand assets

// ═══════════════════════════════════════════════════════════════════════════════
// CORE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './button';     // Button, ButtonGroup, variants
export * from './code';       // CodeBlock, InlineCode, syntax highlighting
export * from './progress';   // ProgressBar, CircularProgress, StepProgress
export * from './workflow';   // WorkflowCanvas, WorkflowNodes, NodePalette

// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY (explicit exports to avoid InlineCode conflict with code module)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  Heading, Text, Prose, Label, Caption, Kbd, GradientText,
  // Types: HeadingProps, TextProps, ProseProps, LabelProps,
  //        CaptionProps, KbdProps, GradientTextProps
} from './typography';

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL & LAYOUT PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

export * from './backgrounds';      // HeroHighlight, GridBackground, BackgroundGradient
export * from './layout';           // BentoGrid, LayoutGrid, layout primitives
export * from './visualizations';   // Globe, Sparkles, animated visual effects

// ═══════════════════════════════════════════════════════════════════════════════
// DATA COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './data';             // TanStackTable, StatsCard, StatsGrid, LargeStat
export * from './grid';             // BentoGrid layouts
export * from './notifications';    // Notification system

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT MANAGEMENT (explicit to avoid DataTable/ColumnDef conflicts)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  KanbanBoard, Calendar, MiniCalendar, GanttChart, ListView, SimpleList,
  // Types: KanbanBoardProps, KanbanItem, KanbanColumn, CalendarProps,
  //        MiniCalendarProps, CalendarView, CalendarEvent, GanttProps,
  //        GanttTask, GanttViewMode, GanttTaskStatus, ListViewProps,
  //        SimpleListProps, ListItem, ListGroup, ListItemStatus, ListItemPriority
} from './project-management';

// ═══════════════════════════════════════════════════════════════════════════════
// FORM COMPONENTS (130+ exports)
// ═══════════════════════════════════════════════════════════════════════════════

export * from './form';

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA, FINANCE, CALLOUT
// ═══════════════════════════════════════════════════════════════════════════════

export * from './media';            // ImageZoom, VideoPlayer, Stories
export * from './finance';          // CreditCard, Ticker
export * from './callout';          // Banner, Announcement

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS (explicit exports for conflict avoidance)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  Status, StatusIndicator, ActivityStatus, HealthStatus,
  RelativeTime, Timestamp, Countdown,
  Spinner, LoadingOverlay, Skeleton,
  CopyButton, CopyField, CopyText, CopyCodeBlock,
  KeyboardShortcut, ShortcutHint, ShortcutWithLabel, ShortcutList,
  ShortcutGroup, ShortcutsPanel, commonShortcuts,
  // + all associated types
} from './utility';

// ═══════════════════════════════════════════════════════════════════════════════
// AI SDK COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './ai';               // Chatbot, Terminal, Voice*, StreamingText,
                                    // ToolCall, ThinkingIndicator, MessageVariants

// ═══════════════════════════════════════════════════════════════════════════════
// EDITOR, NAVIGATION, MARKETING
// ═══════════════════════════════════════════════════════════════════════════════

export * from './editor';           // RichTextEditor
export * from './navigation';       // CommandMenu, CommandInput, CommandGroup
export * from './marketing';        // ScrollingBanner, Testimonials

// ═══════════════════════════════════════════════════════════════════════════════
// RADIX PRIMITIVES (16 primitive components)
// ═══════════════════════════════════════════════════════════════════════════════

export * from './primitives/dialog';
export * from './primitives/alert-dialog';
export * from './primitives/drawer';
export * from './primitives/dropdown-menu';
export * from './primitives/context-menu';
export * from './primitives/tabs';
export * from './primitives/accordion';
export * from './primitives/collapsible';
export * from './primitives/breadcrumb';
export * from './primitives/sonner';        // Toast notifications
export * from './primitives/tooltip';
export * from './primitives/hover-card';
export * from './primitives/card';
export * from './primitives/separator';
export * from './primitives/badge';
export * from './primitives/scroll-area';

// ═══════════════════════════════════════════════════════════════════════════════
// CHARTS (Recharts-based)
// ═══════════════════════════════════════════════════════════════════════════════

export * from './charts';           // AreaChart, BarChart, DonutChart, PieChart,
                                    // Sparkline, KpiCard, HeatmapChart,
                                    // TreemapChart, ScatterChart, BubbleChart

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE COMPOSITION (explicit to avoid BreadcrumbItem conflict)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  PageHeader, CompactPageHeader, Breadcrumbs,
  PageSection, SectionDivider, SectionGroup,
  EmptyState, EmptyList, NoSearchResults, ErrorState,
  OfflineState, UnauthorizedState, WelcomeState, ComingSoonState,
  ContentShell, PageContainer, SplitLayout, GridLayout, StackLayout,
  // + all associated types
} from './page';

// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export {
  Alert, InlineAlert, AlertList,
  ConfirmDialog, DeleteConfirmDialog, UnsavedChangesDialog,
  ProgressBar, CircularProgress, StepProgress, UploadProgress,
  showSuccessToast, showErrorToast, showWarningToast, showInfoToast,
  showLoadingToast, dismissToast, showPromiseToast, withToastFeedback,
  copyToClipboard, showUndoToast, presetToasts,
  SuccessState, LoadingState, InlineLoading,
  // + all associated types
} from './feedback';

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PATTERNS, IDENTITY, CARDS, TIMELINE, TABLE, COMMENTS, TABS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './data-patterns';    // MetricCard, KeyValue, ErrorBoundary
export * from './identity';         // Avatar, UserCard, PermissionBadge, AgentBadge
export { /* 50+ card components */ } from './cards';
export { /* 80+ timeline/activity components */ } from './timeline';
export { /* 40+ table pattern components */ } from './table';
export { /* comment/thread components */ } from './comments';
export { /* tabbed container components */ } from './tabs';

// ═══════════════════════════════════════════════════════════════════════════════
// INSPECTOR, SHELL, PIPELINE, SKELETONS, DOMAIN, ONBOARDING, THEME, DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export * from './inspector';        // DetailDrawer, SplitPaneLayout, MasterDetail
export * from './patterns/shell';   // AppShell, Header, Sidebar
export * from './pipeline';         // PipelineProgress, ApprovalPipeline
export * from './skeletons';        // CardSkeleton, GridSkeleton, ListSkeleton
export * from './domain';           // PipelineItem, IncidentCard, CampaignRow
export { /* onboarding components */ } from './onboarding';
export * from './theme';            // ThemeToggle, ThemeCustomizer
export * from './dashboard';        // WidgetContainer, WidgetGrid, MetricDashboard
```

---

## Component Catalog

### 77 Category Directories

The component source is organized into 77 directories under `packages/ui/src/`. Each directory contains component TSX files, Storybook stories (`*.stories.tsx`), and a barrel `index.ts`.

#### Foundation & Primitives (12 categories)

| Category | Key Components | Description |
|----------|---------------|-------------|
| **primitives** | Dialog, AlertDialog, Drawer, DropdownMenu, ContextMenu, Tabs, Accordion, Collapsible, Breadcrumb, Tooltip, HoverCard, Card, Badge, Separator, ScrollArea, Sonner | Radix UI headless primitives with MCV styling — the building blocks for all overlays, menus, and accessible interactions |
| **typography** | Heading, Text, Prose, Label, Caption, Kbd, GradientText | Semantic text components with consistent font scales and responsive sizing |
| **button** | Button, ButtonGroup, IconButton, LoadingButton, GradientButton | Interactive elements with 5 variants (solid/outline/ghost/flat/link), 6 colors, 5 sizes |
| **layout** | BentoGrid, LayoutGrid, Primitives (Stack, Flex, Center) | CSS Grid and Flexbox layout compositions for dashboard and content assembly |
| **backgrounds** | HeroHighlight, GridBackground, BackgroundGradient | Decorative background components for landing pages and hero sections |
| **brand** | Logo, Wordmark, LogoMark | MCV.ONE brand assets and venture-specific brand components |
| **shared** | (types.ts) ComponentSize, SemanticColor, TrendDirection, Sentiment, StatusType, ProcessStatus, Placement, AnimationPreset, BaseComponentProps, FieldProps | Shared TypeScript types ensuring consistency across all 508 components |
| **lib** | cn(), formatCurrency(), formatCompact(), formatRelativeTime(), debounce(), generateId(), getStatusColor() | Core utility functions — `cn()` is the cornerstone (clsx + twMerge) |
| **styles** | theme.css (460+ lines) | CSS custom properties defining the complete design token system |
| **theme** | ThemeToggle, ThemeSwitch, ThemeIndicator, ThemeCustomizerProvider, AccentColorPicker, RadiusSelector, FontScaleSelector, ThemeCustomizerPanel, ThemePreview | Runtime theme switching (light/dark/system) and live customization UI |
| **animation** | Motion components, transitions | Framer Motion animation wrappers and presets |
| **interactions** | Click handlers, hover states | Interaction pattern utilities |

#### Form & Input (7 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **form** | Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, TextInput, EmailInput, PasswordInput, NumberInput, CurrencyInput, Checkbox, Radio, Toggle, Switch, Slider, RangeSlider, Textarea, Select, Combobox, AsyncCombobox, Dropzone, TagsInput, ColorPicker, Rating, SearchInput, DateRangePicker, FilterBar, FilterChip, MultiSelectDropdown, WizardForm, MaskedInput, PhoneInput, CreditCardInput, SingleDatePicker, CodeInput, OTPInput, AddressInput, InlineEditor, AdvancedFilter, BulkEditor, FieldArray, DependentField, AsyncFieldValidator, FormValidationSummary, SplitForm, AccordionForm, TabbedForm | **130+** |
| **input** | Core input primitives | Base input components |
| **inline-edit** | Inline editing patterns | Click-to-edit components |
| **filters** | Filter compositions | Multi-filter UIs |
| **selection** | Selection patterns | List and grid selection |
| **search** | Search components | Search input with suggestions |
| **settings** | Settings UI patterns | Toggle settings, preference panels |

#### Data Display (10 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **data** | TanStackTable (wrapping @tanstack/react-table), createSelectionColumn, createActionsColumn, StatsCard, StatsGrid, LargeStat, ComparisonStat, TrendChip | **30+** |
| **table** | TableToolbar, RowActions, BulkActionBar, Pagination, DataRow, PipelineRow, IncidentRow, CurrencyCell, DateCell, StatusCell, BadgeCell, ProgressCell, LinkCell, TrendCell, ColumnVisibilityToggle, SortableHeader, ExportMenu, ExpandableRow, EditableRow, VirtualizedTable, TreeTable, ColumnCustomizer, SavedViews | **65+** |
| **charts** | AreaChart, BarChart, DonutChart, PieChart, Sparkline, SparklineBar, TrendSparkline, MiniSparkline, KpiCard, KpiGrid, SimpleKpi, CompactKpi, HeatmapChart, CalendarHeatmap, TreemapChart, ScatterChart, BubbleChart | **40+** |
| **data-patterns** | MetricCard, KeyValue, ErrorBoundary, loading skeletons | Data composition patterns |
| **metrics** | Metric display components | KPI and metric visualizations |
| **indicators** | Status dots, progress indicators | Visual state indicators |
| **comparison** | Side-by-side comparison views | Diff and comparison components |
| **diff** | Change diff visualization | Code and data diff views |
| **data-import** | Import wizard, file mapping | Data ingestion UI |
| **grid** | BentoGrid, data grid layouts | Grid-based data layouts |

#### Cards & Content (8 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **cards** | ActionCard, QuickActionCard, FeatureCard, ResourceCard, StatCard, InfoCard, TipCard, SummaryCard, ProfileCard, NotificationCard, ComparisonCard, TrendCard, AlertCard, IntegrationCard, QuotaCard (+ Grid/List variants for each) | **60+** |
| **badges** | Badge variants, StatusBadge | Badge components |
| **chips** | Chip, ChipGroup | Interactive chip/tag elements |
| **blocks** | Content block patterns | Rich content blocks |
| **code** | CodeBlock, InlineCode | Code display with syntax highlighting |
| **code-display** | Enhanced code display | Terminal-style code display |
| **callout** | Banner, Announcement, FeatureAnnouncement | Attention-drawing components |
| **marketing** | ScrollingBanner, Testimonials | Marketing-specific components |

#### Timeline & Activity (3 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **timeline** | ActivityItem, ActivityFeed, ActivityFeedEnhanced, TimelineItem, Timeline, AuditLogEntry, ChangelogItem, EventCalendar, GanttMini, LiveFeed, VersionHistory, EventAggregator, CollaborationStack, TimelineScrubber, PlaybackControls, ActivityDigest, EventClustering, CausalityTimeline, ActivityAnalytics, CommentsTimeline | **100+** |
| **activity** | Activity stream components | Real-time activity displays |
| **comments** | Comment, CommentThread, ReactionBar, MentionBadge, MentionList | **15+** |

#### Navigation (5 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **navigation** | CommandMenu, CommandInput, CommandGroup, useCommandMenu | **10+** |
| **nav** | Navigation bar components | Top and side navigation |
| **tabs** | TabbedContainer, TabbedCardGrid, StatusTabs, CategoryTabs | **12+** |
| **scroll** | Scroll area, infinite scroll | Scroll management components |
| **carousel** | Image/content carousel | Swipeable carousel |

#### Feedback & Overlays (5 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **feedback** | Alert, InlineAlert, AlertList, ConfirmDialog, DeleteConfirmDialog, UnsavedChangesDialog, ProgressBar, CircularProgress, StepProgress, UploadProgress, Toast helpers (showSuccessToast, showErrorToast, etc.), SuccessState, LoadingState, InlineLoading | **40+** |
| **notifications** | Notification system | Push-style notification components |
| **overlay** | Overlay primitives | Modal and overlay base |
| **progress** | Progress indicators | Loading and progress bars |
| **skeletons** | CardSkeleton, GridSkeleton, ListSkeleton, TableSkeleton | Loading placeholder patterns |

#### AI & Intelligence (1 category)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **ai** | Terminal, useTerminal, Chatbot, useChat, VoiceInput, VoiceButton, VoiceWaveform, VoiceTranscript, VoiceAssistant, useVoice, StreamingText, TypewriterText, StreamingMarkdown, TextReveal, ToolCall, ToolCallList, ThinkingIndicator, ThinkingBubble, ProcessingIndicator, AIMessage, SystemMessage | **40+** |

#### Project Management & Workflow (4 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **project-management** | KanbanBoard, Calendar, MiniCalendar, GanttChart, ListView, SimpleList | **20+** |
| **workflow** | WorkflowCanvas, EnhancedWorkflowNode, NodePalette, nodeTypeConfigs, createWorkflowNode, createWorkflowEdge | **15+** |
| **pipeline** | PipelineProgress, ApprovalPipeline | Pipeline visualization |
| **dashboard** | WidgetContainer, WidgetGrid, SimpleDashboardGrid, useWidgetGrid, MetricDashboard | **15+** |

#### Domain-Specific (8 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **domain** | PipelineItem, IncidentCard, ResourceBar, ResourceGrid, CampaignRow, MarketingMetric, ToolCard, ContentPiece, CampaignGrid | **20+** |
| **finance** | CreditCard, Ticker | Financial display components |
| **identity** | Avatar, UserCard, PermissionBadge, AgentBadge | User/agent identity |
| **users** | User list and profile components | User management UI |
| **presence** | Online/offline indicators | Real-time presence |
| **locale** | Localization components | i18n-aware components |
| **files** | File browser, preview | File management UI |
| **onboarding** | TourProvider, TourTooltip, TourOverlay, Spotlight, MultiSpotlight, OnboardingChecklist, CoachMark, WelcomeModal | **20+** |

#### Patterns & Shells (3 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **patterns/shell** | AppShell, Header, Sidebar | Application shell layout |
| **page** | PageHeader, CompactPageHeader, Breadcrumbs, PageSection, SectionDivider, EmptyState, EmptyList, NoSearchResults, ErrorState, OfflineState, UnauthorizedState, WelcomeState, ComingSoonState, ContentShell, PageContainer, SplitLayout, GridLayout, StackLayout | **30+** |
| **inspector** | DetailDrawer, DrawerSection, DrawerKeyValue, SplitPaneLayout, MasterDetail | Inspector/detail panels |

#### Utility & Support (7 categories)

| Category | Key Components | Exports |
|----------|---------------|---------|
| **utility** | Status, StatusIndicator, ActivityStatus, HealthStatus, RelativeTime, Timestamp, Countdown, Spinner, LoadingOverlay, Skeleton, CopyButton, CopyField, CopyText, CopyCodeBlock, KeyboardShortcut, ShortcutHint, ShortcutWithLabel, ShortcutList, ShortcutsPanel | **30+** |
| **drag-drop** | Drag and drop interactions | DnD primitives |
| **generators** | Component generators | Dynamic component creation |
| **query-builder** | Visual query builder | Query construction UI |
| **3d** | 3D visualization | Three.js-based components |
| **media** | ImageZoom, VideoPlayer, Stories | Media playback and display |
| **controls** | Interactive controls | Specialized control widgets |

---

## Core TypeScript Interfaces

### Shared Type System (`shared/types.ts`)

Every component in the library references this shared type system for consistency:

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SIZE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Standard component sizes — used by Button, Input, Badge, Chip, etc. */
type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Compact variants — used by StatusIndicator, CompactKpi, etc. */
type CompactSize = 'sm' | 'md' | 'lg';

/** Text sizes — used by Heading, Text, Caption, etc. */
type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Interactive element variants — buttons, links, toggles */
type InteractiveVariant = 'solid' | 'outline' | 'ghost' | 'flat' | 'link';

/** Container variants — cards, panels, surfaces */
type CardVariant = 'default' | 'bordered' | 'gradient' | 'glass' | 'minimal';

/** Input variants — text fields, selects, textareas */
type InputVariant = 'default' | 'bordered' | 'filled' | 'underlined';

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Semantic colors — consistent across all components */
type SemanticColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/** Extended palette — includes info and muted */
type ExtendedColor = SemanticColor | 'info' | 'muted';

/** Brand colors for OAuth/social buttons */
type BrandColor =
  | 'google' | 'github' | 'twitter' | 'facebook' | 'apple'
  | 'microsoft' | 'linkedin' | 'discord' | 'slack' | 'notion';

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS & SENTIMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** Trend direction — used by KpiCard, TrendChip, StatCard */
type TrendDirection = 'up' | 'down' | 'neutral';

/** Sentiment — used by metrics, stats, and analytics components */
type Sentiment = 'positive' | 'negative' | 'neutral';

/** Status indicators — used by StatusBadge, StatusCell, PipelineRow */
type StatusType =
  | 'success' | 'error' | 'warning' | 'info'
  | 'pending' | 'inactive' | 'active';

/** Process/workflow status — used by WorkflowCanvas, PipelineProgress */
type ProcessStatus =
  | 'idle' | 'pending' | 'running' | 'success' | 'error' | 'cancelled';

/** Step status — used by WizardForm, StepProgress, OnboardingChecklist */
type StepStatus = 'pending' | 'current' | 'completed' | 'error' | 'skipped';

// ═══════════════════════════════════════════════════════════════════════════════
// POSITION & LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

/** Side positions — for drawer, toast, sidebar placement */
type Side = 'top' | 'right' | 'bottom' | 'left';

/** Tooltip/popover placement with alignment */
type Placement =
  | 'top' | 'top-start' | 'top-end'
  | 'right' | 'right-start' | 'right-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end';

/** Layout orientation — horizontal/vertical variants */
type Orientation = 'horizontal' | 'vertical';

/** Spacing scale — used by StackLayout, GridLayout, PageSection */
type SpacingScale = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Border radius presets — used by all rounded components */
type RadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON PROP PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/** Base props shared by most components */
interface BaseComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

/** Loadable mixin — components that show loading state */
interface LoadableProps {
  isLoading?: boolean;
  loadingContent?: React.ReactNode;
}

/** Disableable mixin — interactive components */
interface DisableableProps {
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

/** Errorable mixin — form fields with validation */
interface ErrorableProps {
  isInvalid?: boolean;
  errorMessage?: string;
}

/** Complete form field props — combines all mixins */
interface FieldProps extends BaseComponentProps, DisableableProps, ErrorableProps {
  label?: string;
  helperText?: string;
  isRequired?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Make specific properties required */
type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make specific properties optional */
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Extract array element type */
type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;
```

### Key Component Props

#### Button Props

```typescript
interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  isDisabled?: boolean;
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  spinner?: React.ReactNode;
  spinnerPlacement?: 'start' | 'end';
  disableRipple?: boolean;
  disableAnimation?: boolean;
  fullWidth?: boolean;
  isIconOnly?: boolean;
  asChild?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  className?: string;
  children?: React.ReactNode;
}
```

#### Chatbot Props

```typescript
interface ChatbotProps {
  messages: ChatMessage[];
  onSend?: (content: string, attachments?: ChatAttachment[]) => void;
  onStop?: () => void;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  placeholder?: string;
  isStreaming?: boolean;
  disabled?: boolean;
  showAttachments?: boolean;
  showVoiceInput?: boolean;
  showFeedback?: boolean;
  showMetadata?: boolean;
  botName?: string;
  botAvatar?: ReactNode;
  userAvatar?: ReactNode;
  suggestedPrompts?: string[];
  onSuggestedPromptClick?: (prompt: string) => void;
  renderMessage?: (message: ChatMessage) => ReactNode;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error' | 'streaming';
  attachments?: ChatAttachment[];
  metadata?: { tokens?: number; model?: string; latency?: number };
}
```

#### AreaChart Props

```typescript
interface AreaChartProps {
  data: AreaChartDataPoint[];
  series: AreaChartSeries[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curveType?: 'linear' | 'monotone' | 'step';
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  showDots?: boolean;
  gradient?: boolean;
}

interface AreaChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  fillOpacity?: number;
  stackId?: string;
}
```

#### WorkflowCanvas Props

```typescript
interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange?: (nodes: WorkflowNode[]) => void;
  onEdgesChange?: (edges: WorkflowEdge[]) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onConnect?: (connection: { source: string; target: string }) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  readOnly?: boolean;
  showGrid?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  className?: string;
  children?: ReactNode;
}

interface WorkflowNode {
  id: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  selected?: boolean;
  dragging?: boolean;
}

interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
  type?: 'default' | 'straight' | 'step' | 'smoothstep';
}
```

#### Dialog Props (Radix Primitive)

```typescript
interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

// Compound component exports:
// Dialog, DialogTrigger, DialogPortal, DialogClose,
// DialogOverlay, DialogContent, DialogHeader, DialogFooter,
// DialogTitle, DialogDescription
```

#### TanStack Table Integration

```typescript
// Re-exports from @tanstack/react-table + MCV wrapper:
export {
  TanStackTable,              // MCV-styled table wrapper
  createSelectionColumn,      // Row selection column factory
  createActionsColumn,        // Row actions column factory
  useReactTable,              // TanStack hook (re-exported)
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
  type Row,
  type Table,
};
```

#### Theme Configuration

```typescript
interface ThemeConfig {
  accentColor: AccentColor;
  radius: RadiusPreset;
  fontScale: number;
}

interface ThemeCustomizerContextValue {
  config: ThemeConfig;
  setAccentColor: (color: AccentColor) => void;
  setRadius: (radius: RadiusPreset) => void;
  setFontScale: (scale: number) => void;
  reset: () => void;
}
```

---

## Design Token System

### CSS Custom Properties (`styles/theme.css`)

The design token system is built entirely on CSS custom properties, enabling runtime theming and venture-specific overrides:

```css
:root {
  /* ═══════════════════════════════════════════════════════════════════════════
     BRAND COLORS
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-primary: #6366f1;           /* Indigo — MCV brand */
  --mcv-primary-dark: #4f46e5;
  --mcv-secondary: #8b5cf6;         /* Violet */
  --mcv-accent: #10b981;            /* Emerald */

  /* ═══════════════════════════════════════════════════════════════════════════
     BACKGROUND SCALE (dark-first design)
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-bg-dark: #0a0a0f;           /* Page background */
  --mcv-bg-darker: #050508;         /* Deepest background */
  --mcv-bg-surface: #111118;        /* Card/panel surface */
  --mcv-bg-surface-hover: #1a1a24;  /* Surface hover state */
  --mcv-bg-elevated: #18181b;       /* Elevated surface */

  /* ═══════════════════════════════════════════════════════════════════════════
     BORDER SCALE
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-border: #27272a;            /* Default border */
  --mcv-border-light: #3f3f46;      /* Light border */
  --mcv-border-focus: #6366f1;      /* Focus ring color */

  /* ═══════════════════════════════════════════════════════════════════════════
     TEXT SCALE
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-text-primary: #fafafa;      /* Primary text */
  --mcv-text-secondary: #a1a1aa;    /* Secondary text */
  --mcv-text-muted: #71717a;        /* Muted/placeholder */
  --mcv-text-disabled: #52525b;     /* Disabled text */

  /* ═══════════════════════════════════════════════════════════════════════════
     SEMANTIC COLORS
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-success: #10b981;           /* Emerald */
  --mcv-warning: #f59e0b;           /* Amber */
  --mcv-danger: #ef4444;            /* Red */
  --mcv-info: #3b82f6;              /* Blue */

  /* ═══════════════════════════════════════════════════════════════════════════
     VENTURE BRAND COLORS (9 ventures)
     ═══════════════════════════════════════════════════════════════════════════ */
  --venture-antigravity: #8b5cf6;   /* Violet */
  --venture-betedge: #f59e0b;       /* Amber */
  --venture-samba: #ec4899;         /* Pink */
  --venture-crypto: #10b981;        /* Emerald */
  --venture-qubic: #3b82f6;        /* Blue */
  --venture-swarm: #6366f1;        /* Indigo */
  --venture-hitl: #ef4444;          /* Red */
  --venture-infraforge: #6b7280;    /* Gray */
  --venture-holdings: #1f2937;      /* Dark gray */

  /* ═══════════════════════════════════════════════════════════════════════════
     LAYOUT TOKENS
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-sidebar-width: 260px;
  --mcv-sidebar-collapsed: 72px;
  --mcv-header-height: 56px;
  --mcv-module-nav-width: 240px;

  /* ═══════════════════════════════════════════════════════════════════════════
     MOTION TOKENS
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-transition-fast: 150ms;
  --mcv-transition-normal: 300ms;
  --mcv-transition-slow: 500ms;

  /* ═══════════════════════════════════════════════════════════════════════════
     ELEVATION (SHADOWS)
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --mcv-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --mcv-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --mcv-shadow-glow: 0 0 20px rgba(99, 102, 241, 0.4);

  /* ═══════════════════════════════════════════════════════════════════════════
     BORDER RADIUS
     ═══════════════════════════════════════════════════════════════════════════ */
  --mcv-radius-sm: 0.375rem;        /* 6px */
  --mcv-radius-md: 0.5rem;          /* 8px */
  --mcv-radius-lg: 0.75rem;         /* 12px */
  --mcv-radius-xl: 1rem;            /* 16px */
}
```

### Venture Theme Overrides

Each MCV venture overrides the primary color via `data-venture` attribute:

```css
[data-venture="betedge"] {
  --primary-h: 142;
  --primary-s: 71%;
  --primary-l: 45%;
}

[data-venture="serpspace"] {
  --primary-h: 262;
  --primary-s: 83%;
  --primary-l: 58%;
}
```

### Dark/Light Mode

The theme system supports light, dark, and system preference modes:

```css
:root {
  /* Light mode defaults */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --border: 214 32% 91%;
  --ring: 222 47% 50%;
}

.dark {
  --background: 222 47% 5%;
  --foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --border: 217 33% 17%;
}
```

### Component-Level Tokens

```css
/* Sidebar */
.mcv-sidebar {
  background: var(--mcv-bg-surface);
  border-right: 1px solid var(--mcv-border);
  width: var(--mcv-sidebar-width);
  transition: width var(--mcv-transition-normal) ease;
}

/* KPI Cards */
.mcv-kpi-card {
  background: linear-gradient(to bottom right, var(--mcv-bg-surface), transparent);
  border: 1px solid var(--mcv-border);
  border-radius: var(--mcv-radius-xl);
}

/* Status Dots (with glow) */
.mcv-status-dot--online {
  background: var(--mcv-success);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}
```

---

## Code Examples

### Example 1: Basic Button Usage

```tsx
import { Button } from '@mcv/ui';
import { Plus, Settings } from 'lucide-react';

// Solid button with icon
<Button startContent={<Plus className="w-4 h-4" />}>
  Create Project
</Button>

// Outline variant
<Button variant="outline" color="primary" size="lg">
  Large Outline Button
</Button>

// Loading state
<Button isLoading spinnerPlacement="start">
  Submitting...
</Button>

// Icon-only button
<Button isIconOnly variant="ghost" aria-label="Settings">
  <Settings className="w-4 h-4" />
</Button>

// Full-width gradient
<Button variant="gradient" fullWidth color="success">
  Complete Purchase
</Button>
```

### Example 2: Theme Provider & Venture Theming

```tsx
import { ThemeCustomizerProvider, ThemeToggle, useThemeCustomizer } from '@mcv/ui';

// Wrap your app
function App() {
  return (
    <ThemeCustomizerProvider>
      <div data-venture="betedge" className="min-h-screen bg-background">
        <Header />
        <MainContent />
      </div>
    </ThemeCustomizerProvider>
  );
}

// Theme toggle in header
function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <Logo />
      <ThemeToggle />  {/* Light / Dark / System toggle */}
    </header>
  );
}

// Customizer panel for admin
function AdminSettings() {
  const { config, setAccentColor, setRadius, reset } = useThemeCustomizer();

  return (
    <div className="space-y-4">
      <AccentColorPicker value={config.accentColor} onChange={setAccentColor} />
      <RadiusSelector value={config.radius} onChange={setRadius} />
      <Button variant="ghost" onClick={reset}>Reset to Defaults</Button>
    </div>
  );
}
```

### Example 3: React Hook Form + Zod Validation

```tsx
import { z } from 'zod';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
  TextInput, Select, Checkbox, Button, useForm,
} from '@mcv/ui';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']),
  newsletter: z.boolean().default(false),
});

type UserForm = z.infer<typeof userSchema>;

function CreateUserForm() {
  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: 'viewer', newsletter: false },
  });

  const onSubmit = async (data: UserForm) => {
    await createUser(data);
    showSuccessToast('User created successfully');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <TextInput placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <TextInput type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Select
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newsletter"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Subscribe to newsletter</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" isLoading={form.formState.isSubmitting}>
          Create User
        </Button>
      </form>
    </Form>
  );
}
```

### Example 4: TanStack Table with Toolbar & Actions

```tsx
import {
  TanStackTable, useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
  createSelectionColumn, createActionsColumn,
  TableToolbar, BulkActionBar, Pagination,
  type ColumnDef, type SortingState,
} from '@mcv/ui';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

const columns: ColumnDef<User>[] = [
  createSelectionColumn<User>(),
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar name={row.original.name} size="sm" />
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusCell status={row.original.status} />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => <DateCell date={row.original.createdAt} format="relative" />,
  },
  createActionsColumn<User>({
    actions: [
      { label: 'Edit', onClick: (row) => editUser(row.id) },
      { label: 'Delete', onClick: (row) => deleteUser(row.id), variant: 'danger' },
    ],
  }),
];

function UsersTable({ users }: { users: User[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search users..."
        onSearch={(query) => table.setGlobalFilter(query)}
        actions={[
          { label: 'Export', icon: Download, onClick: handleExport },
          { label: 'Add User', icon: Plus, onClick: handleAdd, variant: 'primary' },
        ]}
      />

      {selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          actions={[
            { label: 'Deactivate', onClick: () => bulkDeactivate(rowSelection) },
            { label: 'Delete', onClick: () => bulkDelete(rowSelection), variant: 'danger' },
          ]}
          onClearSelection={() => setRowSelection({})}
        />
      )}

      <TanStackTable table={table} />

      <Pagination
        currentPage={table.getState().pagination.pageIndex + 1}
        totalPages={table.getPageCount()}
        onPageChange={(page) => table.setPageIndex(page - 1)}
      />
    </div>
  );
}
```

### Example 5: Charts Dashboard Assembly

```tsx
import {
  AreaChart, BarChart, DonutChart, KpiCard, KpiGrid,
  Sparkline, HeatmapChart, ScatterChart,
} from '@mcv/ui';

function AnalyticsDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <KpiGrid columns={4}>
        <KpiCard
          title="Total Revenue"
          value="$1.2M"
          change={12.5}
          trend="up"
          sentiment="positive"
          sparklineData={data.revenueSparkline}
        />
        <KpiCard
          title="Active Users"
          value="45.2K"
          change={-3.1}
          trend="down"
          sentiment="negative"
        />
        <KpiCard
          title="Conversion Rate"
          value="3.8%"
          change={0.5}
          trend="up"
          sentiment="positive"
        />
        <KpiCard
          title="Avg Response Time"
          value="142ms"
          change={-15}
          trend="down"
          sentiment="positive"
        />
      </KpiGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        <AreaChart
          data={data.revenueTimeSeries}
          series={[
            { dataKey: 'revenue', name: 'Revenue', color: '#6366f1' },
            { dataKey: 'projections', name: 'Projected', color: '#a5b4fc', fillOpacity: 0.1 },
          ]}
          xAxisKey="month"
          height={300}
          gradient
          showLegend
          yAxisFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
        />

        <BarChart
          data={data.departmentSpend}
          series={[
            { dataKey: 'budget', name: 'Budget', color: '#10b981' },
            { dataKey: 'actual', name: 'Actual', color: '#ef4444' },
          ]}
          xAxisKey="department"
          height={300}
          showLegend
        />
      </div>

      {/* Distribution & Heatmap */}
      <div className="grid grid-cols-3 gap-6">
        <DonutChart
          data={data.trafficSources}
          height={250}
          innerRadius={60}
          showLabels
        />
        <div className="col-span-2">
          <HeatmapChart
            data={data.activityHeatmap}
            xAxisKey="hour"
            yAxisKey="day"
            valueKey="count"
            height={250}
          />
        </div>
      </div>
    </div>
  );
}
```

### Example 6: AI Chatbot with Streaming

```tsx
import {
  Chatbot, useChat, StreamingText, ToolCall, ThinkingIndicator,
  VoiceInput, useVoice,
} from '@mcv/ui';

function AIChatInterface() {
  const {
    messages, sendMessage, isStreaming, clearMessages,
  } = useChat({
    endpoint: '/api/chat',
    model: 'auto',
  });

  return (
    <div className="flex flex-col h-[600px]">
      <Chatbot
        messages={messages}
        onSend={(content) => sendMessage(content)}
        onStop={() => {/* abort streaming */}}
        isStreaming={isStreaming}
        botName="MCV Assistant"
        botAvatar={<BotAvatar />}
        showFeedback
        showVoiceInput
        showMetadata
        suggestedPrompts={[
          'Show me today\'s revenue metrics',
          'What\'s the deployment status?',
          'Summarize the latest incidents',
        ]}
        onSuggestedPromptClick={(prompt) => sendMessage(prompt)}
      />
    </div>
  );
}

// Custom message rendering with tool calls
function CustomAIChat() {
  const { messages, sendMessage, isStreaming } = useChat({ endpoint: '/api/chat' });

  return (
    <Chatbot
      messages={messages}
      onSend={sendMessage}
      isStreaming={isStreaming}
      renderMessage={(message) => (
        <div>
          {message.role === 'assistant' && isStreaming ? (
            <StreamingText text={message.content} speed={30} cursor />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: message.content }} />
          )}

          {/* Tool calls inline */}
          {message.metadata?.toolCalls?.map((tc) => (
            <ToolCall
              key={tc.id}
              name={tc.name}
              status={tc.status}
              args={tc.args}
              result={tc.result}
            />
          ))}
        </div>
      )}
    />
  );
}
```

### Example 7: Workflow Canvas Builder

```tsx
import {
  WorkflowCanvas, EnhancedWorkflowNode, NodePalette,
  nodeTypeConfigs, createWorkflowNode, createWorkflowEdge,
  type WorkflowNode, type WorkflowEdge,
} from '@mcv/ui';

function WorkflowBuilder() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    createWorkflowNode('trigger-1', 'trigger', { x: 100, y: 100 }, {
      label: 'Webhook Trigger',
      description: 'Receives incoming HTTP requests',
      status: 'completed',
    }),
    createWorkflowNode('process-1', 'process', { x: 400, y: 100 }, {
      label: 'Transform Data',
      description: 'Map and validate payload',
      status: 'running',
    }),
    createWorkflowNode('output-1', 'output', { x: 700, y: 100 }, {
      label: 'Send to API',
      description: 'POST to external service',
      status: 'idle',
    }),
  ]);

  const [edges, setEdges] = useState<WorkflowEdge[]>([
    createWorkflowEdge('e1', 'trigger-1', 'process-1', { animated: true }),
    createWorkflowEdge('e2', 'process-1', 'output-1'),
  ]);

  const handleAddNode = (type: string) => {
    const newNode = createWorkflowNode(
      `node-${Date.now()}`,
      type,
      { x: 300, y: 300 },
      { label: `New ${type}`, status: 'idle' }
    );
    setNodes([...nodes, newNode]);
  };

  return (
    <div className="flex h-[600px] border rounded-xl overflow-hidden">
      {/* Node palette sidebar */}
      <NodePalette
        configs={nodeTypeConfigs}
        onAddNode={handleAddNode}
        className="w-64 border-r"
      />

      {/* Canvas */}
      <WorkflowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        onConnect={({ source, target }) => {
          const edge = createWorkflowEdge(`e-${Date.now()}`, source, target);
          setEdges([...edges, edge]);
        }}
        onNodeSelect={(id) => console.log('Selected:', id)}
        showGrid
        showMinimap
        showControls
        snapToGrid
        gridSize={20}
      />
    </div>
  );
}
```

### Example 8: Dashboard with Widget Grid

```tsx
import {
  WidgetGrid, WidgetContainer, MetricDashboard, useWidgetGrid,
  AreaChart, KpiCard, TanStackTable,
  type WidgetConfig, type WidgetDefinition,
} from '@mcv/ui';

const widgetDefinitions: WidgetDefinition[] = [
  { id: 'revenue', type: 'chart', title: 'Revenue Trend', defaultSize: { w: 2, h: 1 } },
  { id: 'users', type: 'metric', title: 'Active Users', defaultSize: { w: 1, h: 1 } },
  { id: 'incidents', type: 'table', title: 'Recent Incidents', defaultSize: { w: 2, h: 2 } },
  { id: 'health', type: 'status', title: 'System Health', defaultSize: { w: 1, h: 1 } },
];

function CustomDashboard() {
  const { layout, moveWidget, resizeWidget, addWidget, removeWidget } = useWidgetGrid({
    widgets: widgetDefinitions,
    columns: 4,
    storageKey: 'admin-dashboard',
  });

  return (
    <WidgetGrid
      layout={layout}
      onLayoutChange={moveWidget}
      columns={4}
      gap={16}
    >
      <WidgetContainer
        title="Revenue Trend"
        actions={[
          { label: 'Export', onClick: handleExport },
          { label: 'Fullscreen', onClick: handleFullscreen },
        ]}
      >
        <AreaChart
          data={revenueData}
          series={[{ dataKey: 'revenue', color: '#6366f1' }]}
          xAxisKey="date"
          height={200}
          gradient
        />
      </WidgetContainer>

      <WidgetContainer title="Active Users">
        <KpiCard
          title="Active Users"
          value="45.2K"
          change={12.5}
          trend="up"
          sentiment="positive"
        />
      </WidgetContainer>

      <WidgetContainer title="Recent Incidents">
        <TanStackTable table={incidentTable} />
      </WidgetContainer>
    </WidgetGrid>
  );
}
```

### Example 9: Command Menu (⌘K)

```tsx
import { CommandMenu, useCommandMenu, type CommandItem } from '@mcv/ui';
import { Search, Settings, Users, FileText, BarChart3 } from 'lucide-react';

function AppCommandMenu() {
  const { isOpen, open, close, search, setSearch, filteredItems } = useCommandMenu({
    items: [
      {
        id: 'dashboard',
        label: 'Go to Dashboard',
        icon: BarChart3,
        shortcut: '⌘D',
        action: () => router.push('/dashboard'),
        group: 'Navigation',
      },
      {
        id: 'users',
        label: 'Manage Users',
        icon: Users,
        shortcut: '⌘U',
        action: () => router.push('/users'),
        group: 'Navigation',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        action: () => router.push('/settings'),
        group: 'Navigation',
      },
      {
        id: 'create-project',
        label: 'Create New Project',
        icon: FileText,
        action: () => openCreateProjectDialog(),
        group: 'Actions',
      },
    ],
  });

  return (
    <CommandMenu
      isOpen={isOpen}
      onClose={close}
      search={search}
      onSearchChange={setSearch}
      placeholder="Search commands, pages, actions..."
    >
      {Object.entries(groupBy(filteredItems, 'group')).map(([group, items]) => (
        <CommandGroup key={group} heading={group}>
          {items.map((item) => (
            <CommandItemComponent
              key={item.id}
              item={item}
              onSelect={() => { item.action(); close(); }}
            />
          ))}
        </CommandGroup>
      ))}
    </CommandMenu>
  );
}
```

### Example 10: Full Page Composition

```tsx
import {
  PageHeader, PageSection, ContentShell,
  EmptyState, Breadcrumbs, TabContainer,
  showSuccessToast,
} from '@mcv/ui';

function ProjectPage({ project }: { project: Project }) {
  return (
    <ContentShell>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]}
      />

      <PageHeader
        title={project.name}
        description={project.description}
        actions={[
          { label: 'Edit', onClick: handleEdit },
          { label: 'Deploy', onClick: handleDeploy, variant: 'primary' },
        ]}
      />

      <TabbedContainer
        tabs={[
          { id: 'overview', label: 'Overview', content: <ProjectOverview /> },
          { id: 'settings', label: 'Settings', content: <ProjectSettings /> },
          { id: 'activity', label: 'Activity', content: <ActivityFeed /> },
        ]}
      />
    </ContentShell>
  );
}

// Empty state when no projects exist
function ProjectsEmptyState() {
  return (
    <EmptyState
      icon={<FolderOpen className="w-12 h-12" />}
      title="No projects yet"
      description="Get started by creating your first project"
      action={{
        label: 'Create Project',
        onClick: handleCreate,
      }}
    />
  );
}
```

### Example 11: Kanban Board with Drag & Drop

```tsx
import {
  KanbanBoard,
  type KanbanColumn, type KanbanItem,
} from '@mcv/ui';

function TaskBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'todo',
      title: 'To Do',
      items: [
        { id: '1', title: 'Design mockups', assignee: 'Alice', priority: 'high' },
        { id: '2', title: 'Write tests', assignee: 'Bob', priority: 'medium' },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      items: [
        { id: '3', title: 'Build API', assignee: 'Charlie', priority: 'high' },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      items: [],
    },
  ]);

  return (
    <KanbanBoard
      columns={columns}
      onDragEnd={(result) => {
        // Handle reordering
        const updated = moveItem(columns, result);
        setColumns(updated);
      }}
      renderItem={(item) => (
        <div className="p-3 bg-card rounded-lg border">
          <h4 className="font-medium">{item.title}</h4>
          <div className="flex items-center justify-between mt-2">
            <Avatar name={item.assignee} size="xs" />
            <Badge color={priorityColor(item.priority)}>{item.priority}</Badge>
          </div>
        </div>
      )}
    />
  );
}
```

### Example 12: Onboarding Tour

```tsx
import {
  TourProvider, useTour, Spotlight, OnboardingChecklist,
  CoachMark, WelcomeModal,
  type TourStepConfig,
} from '@mcv/ui';

const tourSteps: TourStepConfig[] = [
  {
    target: '#sidebar',
    title: 'Navigation',
    content: 'Use the sidebar to navigate between modules',
    placement: 'right',
  },
  {
    target: '#search-bar',
    title: 'Quick Search',
    content: 'Press ⌘K to search anything',
    placement: 'bottom',
  },
  {
    target: '#create-button',
    title: 'Create Resources',
    content: 'Click here to create new projects, users, and more',
    placement: 'left',
  },
];

function OnboardingFlow() {
  return (
    <TourProvider steps={tourSteps}>
      <WelcomeModal
        slides={[
          { title: 'Welcome to MCV.ONE', description: 'Your enterprise command center', image: '/welcome-1.png' },
          { title: 'Powerful Dashboard', description: 'Real-time metrics at your fingertips', image: '/welcome-2.png' },
        ]}
      />

      <OnboardingChecklist
        tasks={[
          { id: 'profile', label: 'Complete your profile', completed: true },
          { id: 'tour', label: 'Take the product tour', completed: false },
          { id: 'project', label: 'Create your first project', completed: false },
          { id: 'invite', label: 'Invite a team member', completed: false },
        ]}
      />

      <AppContent />
    </TourProvider>
  );
}
```

### Example 13: Application Shell (Full Layout)

```tsx
import {
  AppShell, Header, Sidebar,
  ThemeToggle, CommandMenu, useCommandMenu,
} from '@mcv/ui';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const commandMenu = useCommandMenu({ items: navigationItems });

  return (
    <AppShell>
      <Sidebar
        logo={<Logo />}
        sections={[
          {
            label: 'Main',
            items: [
              { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
              { icon: Users, label: 'Users', href: '/users' },
              { icon: Settings, label: 'Settings', href: '/settings' },
            ],
          },
          {
            label: 'Ventures',
            items: ventures.map((v) => ({
              icon: Building, label: v.name, href: `/ventures/${v.id}`,
            })),
          },
        ]}
        collapsible
      />

      <div className="flex-1 flex flex-col">
        <Header
          onSearch={commandMenu.open}
          searchShortcut="⌘K"
          actions={[
            <ThemeToggle key="theme" />,
            <NotificationBell key="notif" count={3} />,
            <UserMenu key="user" />,
          ]}
        />

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      <CommandMenu {...commandMenu} />
    </AppShell>
  );
}
```

### Example 14: Timeline with Collaboration

```tsx
import {
  Timeline, ActivityFeed, AuditLogEntry, LiveFeed,
  CollaborationStack, TimelineScrubber,
  type ActivityFeedItem,
} from '@mcv/ui';

function ProjectActivity({ projectId }: { projectId: string }) {
  const activities = useProjectActivities(projectId);

  return (
    <div className="space-y-6">
      {/* Live collaboration indicator */}
      <CollaborationStack
        collaborators={[
          { id: '1', name: 'Alice', avatar: '/alice.jpg', status: 'editing' },
          { id: '2', name: 'Bob', avatar: '/bob.jpg', status: 'viewing' },
        ]}
      />

      {/* Activity feed with filtering */}
      <ActivityFeed
        items={activities}
        renderItem={(item: ActivityFeedItem) => (
          <ActivityItem
            user={item.user}
            action={item.action}
            target={item.target}
            timestamp={item.timestamp}
            metadata={item.metadata}
          />
        )}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Commits', value: 'commit' },
          { label: 'Deployments', value: 'deploy' },
          { label: 'Comments', value: 'comment' },
        ]}
      />

      {/* Audit log for compliance */}
      <div className="space-y-2">
        {auditLogs.map((log) => (
          <AuditLogEntry
            key={log.id}
            actor={log.actor}
            action={log.action}
            target={log.target}
            changes={log.changes}
            timestamp={log.timestamp}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 15: Feedback & Toast System

```tsx
import {
  Alert, InlineAlert, ConfirmDialog, DeleteConfirmDialog,
  showSuccessToast, showErrorToast, showLoadingToast,
  showPromiseToast, showUndoToast, presetToasts,
  ProgressBar, UploadProgress,
} from '@mcv/ui';

function FeedbackExamples() {
  // Alert variants
  return (
    <div className="space-y-4">
      <Alert variant="info" title="System Update">
        A new version is available. Please refresh to update.
      </Alert>

      <InlineAlert variant="warning">
        Your API key expires in 3 days
      </InlineAlert>

      {/* Promise-based toast */}
      <Button onClick={() => {
        showPromiseToast(
          saveData(),
          {
            loading: 'Saving changes...',
            success: 'Changes saved successfully!',
            error: 'Failed to save. Please try again.',
          }
        );
      }}>
        Save Changes
      </Button>

      {/* Undo toast */}
      <Button onClick={() => {
        const item = deleteItem(id);
        showUndoToast('Item deleted', () => restoreItem(item));
      }}>
        Delete Item
      </Button>

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        title="Delete Project"
        description="This will permanently delete the project and all its data."
        confirmText="DELETE"
        onConfirm={handleDelete}
      />

      {/* Upload progress */}
      <UploadProgress
        filename="report.pdf"
        progress={65}
        size="2.4 MB"
        speed="1.2 MB/s"
      />
    </div>
  );
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

All components are designed for WCAG 2.1 Level AA compliance:

| Principle | Implementation |
|-----------|---------------|
| **Perceivable** | All interactive elements have visible focus indicators. Color is never the sole means of conveying information. Contrast ratios meet 4.5:1 for normal text, 3:1 for large text. |
| **Operable** | Full keyboard navigation via Radix UI primitives. Focus trapping in modals/drawers. Skip navigation links. No keyboard traps. |
| **Understandable** | Consistent component behavior across the library. Form validation with visible error messages linked via `aria-describedby`. Predictable navigation patterns. |
| **Robust** | Semantic HTML elements (button, nav, dialog, etc.). ARIA attributes on all interactive components. Works with screen readers (NVDA, JAWS, VoiceOver). |

### Keyboard Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│  Component        │  Key          │  Action                      │
├─────────────────────────────────────────────────────────────────┤
│  Button           │  Enter/Space  │  Activate                    │
│  Dialog           │  Escape       │  Close                       │
│  DropdownMenu     │  ↑/↓          │  Navigate items              │
│                   │  Enter        │  Select item                 │
│                   │  Escape       │  Close menu                  │
│  Tabs             │  ←/→          │  Switch tabs                 │
│  Accordion        │  Enter/Space  │  Toggle section              │
│  CommandMenu      │  ⌘K           │  Open                        │
│                   │  ↑/↓          │  Navigate results            │
│                   │  Enter        │  Execute action              │
│  DataTable        │  ↑/↓          │  Navigate rows               │
│                   │  Space        │  Select row                  │
│  ComboBox         │  ↑/↓          │  Navigate options            │
│                   │  Enter        │  Select option               │
│  Tree             │  ←/→          │  Collapse/expand             │
│                   │  ↑/↓          │  Navigate siblings           │
└─────────────────────────────────────────────────────────────────┘
```

### ARIA Patterns

```tsx
// Dialog — uses Radix DialogPrimitive with proper ARIA
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Settings</Button>
  </DialogTrigger>
  <DialogContent aria-describedby="settings-desc">
    <DialogTitle>Settings</DialogTitle>
    <DialogDescription id="settings-desc">
      Configure your preferences
    </DialogDescription>
    {/* content */}
  </DialogContent>
</Dialog>

// Form field — linked label, description, and error
<FormField>
  <FormLabel htmlFor="email">Email</FormLabel>
  <FormControl>
    <TextInput
      id="email"
      aria-describedby="email-desc email-error"
      aria-invalid={hasError}
      aria-required
    />
  </FormControl>
  <FormDescription id="email-desc">We'll never share your email.</FormDescription>
  <FormMessage id="email-error" role="alert" />
</FormField>

// Status indicator — not relying on color alone
<StatusIndicator status="error">
  <span className="sr-only">Error:</span>
  Service unavailable
</StatusIndicator>
```

### Color Contrast

All text/background combinations in the token system meet WCAG AA ratios:

| Token Pair | Ratio | Rating |
|-----------|-------|--------|
| `--mcv-text-primary` on `--mcv-bg-dark` | 17.4:1 | AAA |
| `--mcv-text-secondary` on `--mcv-bg-dark` | 7.2:1 | AAA |
| `--mcv-text-muted` on `--mcv-bg-dark` | 4.6:1 | AA |
| `--mcv-primary` on `--mcv-bg-dark` | 5.1:1 | AA |
| `--mcv-danger` on `--mcv-bg-dark` | 4.8:1 | AA |
| `--mcv-success` on `--mcv-bg-dark` | 5.3:1 | AA |

---

## Performance

### Code Splitting Strategy

```
┌───────────────────────────────────────────────────────────────────┐
│  Bundle Strategy                                                   │
│                                                                    │
│  ┌─────────────┐  Tree-shakeable barrel exports                    │
│  │  @mcv/ui    │  • Only imported components are bundled           │
│  │  index.ts   │  • Dead code elimination via ESM                  │
│  └──────┬──────┘                                                   │
│         │                                                          │
│  ┌──────┼──────────────────────────────────────────────┐           │
│  │      │  Heavy dependencies loaded on demand          │           │
│  │      ▼                                               │           │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │           │
│  │  │ recharts     │  │ @tanstack/   │  │ framer-   │ │           │
│  │  │ (~45KB gz)   │  │ react-table  │  │ motion    │ │           │
│  │  │              │  │ (~15KB gz)   │  │ (~30KB gz)│ │           │
│  │  │ Only if you  │  │              │  │           │ │           │
│  │  │ use charts   │  │ Only if you  │  │ Animation │ │           │
│  │  │              │  │ use tables   │  │ only      │ │           │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                    │
│  All components marked 'use client' for RSC compatibility          │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### `'use client'` Boundaries

Every component file begins with `'use client'` to declare client component boundaries for Next.js App Router / React Server Components:

```typescript
// packages/ui/src/charts/area-chart.tsx
'use client';

import * as React from 'react';
import { AreaChart as RechartsAreaChart, ... } from 'recharts';
// ...
```

This ensures:
- Server components can import and render UI components without hydration issues
- Tree-shaking works correctly across the RSC boundary
- Bundle splitting is optimized per route

### Lazy Loading Patterns

```tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@mcv/ui';

// Heavy components loaded on demand
const WorkflowCanvas = lazy(() =>
  import('@mcv/ui').then(m => ({ default: m.WorkflowCanvas }))
);

const RichTextEditor = lazy(() =>
  import('@mcv/ui').then(m => ({ default: m.RichTextEditor }))
);

function EditorPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px]" />}>
      <RichTextEditor />
    </Suspense>
  );
}
```

### Bundle Size Budget

| Category | Components | Estimated gzip Size |
|----------|-----------|-------------------|
| Primitives (Radix) | Dialog, Accordion, Tabs, etc. | ~8KB |
| Form components | Input, Select, Checkbox, etc. | ~12KB |
| Data display | Table, Stats, Cells | ~15KB |
| Charts (Recharts) | Area, Bar, Donut, Sparkline, etc. | ~45KB (peer dep) |
| AI components | Chatbot, Voice, Streaming | ~8KB |
| Workflow | Canvas, Nodes | ~6KB |
| Feedback | Alert, Toast, Progress | ~5KB |
| Total (all imported) | 508 components | ~95KB own code + deps |

### Virtualization

Large datasets use virtualized rendering via custom implementations:

```tsx
<VirtualizedTable
  data={largeDataset}     // 100K+ rows
  columns={columns}
  rowHeight={48}
  overscan={5}
  className="h-[600px]"
/>
```

---

## Testing Strategy

### Unit Testing

Component unit tests use React Testing Library with Vitest:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state with aria-busy', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled when isDisabled is true', () => {
    render(<Button isDisabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    expect(container.firstChild).toHaveClass('border');
  });
});
```

### Storybook

Every component has Storybook stories with interactive examples:

```typescript
// charts/area-chart.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { AreaChart } from './area-chart';

const meta: Meta<typeof AreaChart> = {
  title: 'Charts/AreaChart',
  component: AreaChart,
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Responsive area chart with gradient fills' } },
  },
  argTypes: {
    curveType: {
      options: ['linear', 'monotone', 'step'],
      control: { type: 'select' },
    },
    height: { control: { type: 'range', min: 200, max: 600 } },
  },
};

export default meta;
type Story = StoryObj<typeof AreaChart>;

export const Default: Story = {
  args: {
    data: sampleData,
    series: [{ dataKey: 'value', name: 'Revenue', color: '#6366f1' }],
    xAxisKey: 'month',
    height: 300,
    gradient: true,
  },
};

export const Stacked: Story = { /* ... */ };
export const WithoutGrid: Story = { /* ... */ };
export const CustomColors: Story = { /* ... */ };
```

### Visual Regression Testing

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from '../button';

test.describe('Button visual', () => {
  test('default variant', async ({ mount }) => {
    const component = await mount(<Button>Default</Button>);
    await expect(component).toHaveScreenshot('button-default.png');
  });

  test('all variants side by side', async ({ mount }) => {
    const component = await mount(
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="solid">Solid</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="gradient">Gradient</Button>
      </div>
    );
    await expect(component).toHaveScreenshot('button-variants.png');
  });

  test('dark mode', async ({ mount }) => {
    const component = await mount(
      <div className="dark bg-background p-4">
        <Button>Dark Mode Button</Button>
      </div>
    );
    await expect(component).toHaveScreenshot('button-dark.png');
  });
});
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('Button has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Form fields have proper labeling', async () => {
    const { container } = render(
      <FormField>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <TextInput aria-required />
        </FormControl>
        <FormMessage />
      </FormField>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Dialog has proper ARIA attributes', async () => {
    const { container } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Test Coverage Targets

| Category | Target | Strategy |
|----------|--------|----------|
| Primitives (Radix wrappers) | 95% | Unit + a11y |
| Form components | 90% | Unit + integration + a11y |
| Data display | 85% | Unit + visual regression |
| Charts | 80% | Visual regression + snapshot |
| AI components | 85% | Unit + integration |
| Page patterns | 80% | Integration + visual regression |
| Utility functions | 100% | Unit tests |

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| **@heroui/\*** | ^2.x (32 packages) | Base component primitives — accordion, avatar, badge, button, card, checkbox, chip, divider, dropdown, image, input, kbd, link, listbox, modal, navbar, popover, progress, scroll-shadow, select, skeleton, snippet, spacer, spinner, switch, system, table, tabs, theme, tooltip, user | ~25KB gz (tree-shaken) |
| **@radix-ui/\*** | ^1-2.x (10 packages) | Headless accessible primitives — accordion, alert-dialog, collapsible, context-menu, dialog, dropdown-menu, hover-card, slot, tabs, tooltip | ~12KB gz (tree-shaken) |
| **tailwindcss** | ^4.0.0 | Utility-first CSS framework (v4 with CSS-first config) | Build-time only |
| **framer-motion** | ^11.11.17 | Animation library — page transitions, gesture interactions, layout animations | ~30KB gz |
| **recharts** | ^2.15.0 | Charting library — AreaChart, BarChart, DonutChart, Sparkline, Heatmap, Treemap, ScatterChart | ~45KB gz |
| **@tanstack/react-table** | ^8.20.6 | Headless table engine — sorting, filtering, pagination, selection, virtualization | ~15KB gz |
| **lucide-react** | ^0.563.0 | Icon library — 1500+ icons, tree-shakeable | ~0.5KB per icon |
| **class-variance-authority** | ^0.7.1 | Variant prop management for component styling | ~2KB gz |
| **clsx** | ^2.1.1 | Conditional class name composition | ~0.3KB gz |
| **tailwind-merge** | ^2.5.4 | Intelligent Tailwind class merging (used in `cn()`) | ~3KB gz |
| **sonner** | ^1.7.4 | Toast notification system | ~4KB gz |
| **next-themes** | ^0.4.4 | Theme persistence and system preference detection | ~1KB gz |
| **@hookform/resolvers** | ^3.9.1 | Validation resolver bridge (Zod ↔ React Hook Form) | ~1KB gz |

### Peer Dependencies

| Package | Version | Required By |
|---------|---------|-------------|
| **react** | ^18.0.0 \|\| ^19.0.0 | All components |
| **react-dom** | ^18.0.0 \|\| ^19.0.0 | DOM rendering |
| **next** | ^15.0.3 | App Router, `'use client'` boundaries |
| **react-hook-form** | ^7.0.0 | Form components, FormField, useForm |
| **zod** | ^3.22.0 | Schema validation, zodResolver |

### Workspace Dependencies

| Package | Purpose |
|---------|---------|
| **@mcv/api** | Data fetching hooks and API client — components consume query results from `@mcv/api` |
| **@mcv/config** | Shared configuration including `theme.css` base import |
| **@mcv/tsconfig** | TypeScript configuration (dev only) |

---

## Integration with @mcv/api

Components in `@mcv/ui` are **data-agnostic** — they accept data via props. The `@mcv/api` package provides React Query hooks that fetch data and pass it to UI components:

```tsx
// Pattern: @mcv/api hook → @mcv/ui component

import { useUsers, useUserStats } from '@mcv/api';
import { TanStackTable, StatsGrid, StatsCard, Spinner } from '@mcv/ui';

function UsersPage() {
  // Data fetching via @mcv/api
  const { data: users, isLoading, error } = useUsers();
  const { data: stats } = useUserStats();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      {/* Stats cards consume API data */}
      <StatsGrid>
        <StatsCard title="Total Users" value={stats.total} trend={stats.growth} />
        <StatsCard title="Active" value={stats.active} />
        <StatsCard title="New This Week" value={stats.newThisWeek} />
      </StatsGrid>

      {/* Table consumes user list */}
      <TanStackTable
        data={users}
        columns={userColumns}
        // No data fetching — just display
      />
    </div>
  );
}
```

### Data Flow Architecture

```
  @mcv/api (Tier 5)                    @mcv/ui (Tier 6)
  ┌─────────────────┐                  ┌─────────────────┐
  │                  │                  │                  │
  │  useUsers()      │ ──── data ────▶ │  TanStackTable   │
  │  useStats()      │ ──── data ────▶ │  StatsCard       │
  │  useChat()       │ ──── data ────▶ │  Chatbot         │
  │  useActivities() │ ──── data ────▶ │  ActivityFeed    │
  │                  │                  │                  │
  │  React Query     │                  │  Pure render     │
  │  + fetch logic   │                  │  + interactions  │
  │                  │                  │                  │
  └─────────────────┘                  └─────────────────┘
         │                                      │
         └──── state management ────────────────┘
                    (consuming app)
```

---

## File Structure

```
packages/ui/
├── package.json                    # Dependencies and build config
├── src/
│   ├── index.ts                    # Barrel export (508 components)
│   │
│   ├── lib/
│   │   ├── utils.ts                # cn(), formatCurrency(), debounce(), etc.
│   │   └── use-outside-click.ts    # Click-outside hook
│   │
│   ├── shared/
│   │   ├── index.ts
│   │   └── types.ts                # ComponentSize, SemanticColor, FieldProps, etc.
│   │
│   ├── styles/
│   │   └── theme.css               # Design tokens (460+ lines of CSS variables)
│   │
│   ├── primitives/                 # Radix UI wrappers (16 sub-modules)
│   │   ├── dialog.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── context-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── accordion.tsx
│   │   ├── collapsible.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── sonner.tsx              # Toast notifications
│   │   ├── tooltip.tsx
│   │   ├── hover-card.tsx
│   │   ├── card.tsx
│   │   ├── separator.tsx
│   │   ├── badge.tsx
│   │   └── scroll-area.tsx
│   │
│   ├── form/                       # Form components (50 files, 130+ exports)
│   │   ├── index.ts
│   │   ├── form.tsx                # Form, FormField, FormItem (RHF integration)
│   │   ├── text-input.tsx          # TextInput, EmailInput, PasswordInput, UrlInput
│   │   ├── number-input.tsx        # NumberInput, CurrencyInput, PercentageInput
│   │   ├── checkbox.tsx            # Checkbox, CheckboxGroup
│   │   ├── radio.tsx               # Radio, RadioGroup
│   │   ├── select.tsx              # Select component
│   │   ├── combobox.tsx            # Combobox, AsyncCombobox
│   │   ├── dropzone.tsx            # File upload dropzone
│   │   ├── tags-input.tsx          # TagsInput, PresetTags
│   │   ├── color-picker.tsx        # ColorPicker, ColorSwatches
│   │   ├── rating.tsx              # Rating, RatingDisplay, EmojiRating
│   │   ├── slider.tsx              # Slider, RangeSlider
│   │   ├── toggle.tsx              # Toggle, Switch
│   │   ├── textarea.tsx            # Textarea
│   │   ├── date-range-picker.tsx   # DateRangePicker
│   │   ├── single-date-picker.tsx  # SingleDatePicker
│   │   ├── time-input.tsx          # TimeInput
│   │   ├── search-input.tsx        # SearchInput
│   │   ├── filter-bar.tsx          # FilterBar
│   │   ├── masked-input.tsx        # MaskedInput, PhoneInput, CreditCardInput
│   │   ├── code-input.tsx          # CodeInput, OTPInput
│   │   ├── address-input.tsx       # AddressInput
│   │   ├── wizard-form.tsx         # WizardForm, WizardStepContent, useWizard
│   │   ├── advanced-filter.tsx     # AdvancedFilter (query builder)
│   │   ├── bulk-editor.tsx         # BulkEditor
│   │   ├── field-array.tsx         # FieldArray
│   │   ├── dependent-field.tsx     # DependentField, when()
│   │   ├── async-field-validator.tsx
│   │   ├── form-layouts.tsx        # SplitForm, AccordionForm, TabbedForm
│   │   └── ...stories.tsx          # Storybook stories
│   │
│   ├── ai/                         # AI interaction components
│   │   ├── index.ts
│   │   ├── chatbot.tsx             # Chatbot, useChat
│   │   ├── terminal.tsx            # Terminal, useTerminal
│   │   ├── voice.tsx               # VoiceInput, VoiceButton, VoiceAssistant
│   │   ├── streaming-text.tsx      # StreamingText, TypewriterText, StreamingMarkdown
│   │   ├── tool-call.tsx           # ToolCall, ToolCallList
│   │   ├── thinking-indicator.tsx  # ThinkingIndicator, ThinkingBubble
│   │   ├── message-variants.tsx    # AIMessage, SystemMessage
│   │   └── ...stories.tsx
│   │
│   ├── charts/                     # Recharts-based visualization
│   │   ├── index.ts
│   │   ├── area-chart.tsx
│   │   ├── bar-chart.tsx
│   │   ├── donut-chart.tsx
│   │   ├── sparkline.tsx
│   │   ├── kpi-card.tsx
│   │   ├── heatmap-chart.tsx
│   │   ├── treemap-chart.tsx
│   │   ├── scatter-chart.tsx
│   │   └── ...stories.tsx
│   │
│   ├── table/                      # Table patterns (14 TSX files)
│   │   ├── index.ts
│   │   ├── table-toolbar.tsx
│   │   ├── row-actions.tsx
│   │   ├── bulk-action-bar.tsx
│   │   ├── pagination.tsx
│   │   ├── data-row.tsx
│   │   ├── cell-renderers.tsx
│   │   ├── virtualized-table.tsx
│   │   ├── tree-table.tsx
│   │   ├── editable-row.tsx
│   │   ├── expandable-row.tsx
│   │   ├── column-customizer.tsx
│   │   ├── saved-views.tsx
│   │   └── ...
│   │
│   ├── data/                       # Core data display
│   │   ├── index.ts
│   │   ├── tanstack-table.tsx      # TanStack Table wrapper
│   │   └── stats-card.tsx          # StatsCard, StatsGrid, LargeStat
│   │
│   ├── workflow/                   # Workflow orchestration
│   │   ├── index.ts
│   │   ├── workflow-canvas.tsx     # Canvas with zoom, pan, grid
│   │   └── workflow-nodes.tsx      # Node types, palette, factories
│   │
│   ├── dashboard/                  # Dashboard assembly
│   │   ├── index.ts
│   │   ├── widget-container.tsx    # Widget wrapper with header/actions
│   │   ├── widget-grid.tsx         # Draggable/resizable grid layout
│   │   └── metric-dashboard.tsx    # KPI metric grid
│   │
│   ├── timeline/                   # Timeline & activity (largest category)
│   │   ├── index.ts                # 100+ exports
│   │   └── ... (12 TSX files)
│   │
│   ├── cards/                      # Card variants (60+ exports)
│   ├── feedback/                   # Alerts, toasts, progress, states
│   ├── page/                       # Page composition primitives
│   ├── identity/                   # User/agent identity components
│   ├── comments/                   # Comment threads, reactions, mentions
│   ├── tabs/                       # Tab navigation patterns
│   ├── inspector/                  # Detail drawer, split pane, master-detail
│   ├── patterns/shell/             # AppShell, Header, Sidebar
│   ├── navigation/                 # CommandMenu (⌘K)
│   ├── onboarding/                 # Tour, Spotlight, Checklist, CoachMark
│   ├── project-management/         # Kanban, Calendar, Gantt, ListView
│   ├── theme/                      # Theme toggle, customizer
│   ├── auth/                       # Auth card, PIN, password strength
│   ├── domain/                     # Engineering, Growth, Marketing patterns
│   ├── pipeline/                   # CI/CD pipeline visualization
│   ├── skeletons/                  # Loading skeleton patterns
│   ├── utility/                    # Status, RelativeTime, Copy, Shortcuts
│   ├── typography/                 # Heading, Text, Prose, Label, Caption
│   ├── button/                     # Button variants
│   ├── code/                       # Code display, syntax highlighting
│   ├── backgrounds/                # Hero, grid, gradient backgrounds
│   ├── layout/                     # BentoGrid, LayoutGrid
│   ├── visualizations/             # Globe, Sparkles, effects
│   ├── marketing/                  # Scrolling banners, testimonials
│   ├── media/                      # Image zoom, video player
│   ├── finance/                    # Credit card, ticker
│   ├── callout/                    # Banner, announcement
│   ├── notifications/              # Notification system
│   ├── grid/                       # Data grid layouts
│   └── ... (remaining 20+ categories)
│
└── tsconfig.json                   # TypeScript configuration
```

---

## Utility Functions (`lib/utils.ts`)

The utility module provides essential helpers used across all components:

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CLASS NAME COMPOSITION — the most-used utility in the library
// ═══════════════════════════════════════════════════════════════════════════════

/** Merge Tailwind CSS classes with intelligent deduplication */
function cn(...inputs: ClassValue[]): string;
// Uses clsx for conditional class names + twMerge for Tailwind conflict resolution
// Example: cn('px-4 py-2', isActive && 'bg-primary', className)

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATTING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/** Format currency: formatCurrency(1234.56) → "$1,235" */
function formatCurrency(amount: number, currency?: string, locale?: string): string;

/** Compact notation: formatCompact(45200) → "45.2K" */
function formatCompact(value: number): string;

/** Percentage with sign: formatPercentage(12.5) → "+12.5%" */
function formatPercentage(value: number, decimals?: number): string;

/** Relative time: formatRelativeTime(date) → "2h ago" or "Jan 15" */
function formatRelativeTime(date: Date): string;

// ═══════════════════════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/** Truncate with ellipsis: truncate("long text...", 10) → "long te..." */
function truncate(text: string, maxLength: number): string;

/** Slug to title: slugToTitle("hello-world") → "Hello World" */
function slugToTitle(slug: string): string;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/** Debounce function calls */
function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;

/** Sleep/delay: await sleep(1000) */
function sleep(ms: number): Promise<void>;

// ═══════════════════════════════════════════════════════════════════════════════
// MISCELLANEOUS
// ═══════════════════════════════════════════════════════════════════════════════

/** Generate random prefixed ID: generateId('btn') → "btn_a7x9k2m" */
function generateId(prefix?: string): string;

/** Map status string to Tailwind color: getStatusColor('active') → 'emerald' */
function getStatusColor(status: string): string;

/** Client-side detection */
const isClient: boolean;
```

---

## Environment & Configuration

### Package Entry Points

```jsonc
// package.json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./styles/theme.css": "./src/styles/theme.css"
  }
}
```

### CSS Import

Consuming applications must import the theme CSS:

```tsx
// app/layout.tsx or global entry point
import '@mcv/ui/styles/theme.css';
```

### Tailwind CSS v4 Integration

The library uses Tailwind CSS v4 with PostCSS:

```json
{
  "@tailwindcss/postcss": "^4.0.0",
  "tailwindcss": "^4.0.0"
}
```

Components use Tailwind utilities directly via template literals and the `cn()` utility — no separate Tailwind config file is required in v4.

---

## Audit Events

Components emit no audit events directly. Audit logging is handled by the consuming application layer and `@mcv/api` hooks. The UI components provide callback props (`onClick`, `onSubmit`, `onDelete`, etc.) that applications wire to their audit systems.

---

## Error Handling

### Component-Level Error Boundaries

```tsx
import { ErrorBoundary } from '@mcv/ui';

// Wrap sections that might fail
<ErrorBoundary
  fallback={({ error, reset }) => (
    <ErrorState
      title="Something went wrong"
      description={error.message}
      action={{ label: 'Try Again', onClick: reset }}
    />
  )}
>
  <DashboardWidgets />
</ErrorBoundary>
```

### Form Validation Errors

```tsx
// Zod schema errors surface via FormMessage
<FormField control={form.control} name="email" render={({ field }) => (
  <FormItem>
    <FormLabel>Email</FormLabel>
    <FormControl>
      <TextInput {...field} />
    </FormControl>
    <FormMessage /> {/* Auto-displays Zod validation error */}
  </FormItem>
)} />

// FormValidationSummary shows all errors at once
<FormValidationSummary errors={form.formState.errors} />
```

### Empty & Error States

Pre-built state components for common scenarios:

```tsx
// No data
<EmptyState title="No projects" action={{ label: 'Create', onClick: create }} />

// Error loading
<ErrorState error={error} onRetry={refetch} />

// Offline
<OfflineState />

// Unauthorized
<UnauthorizedState />

// Coming soon
<ComingSoonState feature="Analytics Dashboard" />
```

---

## Related Documentation

| Document | Description | Size |
|----------|-------------|------|
| [01-PACKAGE-SPEC.md](./01-PACKAGE-SPEC.md) | Complete package specification with all 508 components, categories, and patterns | 39KB |
| [02-TECHNICAL-ARCHITECTURE.md](./02-TECHNICAL-ARCHITECTURE.md) | Theming architecture, component composition model, variant system, rendering pipeline | 41KB |
| [03-API-REFERENCE.md](./03-API-REFERENCE.md) | Detailed props documentation for core components (Button, Input, Select, Modal, etc.) | 22KB |

---

## Inspirations

The component library draws design patterns and API conventions from:

- **Kibo UI** — Component composition patterns
- **Magic UI** — Animated visual effects and backgrounds
- **Aceternity UI** — Premium interaction patterns
- **Vercel AI SDK** — AI chat and streaming components
- **HeroUI Pro** — Base component primitives and theming
- **shadcn/ui** — Radix + Tailwind component architecture

---

*@mcv/ui — The Visual Language of MCV.ONE*
