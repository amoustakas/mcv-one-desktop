# @mcv/ui/components — Component Library Catalog

**Parent Package:** @mcv/ui  
**Tier:** 6 (Presentation Layer — UI)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 9, 2026

---

## Purpose

The `components` submodule is the heart of `@mcv/ui` — a catalog of **508 React components** organized across **77 category directories**. Every interactive element, data display, form control, navigation pattern, and domain-specific widget in the MCV.ONE ecosystem originates here. Components follow a strict layered architecture (tokens → primitives → atoms → composites → compounds → page patterns) with TypeScript-first APIs, WCAG 2.1 AA accessibility, and venture-aware theming.

**This is the complete component inventory. Every pixel in every MCV application traces back to this catalog.**

### What This Module Provides

- 508 individually tree-shakeable React components with TypeScript-strict props
- 77 category directories, each with barrel exports, stories, and tests
- Consistent API patterns: `variant`, `size`, `color`, `isDisabled`, `isLoading`, `className`
- 6-layer architecture from design tokens to page-level compositions
- Full Storybook coverage with interactive examples and documentation
- React Hook Form + Zod integration across all form components
- TanStack Table, Recharts, and Framer Motion integrations for data-heavy UIs
- WCAG 2.1 AA accessibility via Radix UI headless primitives

### What This Module Does NOT Provide

- Does not manage application state — state lives in consuming applications
- Does not perform API calls — data fetching is handled by `@mcv/api`
- Does not implement business logic — domain rules belong in tier-3 and tier-4 packages
- Does not handle routing — Next.js App Router manages navigation
- Does not bundle icons — uses `lucide-react` as the icon system (tree-shakeable)

---

## Architecture

### Component Layer Model

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Layer 5: PAGE PATTERNS (85 patterns)                                          │
│  AppShell, Sidebar, Header, PageHeader, EmptyState, ContentShell,             │
│  DataTablePage, DashboardLayout, SettingsPage, AuthPage                       │
├───────────────────────────────────────────────────────────────────────────────┤
│  Layer 4: DOMAIN COMPOUNDS (~80 components)                                    │
│  Chatbot, WorkflowCanvas, MetricDashboard, WidgetGrid, KanbanBoard,          │
│  GanttChart, TanStackTable, CommandMenu, TourProvider, WizardForm             │
├───────────────────────────────────────────────────────────────────────────────┤
│  Layer 3: COMPOSITE COMPONENTS (~120 components)                               │
│  ActionCard, StatCard, AreaChart, FilterBar, CommentThread, Timeline,         │
│  ActivityFeed, DetailDrawer, BulkActionBar, Pagination, TabContainer          │
├───────────────────────────────────────────────────────────────────────────────┤
│  Layer 2: ATOMIC COMPONENTS (~160 components)                                  │
│  Button, Input, Badge, Avatar, Chip, Alert, Checkbox, Select, Slider,        │
│  Toggle, Radio, Rating, Tag, Tooltip, Popover, Spinner, Skeleton             │
├───────────────────────────────────────────────────────────────────────────────┤
│  Layer 1: PRIMITIVES (16 Radix wrappers + HeroUI)                             │
│  Dialog, AlertDialog, Drawer, DropdownMenu, ContextMenu, Tabs,               │
│  Accordion, Collapsible, Breadcrumb, Tooltip, HoverCard, ScrollArea,         │
│  Separator, Card, Badge, Sonner (Toast)                                       │
├───────────────────────────────────────────────────────────────────────────────┤
│  Layer 0: DESIGN TOKENS & THEME                                                │
│  CSS Custom Properties (200+ tokens), venture themes, dark/light modes        │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Composition Flow

```
  User Application
        │
        │  import { Button, DataTable, Chatbot } from '@mcv/ui'
        ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │                     @mcv/ui barrel export                         │
  │                     (src/index.ts)                                │
  │                                                                   │
  │  Re-exports from 77 category directories with explicit           │
  │  named exports to avoid symbol conflicts                         │
  └───────────────┬───────────────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┬──────────────┐
        ▼         ▼         ▼              ▼
  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
  │  form/   │ │  ai/   │ │ charts/  │ │ table/   │
  │ 50 files │ │ 7 tsx  │ │ 7 tsx    │ │ 14 tsx   │
  │ 130+     │ │ 20+    │ │ 25+     │ │ 40+      │
  │ exports  │ │exports │ │ exports  │ │ exports  │
  └──────────┘ └────────┘ └──────────┘ └──────────┘
        │         │         │              │
        └─────────┼─────────┼──────────────┘
                  ▼
          ┌──────────────────────────┐
          │    shared/types.ts       │
          │    lib/utils.ts          │
          │    styles/theme.css      │
          └──────────────────────────┘
```

---

## Shared Type System

Every component references this shared type system for API consistency across all 508 components.

### Size Types

```typescript
/** Standard component sizes — Button, Input, Badge, Chip, Avatar, etc. */
type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Compact variants — StatusIndicator, CompactKpi, etc. */
type CompactSize = 'sm' | 'md' | 'lg';

/** Text sizes — Heading, Text, Caption, etc. */
type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
```

### Variant Types

```typescript
/** Interactive element variants — buttons, links, toggles */
type InteractiveVariant = 'solid' | 'outline' | 'ghost' | 'flat' | 'link';

/** Container variants — cards, panels, surfaces */
type CardVariant = 'default' | 'bordered' | 'gradient' | 'glass' | 'minimal';

/** Input variants — text fields, selects, textareas */
type InputVariant = 'default' | 'bordered' | 'filled' | 'underlined';
```

### Color Types

```typescript
/** Semantic colors — consistent across all components */
type SemanticColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/** Extended palette — includes info and muted */
type ExtendedColor = SemanticColor | 'info' | 'muted';

/** Brand colors for OAuth/social buttons */
type BrandColor =
  | 'google' | 'github' | 'twitter' | 'facebook' | 'apple'
  | 'microsoft' | 'linkedin' | 'discord' | 'slack' | 'notion';
```

### Status & Sentiment Types

```typescript
type TrendDirection = 'up' | 'down' | 'neutral';
type Sentiment = 'positive' | 'negative' | 'neutral';
type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'inactive' | 'active';
type ProcessStatus = 'idle' | 'pending' | 'running' | 'success' | 'error' | 'cancelled';
type StepStatus = 'pending' | 'current' | 'completed' | 'error' | 'skipped';
```

### Position & Layout Types

```typescript
type Side = 'top' | 'right' | 'bottom' | 'left';
type Placement = 'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end'
  | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end';
type Orientation = 'horizontal' | 'vertical';
type SpacingScale = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type RadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
```

### Common Prop Mixins

```typescript
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
```

---

## Component Catalog by Category

### Foundation & Primitives (12 categories, ~71 components)

#### `primitives/` — Radix UI Headless Primitives

16 Radix UI headless primitives wrapped with MCV styling and consistent APIs. These are the accessible building blocks for all overlays, menus, and interactive patterns.

| Component | Source | Description |
|-----------|--------|-------------|
| `Dialog` | `primitives/dialog.tsx` | Modal dialog with size variants (sm/md/lg/xl/full) |
| `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` | `primitives/dialog.tsx` | Dialog sub-components for compound composition |
| `AlertDialog` | `primitives/alert-dialog.tsx` | Destructive action confirmation with required acknowledgement |
| `Drawer` | `primitives/drawer.tsx` | Side panel overlay with slide animation |
| `DropdownMenu` | `primitives/dropdown-menu.tsx` | Click-triggered dropdown with keyboard navigation |
| `ContextMenu` | `primitives/context-menu.tsx` | Right-click context menus |
| `Tabs` | `primitives/tabs.tsx` | Horizontal tab navigation with animated indicator |
| `Accordion` | `primitives/accordion.tsx` | Expandable content sections (single/multi mode) |
| `Collapsible` | `primitives/collapsible.tsx` | Simple expand/collapse toggle |
| `Breadcrumb` | `primitives/breadcrumb.tsx` | Navigation breadcrumb with overflow handling |
| `Tooltip` | `primitives/tooltip.tsx` | Hover tooltip with delay and portal rendering |
| `HoverCard` | `primitives/hover-card.tsx` | Rich content on hover (user profiles, previews) |
| `Card` | `primitives/card.tsx` | Surface container with bordered/gradient/glass variants |
| `Badge` | `primitives/badge.tsx` | Inline status/count indicator |
| `Separator` | `primitives/separator.tsx` | Horizontal/vertical divider line |
| `ScrollArea` | `primitives/scroll-area.tsx` | Custom-styled scrollbar container |
| `Sonner` (Toast) | `primitives/sonner.tsx` | Toast notification system via sonner library |

**Props Pattern (Dialog example):**

```typescript
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

// Usage:
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>Update your information below.</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### `typography/` — Semantic Text Components

| Component | Props | Description |
|-----------|-------|-------------|
| `Heading` | `level?: 1-6`, `size?`, `weight?`, `color?` | Semantic headings (h1–h6) with responsive sizing |
| `Text` | `size?`, `weight?`, `color?`, `as?` | Body text with configurable element |
| `Prose` | `className?` | Tailwind Typography wrapper for rendered markdown/HTML |
| `Label` | `htmlFor?`, `isRequired?` | Form field labels with required indicator |
| `Caption` | `size?`, `color?` | Small helper/caption text |
| `Kbd` | `keys?` | Keyboard shortcut display (e.g., `⌘K`) |
| `GradientText` | `from?`, `to?`, `via?` | Text with animated gradient fill |

#### `button/` — Interactive Button System

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant`, `size`, `color`, `radius`, `isLoading`, `startContent`, `endContent`, `asChild`, `fullWidth`, `isIconOnly` | Primary interactive element — 5 variants × 6 colors × 5 sizes |
| `ButtonGroup` | `variant?`, `size?`, `orientation?` | Grouped buttons with shared styling |
| `IconButton` | `icon`, `aria-label` (required), `variant?`, `size?` | Icon-only button with mandatory accessibility label |
| `LoadingButton` | `isLoading`, `loadingText?`, `spinnerPlacement?` | Button with integrated spinner state |
| `GradientButton` | `from?`, `to?`, `animate?` | Animated gradient background button |

**Button Props (complete):**

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

#### `layout/` — Grid & Flexbox Layout Compositions

| Component | Description |
|-----------|-------------|
| `BentoGrid` | Asymmetric grid layout for dashboard widgets and feature showcases |
| `LayoutGrid` | Configurable CSS Grid wrapper with responsive columns |
| Stack, Flex, Center | Flexbox layout primitives for content assembly |

#### `backgrounds/` — Decorative Background Components

| Component | Description |
|-----------|-------------|
| `HeroHighlight` | Animated spotlight background for hero sections |
| `GridBackground` | Dot/line grid pattern background |
| `BackgroundGradient` | Gradient mesh background effect |

#### `brand/` — MCV.ONE Brand Assets

| Component | Description |
|-----------|-------------|
| `Logo` | MCV.ONE logo with venture-specific variants |
| `Wordmark` | Text-based brand mark |
| `LogoMark` | Icon-only brand mark |

#### `shared/` — Shared Types (no components)

Exports `ComponentSize`, `SemanticColor`, `TrendDirection`, `Sentiment`, `StatusType`, `ProcessStatus`, `Placement`, `AnimationPreset`, `BaseComponentProps`, `FieldProps`, and all other shared type definitions.

#### `lib/` — Core Utility Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `cn()` | `(...inputs: ClassValue[]) => string` | Merge Tailwind classes with intelligent deduplication (clsx + twMerge) |
| `formatCurrency()` | `(amount: number, currency?: string, locale?: string) => string` | Format number as currency: `1234.56 → "$1,235"` |
| `formatCompact()` | `(value: number) => string` | Compact notation: `45200 → "45.2K"` |
| `formatPercentage()` | `(value: number, decimals?: number) => string` | Percentage with sign: `12.5 → "+12.5%"` |
| `formatRelativeTime()` | `(date: Date) => string` | Relative time: `date → "2h ago"` |
| `truncate()` | `(text: string, maxLength: number) => string` | Truncate with ellipsis |
| `slugToTitle()` | `(slug: string) => string` | Convert slug to title case |
| `debounce()` | `<T>(fn: T, delay: number) => T` | Debounce function calls |
| `sleep()` | `(ms: number) => Promise<void>` | Async delay utility |
| `generateId()` | `(prefix?: string) => string` | Generate random prefixed ID |
| `getStatusColor()` | `(status: string) => string` | Map status to Tailwind color name |
| `isClient` | `boolean` | Client-side environment detection |

#### `styles/` — Design Token CSS

Contains `theme.css` (460+ lines) defining the complete CSS custom property token system: brand colors, semantic colors, venture overrides, backgrounds, borders, text scale, shadows, radii, motion, and layout tokens.

#### `theme/` — Runtime Theme Components

| Component | Description |
|-----------|-------------|
| `ThemeToggle` | Light/Dark/System mode toggle button |
| `ThemeSwitch` | Animated theme toggle switch |
| `ThemeIndicator` | Visual indicator of current theme |
| `ThemeCustomizerProvider` | Context provider for live theme customization |
| `AccentColorPicker` | Color palette picker for accent color |
| `RadiusSelector` | Border radius preset selector |
| `FontScaleSelector` | Typography scale adjuster |
| `ThemeCustomizerPanel` | Complete customization UI panel |
| `ThemePreview` | Live preview of theme settings |

#### `animation/` — Motion Components

Framer Motion animation wrappers and presets for consistent animation across components.

#### `interactions/` — Interaction Utilities

Click handlers, hover states, and interaction pattern utilities.

---

### Form & Input Components (7 categories, ~130 exports)

#### `form/` — Complete Form System

The form system is the largest single category with 50 files and 130+ exports. It integrates React Hook Form for state management and Zod for validation.

**Core Form Infrastructure:**

| Component | Description |
|-----------|-------------|
| `Form` | Form wrapper with React Hook Form context provider |
| `FormField` | Field connector bridging RHF `control` to child components |
| `FormItem` | Semantic wrapper for label + control + description + error |
| `FormLabel` | Accessible label with `htmlFor` linking |
| `FormControl` | Control wrapper that applies `aria-describedby` and `aria-invalid` |
| `FormDescription` | Helper text below the field |
| `FormMessage` | Validation error message (auto-populated from Zod) |
| `FormValidationSummary` | Displays all form errors in a summary list |

**Text & Number Inputs:**

| Component | Props Highlights | Description |
|-----------|-----------------|-------------|
| `TextInput` | `type`, `placeholder`, `isClearable` | Standard text input |
| `EmailInput` | `validate?` | Email-specific input with format validation |
| `PasswordInput` | `isPasswordVisible`, `onVisibilityChange` | Password input with show/hide toggle |
| `UrlInput` | `protocol?` | URL input with protocol prefix |
| `NumberInput` | `min`, `max`, `step`, `precision` | Numeric input with increment/decrement |
| `CurrencyInput` | `currency`, `locale`, `symbol` | Formatted currency input |
| `PercentageInput` | `min`, `max`, `decimals` | Percentage input with `%` suffix |
| `Textarea` | `minRows`, `maxRows`, `autoResize` | Multi-line text input |

**Selection & Toggle:**

| Component | Description |
|-----------|-------------|
| `Select` | Single-select dropdown |
| `Combobox` | Searchable select with typeahead |
| `AsyncCombobox` | Combobox with async data loading |
| `Checkbox` | Single checkbox |
| `CheckboxGroup` | Multi-checkbox group with label |
| `Radio` | Single radio button |
| `RadioGroup` | Radio button group |
| `Toggle` | Binary toggle button |
| `Switch` | Toggle switch with label |
| `Slider` | Single-value slider |
| `RangeSlider` | Dual-handle range slider |

**Date & Time:**

| Component | Description |
|-----------|-------------|
| `DateRangePicker` | Start/end date range selection |
| `SingleDatePicker` | Single date selection with calendar |
| `TimeInput` | Time entry (HH:MM format) |

**Specialized Inputs:**

| Component | Description |
|-----------|-------------|
| `SearchInput` | Search with icon, clear button, keyboard shortcut |
| `TagsInput` | Tag entry with autocomplete |
| `PresetTags` | Pre-defined tag selector |
| `ColorPicker` | Color selection with palette and custom hex |
| `ColorSwatches` | Pre-defined color swatch grid |
| `Rating` | Star/icon rating input |
| `RatingDisplay` | Read-only rating display |
| `EmojiRating` | Emoji-based rating (😡 → 😊) |
| `Dropzone` | File upload drag-and-drop area |
| `MaskedInput` | Input with format masking |
| `PhoneInput` | International phone number with country code |
| `CreditCardInput` | Credit card number with formatting |
| `CodeInput` | Code/PIN entry (fixed-length) |
| `OTPInput` | One-time password entry |
| `AddressInput` | Multi-field address entry |
| `InlineEditor` | Click-to-edit inline text |

**Filter & Search:**

| Component | Description |
|-----------|-------------|
| `FilterBar` | Horizontal bar with active filter chips |
| `FilterChip` | Removable filter indicator |
| `MultiSelectDropdown` | Multi-select with search and checkboxes |
| `AdvancedFilter` | Visual query builder for complex filters |

**Form Layouts:**

| Component | Description |
|-----------|-------------|
| `WizardForm` | Multi-step form with progress indicator |
| `WizardStepContent` | Individual wizard step content |
| `useWizard` | Hook for wizard state management |
| `SplitForm` | Two-column form layout |
| `AccordionForm` | Collapsible section form layout |
| `TabbedForm` | Tab-separated form sections |

**Advanced Form Features:**

| Component | Description |
|-----------|-------------|
| `BulkEditor` | Edit multiple records simultaneously |
| `FieldArray` | Dynamic repeatable field groups |
| `DependentField` | Conditionally rendered fields |
| `AsyncFieldValidator` | Server-side async validation |

**Form Usage Example:**

```tsx
import { z } from 'zod';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
  TextInput, Select, Checkbox, Button,
} from '@mcv/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

function CreateUserForm() {
  const form = useForm({ resolver: zodResolver(schema) });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><TextInput {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" isLoading={form.formState.isSubmitting}>Create</Button>
      </form>
    </Form>
  );
}
```

#### `input/` — Core Input Primitives

Base input components providing the foundation for all text entry. Lower-level than `form/` components.

#### `inline-edit/` — Click-to-Edit Patterns

Components for inline editing (click text to edit, press Enter or blur to save).

#### `filters/` — Filter Compositions

Multi-filter UI patterns for data views — cascading filters, saved filter presets.

#### `selection/` — Selection Patterns

List and grid selection components — single select, multi-select, range select.

#### `search/` — Search Components

Search input variations with suggestion dropdown, recent searches, and search scopes.

#### `settings/` — Settings UI Patterns

Toggle settings, preference panels, and configuration interfaces.

---

### Data Display (10 categories, ~109 components)

#### `data/` — Core Data Components

| Component | Exports | Description |
|-----------|---------|-------------|
| `TanStackTable` | 1 | MCV-styled wrapper around `@tanstack/react-table` |
| `createSelectionColumn` | 1 | Factory for row selection checkbox column |
| `createActionsColumn` | 1 | Factory for row action dropdown column |
| `StatsCard` | 1 | Single metric card with trend indicator |
| `StatsGrid` | 1 | Grid layout for multiple StatsCards |
| `LargeStat` | 1 | Hero-size metric display |
| `ComparisonStat` | 1 | Before/after comparison metric |
| `TrendChip` | 1 | Small trend indicator chip (↑/↓/→) |

Also re-exports from `@tanstack/react-table`: `useReactTable`, `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`, `flexRender`, and all table types (`ColumnDef`, `SortingState`, `ColumnFiltersState`, `VisibilityState`, `RowSelectionState`, `PaginationState`, `Row`, `Table`).

**TanStack Table Usage:**

```tsx
import {
  TanStackTable, useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, createSelectionColumn, createActionsColumn,
  type ColumnDef,
} from '@mcv/ui';

const columns: ColumnDef<User>[] = [
  createSelectionColumn<User>(),
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  createActionsColumn<User>({
    actions: [
      { label: 'Edit', onClick: (row) => editUser(row.id) },
      { label: 'Delete', onClick: (row) => deleteUser(row.id), variant: 'danger' },
    ],
  }),
];

function UsersTable({ users }: { users: User[] }) {
  const table = useReactTable({
    data: users, columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  return <TanStackTable table={table} />;
}
```

#### `table/` — Table Patterns (65+ exports)

| Component | Description |
|-----------|-------------|
| `TableToolbar` | Search bar + filter toggles + action buttons above table |
| `RowActions` | Per-row dropdown action menu |
| `BulkActionBar` | Floating bar for batch operations on selected rows |
| `Pagination` | Page navigation with page size selector |
| `DataRow` | Standard table row component |
| `PipelineRow` | Pipeline-stage row with status badges |
| `IncidentRow` | Incident-severity row with color coding |
| **Cell Renderers** | |
| `CurrencyCell` | Formatted currency display |
| `DateCell` | Date with relative/absolute formatting |
| `StatusCell` | Color-coded status badge |
| `BadgeCell` | Badge display in table cell |
| `ProgressCell` | Mini progress bar in cell |
| `LinkCell` | Clickable link in cell |
| `TrendCell` | Trend indicator with sparkline |
| **Advanced** | |
| `ColumnVisibilityToggle` | Show/hide column picker |
| `SortableHeader` | Sortable column header with indicator |
| `ExportMenu` | Export data as CSV/JSON |
| `ExpandableRow` | Row with expandable detail section |
| `EditableRow` | Inline-editable row |
| `VirtualizedTable` | Virtualized rendering for 100K+ rows |
| `TreeTable` | Hierarchical data with expand/collapse |
| `ColumnCustomizer` | Drag-to-reorder column configuration |
| `SavedViews` | Named view presets (column order, filters, sort) |

#### `charts/` — Recharts-Based Visualization (40+ exports)

| Component | Key Props | Description |
|-----------|-----------|-------------|
| `AreaChart` | `data`, `series`, `xAxisKey`, `gradient`, `curveType` | Multi-series area chart with gradient fills |
| `BarChart` | `data`, `series`, `xAxisKey`, `stacked`, `horizontal` | Grouped/stacked bar chart |
| `DonutChart` | `data`, `innerRadius`, `showLabels` | Donut/ring chart |
| `PieChart` | `data`, `showLabels` | Standard pie chart |
| `Sparkline` | `data`, `color`, `height` | Inline mini line chart |
| `SparklineBar` | `data`, `color` | Inline mini bar chart |
| `TrendSparkline` | `data`, `trend` | Sparkline with trend coloring |
| `MiniSparkline` | `data` | Minimal sparkline for stat cards |
| `KpiCard` | `title`, `value`, `change`, `trend`, `sentiment`, `sparklineData` | KPI metric card with optional sparkline |
| `KpiGrid` | `columns` | Grid layout for KPI cards |
| `SimpleKpi` | `label`, `value` | Minimal KPI display |
| `CompactKpi` | `label`, `value`, `trend` | Compact KPI with trend |
| `HeatmapChart` | `data`, `xAxisKey`, `yAxisKey`, `valueKey` | 2D heatmap visualization |
| `CalendarHeatmap` | `data`, `startDate`, `endDate` | GitHub-style calendar heatmap |
| `TreemapChart` | `data`, `valueKey`, `nameKey` | Hierarchical treemap |
| `ScatterChart` | `data`, `xKey`, `yKey` | Scatter plot |
| `BubbleChart` | `data`, `xKey`, `yKey`, `sizeKey` | Bubble chart (scatter + size dimension) |

**Chart Usage:**

```tsx
<AreaChart
  data={monthlyRevenue}
  series={[
    { dataKey: 'revenue', name: 'Revenue', color: '#6366f1' },
    { dataKey: 'projected', name: 'Projected', color: '#a5b4fc', fillOpacity: 0.1 },
  ]}
  xAxisKey="month"
  height={300}
  gradient
  showLegend
  yAxisFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
/>
```

#### `data-patterns/` — Data Composition Patterns

| Component | Description |
|-----------|-------------|
| `MetricCard` | Generic metric display with label/value/icon |
| `KeyValue` | Key-value pair display (label: value) |
| `ErrorBoundary` | React error boundary with fallback UI |

#### `metrics/` — KPI & Metric Visualizations

Extended metric display components for dashboards and analytics.

#### `indicators/` — Status & Progress Indicators

Visual state indicators — status dots, traffic lights, health indicators.

#### `comparison/` — Side-by-Side Comparison

Comparison views for before/after, A/B testing, and feature comparison tables.

#### `diff/` — Change Diff Visualization

Code diff and data change visualization components.

#### `data-import/` — Data Ingestion UI

Import wizard, file mapping, column matching, and preview components for data ingestion flows.

#### `grid/` — Grid-Based Data Layouts

`BentoGrid` and data grid layouts for dashboard assembly.

---

### Cards & Content (8 categories, ~60+ components)

#### `cards/` — Card Variants (60+ exports)

The card system provides 15 card types, each available in standard, grid, and list variants:

| Card Type | Key Props | Description |
|-----------|-----------|-------------|
| `ActionCard` | `title`, `description`, `icon`, `onClick` | Clickable action trigger card |
| `QuickActionCard` | `title`, `icon`, `onClick` | Compact quick action |
| `FeatureCard` | `title`, `description`, `icon`, `badge?` | Feature showcase card |
| `ResourceCard` | `title`, `type`, `status`, `metadata` | Resource display (API keys, configs) |
| `StatCard` | `title`, `value`, `change`, `trend` | Metric/statistic card |
| `InfoCard` | `title`, `content`, `variant` | Informational content card |
| `TipCard` | `title`, `content`, `icon` | Pro-tip/help card |
| `SummaryCard` | `title`, `items`, `footer` | Summary list card |
| `ProfileCard` | `user`, `role`, `avatar`, `status` | User profile card |
| `NotificationCard` | `title`, `message`, `timestamp`, `read` | Notification item card |
| `ComparisonCard` | `before`, `after`, `metric` | Before/after comparison |
| `TrendCard` | `title`, `value`, `data`, `trend` | Trend with sparkline |
| `AlertCard` | `title`, `severity`, `message`, `actions` | Alert/incident card |
| `IntegrationCard` | `name`, `icon`, `status`, `connected` | Integration status card |
| `QuotaCard` | `title`, `used`, `total`, `unit` | Quota/usage card with progress |

Each card exports: `{Name}Card`, `{Name}CardGrid`, `{Name}CardList`.

#### `badges/` — Badge Components

StatusBadge, CountBadge, and variant badges for inline status indication.

#### `chips/` — Interactive Chip Elements

Chip, ChipGroup for interactive tags and filter chips.

#### `blocks/` — Content Block Patterns

Rich content blocks for structured content display.

#### `code/` — Code Display

| Component | Description |
|-----------|-------------|
| `CodeBlock` | Syntax-highlighted code block with copy button |
| `InlineCode` | Inline code text styling |

#### `code-display/` — Enhanced Code Display

Terminal-style code display, command output rendering.

#### `callout/` — Attention-Drawing Components

| Component | Description |
|-----------|-------------|
| `Banner` | Full-width announcement banner (top of page) |
| `Announcement` | Dismissible announcement card |
| `FeatureAnnouncement` | New feature announcement with illustration |

#### `marketing/` — Marketing Components

| Component | Description |
|-----------|-------------|
| `ScrollingBanner` | Infinitely scrolling logo/text banner |
| `Testimonials` | Testimonial carousel with avatar + quote |

---

### Timeline & Activity (3 categories, ~100+ components)

#### `timeline/` — Timeline & Activity (Largest Category)

The timeline module is the largest single category with 100+ exports across 12 TSX files:

| Component | Description |
|-----------|-------------|
| **Core** | |
| `ActivityItem` | Single activity entry with user, action, target, timestamp |
| `ActivityFeed` | Scrollable activity list with filtering |
| `ActivityFeedEnhanced` | Activity feed with grouping and search |
| `TimelineItem` | Single timeline entry with icon and connector |
| `Timeline` | Vertical timeline layout |
| **Specialized** | |
| `AuditLogEntry` | Structured audit log with actor, action, changes |
| `ChangelogItem` | Version changelog entry |
| `EventCalendar` | Calendar view of events on timeline |
| `GanttMini` | Compact Gantt chart for timeline view |
| `LiveFeed` | Real-time updating activity stream |
| `VersionHistory` | Version history with diff links |
| **Advanced** | |
| `EventAggregator` | Groups similar events into clusters |
| `CollaborationStack` | Shows active collaborators with status |
| `TimelineScrubber` | Scrubber/slider for timeline navigation |
| `PlaybackControls` | Play/pause/speed controls for timeline replay |
| `ActivityDigest` | Summarized activity digest view |
| `EventClustering` | Intelligent event clustering by time/type |
| `CausalityTimeline` | Shows cause-effect relationships |
| `ActivityAnalytics` | Activity trend analytics |
| `CommentsTimeline` | Timeline filtered to comments |

#### `activity/` — Activity Stream Components

Real-time activity display components for dashboards.

#### `comments/` — Comment System (15+ exports)

| Component | Description |
|-----------|-------------|
| `Comment` | Single comment with avatar, content, timestamp |
| `CommentThread` | Nested comment replies |
| `ReactionBar` | Emoji reaction picker/display |
| `MentionBadge` | @mention highlight badge |
| `MentionList` | List of mentions with navigation |

---

### Navigation (5 categories, ~52 components)

#### `navigation/` — Command Menu (10+ exports)

| Component | Description |
|-----------|-------------|
| `CommandMenu` | ⌘K command palette with search, keyboard nav, grouping |
| `CommandInput` | Search input within command menu |
| `CommandGroup` | Grouped command items with heading |
| `useCommandMenu` | Hook for command menu state management |

**Command Menu Usage:**

```tsx
const { isOpen, open, close, search, setSearch, filteredItems } = useCommandMenu({
  items: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, shortcut: '⌘D', action: () => router.push('/') },
    { id: 'users', label: 'Users', icon: Users, action: () => router.push('/users') },
  ],
});

<CommandMenu isOpen={isOpen} onClose={close} search={search} onSearchChange={setSearch}>
  {filteredItems.map(item => <CommandItem key={item.id} item={item} />)}
</CommandMenu>
```

#### `nav/` — Navigation Bar Components

Top navigation bar and side navigation components.

#### `tabs/` — Tab Navigation (12+ exports)

| Component | Description |
|-----------|-------------|
| `TabbedContainer` | Complete tabbed interface (tabs + content panels) |
| `TabbedCardGrid` | Tabs switching between card grids |
| `StatusTabs` | Tabs with status indicators (count badges) |
| `CategoryTabs` | Category-based tab navigation |

#### `scroll/` — Scroll Management

Scroll area, infinite scroll, scroll-to-top, and scroll spy components.

#### `carousel/` — Content Carousel

Swipeable image/content carousel with indicators and autoplay.

---

### Feedback & Overlays (5 categories, ~40+ components)

#### `feedback/` — Alerts, Toasts, Progress & States (40+ exports)

| Component | Description |
|-----------|-------------|
| **Alerts** | |
| `Alert` | Block-level alert with icon, title, and body (info/success/warning/danger) |
| `InlineAlert` | Compact inline alert |
| `AlertList` | Stacked alert list |
| **Confirm Dialogs** | |
| `ConfirmDialog` | Generic confirmation dialog |
| `DeleteConfirmDialog` | Destructive action confirmation with "type to confirm" |
| `UnsavedChangesDialog` | Navigation guard for unsaved changes |
| **Progress** | |
| `ProgressBar` | Horizontal progress bar (determinate/indeterminate) |
| `CircularProgress` | Circular/ring progress indicator |
| `StepProgress` | Step-based progress (1 of 5) |
| `UploadProgress` | File upload progress with filename and speed |
| **Toast Functions** | |
| `showSuccessToast(msg)` | Green success toast |
| `showErrorToast(msg)` | Red error toast |
| `showWarningToast(msg)` | Yellow warning toast |
| `showInfoToast(msg)` | Blue info toast |
| `showLoadingToast(msg)` | Toast with spinner |
| `dismissToast(id)` | Dismiss specific toast |
| `showPromiseToast(promise, msgs)` | Auto-resolving promise toast |
| `showUndoToast(msg, undoFn)` | Toast with undo action |
| `withToastFeedback(fn)` | Wrapper that shows toasts on success/error |
| `copyToClipboard(text)` | Copy to clipboard + success toast |
| `presetToasts` | Pre-configured toast helpers |
| **States** | |
| `SuccessState` | Full-page success display |
| `LoadingState` | Full-page loading display |
| `InlineLoading` | Inline loading indicator |

#### `notifications/` — Notification System

Push-style notification components, notification list, and notification preferences.

#### `overlay/` — Overlay Primitives

Base overlay/backdrop components used by modals, drawers, and sheets.

#### `progress/` — Progress Indicators

Extended progress components beyond feedback module.

#### `skeletons/` — Loading Skeleton Patterns

| Component | Description |
|-----------|-------------|
| `CardSkeleton` | Loading placeholder matching card dimensions |
| `GridSkeleton` | Multi-card grid skeleton |
| `ListSkeleton` | List item skeleton rows |
| `TableSkeleton` | Table with header and row skeletons |

---

### AI & Intelligence (1 category, ~40 exports)

#### `ai/` — AI Interaction Components

| Component | Key Props | Description |
|-----------|-----------|-------------|
| `Chatbot` | `messages`, `onSend`, `isStreaming`, `botName`, `showVoice`, `suggestedPrompts` | Complete AI chat interface |
| `useChat` | `endpoint`, `model` | Hook for chat state and streaming |
| `Terminal` | `commands`, `onCommand` | CLI-style terminal interface |
| `useTerminal` | — | Hook for terminal state |
| `StreamingText` | `text`, `speed`, `cursor` | Animated text streaming display |
| `TypewriterText` | `text`, `speed` | Typewriter-style text reveal |
| `StreamingMarkdown` | `content` | Streaming markdown renderer |
| `TextReveal` | `text`, `delay` | Word-by-word text reveal animation |
| `VoiceInput` | `onTranscript` | Speech-to-text input |
| `VoiceButton` | `onStart`, `onStop` | Microphone toggle button |
| `VoiceWaveform` | `isRecording` | Audio waveform visualization |
| `VoiceTranscript` | `text`, `isInterim` | Live voice transcript display |
| `VoiceAssistant` | `onCommand` | Voice-activated assistant interface |
| `useVoice` | — | Hook for voice input state |
| `ToolCall` | `name`, `status`, `args`, `result` | Expandable tool invocation card |
| `ToolCallList` | `toolCalls` | List of tool call results |
| `ThinkingIndicator` | `isThinking` | Animated thinking dots |
| `ThinkingBubble` | `isThinking` | Chat bubble with thinking animation |
| `ProcessingIndicator` | `label` | Processing state indicator |
| `AIMessage` | `content`, `model?`, `tokens?` | AI response message with metadata |
| `SystemMessage` | `content` | System-level message display |

**Chatbot Usage:**

```tsx
const { messages, sendMessage, isStreaming } = useChat({ endpoint: '/api/chat' });

<Chatbot
  messages={messages}
  onSend={sendMessage}
  isStreaming={isStreaming}
  botName="MCV Assistant"
  showFeedback
  showVoiceInput
  suggestedPrompts={['Show revenue metrics', 'Deployment status']}
/>
```

---

### Project Management & Workflow (4 categories, ~50+ components)

#### `project-management/` — PM Views (20+ exports)

| Component | Key Props | Description |
|-----------|-----------|-------------|
| `KanbanBoard` | `columns`, `onDragEnd`, `renderItem` | Drag-and-drop Kanban board |
| `Calendar` | `events`, `view`, `onEventClick` | Full calendar with day/week/month views |
| `MiniCalendar` | `selectedDate`, `onDateChange` | Compact calendar picker widget |
| `GanttChart` | `tasks`, `viewMode`, `onTaskChange` | Gantt chart with task bars and dependencies |
| `ListView` | `items`, `columns`, `onSort` | Sortable list view |
| `SimpleList` | `items`, `renderItem` | Minimal list display |

**Types:**

```typescript
interface KanbanColumn { id: string; title: string; items: KanbanItem[]; }
interface KanbanItem { id: string; title: string; [key: string]: any; }
interface CalendarEvent { id: string; title: string; start: Date; end: Date; color?: string; }
interface GanttTask { id: string; name: string; start: Date; end: Date; progress: number; dependencies?: string[]; }
```

#### `workflow/` — Workflow Orchestration (15+ exports)

| Component | Description |
|-----------|-------------|
| `WorkflowCanvas` | Interactive canvas with zoom, pan, grid, minimap, and node rendering |
| `EnhancedWorkflowNode` | Styled workflow node with icon, status, and handles |
| `NodePalette` | Drag-to-add node sidebar/panel |
| `nodeTypeConfigs` | Pre-defined node type configurations (trigger, process, output, decision, etc.) |
| `createWorkflowNode` | Factory function for creating workflow nodes |
| `createWorkflowEdge` | Factory function for creating workflow edges |

#### `pipeline/` — Pipeline Visualization

| Component | Description |
|-----------|-------------|
| `PipelineProgress` | Multi-stage pipeline with status per stage |
| `ApprovalPipeline` | Approval workflow pipeline with approver avatars |

#### `dashboard/` — Dashboard Assembly (15+ exports)

| Component | Description |
|-----------|-------------|
| `WidgetContainer` | Widget wrapper with title, actions dropdown, resize handle |
| `WidgetGrid` | Draggable/resizable grid layout for dashboard widgets |
| `SimpleDashboardGrid` | Static grid for metric dashboards |
| `useWidgetGrid` | Hook for widget grid state (layout, persistence) |
| `MetricDashboard` | Pre-built KPI metric grid dashboard |

---

### Domain-Specific Components (8 categories, ~20+ components)

#### `domain/` — Cross-Domain Components

| Component | Description |
|-----------|-------------|
| `PipelineItem` | CI/CD pipeline stage item |
| `IncidentCard` | Incident severity card (P0–P4) |
| `ResourceBar` | Resource utilization bar (CPU, RAM, Storage) |
| `ResourceGrid` | Grid of resource bars |
| `CampaignRow` | Marketing campaign table row |
| `MarketingMetric` | Marketing-specific metric display |
| `ToolCard` | Developer tool card |
| `ContentPiece` | Content management item |
| `CampaignGrid` | Campaign overview grid |

#### `finance/` — Financial Components

| Component | Description |
|-----------|-------------|
| `CreditCard` | Visual credit card display |
| `Ticker` | Live price/value ticker |

#### `identity/` — User & Agent Identity

| Component | Description |
|-----------|-------------|
| `Avatar` | User avatar with fallback initials |
| `UserCard` | User profile card with role and status |
| `PermissionBadge` | Permission level badge (admin, editor, viewer) |
| `AgentBadge` | AI agent identification badge |

#### `users/` — User Management UI

User list, profile, and management components.

#### `presence/` — Real-Time Presence

Online/offline status indicators with live updates.

#### `locale/` — Internationalization Components

i18n-aware components with locale detection and formatting.

#### `files/` — File Management

File browser, file preview, file upload queue, and version history.

#### `onboarding/` — User Onboarding (20+ exports)

| Component | Description |
|-----------|-------------|
| `TourProvider` | Context provider for product tours |
| `TourTooltip` | Positioned tooltip for tour steps |
| `TourOverlay` | Semi-transparent overlay with spotlight cutout |
| `useTour` | Hook for tour state management |
| `Spotlight` | Single-element spotlight highlight |
| `MultiSpotlight` | Multiple simultaneous spotlight highlights |
| `OnboardingChecklist` | Task checklist with progress |
| `CoachMark` | Persistent coach mark pointer |
| `WelcomeModal` | Multi-slide welcome screen |

---

### Page Composition (3 categories, ~30+ components)

#### `patterns/shell/` — Application Shell

| Component | Description |
|-----------|-------------|
| `AppShell` | Root layout combining sidebar + header + main content |
| `Header` | Top bar with search trigger, actions, user menu |
| `Sidebar` | Collapsible navigation sidebar with sections and icons |

**AppShell Usage:**

```tsx
<AppShell>
  <Sidebar logo={<Logo />} sections={sidebarSections} collapsible />
  <div className="flex-1 flex flex-col">
    <Header onSearch={openCommandMenu} actions={[<ThemeToggle />, <UserMenu />]} />
    <main className="flex-1 p-6">{children}</main>
  </div>
</AppShell>
```

#### `page/` — Page Composition Primitives (30+ exports)

| Component | Description |
|-----------|-------------|
| **Headers** | |
| `PageHeader` | Page title + description + action buttons |
| `CompactPageHeader` | Minimal page header |
| `Breadcrumbs` | Breadcrumb navigation (wraps Radix Breadcrumb) |
| **Sections** | |
| `PageSection` | Content section with optional title |
| `SectionDivider` | Visual section separator |
| `SectionGroup` | Grouped sections |
| **Empty/Error States** | |
| `EmptyState` | No data state with icon, title, description, CTA |
| `EmptyList` | Empty list state |
| `NoSearchResults` | No search results state |
| `ErrorState` | Error display with retry action |
| `OfflineState` | Network offline state |
| `UnauthorizedState` | Access denied state |
| `WelcomeState` | First-time welcome state |
| `ComingSoonState` | Feature coming soon state |
| **Layouts** | |
| `ContentShell` | Page content wrapper with max-width |
| `PageContainer` | Full-page container |
| `SplitLayout` | Two-column split layout |
| `GridLayout` | Multi-column grid layout |
| `StackLayout` | Vertical stack layout with spacing |

#### `inspector/` — Detail & Master-Detail Panels

| Component | Description |
|-----------|-------------|
| `DetailDrawer` | Right-side detail drawer with sections |
| `DrawerSection` | Section within detail drawer |
| `DrawerKeyValue` | Key-value pair within drawer |
| `SplitPaneLayout` | Resizable split pane (master/detail) |
| `MasterDetail` | Master list + detail view pattern |

---

### Utility & Support (7 categories, ~30+ components)

#### `utility/` — Status, Time & Copy (30+ exports)

| Component | Description |
|-----------|-------------|
| **Status** | |
| `Status` | Generic status display with icon |
| `StatusIndicator` | Color dot status indicator |
| `ActivityStatus` | User activity status (active, idle, offline) |
| `HealthStatus` | System health indicator (healthy, degraded, down) |
| **Time** | |
| `RelativeTime` | Auto-updating relative time ("2h ago") |
| `Timestamp` | Formatted timestamp with tooltip |
| `Countdown` | Countdown timer display |
| **Copy** | |
| `CopyButton` | Standalone copy-to-clipboard button |
| `CopyField` | Input field with copy button |
| `CopyText` | Text with inline copy action |
| `CopyCodeBlock` | Code block with copy functionality |
| **Shortcuts** | |
| `KeyboardShortcut` | Keyboard shortcut display (styled keys) |
| `ShortcutHint` | Inline shortcut hint |
| `ShortcutWithLabel` | Shortcut + description pair |
| `ShortcutList` | List of shortcuts |
| `ShortcutGroup` | Grouped shortcuts with heading |
| `ShortcutsPanel` | Full shortcuts reference panel |
| `commonShortcuts` | Pre-defined common shortcut definitions |
| **Loading** | |
| `Spinner` | Loading spinner animation |
| `LoadingOverlay` | Full-area loading overlay |
| `Skeleton` | Placeholder skeleton for loading state |

#### `drag-drop/` — Drag & Drop

Drag-and-drop interaction primitives for sortable lists and Kanban boards.

#### `generators/` — Component Generators

Dynamic component creation utilities for runtime component generation.

#### `query-builder/` — Visual Query Builder

Visual query construction UI for advanced filter interfaces.

#### `3d/` — 3D Visualization

Three.js-based 3D components for data visualization.

#### `media/` — Media Playback & Display

| Component | Description |
|-----------|-------------|
| `ImageZoom` | Image with zoom-on-click |
| `VideoPlayer` | Video player with controls |
| `Stories` | Instagram-style stories viewer |

#### `controls/` — Specialized Controls

Specialized interactive control widgets beyond standard form elements.

---

## Component API Standard

Every component follows this standard API pattern:

```typescript
interface StandardComponentProps {
  // Visual variants (handled by tailwind-variants or CVA)
  variant?: VariantType;
  size?: ComponentSize;
  color?: SemanticColor;
  radius?: RadiusPreset;

  // State
  isDisabled?: boolean;
  isLoading?: boolean;
  isActive?: boolean;

  // Content slots
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  children?: React.ReactNode;

  // DOM passthrough
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'data-testid'?: string;

  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}
```

### Variant Implementation (tailwind-variants)

```typescript
import { tv } from 'tailwind-variants';

const button = tv({
  base: 'inline-flex items-center justify-center font-medium transition-all focus-visible:ring-2',
  variants: {
    variant: {
      solid: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      xs: 'h-7 px-2 text-xs rounded-md',
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-sm rounded-lg',
      lg: 'h-11 px-6 text-base rounded-lg',
      xl: 'h-12 px-8 text-lg rounded-xl',
    },
  },
  defaultVariants: { variant: 'solid', size: 'md' },
});
```

### Compound Component Pattern

Complex components use the compound component pattern with shared context:

```typescript
// DataTable compound
<DataTable data={users} columns={columns}>
  <DataTable.Toolbar>
    <DataTable.Search placeholder="Search users..." />
  </DataTable.Toolbar>
  <DataTable.Header>
    <DataTable.Column field="name" sortable />
    <DataTable.Column field="email" />
  </DataTable.Header>
  <DataTable.Body>
    {(row) => (
      <DataTable.Row id={row.id}>
        <DataTable.Cell>{row.name}</DataTable.Cell>
        <DataTable.Cell>{row.email}</DataTable.Cell>
      </DataTable.Row>
    )}
  </DataTable.Body>
  <DataTable.Pagination />
</DataTable>
```

### Slot Pattern (Radix)

Composition via `asChild` prop allows any component to render as a different element:

```tsx
<Button asChild variant="ghost">
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

---

## Accessibility

### WCAG 2.1 AA Compliance

All interactive components are designed for WCAG 2.1 Level AA compliance:

| Principle | Implementation |
|-----------|---------------|
| **Perceivable** | Visible focus indicators, 4.5:1 contrast ratio for text, 3:1 for large text, color never sole indicator |
| **Operable** | Full keyboard navigation via Radix primitives, focus trapping in modals, skip links |
| **Understandable** | Consistent behavior, visible error messages via `aria-describedby`, predictable navigation |
| **Robust** | Semantic HTML elements, ARIA attributes on all interactive components, screen reader tested |

### Keyboard Navigation

| Component | Key | Action |
|-----------|-----|--------|
| Button | `Enter`/`Space` | Activate |
| Dialog | `Escape` | Close |
| DropdownMenu | `↑`/`↓` | Navigate items |
| DropdownMenu | `Enter` | Select item |
| DropdownMenu | `Escape` | Close menu |
| Tabs | `←`/`→` | Switch tabs |
| Accordion | `Enter`/`Space` | Toggle section |
| CommandMenu | `⌘K` | Open |
| CommandMenu | `↑`/`↓` | Navigate results |
| CommandMenu | `Enter` | Execute action |
| DataTable | `↑`/`↓` | Navigate rows |
| DataTable | `Space` | Select row |
| ComboBox | `↑`/`↓` | Navigate options |
| ComboBox | `Enter` | Select option |
| Tree | `←`/`→` | Collapse/expand |

---

## Performance

### Code Splitting

All components are individually tree-shakeable via the ESM barrel export. Heavy dependencies (Recharts, TanStack Table, Framer Motion) are only bundled when their components are imported.

### `'use client'` Boundaries

Every component file begins with `'use client'` for Next.js App Router / React Server Component compatibility.

### Bundle Size Budget

| Category | Estimated gzip Size |
|----------|-------------------|
| Primitives (Radix wrappers) | ~8KB |
| Form components | ~12KB |
| Data display (Table, Stats, Cells) | ~15KB |
| Charts (Recharts peer dep) | ~45KB |
| AI components | ~8KB |
| Workflow canvas | ~6KB |
| Feedback system | ~5KB |
| **Total (all imported)** | **~95KB own + deps** |

### Virtualization

Large datasets use virtualized rendering for 60fps performance:

```tsx
<VirtualizedTable data={largeDataset} columns={columns} rowHeight={48} overscan={5} />
```

---

## Testing Strategy

### Test Types

| Type | Tools | Coverage Target |
|------|-------|-----------------|
| Unit tests | Vitest + React Testing Library | 85%+ |
| Accessibility | jest-axe | Zero violations |
| Visual regression | Playwright | Key component states |
| Integration | Vitest + RTL | Form flows, table interactions |
| Storybook | Storybook 8 | All components documented |

### Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

---

## Dependencies

### Production Dependencies

| Package | Purpose | Bundle Impact |
|---------|---------|---------------|
| `@heroui/*` (32 pkgs) | Base component primitives | ~25KB gz (tree-shaken) |
| `@radix-ui/*` (10 pkgs) | Headless accessible primitives | ~12KB gz (tree-shaken) |
| `tailwindcss` v4 | Utility-first CSS | Build-time only |
| `framer-motion` v11 | Animations | ~30KB gz |
| `recharts` v2 | Charts | ~45KB gz |
| `@tanstack/react-table` v8 | Table engine | ~15KB gz |
| `lucide-react` | Icons | ~0.5KB per icon |
| `class-variance-authority` | Variant management | ~2KB gz |
| `clsx` + `tailwind-merge` | Class composition | ~3.3KB gz |
| `sonner` | Toast notifications | ~4KB gz |
| `next-themes` | Theme persistence | ~1KB gz |
| `@hookform/resolvers` | Zod ↔ RHF bridge | ~1KB gz |

### Peer Dependencies

| Package | Version |
|---------|---------|
| `react` | ^18.0.0 \|\| ^19.0.0 |
| `react-dom` | ^18.0.0 \|\| ^19.0.0 |
| `next` | ^15.0.3 |
| `react-hook-form` | ^7.0.0 |
| `zod` | ^3.22.0 |

---

## File Structure

```
packages/ui/src/
├── index.ts                        # Barrel export (508 components, 20 sections)
├── lib/
│   ├── utils.ts                    # cn(), formatCurrency(), debounce(), etc.
│   └── use-outside-click.ts        # Click-outside hook
├── shared/
│   └── types.ts                    # ComponentSize, SemanticColor, FieldProps, etc.
├── styles/
│   └── theme.css                   # 460+ lines of CSS custom properties
│
├── primitives/                     # 16 Radix UI wrappers
│   ├── dialog.tsx
│   ├── alert-dialog.tsx
│   ├── drawer.tsx
│   ├── dropdown-menu.tsx
│   ├── context-menu.tsx
│   ├── tabs.tsx
│   ├── accordion.tsx
│   ├── collapsible.tsx
│   ├── breadcrumb.tsx
│   ├── tooltip.tsx
│   ├── hover-card.tsx
│   ├── card.tsx
│   ├── separator.tsx
│   ├── badge.tsx
│   ├── scroll-area.tsx
│   └── sonner.tsx
│
├── form/                           # 50 files, 130+ exports
│   ├── form.tsx                    # Form, FormField, FormItem (RHF)
│   ├── text-input.tsx
│   ├── number-input.tsx
│   ├── checkbox.tsx
│   ├── radio.tsx
│   ├── select.tsx
│   ├── combobox.tsx
│   ├── wizard-form.tsx
│   └── ... (50 files)
│
├── ai/                             # 7 TSX files, 40+ exports
│   ├── chatbot.tsx
│   ├── terminal.tsx
│   ├── voice.tsx
│   ├── streaming-text.tsx
│   ├── tool-call.tsx
│   ├── thinking-indicator.tsx
│   └── message-variants.tsx
│
├── charts/                         # 7 TSX files, 40+ exports
│   ├── area-chart.tsx
│   ├── bar-chart.tsx
│   ├── donut-chart.tsx
│   ├── sparkline.tsx
│   ├── kpi-card.tsx
│   ├── heatmap-chart.tsx
│   └── scatter-chart.tsx
│
├── table/                          # 14 TSX files, 65+ exports
│   ├── table-toolbar.tsx
│   ├── row-actions.tsx
│   ├── bulk-action-bar.tsx
│   ├── pagination.tsx
│   ├── cell-renderers.tsx
│   ├── virtualized-table.tsx
│   └── ...
│
├── data/                           # Core data display
├── cards/                          # 60+ card variants
├── timeline/                       # 100+ exports (largest)
├── feedback/                       # Alerts, toasts, progress
├── page/                           # Page composition
├── workflow/                       # Workflow canvas
├── project-management/             # Kanban, Calendar, Gantt
├── dashboard/                      # Widget grid
├── navigation/                     # Command menu
├── onboarding/                     # Tours, spotlight
├── identity/                       # Avatar, UserCard
├── theme/                          # Theme toggle, customizer
├── auth/                           # Auth card, PIN
├── typography/                     # Heading, Text, Prose
├── button/                         # Button variants
└── ... (remaining 50+ categories)
```

---

## Integration with @mcv/api

Components are **data-agnostic** — they accept data via props. The `@mcv/api` package provides React Query hooks that feed data into UI components:

```
  @mcv/api (Tier 5)                    @mcv/ui (Tier 6)
  ┌─────────────────┐                  ┌─────────────────┐
  │ useUsers()      │ ──── data ────▶ │ TanStackTable    │
  │ useStats()      │ ──── data ────▶ │ StatsCard        │
  │ useChat()       │ ──── data ────▶ │ Chatbot          │
  │ useActivities() │ ──── data ────▶ │ ActivityFeed     │
  └─────────────────┘                  └─────────────────┘
```

---

*@mcv/ui/components — Component Library Catalog v1.0*
