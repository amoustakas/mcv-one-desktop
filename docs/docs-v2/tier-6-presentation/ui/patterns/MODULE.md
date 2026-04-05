# @mcv/ui/patterns — Reusable UI Patterns & Page Compositions

**Parent Package:** @mcv/ui  
**Submodule:** patterns  
**Tier:** 6 (Presentation Layer - UI)  
**Classification:** PUBLISHABLE  
**Version:** 0.1.0  
**Last Updated:** February 9, 2026

---

## Purpose

`@mcv/ui/patterns` provides **85+ pre-built, composable UI patterns** that orchestrate atomic components, primitives, and composite elements from `@mcv/ui` into production-ready page compositions. These patterns encode proven UX solutions — layout shells, data tables with full CRUD, multi-step wizards, dashboard grids, command palettes, empty states, and responsive navigation — so that every MCV.ONE application achieves design consistency without re-inventing structural decisions.

**Patterns are not components. They are opinionated compositions of components that solve recurring UX problems.**

### What It Does

- Provides slot-based page layout patterns (standard, split, full-width, sidebar, dashboard)
- Delivers data display patterns with sorting, filtering, pagination, and virtualization baked in
- Offers form composition patterns including multi-step wizards, inline edit, bulk edit, and dynamic field arrays
- Ships dashboard patterns with metric cards, chart grids, activity feeds, and KPI compositions
- Includes navigation patterns (sidebar nav, breadcrumbs, tabs, command palette)
- Provides modal and dialog patterns (confirmation, form modal, drawer, sheet, lightbox)
- Implements empty state patterns (no data, no results, first-time, error, offline, unauthorized)
- Delivers loading patterns (skeleton screens, spinners, progress bars, optimistic UI)
- Implements error handling patterns (inline errors, toast notifications, error boundaries, retry)
- Ships responsive patterns (mobile-first, breakpoint system, responsive tables)
- Ensures accessibility patterns (focus management, keyboard navigation, screen reader, ARIA live regions)
- Provides animation patterns (transitions, micro-interactions, page transitions)
- Supports pattern composition — combining multiple patterns into complex page-level UIs

### What It Does NOT Do

- Does not define new atomic components — all building blocks come from `@mcv/ui` core
- Does not manage application state — consuming applications own state management
- Does not perform data fetching — `@mcv/api` handles all API communication
- Does not implement business logic — domain rules live in tier-3 and tier-4 packages
- Does not handle routing — Next.js App Router handles navigation

---

## Pattern Philosophy

### Composition Over Inheritance

Every pattern in this module follows a strict **composition-first** approach. Patterns are not subclassed or extended — they are assembled from smaller pieces using React composition patterns:

```typescript
// ❌ WRONG: Inheritance-based pattern
class AdminDashboard extends BaseDashboard {
  override renderHeader() { ... }
  override renderMetrics() { ... }
}

// ✅ RIGHT: Composition-based pattern
function AdminDashboard() {
  return (
    <DashboardLayout>
      <DashboardLayout.Header>
        <PageHeader title="Admin Dashboard" />
      </DashboardLayout.Header>
      <DashboardLayout.Metrics>
        <MetricCardGrid metrics={metrics} />
      </DashboardLayout.Metrics>
      <DashboardLayout.Content>
        <DataTable data={data} columns={columns} />
      </DashboardLayout.Content>
    </DashboardLayout>
  );
}
```

### Slot-Based Layout

Patterns use a **slot model** inspired by Web Components and Radix UI compound components. Each pattern exposes named slots that consuming applications fill with their own content:

```typescript
// Slot-based pattern definition
interface PageLayoutSlots {
  header?: React.ReactNode;       // Top bar with title, breadcrumbs, actions
  sidebar?: React.ReactNode;      // Optional left sidebar for navigation
  toolbar?: React.ReactNode;      // Action toolbar below header
  content: React.ReactNode;       // Main content area (required)
  footer?: React.ReactNode;       // Optional bottom bar
  aside?: React.ReactNode;        // Optional right sidebar for details
}

// Usage — only fill the slots you need
<StandardPage
  header={<PageHeader title="Users" />}
  toolbar={<FilterBar filters={filters} />}
  content={<UserTable data={users} />}
/>
```

### Pattern Layering Model

Patterns are organized in four layers, each building on the one below:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: FULL PAGE PATTERNS                                     │
│  Complete pages with shell, navigation, and content composition  │
│  AdminDashboard, SettingsPage, EntityCrudPage, OnboardingFlow   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: SECTION PATTERNS                                       │
│  Major page sections that compose multiple components            │
│  DataTableSection, MetricCardGrid, FormWizard, ActivitySection  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: LAYOUT PATTERNS                                        │
│  Structural layouts defining content arrangement                 │
│  StandardPage, SplitLayout, SidebarLayout, DashboardGrid        │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: BEHAVIORAL PATTERNS                                    │
│  Reusable behaviors attached to any component tree               │
│  ErrorBoundary, LoadingGate, OptimisticUpdate, RetryWrapper     │
└─────────────────────────────────────────────────────────────────┘
```

### Convention: Props Over Configuration Objects

Patterns prefer **flat props** for simple configuration and **object props** for complex nested configuration. This keeps the API surface predictable:

```typescript
// Simple: flat props
<StandardPage title="Users" subtitle="Manage system users" maxWidth="xl" />

// Complex: object props for nested config
<DataTablePattern
  columns={columns}
  data={data}
  sorting={{ defaultField: 'name', defaultOrder: 'asc' }}
  pagination={{ pageSize: 25, pageSizes: [10, 25, 50, 100] }}
  filtering={{ searchable: true, filterFields: ['status', 'role'] }}
/>
```

---

## Page Layout Patterns

Page layouts define the structural skeleton that every page in MCV.ONE builds upon. Each layout pattern is responsive, accessible, and theme-aware.

### StandardPage

The most common layout — a single-column content area with optional header and footer:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface StandardPageProps {
  /** Page title displayed in PageHeader */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Breadcrumb items for navigation context */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons rendered in the header right side */
  actions?: React.ReactNode;
  /** Maximum content width: 'sm' | 'md' | 'lg' | 'xl' | 'full' */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Optional toolbar rendered below header */
  toolbar?: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Whether to show a loading skeleton instead of content */
  loading?: boolean;
  /** Padding preset */
  padding?: SpacingScale;
  /** Additional className for the content container */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { StandardPage, Button, DataTable } from '@mcv/ui';

function UsersPage() {
  return (
    <StandardPage
      title="Users"
      subtitle="Manage system users and permissions"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Settings', href: '/settings' },
        { label: 'Users' },
      ]}
      actions={
        <Button color="primary" startContent={<PlusIcon />}>
          Add User
        </Button>
      }
      toolbar={<FilterBar filters={userFilters} />}
      maxWidth="xl"
    >
      <DataTable data={users} columns={userColumns} />
    </StandardPage>
  );
}
```

**Rendered Structure:**

```
┌──────────────────────────────────────────────┐
│  Breadcrumb: Home > Settings > Users         │
│                                              │
│  Users                        [+ Add User]   │
│  Manage system users and permissions         │
├──────────────────────────────────────────────┤
│  [Search...] [Status ▾] [Role ▾] [Clear]    │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Name  │ Email  │ Role  │ Status │ ⋮ │    │
│  │  ───── │ ─────  │ ───── │ ────── │   │    │
│  │  Alice │ a@...  │ Admin │ Active │ ⋮ │    │
│  │  Bob   │ b@...  │ User  │ Active │ ⋮ │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ◀ 1 2 3 ... 12 ▶     Showing 1-25 of 291   │
└──────────────────────────────────────────────┘
```

### SplitLayout

A two-panel layout for master-detail views, comparison screens, and side-by-side content:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface SplitLayoutProps {
  /** Left panel content */
  left: React.ReactNode;
  /** Right panel content */
  right: React.ReactNode;
  /** Split ratio: default '1:1' */
  ratio?: '1:1' | '1:2' | '2:1' | '1:3' | '3:1' | 'auto';
  /** Whether the divider is draggable for resizing */
  resizable?: boolean;
  /** Minimum panel width in pixels */
  minPanelWidth?: number;
  /** Direction: 'horizontal' (side-by-side) or 'vertical' (stacked) */
  direction?: 'horizontal' | 'vertical';
  /** Responsive collapse breakpoint — below this width, panels stack vertically */
  collapseBelow?: 'sm' | 'md' | 'lg';
  /** Which panel to show when collapsed */
  collapsePriority?: 'left' | 'right';
  /** Divider style */
  divider?: 'line' | 'gap' | 'none';
  /** Gap between panels */
  gap?: SpacingScale;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { SplitLayout, ListView, DetailView } from '@mcv/ui';

function EmailInbox() {
  const [selected, setSelected] = useState<Email | null>(null);

  return (
    <SplitLayout
      ratio="1:2"
      resizable
      minPanelWidth={320}
      collapseBelow="md"
      collapsePriority="left"
      left={
        <ListView
          items={emails}
          selected={selected?.id}
          onSelect={(email) => setSelected(email)}
          renderItem={(email) => (
            <EmailPreview email={email} />
          )}
        />
      }
      right={
        selected ? (
          <DetailView data={selected} />
        ) : (
          <EmptyState
            icon={<MailIcon />}
            title="Select an email"
            description="Choose an email from the list to view its contents"
          />
        )
      }
    />
  );
}
```

### FullWidthLayout

An edge-to-edge layout for dashboards, maps, and immersive content that needs maximum horizontal space:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface FullWidthLayoutProps {
  /** Optional sticky header */
  header?: React.ReactNode;
  /** Main content — spans full viewport width */
  children: React.ReactNode;
  /** Optional floating action bar at bottom */
  actionBar?: React.ReactNode;
  /** Whether to remove default padding */
  flush?: boolean;
  /** Background variant */
  background?: 'default' | 'muted' | 'transparent';
  /** Minimum height: defaults to 'screen' (100vh) */
  minHeight?: 'screen' | 'auto' | string;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { FullWidthLayout, WorkflowCanvas } from '@mcv/ui';

function WorkflowEditorPage() {
  return (
    <FullWidthLayout
      flush
      background="muted"
      header={
        <CompactPageHeader
          title="Workflow Editor"
          actions={<Button>Save & Publish</Button>}
        />
      }
      actionBar={
        <FloatingToolbar>
          <ZoomControls />
          <UndoRedo />
          <MiniMap />
        </FloatingToolbar>
      }
    >
      <WorkflowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
      />
    </FullWidthLayout>
  );
}
```

### SidebarLayout

A persistent sidebar with scrollable main content — the foundation of most admin and dashboard views:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface SidebarLayoutProps {
  /** Sidebar content (usually navigation) */
  sidebar: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right';
  /** Sidebar width in pixels or CSS value */
  sidebarWidth?: number | string;
  /** Whether the sidebar is collapsible */
  collapsible?: boolean;
  /** Collapsed state (controlled) */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Width when collapsed (icon-only mode) */
  collapsedWidth?: number;
  /** Whether to overlay on mobile instead of pushing content */
  mobileOverlay?: boolean;
  /** Breakpoint below which sidebar becomes a mobile overlay */
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  /** Whether sidebar has a border separator */
  bordered?: boolean;
  /** Sticky sidebar (stays in viewport while content scrolls) */
  sticky?: boolean;
  /** Additional className for the layout container */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { SidebarLayout, SidebarNav, StandardPage } from '@mcv/ui';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarLayout
      collapsible
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      sidebarWidth={260}
      collapsedWidth={64}
      mobileOverlay
      mobileBreakpoint="md"
      sticky
      bordered
      sidebar={
        <SidebarNav
          collapsed={collapsed}
          items={[
            { icon: <HomeIcon />, label: 'Dashboard', href: '/admin' },
            { icon: <UsersIcon />, label: 'Users', href: '/admin/users' },
            { icon: <SettingsIcon />, label: 'Settings', href: '/admin/settings' },
          ]}
          footer={
            <UserCard user={currentUser} compact={collapsed} />
          }
        />
      }
    >
      {children}
    </SidebarLayout>
  );
}
```

**Rendered Structure:**

```
┌────────┬─────────────────────────────────────┐
│        │                                     │
│  🏠    │  Dashboard                          │
│  👥    │  ─────────────────────────────────  │
│  ⚙️    │                                     │
│        │  [Main Content Area]                │
│        │                                     │
│        │                                     │
│        │                                     │
│        │                                     │
├────────┤                                     │
│  👤 AK │                                     │
└────────┴─────────────────────────────────────┘
```

---

## Data Display Patterns

Data display patterns solve the complex UX challenges of presenting, sorting, filtering, paginating, and interacting with structured data.

### DataTablePattern

The flagship data display pattern — a complete data table with sorting, filtering, search, pagination, row selection, bulk actions, column visibility, and export:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface DataTablePatternProps<TData> {
  /** Column definitions (TanStack Table ColumnDef[]) */
  columns: ColumnDef<TData>[];
  /** Data array */
  data: TData[];
  /** Total row count for server-side pagination */
  totalRows?: number;
  /** Whether data is currently loading */
  loading?: boolean;
  /** Error state */
  error?: Error | null;

  // ─── Sorting ────────────────────────────────────────────────
  /** Enable column sorting */
  sortable?: boolean;
  /** Default sort configuration */
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  /** Server-side sort handler */
  onSortChange?: (sort: SortState) => void;

  // ─── Filtering ──────────────────────────────────────────────
  /** Enable search input */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Filterable field definitions */
  filters?: FilterFieldDef[];
  /** Server-side filter handler */
  onFilterChange?: (filters: FilterState) => void;
  /** Debounce delay for search input (ms) */
  searchDebounce?: number;

  // ─── Pagination ─────────────────────────────────────────────
  /** Enable pagination */
  paginated?: boolean;
  /** Default page size */
  pageSize?: number;
  /** Available page sizes */
  pageSizes?: number[];
  /** Server-side pagination handler */
  onPageChange?: (page: number, pageSize: number) => void;
  /** Pagination position */
  paginationPosition?: 'top' | 'bottom' | 'both';

  // ─── Selection ──────────────────────────────────────────────
  /** Enable row selection */
  selectable?: boolean;
  /** Selection mode */
  selectionMode?: 'single' | 'multi';
  /** Currently selected row IDs */
  selectedIds?: string[];
  /** Selection change handler */
  onSelectionChange?: (ids: string[]) => void;

  // ─── Bulk Actions ───────────────────────────────────────────
  /** Actions available when rows are selected */
  bulkActions?: BulkAction[];

  // ─── Row Actions ────────────────────────────────────────────
  /** Per-row action menu items */
  rowActions?: RowActionDef<TData>[];
  /** Row click handler */
  onRowClick?: (row: TData) => void;

  // ─── Column Customization ───────────────────────────────────
  /** Allow users to toggle column visibility */
  columnToggle?: boolean;
  /** Allow column reordering via drag */
  columnReorder?: boolean;
  /** Saved view presets */
  savedViews?: SavedView[];
  /** Save view handler */
  onSaveView?: (view: SavedView) => void;

  // ─── Export ─────────────────────────────────────────────────
  /** Export options */
  exportFormats?: ('csv' | 'json' | 'xlsx')[];
  /** Custom export handler */
  onExport?: (format: string, data: TData[]) => void;

  // ─── Expansion ──────────────────────────────────────────────
  /** Enable expandable rows */
  expandable?: boolean;
  /** Render function for expanded row content */
  renderExpandedRow?: (row: TData) => React.ReactNode;

  // ─── Virtualization ─────────────────────────────────────────
  /** Enable row virtualization for large datasets */
  virtualized?: boolean;
  /** Estimated row height for virtualization */
  estimatedRowHeight?: number;

  // ─── Empty & Error States ───────────────────────────────────
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Custom error state */
  errorState?: React.ReactNode;
  /** Retry handler for error state */
  onRetry?: () => void;

  // ─── Styling ────────────────────────────────────────────────
  /** Table density */
  density?: 'compact' | 'default' | 'comfortable';
  /** Striped rows */
  striped?: boolean;
  /** Row hover highlight */
  hoverable?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Additional className */
  className?: string;
}

// ─── Supporting Types ───────────────────────────────────────────
interface FilterFieldDef {
  field: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'number-range' | 'boolean';
  options?: { label: string; value: string }[];
}

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  onClick: (selectedIds: string[]) => void;
  confirmMessage?: string;
}

interface RowActionDef<TData> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: TData) => void;
  variant?: 'default' | 'danger';
  disabled?: (row: TData) => boolean;
  hidden?: (row: TData) => boolean;
}

interface SavedView {
  id: string;
  name: string;
  columns: string[];
  sort?: SortState;
  filters?: FilterState;
}

// ─── Usage ──────────────────────────────────────────────────────
import { DataTablePattern } from '@mcv/ui';
import { type User } from '@/types';

const userColumns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => <Badge>{getValue()}</Badge>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusIndicator status={getValue()} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ getValue }) => <RelativeTime date={getValue()} />,
  },
];

function UsersTable() {
  return (
    <DataTablePattern<User>
      columns={userColumns}
      data={users}
      totalRows={totalCount}
      loading={isLoading}
      sortable
      defaultSort={{ field: 'name', order: 'asc' }}
      searchable
      searchPlaceholder="Search users..."
      filters={[
        {
          field: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Suspended', value: 'suspended' },
          ],
        },
        {
          field: 'role',
          label: 'Role',
          type: 'multi-select',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Editor', value: 'editor' },
            { label: 'Viewer', value: 'viewer' },
          ],
        },
      ]}
      paginated
      pageSize={25}
      pageSizes={[10, 25, 50, 100]}
      selectable
      selectionMode="multi"
      bulkActions={[
        { label: 'Activate', icon: <CheckIcon />, onClick: handleActivate },
        { label: 'Deactivate', icon: <XIcon />, onClick: handleDeactivate },
        {
          label: 'Delete',
          icon: <TrashIcon />,
          variant: 'danger',
          onClick: handleDelete,
          confirmMessage: 'Are you sure you want to delete the selected users?',
        },
      ]}
      rowActions={[
        { label: 'Edit', icon: <EditIcon />, onClick: handleEdit },
        { label: 'View Profile', icon: <EyeIcon />, onClick: handleView },
        {
          label: 'Delete',
          icon: <TrashIcon />,
          variant: 'danger',
          onClick: handleDeleteSingle,
        },
      ]}
      columnToggle
      exportFormats={['csv', 'json']}
      density="default"
      striped
      hoverable
      stickyHeader
      onRowClick={(user) => router.push(`/users/${user.id}`)}
      emptyState={
        <EmptyState
          icon={<UsersIcon />}
          title="No users found"
          description="Try adjusting your search or filter criteria"
          action={{ label: 'Clear Filters', onClick: clearFilters }}
        />
      }
    />
  );
}
```

### DetailView

A structured detail page for viewing a single entity with sections, key-value pairs, and related data:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface DetailViewProps<TData> {
  /** The entity data object */
  data: TData;
  /** Whether the data is loading */
  loading?: boolean;
  /** Page title — can be a string or a render function */
  title: string | ((data: TData) => string);
  /** Subtitle */
  subtitle?: string | ((data: TData) => string);
  /** Avatar or icon to display alongside the title */
  avatar?: React.ReactNode | ((data: TData) => React.ReactNode);
  /** Header action buttons */
  actions?: React.ReactNode;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];

  /** Detail sections */
  sections: DetailSection<TData>[];

  /** Related entities displayed in tabs below the detail */
  relatedTabs?: RelatedTab[];

  /** Back navigation */
  backHref?: string;
  backLabel?: string;

  /** Additional className */
  className?: string;
}

interface DetailSection<TData> {
  title: string;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  fields: DetailField<TData>[];
}

interface DetailField<TData> {
  label: string;
  accessor: keyof TData | ((data: TData) => React.ReactNode);
  type?: 'text' | 'date' | 'currency' | 'status' | 'badge' | 'link' | 'email' | 'custom';
  span?: 1 | 2 | 3;      // Grid column span (out of 3)
  copyable?: boolean;
  editable?: boolean;
  onEdit?: (value: unknown) => void;
}

interface RelatedTab {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  content: React.ReactNode;
}

// ─── Usage ──────────────────────────────────────────────────────
import { DetailView, Badge, StatusIndicator, RelativeTime } from '@mcv/ui';

function UserDetailPage({ user }: { user: User }) {
  return (
    <DetailView
      data={user}
      title={(u) => u.name}
      subtitle={(u) => u.email}
      avatar={(u) => <Avatar src={u.avatarUrl} name={u.name} size="lg" />}
      breadcrumbs={[
        { label: 'Users', href: '/users' },
        { label: user.name },
      ]}
      actions={
        <>
          <Button variant="outline" startContent={<EditIcon />}>Edit</Button>
          <Button variant="outline" color="danger" startContent={<TrashIcon />}>Delete</Button>
        </>
      }
      sections={[
        {
          title: 'General Information',
          icon: <UserIcon />,
          fields: [
            { label: 'Full Name', accessor: 'name', copyable: true },
            { label: 'Email', accessor: 'email', type: 'email', copyable: true },
            { label: 'Role', accessor: (u) => <Badge>{u.role}</Badge>, type: 'custom' },
            { label: 'Status', accessor: (u) => <StatusIndicator status={u.status} />, type: 'custom' },
            { label: 'Joined', accessor: (u) => <RelativeTime date={u.createdAt} />, type: 'custom' },
            { label: 'Last Active', accessor: (u) => <RelativeTime date={u.lastActiveAt} />, type: 'custom' },
          ],
        },
        {
          title: 'Permissions',
          icon: <ShieldIcon />,
          collapsible: true,
          fields: [
            { label: 'Access Level', accessor: 'accessLevel' },
            { label: 'Two-Factor', accessor: (u) => u.mfaEnabled ? 'Enabled' : 'Disabled' },
            { label: 'API Key', accessor: 'apiKey', copyable: true },
          ],
        },
      ]}
      relatedTabs={[
        {
          label: 'Activity',
          icon: <ActivityIcon />,
          count: 142,
          content: <ActivityFeed userId={user.id} />,
        },
        {
          label: 'Audit Log',
          icon: <FileTextIcon />,
          count: 56,
          content: <AuditLogTable userId={user.id} />,
        },
      ]}
      backHref="/users"
      backLabel="Back to Users"
    />
  );
}
```

### CardGrid

A responsive grid of cards with optional filtering, sorting, and view toggle (grid/list):

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface CardGridProps<TData> {
  /** Array of data items to display */
  items: TData[];
  /** Render function for each card */
  renderCard: (item: TData) => React.ReactNode;
  /** Render function for list view (optional) */
  renderListItem?: (item: TData) => React.ReactNode;
  /** Enable grid/list view toggle */
  viewToggle?: boolean;
  /** Default view mode */
  defaultView?: 'grid' | 'list';
  /** Grid columns configuration */
  columns?: {
    sm?: number;   // Default: 1
    md?: number;   // Default: 2
    lg?: number;   // Default: 3
    xl?: number;   // Default: 4
  };
  /** Gap between cards */
  gap?: SpacingScale;
  /** Enable search */
  searchable?: boolean;
  /** Search field accessor */
  searchField?: keyof TData | ((item: TData) => string);
  /** Sorting options */
  sortOptions?: { label: string; field: keyof TData; order: 'asc' | 'desc' }[];
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  /** Empty state */
  emptyState?: React.ReactNode;
  /** Pagination */
  paginated?: boolean;
  pageSize?: number;
  /** Infinite scroll instead of pagination */
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { CardGrid, ResourceCard } from '@mcv/ui';

function ProjectsGrid({ projects }: { projects: Project[] }) {
  return (
    <CardGrid
      items={projects}
      viewToggle
      defaultView="grid"
      columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
      gap="md"
      searchable
      searchField={(p) => `${p.name} ${p.description}`}
      sortOptions={[
        { label: 'Name A-Z', field: 'name', order: 'asc' },
        { label: 'Newest', field: 'createdAt', order: 'desc' },
        { label: 'Most Active', field: 'activityCount', order: 'desc' },
      ]}
      loading={isLoading}
      skeletonCount={8}
      emptyState={
        <EmptyState
          icon={<FolderIcon />}
          title="No projects yet"
          description="Create your first project to get started"
          action={{ label: 'New Project', onClick: handleCreate }}
        />
      }
      renderCard={(project) => (
        <ResourceCard
          title={project.name}
          description={project.description}
          badges={project.tags.map((t) => ({ label: t }))}
          footer={<RelativeTime date={project.updatedAt} />}
          onClick={() => router.push(`/projects/${project.id}`)}
        />
      )}
      renderListItem={(project) => (
        <ListItem
          title={project.name}
          subtitle={project.description}
          trailing={<RelativeTime date={project.updatedAt} />}
        />
      )}
    />
  );
}
```

### ListView

A vertical list for data that benefits from a compact, scannable format:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface ListViewProps<TData> {
  /** Array of data items */
  items: TData[];
  /** Render function for each list item */
  renderItem: (item: TData, index: number) => React.ReactNode;
  /** Item key extractor */
  keyExtractor: (item: TData) => string;
  /** Whether to show dividers between items */
  dividers?: boolean;
  /** Whether items are selectable */
  selectable?: boolean;
  /** Selected item ID(s) */
  selected?: string | string[];
  /** Selection handler */
  onSelect?: (id: string) => void;
  /** Whether items are hoverable */
  hoverable?: boolean;
  /** Grouping function */
  groupBy?: (item: TData) => string;
  /** Group header renderer */
  renderGroupHeader?: (group: string, items: TData[]) => React.ReactNode;
  /** Sticky group headers */
  stickyGroups?: boolean;
  /** Enable virtualization for long lists */
  virtualized?: boolean;
  /** Estimated item height for virtualization */
  estimatedItemHeight?: number;
  /** Loading state */
  loading?: boolean;
  /** Skeleton count when loading */
  skeletonCount?: number;
  /** Empty state */
  emptyState?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { ListView } from '@mcv/ui';

function NotificationsList({ notifications }: Props) {
  return (
    <ListView
      items={notifications}
      keyExtractor={(n) => n.id}
      dividers
      hoverable
      groupBy={(n) => formatDate(n.date)}
      renderGroupHeader={(date) => (
        <Text size="sm" className="text-muted-foreground px-4 py-2">{date}</Text>
      )}
      stickyGroups
      renderItem={(notification) => (
        <NotificationItem
          icon={notification.icon}
          title={notification.title}
          description={notification.message}
          time={notification.createdAt}
          unread={!notification.readAt}
          onClick={() => markAsRead(notification.id)}
        />
      )}
      emptyState={
        <EmptyState
          icon={<BellIcon />}
          title="All caught up"
          description="No new notifications"
        />
      }
    />
  );
}
```

### TreeView

A hierarchical tree for file systems, org charts, category trees, and nested navigation:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface TreeViewProps<TData extends TreeNode> {
  /** Tree data */
  data: TData[];
  /** Render function for each tree node */
  renderNode: (node: TData, depth: number, expanded: boolean) => React.ReactNode;
  /** Node key extractor */
  keyExtractor: (node: TData) => string;
  /** Children accessor */
  childrenAccessor?: keyof TData;
  /** Default expanded node IDs */
  defaultExpanded?: string[];
  /** Controlled expanded state */
  expanded?: string[];
  /** Expand/collapse handler */
  onExpandedChange?: (expanded: string[]) => void;
  /** Whether nodes are selectable */
  selectable?: boolean;
  /** Selected node ID */
  selected?: string;
  /** Selection handler */
  onSelect?: (nodeId: string, node: TData) => void;
  /** Enable drag and drop reordering */
  draggable?: boolean;
  /** Drop handler */
  onDrop?: (dragId: string, dropId: string, position: 'before' | 'after' | 'inside') => void;
  /** Lazy loading for deep trees */
  loadChildren?: (nodeId: string) => Promise<TData[]>;
  /** Indent size in pixels per level */
  indentSize?: number;
  /** Show connecting lines */
  showLines?: boolean;
  /** Additional className */
  className?: string;
}

interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
}

// ─── Usage ──────────────────────────────────────────────────────
import { TreeView } from '@mcv/ui';

function FileBrowser({ files }: { files: FileNode[] }) {
  return (
    <TreeView
      data={files}
      keyExtractor={(f) => f.path}
      childrenAccessor="children"
      defaultExpanded={['src', 'src/components']}
      selectable
      selected={selectedFile}
      onSelect={(_, file) => openFile(file)}
      draggable
      onDrop={handleMove}
      showLines
      indentSize={20}
      renderNode={(file, depth, expanded) => (
        <div className="flex items-center gap-2 py-1">
          {file.isLeaf ? (
            <FileIcon className="h-4 w-4 text-muted-foreground" />
          ) : expanded ? (
            <FolderOpenIcon className="h-4 w-4 text-primary" />
          ) : (
            <FolderIcon className="h-4 w-4 text-primary" />
          )}
          <Text size="sm">{file.label}</Text>
        </div>
      )}
    />
  );
}
```

---

## Form Patterns

Form patterns solve the complexity of data entry — from simple single-page forms to multi-step wizards with validation, conditional fields, and dynamic arrays.

### StandardForm

A single-page form with sections, validation, and submit handling:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface StandardFormProps<TValues extends FieldValues> {
  /** Zod schema for validation */
  schema: ZodSchema<TValues>;
  /** Default form values */
  defaultValues?: DefaultValues<TValues>;
  /** Form submission handler */
  onSubmit: (values: TValues) => Promise<void> | void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Form sections */
  sections: FormSection[];
  /** Submit button label */
  submitLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Whether to show a reset button */
  resetable?: boolean;
  /** Layout mode */
  layout?: 'single-column' | 'two-column' | 'compact';
  /** Whether the form is in a loading/saving state */
  saving?: boolean;
  /** Unsaved changes warning */
  warnUnsaved?: boolean;
  /** Show validation summary at top on submit failure */
  validationSummary?: boolean;
  /** Autosave configuration */
  autoSave?: {
    enabled: boolean;
    debounceMs?: number;
    onAutoSave: (values: Partial<TValues>) => Promise<void>;
  };
  /** Additional className */
  className?: string;
}

interface FormSection {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  collapsible?: boolean;
  columns?: 1 | 2 | 3;
  fields: FormFieldConfig[];
}

interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'currency' | 'textarea'
       | 'select' | 'multi-select' | 'combobox' | 'checkbox' | 'radio'
       | 'switch' | 'slider' | 'date' | 'date-range' | 'file' | 'color'
       | 'tags' | 'phone' | 'url' | 'rich-text' | 'code' | 'custom';
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  span?: 1 | 2 | 3;
  options?: { label: string; value: string }[];
  /** For custom type: render function */
  render?: (field: ControllerRenderProps) => React.ReactNode;
  /** Conditional visibility */
  showWhen?: (values: Record<string, unknown>) => boolean;
  /** Dependent field: re-fetch options when this field changes */
  dependsOn?: string;
  loadOptions?: (dependencyValue: unknown) => Promise<{ label: string; value: string }[]>;
}

// ─── Usage ──────────────────────────────────────────────────────
import { StandardForm } from '@mcv/ui';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']),
  department: z.string().optional(),
  bio: z.string().max(500).optional(),
  notifications: z.boolean().default(true),
});

function CreateUserForm() {
  return (
    <StandardForm
      schema={userSchema}
      defaultValues={{ role: 'viewer', notifications: true }}
      onSubmit={async (values) => {
        await createUser(values);
        router.push('/users');
      }}
      onCancel={() => router.back()}
      submitLabel="Create User"
      layout="two-column"
      warnUnsaved
      validationSummary
      sections={[
        {
          title: 'Basic Information',
          description: 'Enter the user\'s personal details',
          columns: 2,
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'role', label: 'Role', type: 'select', required: true, options: [
              { label: 'Admin', value: 'admin' },
              { label: 'Editor', value: 'editor' },
              { label: 'Viewer', value: 'viewer' },
            ]},
            { name: 'department', label: 'Department', type: 'combobox',
              dependsOn: 'role',
              loadOptions: async (role) => fetchDepartments(role as string),
            },
          ],
        },
        {
          title: 'Profile',
          description: 'Optional profile information',
          fields: [
            { name: 'bio', label: 'Biography', type: 'textarea', span: 2 },
          ],
        },
        {
          title: 'Preferences',
          fields: [
            { name: 'notifications', label: 'Email Notifications', type: 'switch' },
          ],
        },
      ]}
    />
  );
}
```

### WizardForm (Multi-Step)

A multi-step wizard pattern for complex flows like onboarding, checkout, or entity creation:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface WizardFormProps<TValues extends FieldValues> {
  /** Wizard steps */
  steps: WizardStep<TValues>[];
  /** Full schema for final validation */
  schema: ZodSchema<TValues>;
  /** Default values across all steps */
  defaultValues?: DefaultValues<TValues>;
  /** Final submission handler */
  onSubmit: (values: TValues) => Promise<void> | void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Step change handler */
  onStepChange?: (step: number, direction: 'forward' | 'backward') => void;
  /** Navigation mode: 'linear' forces sequential, 'free' allows jumping */
  navigationMode?: 'linear' | 'free';
  /** Whether to show step progress indicator */
  showProgress?: boolean;
  /** Progress indicator variant */
  progressVariant?: 'stepper' | 'bar' | 'dots';
  /** Position of the progress indicator */
  progressPosition?: 'top' | 'left';
  /** Whether to persist form data to sessionStorage */
  persistKey?: string;
  /** Whether the last step shows a review/summary */
  showReview?: boolean;
  /** Submit button label for the final step */
  submitLabel?: string;
  /** Whether to show a "Save Draft" option */
  saveDraft?: boolean;
  /** Draft save handler */
  onSaveDraft?: (values: Partial<TValues>, currentStep: number) => void;
  /** Additional className */
  className?: string;
}

interface WizardStep<TValues> {
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Step icon */
  icon?: React.ReactNode;
  /** Zod schema for this step's validation */
  schema?: ZodSchema<Partial<TValues>>;
  /** Field configurations for this step */
  fields?: FormFieldConfig[];
  /** Custom render for the entire step content */
  render?: (form: UseFormReturn<TValues>) => React.ReactNode;
  /** Async validation before proceeding to next step */
  onBeforeNext?: (values: Partial<TValues>) => Promise<boolean | string>;
  /** Whether this step is optional */
  optional?: boolean;
  /** Skip condition */
  skipWhen?: (values: Partial<TValues>) => boolean;
}

// ─── Usage ──────────────────────────────────────────────────────
import { WizardForm } from '@mcv/ui';

function OnboardingWizard() {
  return (
    <WizardForm
      steps={[
        {
          title: 'Company Info',
          description: 'Tell us about your organization',
          icon: <BuildingIcon />,
          schema: companySchema,
          fields: [
            { name: 'companyName', label: 'Company Name', type: 'text', required: true },
            { name: 'industry', label: 'Industry', type: 'select', options: industries },
            { name: 'size', label: 'Company Size', type: 'radio', options: companySizes },
          ],
        },
        {
          title: 'Team Setup',
          description: 'Invite your team members',
          icon: <UsersIcon />,
          render: (form) => (
            <TeamInviteStep
              onInvite={(emails) => form.setValue('invitedEmails', emails)}
            />
          ),
          optional: true,
        },
        {
          title: 'Integrations',
          description: 'Connect your existing tools',
          icon: <PlugIcon />,
          render: (form) => <IntegrationSelector form={form} />,
          skipWhen: (values) => values.size === '1',
        },
        {
          title: 'Review',
          description: 'Review and confirm your setup',
          icon: <CheckIcon />,
        },
      ]}
      schema={onboardingSchema}
      onSubmit={async (values) => {
        await completeOnboarding(values);
        router.push('/dashboard');
      }}
      showProgress
      progressVariant="stepper"
      progressPosition="left"
      navigationMode="linear"
      persistKey="onboarding-wizard"
      showReview
      submitLabel="Complete Setup"
      saveDraft
      onSaveDraft={async (values, step) => {
        await saveOnboardingDraft(values, step);
      }}
    />
  );
}
```

### InlineEdit

Click-to-edit pattern for in-place editing without navigating to a separate form:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface InlineEditProps<TValue = string> {
  /** Current value */
  value: TValue;
  /** Save handler — called when user confirms the edit */
  onSave: (newValue: TValue) => Promise<void> | void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Render the display (read) mode */
  renderDisplay?: (value: TValue) => React.ReactNode;
  /** Input type for the edit mode */
  inputType?: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'custom';
  /** Options for select type */
  options?: { label: string; value: string }[];
  /** Custom editor render */
  renderEditor?: (value: TValue, onChange: (v: TValue) => void) => React.ReactNode;
  /** Validation function */
  validate?: (value: TValue) => string | null;
  /** Trigger mode: 'click' or 'doubleClick' */
  trigger?: 'click' | 'doubleClick';
  /** Show edit icon on hover */
  showEditIcon?: boolean;
  /** Whether the field is currently editable */
  editable?: boolean;
  /** Save on blur */
  saveOnBlur?: boolean;
  /** Save on Enter key */
  saveOnEnter?: boolean;
  /** Placeholder when value is empty */
  placeholder?: string;
  /** Size variant */
  size?: ComponentSize;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { InlineEdit } from '@mcv/ui';

function UserProfile({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <InlineEdit
          value={user.name}
          onSave={async (name) => {
            await updateUser(user.id, { name });
          }}
          trigger="click"
          showEditIcon
          saveOnEnter
          saveOnBlur
        />
      </div>
      <div>
        <Label>Role</Label>
        <InlineEdit
          value={user.role}
          inputType="select"
          options={[
            { label: 'Admin', value: 'admin' },
            { label: 'Editor', value: 'editor' },
            { label: 'Viewer', value: 'viewer' },
          ]}
          onSave={async (role) => {
            await updateUser(user.id, { role });
          }}
        />
      </div>
      <div>
        <Label>Bio</Label>
        <InlineEdit
          value={user.bio}
          inputType="textarea"
          placeholder="Add a bio..."
          onSave={async (bio) => {
            await updateUser(user.id, { bio });
          }}
          validate={(bio) => bio.length > 500 ? 'Bio must be under 500 characters' : null}
        />
      </div>
    </div>
  );
}
```

### BulkEdit

Pattern for editing multiple records simultaneously:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface BulkEditProps<TData> {
  /** Items to edit */
  items: TData[];
  /** Editable fields configuration */
  fields: BulkEditField<TData>[];
  /** Save handler — receives the changed items */
  onSave: (changes: Partial<TData>[]) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Key extractor */
  keyExtractor: (item: TData) => string;
  /** Display column (for identifying rows) */
  identifierField: keyof TData;
  /** Validation schema */
  schema?: ZodSchema;
  /** Show change diff before saving */
  showDiff?: boolean;
  /** Maximum items that can be bulk edited */
  maxItems?: number;
  /** Additional className */
  className?: string;
}

interface BulkEditField<TData> {
  name: keyof TData;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  options?: { label: string; value: string }[];
  width?: string;
  /** Apply to all: shows a "set all" action in the column header */
  applyToAll?: boolean;
}

// ─── Usage ──────────────────────────────────────────────────────
import { BulkEdit } from '@mcv/ui';

function BulkPriceEditor({ products }: { products: Product[] }) {
  return (
    <BulkEdit
      items={products}
      keyExtractor={(p) => p.id}
      identifierField="name"
      fields={[
        { name: 'price', label: 'Price', type: 'number', applyToAll: true },
        { name: 'category', label: 'Category', type: 'select', options: categories, applyToAll: true },
        { name: 'active', label: 'Active', type: 'checkbox', applyToAll: true },
      ]}
      onSave={async (changes) => {
        await bulkUpdateProducts(changes);
      }}
      showDiff
      maxItems={100}
    />
  );
}
```

### DynamicFields

Pattern for forms with repeating, user-manageable field groups:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface DynamicFieldsProps {
  /** Field name in the parent form */
  name: string;
  /** Label for the field array section */
  label: string;
  /** Description */
  description?: string;
  /** Fields in each repeated group */
  fields: FormFieldConfig[];
  /** Minimum number of items */
  min?: number;
  /** Maximum number of items */
  max?: number;
  /** Default values for a new item */
  defaultItem?: Record<string, unknown>;
  /** Whether items can be reordered via drag */
  reorderable?: boolean;
  /** Add button label */
  addLabel?: string;
  /** Layout of each item: 'row' (inline) or 'card' (stacked) */
  layout?: 'row' | 'card';
  /** Whether to show item numbers */
  numbered?: boolean;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { StandardForm, DynamicFields } from '@mcv/ui';

function InvoiceForm() {
  return (
    <StandardForm
      schema={invoiceSchema}
      onSubmit={handleSubmit}
      sections={[
        {
          title: 'Invoice Details',
          fields: [
            { name: 'clientName', label: 'Client', type: 'combobox' },
            { name: 'dueDate', label: 'Due Date', type: 'date' },
          ],
        },
        {
          title: 'Line Items',
          fields: [
            {
              name: 'lineItems',
              label: 'Items',
              type: 'custom',
              render: (field) => (
                <DynamicFields
                  name="lineItems"
                  label="Line Items"
                  min={1}
                  max={50}
                  reorderable
                  addLabel="Add Line Item"
                  layout="row"
                  defaultItem={{ description: '', quantity: 1, unitPrice: 0 }}
                  fields={[
                    { name: 'description', label: 'Description', type: 'text', span: 2 },
                    { name: 'quantity', label: 'Qty', type: 'number' },
                    { name: 'unitPrice', label: 'Unit Price', type: 'currency' },
                  ]}
                />
              ),
            },
          ],
        },
      ]}
    />
  );
}
```

---

## Dashboard Patterns

Dashboard patterns compose charts, metrics, and activity feeds into information-rich layouts optimized for at-a-glance monitoring.

### MetricCardGrid

A responsive grid of metric/KPI cards:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface MetricCardGridProps {
  /** Array of metric definitions */
  metrics: MetricDef[];
  /** Grid columns */
  columns?: { sm?: number; md?: number; lg?: number; xl?: number };
  /** Gap between cards */
  gap?: SpacingScale;
  /** Card variant */
  variant?: 'default' | 'bordered' | 'gradient' | 'glass';
  /** Whether metrics are loading */
  loading?: boolean;
  /** Animated count-up on mount */
  animate?: boolean;
  /** Click handler for individual metrics */
  onMetricClick?: (metricId: string) => void;
  /** Additional className */
  className?: string;
}

interface MetricDef {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent' | 'compact';
  icon?: React.ReactNode;
  color?: SemanticColor;
  trend?: TrendDirection;
  trendValue?: string;
  sparkline?: number[];
  href?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { MetricCardGrid } from '@mcv/ui';

function DashboardMetrics() {
  return (
    <MetricCardGrid
      columns={{ sm: 1, md: 2, lg: 4 }}
      gap="md"
      variant="bordered"
      animate
      onMetricClick={(id) => router.push(`/analytics/${id}`)}
      metrics={[
        {
          id: 'revenue',
          label: 'Total Revenue',
          value: 284500,
          previousValue: 252000,
          format: 'currency',
          icon: <DollarSignIcon />,
          color: 'success',
          trend: 'up',
          trendValue: '+12.9%',
          sparkline: [18, 22, 19, 25, 28, 24, 30, 28, 35],
        },
        {
          id: 'users',
          label: 'Active Users',
          value: 12847,
          previousValue: 11203,
          format: 'compact',
          icon: <UsersIcon />,
          color: 'primary',
          trend: 'up',
          trendValue: '+14.7%',
        },
        {
          id: 'conversion',
          label: 'Conversion Rate',
          value: 3.24,
          previousValue: 3.18,
          format: 'percent',
          icon: <TrendingUpIcon />,
          color: 'warning',
          trend: 'up',
          trendValue: '+0.06%',
        },
        {
          id: 'churn',
          label: 'Churn Rate',
          value: 2.1,
          previousValue: 2.8,
          format: 'percent',
          icon: <UserMinusIcon />,
          color: 'danger',
          trend: 'down',
          trendValue: '-0.7%',
        },
      ]}
    />
  );
}
```

### ChartsGrid

A responsive grid layout for arranging charts:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface ChartsGridProps {
  /** Chart definitions */
  charts: ChartDef[];
  /** Grid columns */
  columns?: number;
  /** Gap between charts */
  gap?: SpacingScale;
  /** Whether charts can be rearranged via drag */
  draggable?: boolean;
  /** Drag end handler */
  onReorder?: (chartIds: string[]) => void;
  /** Date range for all charts */
  dateRange?: DateRange;
  /** Date range change handler */
  onDateRangeChange?: (range: DateRange) => void;
  /** Show date range picker in the header */
  showDatePicker?: boolean;
  /** Additional className */
  className?: string;
}

interface ChartDef {
  id: string;
  title: string;
  description?: string;
  type: 'area' | 'bar' | 'donut' | 'pie' | 'sparkline' | 'heatmap' | 'scatter';
  data: unknown[];
  config: Record<string, unknown>;
  span?: number;          // Grid column span
  height?: number | string;
  loading?: boolean;
  emptyMessage?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { ChartsGrid } from '@mcv/ui';

function AnalyticsDashboard() {
  return (
    <ChartsGrid
      columns={2}
      gap="lg"
      showDatePicker
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      draggable
      onReorder={handleReorder}
      charts={[
        {
          id: 'revenue-trend',
          title: 'Revenue Over Time',
          type: 'area',
          span: 2,
          data: revenueData,
          config: {
            xField: 'date',
            yField: 'revenue',
            color: 'var(--color-primary)',
            fillOpacity: 0.1,
          },
        },
        {
          id: 'traffic-sources',
          title: 'Traffic Sources',
          type: 'donut',
          data: trafficData,
          config: {
            nameField: 'source',
            valueField: 'visits',
          },
        },
        {
          id: 'top-pages',
          title: 'Top Pages',
          type: 'bar',
          data: pageData,
          config: {
            xField: 'page',
            yField: 'views',
            horizontal: true,
          },
        },
      ]}
    />
  );
}
```

### ActivityFeedPattern

A real-time or polling-based activity stream:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface ActivityFeedPatternProps {
  /** Activity items */
  items: ActivityItem[];
  /** Whether new items are being loaded */
  loading?: boolean;
  /** Polling interval in milliseconds (0 = disabled) */
  pollInterval?: number;
  /** Load more handler for infinite scroll */
  onLoadMore?: () => void;
  /** Whether there are more items to load */
  hasMore?: boolean;
  /** Group items by date */
  groupByDate?: boolean;
  /** Filter options */
  filters?: { label: string; value: string }[];
  /** Current filter */
  activeFilter?: string;
  /** Filter change handler */
  onFilterChange?: (filter: string) => void;
  /** Item click handler */
  onItemClick?: (item: ActivityItem) => void;
  /** Max height with internal scroll */
  maxHeight?: string | number;
  /** Empty state */
  emptyState?: React.ReactNode;
  /** Show relative timestamps */
  relativeTime?: boolean;
  /** Additional className */
  className?: string;
}

interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'comment' | 'assign' | 'status' | 'custom';
  actor: { name: string; avatar?: string };
  target?: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date | string;
  icon?: React.ReactNode;
  color?: SemanticColor;
}

// ─── Usage ──────────────────────────────────────────────────────
import { ActivityFeedPattern } from '@mcv/ui';

function ProjectActivity({ projectId }: { projectId: string }) {
  const { activities, loadMore, hasMore } = useProjectActivities(projectId);

  return (
    <ActivityFeedPattern
      items={activities}
      groupByDate
      relativeTime
      pollInterval={30000}
      onLoadMore={loadMore}
      hasMore={hasMore}
      filters={[
        { label: 'All', value: 'all' },
        { label: 'Comments', value: 'comment' },
        { label: 'Changes', value: 'update' },
        { label: 'Assignments', value: 'assign' },
      ]}
      onItemClick={(item) => navigateToItem(item)}
      maxHeight="600px"
      emptyState={
        <EmptyState
          icon={<ActivityIcon />}
          title="No activity yet"
          description="Activity will appear here as your team works on this project"
        />
      }
    />
  );
}
```

### KPI Dashboard

A full dashboard composition combining metrics, charts, and feeds:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface KPIDashboardProps {
  /** Dashboard title */
  title: string;
  /** Date range for the dashboard */
  dateRange: DateRange;
  /** Date range change handler */
  onDateRangeChange: (range: DateRange) => void;
  /** Date range presets */
  datePresets?: { label: string; range: DateRange }[];
  /** Header actions */
  actions?: React.ReactNode;
  /** Metric cards */
  metrics: MetricDef[];
  /** Chart sections */
  charts: ChartDef[];
  /** Activity feed (optional right sidebar) */
  activityFeed?: ActivityItem[];
  /** Whether to show a sidebar with activity */
  showActivitySidebar?: boolean;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Auto-refresh interval in ms */
  autoRefreshInterval?: number;
  /** Last refreshed timestamp */
  lastRefreshed?: Date;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { KPIDashboard } from '@mcv/ui';

function ExecutiveDashboard() {
  return (
    <KPIDashboard
      title="Executive Dashboard"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      datePresets={[
        { label: 'Last 7 days', range: last7Days },
        { label: 'Last 30 days', range: last30Days },
        { label: 'This Quarter', range: thisQuarter },
        { label: 'Year to Date', range: ytd },
      ]}
      actions={
        <Button variant="outline" startContent={<DownloadIcon />}>
          Export Report
        </Button>
      }
      metrics={dashboardMetrics}
      charts={dashboardCharts}
      showActivitySidebar
      activityFeed={recentActivity}
      onRefresh={refetchAll}
      autoRefreshInterval={60000}
      lastRefreshed={new Date()}
    />
  );
}
```

---

## Navigation Patterns

### SidebarNav

A collapsible sidebar navigation with nested groups, badges, and active state tracking:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface SidebarNavProps {
  /** Navigation items */
  items: NavItem[];
  /** Whether the sidebar is collapsed (icon-only mode) */
  collapsed?: boolean;
  /** Currently active path */
  activePath?: string;
  /** Header content (logo, brand) */
  header?: React.ReactNode;
  /** Footer content (user card, settings) */
  footer?: React.ReactNode;
  /** Navigation click handler */
  onNavigate?: (href: string) => void;
  /** Tooltip on collapsed items */
  showTooltips?: boolean;
  /** Additional className */
  className?: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: SemanticColor;
  disabled?: boolean;
  /** Nested children create a collapsible group */
  children?: NavItem[];
  /** Section divider before this item */
  divider?: boolean;
  /** Section label (non-clickable group header) */
  sectionLabel?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { SidebarNav } from '@mcv/ui';

<SidebarNav
  collapsed={collapsed}
  activePath={pathname}
  header={<Logo collapsed={collapsed} />}
  footer={
    <UserCard user={currentUser} compact={collapsed} />
  }
  items={[
    { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
    { label: 'Inbox', href: '/inbox', icon: <InboxIcon />, badge: 5, badgeColor: 'danger' },
    { divider: true, sectionLabel: 'Management', label: '' },
    {
      label: 'Users',
      icon: <UsersIcon />,
      children: [
        { label: 'All Users', href: '/users' },
        { label: 'Roles', href: '/users/roles' },
        { label: 'Invitations', href: '/users/invitations', badge: 2 },
      ],
    },
    {
      label: 'Content',
      icon: <FileTextIcon />,
      children: [
        { label: 'Pages', href: '/content/pages' },
        { label: 'Blog', href: '/content/blog' },
        { label: 'Media', href: '/content/media' },
      ],
    },
    { divider: true, sectionLabel: 'System', label: '' },
    { label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
    { label: 'API Keys', href: '/settings/api', icon: <KeyIcon /> },
  ]}
/>
```

### BreadcrumbPattern

A contextual breadcrumb trail with truncation for deep hierarchies:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface BreadcrumbPatternProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Maximum visible items before collapsing */
  maxItems?: number;
  /** Separator between items */
  separator?: React.ReactNode;
  /** Whether the last item is the current page (non-linked) */
  currentIsLink?: boolean;
  /** Home icon instead of "Home" text */
  showHomeIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional className */
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

// ─── Usage ──────────────────────────────────────────────────────
import { BreadcrumbPattern } from '@mcv/ui';

<BreadcrumbPattern
  showHomeIcon
  maxItems={4}
  items={[
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Electronics', href: '/products/electronics' },
    { label: 'Laptops', href: '/products/electronics/laptops' },
    { label: 'MacBook Pro 16"' },
  ]}
/>
// Renders: 🏠 > Products > ... > Laptops > MacBook Pro 16"
```

### TabsPattern

A tabbed content pattern with URL-synced active state, lazy loading, and badge counts:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface TabsPatternProps {
  /** Tab definitions */
  tabs: TabDef[];
  /** Default active tab ID */
  defaultTab?: string;
  /** Controlled active tab */
  activeTab?: string;
  /** Tab change handler */
  onTabChange?: (tabId: string) => void;
  /** Sync active tab with URL query parameter */
  urlParam?: string;
  /** Tab variant */
  variant?: 'underline' | 'pills' | 'bordered' | 'segment';
  /** Tab size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to keep unmounted tab content in DOM */
  keepMounted?: boolean;
  /** Lazy load: only render tab content when first activated */
  lazy?: boolean;
  /** Full width tabs */
  fullWidth?: boolean;
  /** Scrollable tab bar when tabs overflow */
  scrollable?: boolean;
  /** Additional className */
  className?: string;
}

interface TabDef {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: SemanticColor;
  disabled?: boolean;
  content: React.ReactNode | (() => React.ReactNode);
}

// ─── Usage ──────────────────────────────────────────────────────
import { TabsPattern } from '@mcv/ui';

<TabsPattern
  variant="underline"
  urlParam="tab"
  lazy
  tabs={[
    {
      id: 'overview',
      label: 'Overview',
      icon: <EyeIcon />,
      content: <OverviewTab />,
    },
    {
      id: 'members',
      label: 'Members',
      icon: <UsersIcon />,
      badge: 24,
      content: <MembersTab />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      content: <SettingsTab />,
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: <AlertTriangleIcon />,
      badgeColor: 'danger',
      content: <DangerZoneTab />,
    },
  ]}
/>
```

### CommandPalettePattern

A keyboard-driven command palette for power users:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface CommandPalettePatternProps {
  /** Command groups */
  groups: CommandGroup[];
  /** Open state (controlled) */
  open: boolean;
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
  /** Keyboard shortcut to toggle (default: Cmd+K) */
  shortcut?: string;
  /** Search placeholder */
  placeholder?: string;
  /** Recent commands (shown when search is empty) */
  recentCommands?: CommandItem[];
  /** Maximum recent items to show */
  maxRecent?: number;
  /** Footer content (shortcut hints) */
  footer?: React.ReactNode;
  /** Server-side search handler for dynamic results */
  onSearch?: (query: string) => Promise<CommandItem[]>;
  /** Search debounce delay */
  searchDebounce?: number;
  /** Additional className */
  className?: string;
}

interface CommandGroup {
  label: string;
  items: CommandItem[];
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
  disabled?: boolean;
}

// ─── Usage ──────────────────────────────────────────────────────
import { CommandPalettePattern } from '@mcv/ui';

function AppCommandPalette() {
  const [open, setOpen] = useState(false);

  return (
    <CommandPalettePattern
      open={open}
      onOpenChange={setOpen}
      shortcut="Cmd+K"
      placeholder="Type a command or search..."
      recentCommands={recentCommands}
      maxRecent={5}
      groups={[
        {
          label: 'Navigation',
          items: [
            { id: 'dashboard', label: 'Go to Dashboard', icon: <HomeIcon />, shortcut: 'G D', onSelect: () => router.push('/dashboard') },
            { id: 'users', label: 'Go to Users', icon: <UsersIcon />, shortcut: 'G U', onSelect: () => router.push('/users') },
            { id: 'settings', label: 'Go to Settings', icon: <SettingsIcon />, shortcut: 'G S', onSelect: () => router.push('/settings') },
          ],
        },
        {
          label: 'Actions',
          items: [
            { id: 'new-user', label: 'Create New User', icon: <PlusIcon />, shortcut: 'N U', onSelect: handleCreateUser },
            { id: 'new-project', label: 'Create New Project', icon: <PlusIcon />, shortcut: 'N P', onSelect: handleCreateProject },
          ],
        },
        {
          label: 'Theme',
          items: [
            { id: 'theme-light', label: 'Switch to Light Mode', icon: <SunIcon />, onSelect: () => setTheme('light') },
            { id: 'theme-dark', label: 'Switch to Dark Mode', icon: <MoonIcon />, onSelect: () => setTheme('dark') },
          ],
        },
      ]}
      onSearch={async (query) => {
        const results = await searchEverything(query);
        return results.map((r) => ({
          id: r.id,
          label: r.title,
          description: r.type,
          icon: getIconForType(r.type),
          onSelect: () => router.push(r.href),
        }));
      }}
      footer={
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span><Kbd>↑↓</Kbd> Navigate</span>
          <span><Kbd>↵</Kbd> Select</span>
          <span><Kbd>Esc</Kbd> Close</span>
        </div>
      }
    />
  );
}
```

---

## Modal & Dialog Patterns

### ConfirmationDialog

A standardized confirmation dialog for destructive or important actions:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => Promise<void> | void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Variant determines color and icon */
  variant?: 'default' | 'danger' | 'warning';
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Require typing a confirmation phrase */
  confirmPhrase?: string;
  /** Loading state during confirmation */
  loading?: boolean;
  /** Icon override */
  icon?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { ConfirmationDialog } from '@mcv/ui';

<ConfirmationDialog
  open={showDeleteDialog}
  onClose={() => setShowDeleteDialog(false)}
  onConfirm={async () => {
    await deleteProject(project.id);
    router.push('/projects');
  }}
  variant="danger"
  title="Delete Project"
  description={`This will permanently delete "${project.name}" and all associated data. This action cannot be undone.`}
  confirmLabel="Delete Project"
  confirmPhrase={project.name}
/>
```

### FormModal

A dialog containing a form — combining modal overlay with form submission:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface FormModalProps<TValues extends FieldValues> {
  /** Whether the modal is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal description */
  description?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Zod schema */
  schema: ZodSchema<TValues>;
  /** Default values */
  defaultValues?: DefaultValues<TValues>;
  /** Submit handler */
  onSubmit: (values: TValues) => Promise<void> | void;
  /** Form fields */
  fields: FormFieldConfig[];
  /** Field layout columns */
  columns?: 1 | 2;
  /** Submit button label */
  submitLabel?: string;
  /** Whether to close on successful submit */
  closeOnSubmit?: boolean;
  /** Loading state */
  saving?: boolean;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { FormModal } from '@mcv/ui';

<FormModal
  open={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  title="Create User"
  description="Add a new user to the system"
  size="md"
  schema={createUserSchema}
  defaultValues={{ role: 'viewer' }}
  onSubmit={async (values) => {
    await createUser(values);
    toast.success('User created successfully');
  }}
  closeOnSubmit
  submitLabel="Create"
  columns={2}
  fields={[
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'role', label: 'Role', type: 'select', options: roleOptions },
    { name: 'sendInvite', label: 'Send invitation email', type: 'switch' },
  ]}
/>
```

### DrawerPattern

A slide-out panel for detail views, filters, and secondary content:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface DrawerPatternProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Drawer title */
  title?: string;
  /** Drawer description */
  description?: string;
  /** Slide-in direction */
  side?: 'left' | 'right';
  /** Drawer width */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Drawer content */
  children: React.ReactNode;
  /** Footer content (action buttons) */
  footer?: React.ReactNode;
  /** Whether to show a close button */
  showClose?: boolean;
  /** Whether clicking the overlay closes the drawer */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the drawer */
  closeOnEscape?: boolean;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { DrawerPattern } from '@mcv/ui';

<DrawerPattern
  open={showDetail}
  onClose={() => setShowDetail(false)}
  title="User Details"
  side="right"
  size="lg"
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
      <Button color="primary" onClick={handleSave}>Save Changes</Button>
    </div>
  }
>
  <UserDetailForm user={selectedUser} />
</DrawerPattern>
```

### SheetPattern

A bottom sheet for mobile-friendly actions and content:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface SheetPatternProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Sheet title */
  title?: string;
  /** Snap points (percentage of viewport height) */
  snapPoints?: number[];
  /** Default snap point index */
  defaultSnapPoint?: number;
  /** Whether the sheet is dismissible by dragging down */
  dismissible?: boolean;
  /** Sheet content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { SheetPattern } from '@mcv/ui';

<SheetPattern
  open={showActions}
  onClose={() => setShowActions(false)}
  title="Actions"
  snapPoints={[0.25, 0.5, 0.9]}
  defaultSnapPoint={0}
  dismissible
>
  <div className="space-y-2 p-4">
    <Button variant="ghost" fullWidth startContent={<EditIcon />}>Edit</Button>
    <Button variant="ghost" fullWidth startContent={<ShareIcon />}>Share</Button>
    <Button variant="ghost" fullWidth startContent={<CopyIcon />}>Duplicate</Button>
    <Separator />
    <Button variant="ghost" fullWidth color="danger" startContent={<TrashIcon />}>Delete</Button>
  </div>
</SheetPattern>
```

### LightboxPattern

An image/media lightbox with gallery navigation:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface LightboxPatternProps {
  /** Array of media items */
  items: LightboxItem[];
  /** Currently active index */
  activeIndex: number;
  /** Whether the lightbox is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Index change handler */
  onIndexChange?: (index: number) => void;
  /** Show thumbnails strip */
  showThumbnails?: boolean;
  /** Show download button */
  downloadable?: boolean;
  /** Zoom controls */
  zoomable?: boolean;
  /** Slideshow auto-play interval in ms */
  slideshowInterval?: number;
  /** Additional className */
  className?: string;
}

interface LightboxItem {
  src: string;
  alt?: string;
  type?: 'image' | 'video';
  thumbnail?: string;
  caption?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { LightboxPattern } from '@mcv/ui';

<LightboxPattern
  open={showLightbox}
  onClose={() => setShowLightbox(false)}
  activeIndex={activeImageIndex}
  onIndexChange={setActiveImageIndex}
  showThumbnails
  downloadable
  zoomable
  items={gallery.map((img) => ({
    src: img.url,
    alt: img.title,
    thumbnail: img.thumbnailUrl,
    caption: img.description,
  }))}
/>
```

---

## Empty States

Empty states guide users when there's no data to display. Each variant communicates a different situation with appropriate messaging and actions.

```typescript
// ─── Shared Props ───────────────────────────────────────────────
interface EmptyStateBaseProps {
  /** Illustration or icon */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action */
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  /** Secondary action */
  secondaryAction?: { label: string; onClick: () => void };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}
```

### NoData Empty State

When a collection exists but has no items yet:

```typescript
<EmptyState
  icon={<FolderIcon className="h-12 w-12 text-muted-foreground" />}
  title="No projects yet"
  description="Create your first project to start organizing your work"
  action={{ label: 'Create Project', onClick: handleCreate, icon: <PlusIcon /> }}
  size="lg"
/>
```

### NoResults Empty State

When a search or filter returns zero results:

```typescript
<NoSearchResults
  query={searchQuery}
  title={`No results for "${searchQuery}"`}
  description="Try adjusting your search terms or clearing some filters"
  action={{ label: 'Clear Filters', onClick: clearFilters }}
  secondaryAction={{ label: 'Search Help', onClick: showSearchHelp }}
/>
```

### FirstTime Empty State

When a user encounters a feature for the first time:

```typescript
<WelcomeState
  icon={<RocketIcon className="h-16 w-16 text-primary" />}
  title="Welcome to Analytics"
  description="Track your key metrics, visualize trends, and make data-driven decisions. Let's set up your first dashboard."
  action={{ label: 'Set Up Dashboard', onClick: startSetup, icon: <SparklesIcon /> }}
  secondaryAction={{ label: 'Watch Tutorial', onClick: showTutorial }}
/>
```

### Error Empty State

When an error prevents data from loading:

```typescript
<ErrorState
  icon={<AlertCircleIcon className="h-12 w-12 text-danger" />}
  title="Failed to load data"
  description="We encountered an error while loading your projects. This might be a temporary issue."
  action={{ label: 'Try Again', onClick: handleRetry, icon: <RefreshIcon /> }}
  secondaryAction={{ label: 'Contact Support', onClick: contactSupport }}
/>
```

### Offline Empty State

When network connectivity is lost:

```typescript
<OfflineState
  title="You're offline"
  description="Check your internet connection and try again. Your changes have been saved locally."
  action={{ label: 'Retry', onClick: retryConnection }}
/>
```

### Unauthorized Empty State

When the user lacks permissions:

```typescript
<UnauthorizedState
  title="Access Denied"
  description="You don't have permission to view this resource. Contact your administrator to request access."
  action={{ label: 'Request Access', onClick: requestAccess }}
  secondaryAction={{ label: 'Go Back', onClick: () => router.back() }}
/>
```

---

## Loading Patterns

### Skeleton Screens

Content-shaped placeholder animations that maintain layout stability during load:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface SkeletonScreenProps {
  /** Predefined skeleton variant */
  variant: 'card' | 'table' | 'list' | 'detail' | 'dashboard' | 'form' | 'custom';
  /** Number of skeleton items (for card/list/table) */
  count?: number;
  /** Grid columns for card variant */
  columns?: { sm?: number; md?: number; lg?: number };
  /** Custom skeleton layout (for 'custom' variant) */
  children?: React.ReactNode;
  /** Animation style */
  animation?: 'pulse' | 'wave' | 'none';
  /** Additional className */
  className?: string;
}

// ─── Built-in Variants ──────────────────────────────────────────
// Card Grid Skeleton
<SkeletonScreen variant="card" count={8} columns={{ sm: 1, md: 2, lg: 4 }} />

// Table Skeleton
<SkeletonScreen variant="table" count={10} />

// Detail Page Skeleton
<SkeletonScreen variant="detail" />

// Dashboard Skeleton
<SkeletonScreen variant="dashboard" />

// Custom Skeleton
<SkeletonScreen variant="custom">
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-96" />
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  </div>
</SkeletonScreen>
```

### Spinner Pattern

A loading spinner with optional message and overlay:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface SpinnerPatternProps {
  /** Whether to show the spinner */
  loading: boolean;
  /** Loading message */
  message?: string;
  /** Display mode */
  mode?: 'inline' | 'overlay' | 'fullscreen';
  /** Spinner size */
  size?: ComponentSize;
  /** Spinner color */
  color?: SemanticColor;
  /** Minimum display time in ms (prevents flash) */
  minDisplayMs?: number;
  /** Delay before showing spinner in ms (prevents flash for fast loads) */
  delayMs?: number;
  /** Content to show when not loading */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
// Inline spinner
<SpinnerPattern loading={isLoading} mode="inline" message="Loading users..." size="md">
  <UserList users={users} />
</SpinnerPattern>

// Overlay spinner (covers content)
<SpinnerPattern loading={isSaving} mode="overlay" message="Saving changes..." delayMs={200}>
  <FormContent />
</SpinnerPattern>

// Fullscreen spinner
<SpinnerPattern loading={isInitializing} mode="fullscreen" message="Setting up your workspace..." />
```

### ProgressBar Pattern

A determinate progress indicator for operations with known completion:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface ProgressBarPatternProps {
  /** Progress value (0-100) */
  value: number;
  /** Label text */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Additional description (e.g., "3 of 10 files uploaded") */
  description?: string;
  /** Color based on progress */
  color?: SemanticColor | 'auto';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the progress is indeterminate */
  indeterminate?: boolean;
  /** Striped animation */
  striped?: boolean;
  /** Animated stripes */
  animated?: boolean;
  /** Cancel handler */
  onCancel?: () => void;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
<ProgressBarPattern
  value={uploadProgress}
  label="Uploading files..."
  showPercentage
  description={`${uploadedCount} of ${totalCount} files uploaded`}
  color="auto"
  size="md"
  striped
  animated
  onCancel={() => cancelUpload()}
/>
```

### Optimistic UI Pattern

A wrapper that applies optimistic updates and rolls back on failure:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface OptimisticUIProps<TData> {
  /** Current data */
  data: TData;
  /** The mutation function */
  mutate: (optimisticData: TData) => Promise<TData>;
  /** Rollback on error */
  rollbackOnError?: boolean;
  /** Success callback */
  onSuccess?: (data: TData) => void;
  /** Error callback */
  onError?: (error: Error, rollbackData: TData) => void;
  /** Render function receiving optimistic state */
  children: (props: {
    data: TData;
    isPending: boolean;
    update: (newData: TData) => void;
  }) => React.ReactNode;
}

// ─── Usage ──────────────────────────────────────────────────────
import { OptimisticUI } from '@mcv/ui';

<OptimisticUI
  data={todo}
  mutate={async (optimisticTodo) => {
    return await updateTodo(optimisticTodo);
  }}
  rollbackOnError
  onError={(err) => toast.error('Failed to update')}
>
  {({ data, isPending, update }) => (
    <TodoItem
      todo={data}
      className={isPending ? 'opacity-70' : ''}
      onToggle={() => update({ ...data, completed: !data.completed })}
    />
  )}
</OptimisticUI>
```

---

## Error Patterns

### Inline Errors

Field-level and section-level error display within forms and content:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface InlineErrorProps {
  /** Error message */
  message: string;
  /** Error variant */
  variant?: 'field' | 'section' | 'banner';
  /** Icon override */
  icon?: React.ReactNode;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Retry handler */
  onRetry?: () => void;
  /** Additional className */
  className?: string;
}

// ─── Usage ──────────────────────────────────────────────────────

// Field error (below an input)
<InlineError variant="field" message="Email is already in use" />

// Section error (within a form section)
<InlineError
  variant="section"
  message="Failed to load department options. Using cached data."
  onRetry={refetchDepartments}
  onDismiss={() => setError(null)}
/>

// Banner error (top of page)
<InlineError
  variant="banner"
  message="Your subscription has expired. Some features may be limited."
  onDismiss={dismissBanner}
/>
```

### Toast Notifications

Ephemeral notifications for operation feedback:

```typescript
// ─── Usage (via helper functions) ────────────────────────────────
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
  showPromiseToast,
  showUndoToast,
} from '@mcv/ui';

// Simple notifications
showSuccessToast('User created successfully');
showErrorToast('Failed to delete user');
showWarningToast('You have unsaved changes');
showInfoToast('New version available');

// Loading → success/error
showPromiseToast(
  saveUser(data),
  {
    loading: 'Saving user...',
    success: 'User saved successfully',
    error: 'Failed to save user',
  }
);

// Undo action
showUndoToast('User deleted', {
  onUndo: async () => {
    await restoreUser(userId);
  },
  duration: 5000,
});
```

### Error Boundary Pattern

A React error boundary with fallback UI and error reporting:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface ErrorBoundaryPatternProps {
  /** Fallback UI variant */
  fallback?: 'default' | 'compact' | 'inline' | 'custom';
  /** Custom fallback render */
  renderFallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Error reporting handler */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show error details in development */
  showDetails?: boolean;
  /** Retry handler */
  onRetry?: () => void;
  /** Children to wrap */
  children: React.ReactNode;
}

// ─── Usage ──────────────────────────────────────────────────────
import { ErrorBoundaryPattern } from '@mcv/ui';

// Page-level error boundary
<ErrorBoundaryPattern
  fallback="default"
  onError={(error, info) => {
    reportError(error, info);
  }}
  onRetry={() => window.location.reload()}
>
  <DashboardContent />
</ErrorBoundaryPattern>

// Section-level error boundary (compact)
<ErrorBoundaryPattern fallback="compact">
  <ChartWidget data={chartData} />
</ErrorBoundaryPattern>

// Custom fallback
<ErrorBoundaryPattern
  renderFallback={(error, reset) => (
    <Alert variant="destructive">
      <AlertCircleIcon className="h-4 w-4" />
      <p>Something went wrong loading this section.</p>
      <Button size="sm" onClick={reset}>Try Again</Button>
    </Alert>
  )}
>
  <ComplexComponent />
</ErrorBoundaryPattern>
```

### Retry Pattern

A wrapper that adds automatic retry with exponential backoff for failed operations:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface RetryPatternProps {
  /** The async operation to retry */
  operation: () => Promise<void>;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Base delay in ms (doubles each attempt) */
  baseDelay?: number;
  /** Maximum delay in ms */
  maxDelay?: number;
  /** Whether to retry automatically */
  auto?: boolean;
  /** Render function */
  children: (state: {
    loading: boolean;
    error: Error | null;
    attempt: number;
    retry: () => void;
    nextRetryIn: number | null;
  }) => React.ReactNode;
}

// ─── Usage ──────────────────────────────────────────────────────
import { RetryPattern } from '@mcv/ui';

<RetryPattern
  operation={fetchDashboardData}
  maxRetries={3}
  baseDelay={1000}
  auto
>
  {({ loading, error, attempt, retry, nextRetryIn }) => {
    if (loading) return <SkeletonScreen variant="dashboard" />;
    if (error) return (
      <ErrorState
        title="Failed to load dashboard"
        description={
          nextRetryIn
            ? `Retrying in ${Math.ceil(nextRetryIn / 1000)}s (attempt ${attempt}/3)...`
            : `Failed after ${attempt} attempts`
        }
        action={{ label: 'Retry Now', onClick: retry }}
      />
    );
    return <DashboardContent />;
  }}
</RetryPattern>
```

---

## Responsive Patterns

### Mobile-First Approach

All patterns follow a mobile-first CSS strategy using Tailwind CSS v4 breakpoints. Components are designed for the smallest viewport first and progressively enhanced:

```typescript
// ─── Breakpoint System ──────────────────────────────────────────
const breakpoints = {
  sm: '640px',    // Small tablets
  md: '768px',    // Tablets
  lg: '1024px',   // Laptops
  xl: '1280px',   // Desktops
  '2xl': '1536px', // Large desktops
} as const;

// ─── ResponsiveContainer ────────────────────────────────────────
interface ResponsiveContainerProps {
  /** Content */
  children: React.ReactNode;
  /** Padding that adjusts per breakpoint */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Maximum width with auto centering */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Additional className */
  className?: string;
}

// ─── useBreakpoint Hook ─────────────────────────────────────────
function useBreakpoint() {
  return {
    isMobile: boolean;     // < 640px
    isTablet: boolean;     // 640px - 1023px
    isDesktop: boolean;    // ≥ 1024px
    isLargeDesktop: boolean; // ≥ 1280px
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  };
}

// ─── Usage ──────────────────────────────────────────────────────
function ResponsiveDashboard() {
  const { isMobile, isTablet } = useBreakpoint();

  return (
    <MetricCardGrid
      columns={{
        sm: 1,             // Mobile: single column
        md: 2,             // Tablet: two columns
        lg: 4,             // Desktop: four columns
      }}
      metrics={metrics}
    />
  );
}
```

### Responsive Table Pattern

Tables that adapt to mobile viewports by transforming into cards or stacked layouts:

```typescript
// ─── Props ──────────────────────────────────────────────────────
interface ResponsiveTableProps<TData> {
  /** Table columns */
  columns: ColumnDef<TData>[];
  /** Table data */
  data: TData[];
  /** Mobile display mode */
  mobileMode?: 'cards' | 'stacked' | 'scroll' | 'hide-columns';
  /** Columns to prioritize on mobile (shown first) */
  priorityColumns?: string[];
  /** Columns to hide on mobile */
  hideOnMobile?: string[];
  /** Card render function for 'cards' mobile mode */
  renderMobileCard?: (row: TData) => React.ReactNode;
  /** Breakpoint at which to switch to mobile mode */
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  /** All other DataTablePattern props */
  // ...extends DataTablePatternProps<TData>
}

// ─── Usage ──────────────────────────────────────────────────────
import { ResponsiveTable } from '@mcv/ui';

<ResponsiveTable
  columns={userColumns}
  data={users}
  mobileMode="cards"
  mobileBreakpoint="md"
  priorityColumns={['name', 'status']}
  hideOnMobile={['createdAt', 'lastLogin']}
  renderMobileCard={(user) => (
    <div className="flex items-center gap-3 p-4">
      <Avatar src={user.avatar} name={user.name} />
      <div className="flex-1">
        <Text className="font-medium">{user.name}</Text>
        <Text size="sm" className="text-muted-foreground">{user.email}</Text>
      </div>
      <StatusIndicator status={user.status} />
    </div>
  )}
  sortable
  paginated
  pageSize={25}
/>
```

---

## Accessibility Patterns

### Focus Management

Patterns for managing focus in complex interactions — modals, drawers, and dynamic content:

```typescript
// ─── FocusTrap ──────────────────────────────────────────────────
interface FocusTrapProps {
  /** Whether the focus trap is active */
  active: boolean;
  /** Element to return focus to on deactivation */
  returnFocusTo?: React.RefObject<HTMLElement>;
  /** Initial focus element ref */
  initialFocus?: React.RefObject<HTMLElement>;
  /** Wrap focus at boundaries */
  loop?: boolean;
  /** Children to trap focus within */
  children: React.ReactNode;
}

// ─── useFocusManagement Hook ────────────────────────────────────
function useFocusManagement() {
  return {
    /** Move focus to a specific element */
    focusElement: (ref: React.RefObject<HTMLElement>) => void;
    /** Move focus to the first focusable element in a container */
    focusFirst: (containerRef: React.RefObject<HTMLElement>) => void;
    /** Announce content to screen readers via aria-live */
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
    /** Save current focus position */
    saveFocus: () => void;
    /** Restore previously saved focus position */
    restoreFocus: () => void;
  };
}

// ─── Usage ──────────────────────────────────────────────────────
import { FocusTrap, useFocusManagement } from '@mcv/ui';

function CustomModal({ open, onClose, children }) {
  const closeButtonRef = useRef(null);
  const { announce } = useFocusManagement();

  useEffect(() => {
    if (open) announce('Dialog opened', 'assertive');
  }, [open]);

  return (
    <FocusTrap active={open} initialFocus={closeButtonRef} loop>
      <div role="dialog" aria-modal="true" aria-label="Custom dialog">
        <button ref={closeButtonRef} onClick={onClose}>Close</button>
        {children}
      </div>
    </FocusTrap>
  );
}
```

### Keyboard Navigation

Patterns for arrow-key navigation, roving tabindex, and shortcut handling:

```typescript
// ─── useRovingTabIndex Hook ─────────────────────────────────────
interface UseRovingTabIndexOptions {
  /** Orientation for arrow key navigation */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Whether to loop at boundaries */
  loop?: boolean;
  /** Number of columns (for grid navigation) */
  columns?: number;
}

function useRovingTabIndex(
  items: React.RefObject<HTMLElement>[],
  options?: UseRovingTabIndexOptions
): {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  getTabIndex: (index: number) => 0 | -1;
  onKeyDown: (event: React.KeyboardEvent) => void;
};

// ─── Usage ──────────────────────────────────────────────────────
function ToolbarPattern({ items }: { items: ToolbarItem[] }) {
  const itemRefs = items.map(() => useRef<HTMLButtonElement>(null));
  const { getTabIndex, onKeyDown } = useRovingTabIndex(itemRefs, {
    orientation: 'horizontal',
    loop: true,
  });

  return (
    <div role="toolbar" aria-label="Actions" onKeyDown={onKeyDown}>
      {items.map((item, i) => (
        <button
          key={item.id}
          ref={itemRefs[i]}
          tabIndex={getTabIndex(i)}
          onClick={item.onClick}
        >
          {item.icon}
          <span className="sr-only">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
```

### Screen Reader Patterns

Patterns ensuring content is properly announced and navigable for assistive technology:

```typescript
// ─── ScreenReaderOnly ───────────────────────────────────────────
// Visually hidden but accessible to screen readers
<span className="sr-only">3 unread notifications</span>

// ─── LiveRegion ─────────────────────────────────────────────────
interface LiveRegionProps {
  /** Message to announce */
  message: string;
  /** Politeness level */
  politeness?: 'polite' | 'assertive';
  /** Whether to clear previous announcements first */
  clearOnAnnounce?: boolean;
}

// ─── Usage ──────────────────────────────────────────────────────
import { LiveRegion } from '@mcv/ui';

function SearchResults({ results, query }: Props) {
  return (
    <>
      <LiveRegion
        message={`${results.length} results found for "${query}"`}
        politeness="polite"
      />
      <ResultsList results={results} />
    </>
  );
}
```

### ARIA Patterns

Standardized ARIA attribute patterns for complex widgets:

```typescript
// ─── ARIA Patterns Reference ────────────────────────────────────

// Tabs Pattern
<div role="tablist" aria-label="User sections">
  <button role="tab" aria-selected="true" aria-controls="panel-overview">Overview</button>
  <button role="tab" aria-selected="false" aria-controls="panel-activity">Activity</button>
</div>
<div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
  {/* Tab content */}
</div>

// Dialog Pattern
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-desc">
  <h2 id="dialog-title">Confirm Delete</h2>
  <p id="dialog-desc">This action cannot be undone.</p>
</div>

// Data Grid Pattern
<table role="grid" aria-label="Users table" aria-rowcount={totalRows}>
  <thead>
    <tr role="row">
      <th role="columnheader" aria-sort="ascending">Name</th>
      <th role="columnheader" aria-sort="none">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row" aria-rowindex={1} aria-selected="false">
      <td role="gridcell">Alice Johnson</td>
      <td role="gridcell">alice@example.com</td>
    </tr>
  </tbody>
</table>

// Tree Pattern
<ul role="tree" aria-label="File browser">
  <li role="treeitem" aria-expanded="true" aria-level={1}>
    src
    <ul role="group">
      <li role="treeitem" aria-level={2}>index.ts</li>
      <li role="treeitem" aria-level={2}>utils.ts</li>
    </ul>
  </li>
</ul>

// Combobox Pattern
<div role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-owns="suggestions">
  <input
    aria-autocomplete="list"
    aria-controls="suggestions"
    aria-activedescendant="suggestion-2"
  />
</div>
<ul id="suggestions" role="listbox">
  <li id="suggestion-1" role="option" aria-selected="false">Option A</li>
  <li id="suggestion-2" role="option" aria-selected="true">Option B</li>
</ul>
```

---

## Animation Patterns

### Transition Patterns

Standardized enter/exit transitions for components:

```typescript
// ─── TransitionPresets ──────────────────────────────────────────
const transitionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  },
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  slideDown: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  slideRight: {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.15 },
  },
  expand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
} as const;

// ─── AnimatedPresence Wrapper ───────────────────────────────────
interface AnimatedPresenceProps {
  /** Whether to show the content */
  show: boolean;
  /** Transition preset or custom variants */
  transition?: keyof typeof transitionPresets | MotionVariants;
  /** Children to animate */
  children: React.ReactNode;
  /** Unique key for AnimatePresence */
  animateKey?: string;
}

// ─── Usage ──────────────────────────────────────────────────────
import { AnimatedPresence } from '@mcv/ui';

<AnimatedPresence show={showNotification} transition="slideUp">
  <Alert variant="info">You have new messages</Alert>
</AnimatedPresence>
```

### Micro-Interactions

Subtle animations that provide feedback on user actions:

```typescript
// ─── Interaction Animations ─────────────────────────────────────
const microInteractions = {
  /** Button press feedback */
  press: { scale: 0.97, transition: { duration: 0.1 } },

  /** Checkbox/toggle check animation */
  check: {
    pathLength: [0, 1],
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  /** Like/favorite heart pop */
  heartPop: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  /** Shake for error feedback */
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.4 },
  },

  /** Count change (number ticks up/down) */
  countChange: {
    y: [0, -20],
    opacity: [1, 0],
    transition: { duration: 0.2 },
  },

  /** Item added to list */
  listItemEnter: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    transition: { duration: 0.2 },
  },
} as const;

// ─── Usage ──────────────────────────────────────────────────────
import { motion } from 'framer-motion';
import { microInteractions } from '@mcv/ui';

<motion.button whileTap={microInteractions.press}>
  Save Changes
</motion.button>

<motion.div
  animate={hasError ? microInteractions.shake : {}}
>
  <Input error={hasError} />
</motion.div>
```

### Page Transitions

Smooth transitions between pages or major view changes:

```typescript
// ─── PageTransition ─────────────────────────────────────────────
interface PageTransitionProps {
  /** Transition variant */
  variant?: 'fade' | 'slide' | 'scale' | 'none';
  /** Transition direction (for 'slide') */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Duration in seconds */
  duration?: number;
  /** Unique key (usually the route path) */
  pageKey: string;
  /** Page content */
  children: React.ReactNode;
}

// ─── Usage ──────────────────────────────────────────────────────
import { PageTransition } from '@mcv/ui';

// In Next.js layout
function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell>
      <PageTransition pageKey={pathname} variant="fade" duration={0.2}>
        {children}
      </PageTransition>
    </AppShell>
  );
}
```

---

## Pattern Composition

Patterns are designed to compose together into full pages. Here's how they combine:

### CRUD Entity Page

A common composition: list → detail → create/edit:

```typescript
import {
  StandardPage,
  DataTablePattern,
  FormModal,
  ConfirmationDialog,
  DrawerPattern,
  DetailView,
  showSuccessToast,
  showErrorToast,
} from '@mcv/ui';

function UsersCrudPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  return (
    <>
      {/* Main List View */}
      <StandardPage
        title="Users"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Users' }]}
        actions={
          <Button color="primary" onClick={() => setShowCreate(true)}>
            Add User
          </Button>
        }
      >
        <DataTablePattern<User>
          columns={userColumns}
          data={users}
          sortable
          searchable
          paginated
          selectable
          rowActions={[
            { label: 'View', icon: <EyeIcon />, onClick: setViewUser },
            { label: 'Edit', icon: <EditIcon />, onClick: setEditUser },
            {
              label: 'Delete',
              icon: <TrashIcon />,
              variant: 'danger',
              onClick: setDeleteUser,
            },
          ]}
          onRowClick={setViewUser}
        />
      </StandardPage>

      {/* Create Modal */}
      <FormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create User"
        schema={createUserSchema}
        fields={userFormFields}
        onSubmit={async (values) => {
          await createUser(values);
          showSuccessToast('User created');
        }}
        closeOnSubmit
      />

      {/* Edit Modal */}
      <FormModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        schema={updateUserSchema}
        defaultValues={editUser ?? undefined}
        fields={userFormFields}
        onSubmit={async (values) => {
          await updateUser(editUser!.id, values);
          showSuccessToast('User updated');
        }}
        closeOnSubmit
      />

      {/* Detail Drawer */}
      <DrawerPattern
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        title="User Details"
        side="right"
        size="lg"
      >
        {viewUser && <UserDetail user={viewUser} />}
      </DrawerPattern>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        variant="danger"
        title="Delete User"
        description={`Are you sure you want to delete ${deleteUser?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmPhrase={deleteUser?.name}
        onConfirm={async () => {
          await deleteUserApi(deleteUser!.id);
          showSuccessToast('User deleted');
          setDeleteUser(null);
        }}
      />
    </>
  );
}
```

### Settings Page Composition

A composed settings page with sidebar navigation and sectioned forms:

```typescript
import {
  SidebarLayout,
  SidebarNav,
  StandardPage,
  StandardForm,
  TabsPattern,
  ConfirmationDialog,
} from '@mcv/ui';

function SettingsPage() {
  return (
    <StandardPage
      title="Settings"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Settings' }]}
    >
      <TabsPattern
        variant="pills"
        urlParam="section"
        tabs={[
          {
            id: 'general',
            label: 'General',
            icon: <SettingsIcon />,
            content: (
              <StandardForm
                schema={generalSettingsSchema}
                defaultValues={generalSettings}
                onSubmit={saveGeneralSettings}
                submitLabel="Save Changes"
                sections={[
                  {
                    title: 'Organization',
                    fields: [
                      { name: 'orgName', label: 'Organization Name', type: 'text' },
                      { name: 'orgSlug', label: 'URL Slug', type: 'text' },
                      { name: 'timezone', label: 'Timezone', type: 'select', options: timezones },
                    ],
                  },
                ]}
              />
            ),
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: <BellIcon />,
            content: <NotificationSettings />,
          },
          {
            id: 'security',
            label: 'Security',
            icon: <ShieldIcon />,
            content: <SecuritySettings />,
          },
          {
            id: 'danger',
            label: 'Danger Zone',
            icon: <AlertTriangleIcon />,
            badgeColor: 'danger',
            content: <DangerZoneSettings />,
          },
        ]}
      />
    </StandardPage>
  );
}
```

### Dashboard Page Composition

A fully composed executive dashboard:

```typescript
import {
  FullWidthLayout,
  PageHeader,
  MetricCardGrid,
  ChartsGrid,
  ActivityFeedPattern,
  SplitLayout,
  TabsPattern,
  SkeletonScreen,
} from '@mcv/ui';

function ExecutiveDashboardPage() {
  const { data, isLoading, error } = useDashboardData(dateRange);

  if (isLoading) return <SkeletonScreen variant="dashboard" />;

  return (
    <FullWidthLayout
      header={
        <PageHeader
          title="Executive Dashboard"
          actions={
            <div className="flex items-center gap-3">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <Button variant="outline" startContent={<RefreshIcon />} onClick={refetch}>
                Refresh
              </Button>
              <Button variant="outline" startContent={<DownloadIcon />}>
                Export
              </Button>
            </div>
          }
        />
      }
    >
      <div className="space-y-8 p-6">
        {/* KPI Metrics */}
        <MetricCardGrid
          metrics={data.metrics}
          columns={{ sm: 1, md: 2, lg: 4 }}
          animate
        />

        {/* Charts + Activity */}
        <SplitLayout
          ratio="2:1"
          collapseBelow="lg"
          gap="lg"
          left={
            <ChartsGrid
              columns={2}
              gap="md"
              charts={data.charts}
            />
          }
          right={
            <div className="rounded-lg border bg-card p-4">
              <Text className="mb-4 font-semibold">Recent Activity</Text>
              <ActivityFeedPattern
                items={data.activities}
                maxHeight="500px"
                relativeTime
                groupByDate
              />
            </div>
          }
        />

        {/* Detailed Tabs */}
        <TabsPattern
          variant="underline"
          tabs={[
            { id: 'revenue', label: 'Revenue', content: <RevenueDetail data={data.revenue} /> },
            { id: 'users', label: 'Users', content: <UserGrowthDetail data={data.userGrowth} /> },
            { id: 'performance', label: 'Performance', content: <PerformanceDetail data={data.performance} /> },
          ]}
        />
      </div>
    </FullWidthLayout>
  );
}
```

---

## TypeScript Props Summary

Every pattern exports its prop types for TypeScript consumers. The full list of exported types:

```typescript
// ─── Layout Patterns ────────────────────────────────────────────
export type { StandardPageProps } from './layouts/standard-page';
export type { SplitLayoutProps } from './layouts/split-layout';
export type { FullWidthLayoutProps } from './layouts/full-width-layout';
export type { SidebarLayoutProps } from './layouts/sidebar-layout';

// ─── Data Display Patterns ──────────────────────────────────────
export type {
  DataTablePatternProps,
  FilterFieldDef,
  BulkAction,
  RowActionDef,
  SavedView,
  SortState,
  FilterState,
} from './data/data-table-pattern';
export type { DetailViewProps, DetailSection, DetailField, RelatedTab } from './data/detail-view';
export type { CardGridProps } from './data/card-grid';
export type { ListViewProps } from './data/list-view';
export type { TreeViewProps, TreeNode } from './data/tree-view';

// ─── Form Patterns ──────────────────────────────────────────────
export type { StandardFormProps, FormSection, FormFieldConfig } from './forms/standard-form';
export type { WizardFormProps, WizardStep } from './forms/wizard-form';
export type { InlineEditProps } from './forms/inline-edit';
export type { BulkEditProps, BulkEditField } from './forms/bulk-edit';
export type { DynamicFieldsProps } from './forms/dynamic-fields';

// ─── Dashboard Patterns ─────────────────────────────────────────
export type { MetricCardGridProps, MetricDef } from './dashboard/metric-card-grid';
export type { ChartsGridProps, ChartDef } from './dashboard/charts-grid';
export type { ActivityFeedPatternProps, ActivityItem } from './dashboard/activity-feed';
export type { KPIDashboardProps } from './dashboard/kpi-dashboard';

// ─── Navigation Patterns ────────────────────────────────────────
export type { SidebarNavProps, NavItem } from './navigation/sidebar-nav';
export type { BreadcrumbPatternProps, BreadcrumbItem } from './navigation/breadcrumb-pattern';
export type { TabsPatternProps, TabDef } from './navigation/tabs-pattern';
export type { CommandPalettePatternProps, CommandGroup, CommandItem } from './navigation/command-palette';

// ─── Modal & Dialog Patterns ────────────────────────────────────
export type { ConfirmationDialogProps } from './dialogs/confirmation-dialog';
export type { FormModalProps } from './dialogs/form-modal';
export type { DrawerPatternProps } from './dialogs/drawer-pattern';
export type { SheetPatternProps } from './dialogs/sheet-pattern';
export type { LightboxPatternProps, LightboxItem } from './dialogs/lightbox-pattern';

// ─── Empty States ───────────────────────────────────────────────
export type { EmptyStateBaseProps } from './empty-states/empty-state';

// ─── Loading Patterns ───────────────────────────────────────────
export type { SkeletonScreenProps } from './loading/skeleton-screen';
export type { SpinnerPatternProps } from './loading/spinner-pattern';
export type { ProgressBarPatternProps } from './loading/progress-bar-pattern';
export type { OptimisticUIProps } from './loading/optimistic-ui';

// ─── Error Patterns ─────────────────────────────────────────────
export type { InlineErrorProps } from './errors/inline-error';
export type { ErrorBoundaryPatternProps } from './errors/error-boundary-pattern';
export type { RetryPatternProps } from './errors/retry-pattern';

// ─── Responsive Patterns ────────────────────────────────────────
export type { ResponsiveContainerProps } from './responsive/responsive-container';
export type { ResponsiveTableProps } from './responsive/responsive-table';

// ─── Accessibility Patterns ─────────────────────────────────────
export type { FocusTrapProps } from './a11y/focus-trap';
export type { LiveRegionProps } from './a11y/live-region';

// ─── Animation Patterns ─────────────────────────────────────────
export type { AnimatedPresenceProps } from './animation/animated-presence';
export type { PageTransitionProps } from './animation/page-transition';
```

---

## Storybook Stories

Every pattern has corresponding Storybook stories for visual testing and documentation. Stories follow a consistent structure:

```typescript
// ─── Example: DataTablePattern.stories.tsx ──────────────────────
import type { Meta, StoryObj } from '@storybook/react';
import { DataTablePattern } from './data-table-pattern';
import { generateMockUsers } from '@/test/generators';

const meta: Meta<typeof DataTablePattern> = {
  title: 'Patterns/Data Display/DataTable',
  component: DataTablePattern,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A complete data table pattern with sorting, filtering, pagination, selection, and bulk actions.',
      },
    },
  },
  argTypes: {
    density: {
      control: 'radio',
      options: ['compact', 'default', 'comfortable'],
    },
    pageSize: {
      control: 'select',
      options: [10, 25, 50, 100],
    },
  },
};
export default meta;

type Story = StoryObj<typeof DataTablePattern>;

// Default state
export const Default: Story = {
  args: {
    columns: userColumns,
    data: generateMockUsers(50),
    sortable: true,
    searchable: true,
    paginated: true,
    pageSize: 25,
  },
};

// With selection and bulk actions
export const WithBulkActions: Story = {
  args: {
    ...Default.args,
    selectable: true,
    selectionMode: 'multi',
    bulkActions: [
      { label: 'Activate', onClick: () => {} },
      { label: 'Delete', variant: 'danger', onClick: () => {} },
    ],
  },
};

// Loading state
export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
};

// Empty state
export const Empty: Story = {
  args: {
    ...Default.args,
    data: [],
    emptyState: <EmptyState title="No data" description="Nothing here yet" />,
  },
};

// Error state
export const Error: Story = {
  args: {
    ...Default.args,
    data: [],
    error: new Error('Failed to fetch'),
    onRetry: () => {},
  },
};

// ─── Example: WizardForm.stories.tsx ────────────────────────────
import type { Meta, StoryObj } from '@storybook/react';
import { WizardForm } from './wizard-form';

const meta: Meta<typeof WizardForm> = {
  title: 'Patterns/Forms/WizardForm',
  component: WizardForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof WizardForm>;

export const Default: Story = {
  args: {
    steps: [
      {
        title: 'Account',
        fields: [
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'password', label: 'Password', type: 'password', required: true },
        ],
      },
      {
        title: 'Profile',
        fields: [
          { name: 'name', label: 'Full Name', type: 'text', required: true },
          { name: 'bio', label: 'Bio', type: 'textarea' },
        ],
      },
      {
        title: 'Review',
      },
    ],
    schema: signupSchema,
    showProgress: true,
    progressVariant: 'stepper',
    showReview: true,
    submitLabel: 'Create Account',
    onSubmit: async (values) => console.log('Submit:', values),
  },
};

export const WithSideProgress: Story = {
  args: {
    ...Default.args,
    progressPosition: 'left',
  },
};

// ─── Story Naming Convention ────────────────────────────────────
// Patterns/
//   Data Display/
//     DataTable        → Default, WithBulkActions, Loading, Empty, Error, Virtualized
//     DetailView       → Default, Loading, WithTabs, Compact
//     CardGrid         → Default, ListView, Loading, Empty, InfiniteScroll
//     ListView         → Default, Grouped, Virtualized, Empty
//     TreeView         → Default, Draggable, LazyLoad
//   Forms/
//     StandardForm     → Default, TwoColumn, WithAutoSave, WithValidationSummary
//     WizardForm       → Default, WithSideProgress, WithSkippableSteps
//     InlineEdit       → Text, Select, Textarea
//     BulkEdit         → Default, WithDiff
//     DynamicFields    → Default, Reorderable, Cards
//   Dashboard/
//     MetricCardGrid   → Default, Loading, Animated
//     ChartsGrid       → Default, Draggable
//     ActivityFeed     → Default, Grouped, WithFilters
//     KPIDashboard     → Default, WithSidebar, Loading
//   Navigation/
//     SidebarNav       → Default, Collapsed, WithBadges
//     BreadcrumbPattern → Default, Collapsed, WithIcons
//     TabsPattern      → Underline, Pills, Bordered, Segment
//     CommandPalette   → Default, WithSearch, WithRecent
//   Dialogs/
//     ConfirmationDialog → Default, Danger, WithPhrase
//     FormModal        → Default, TwoColumn, Large
//     DrawerPattern    → Right, Left, Large, WithFooter
//     SheetPattern     → Default, WithSnapPoints
//     LightboxPattern  → Default, WithThumbnails, Video
//   Empty States/
//     NoData, NoResults, FirstTime, Error, Offline, Unauthorized
//   Loading/
//     SkeletonScreen   → Card, Table, List, Detail, Dashboard
//     SpinnerPattern   → Inline, Overlay, Fullscreen
//     ProgressBar      → Default, Striped, Animated
//   Errors/
//     InlineError      → Field, Section, Banner
//     ErrorBoundary    → Default, Compact, Custom
//     RetryPattern     → Auto, Manual
//   Responsive/
//     ResponsiveTable  → Cards, Stacked, Scroll
//   Animation/
//     AnimatedPresence → FadeIn, SlideUp, ScaleIn
//     PageTransition   → Fade, Slide
//   Composition/
//     CrudPage, SettingsPage, DashboardPage
```

---

## Usage Examples

### Quick Start

```typescript
// 1. Install @mcv/ui (patterns are included)
// pnpm add @mcv/ui

// 2. Import patterns
import {
  StandardPage,
  DataTablePattern,
  FormModal,
  ConfirmationDialog,
  MetricCardGrid,
  EmptyState,
  showSuccessToast,
} from '@mcv/ui';

// 3. Use in your page
export default function MyPage() {
  return (
    <StandardPage title="My Page" maxWidth="xl">
      <DataTablePattern
        columns={myColumns}
        data={myData}
        sortable
        searchable
        paginated
      />
    </StandardPage>
  );
}
```

### Pattern Selection Guide

| Scenario | Pattern |
|----------|---------|
| Standard content page | `StandardPage` |
| Master-detail view | `SplitLayout` |
| Dashboard with metrics | `KPIDashboard` or `MetricCardGrid` + `ChartsGrid` |
| Data listing with CRUD | `DataTablePattern` + `FormModal` + `ConfirmationDialog` |
| Entity detail page | `DetailView` |
| Card-based browsing | `CardGrid` |
| Settings/preferences | `TabsPattern` + `StandardForm` |
| Multi-step workflow | `WizardForm` |
| Quick actions | `CommandPalettePattern` |
| Mobile-friendly actions | `SheetPattern` |
| Image gallery | `LightboxPattern` |
| Admin layout | `SidebarLayout` + `SidebarNav` |
| Immersive editor | `FullWidthLayout` |
| In-place editing | `InlineEdit` |
| Batch operations | `BulkEdit` |
| File/category browser | `TreeView` |
| Activity timeline | `ActivityFeedPattern` |

### Common Compositions

```typescript
// ─── Auth Page ──────────────────────────────────────────────────
<FullWidthLayout flush background="muted" minHeight="screen">
  <div className="flex min-h-screen items-center justify-center">
    <AuthCard mode="login" onSubmit={handleLogin} />
  </div>
</FullWidthLayout>

// ─── Admin Shell ────────────────────────────────────────────────
<SidebarLayout
  sidebar={<SidebarNav items={navItems} />}
  collapsible
  mobileOverlay
>
  <StandardPage title={pageTitle}>
    {children}
  </StandardPage>
</SidebarLayout>

// ─── Data Explorer ──────────────────────────────────────────────
<StandardPage title="Products" actions={<Button>Add Product</Button>}>
  <CardGrid
    items={products}
    viewToggle
    searchable
    sortOptions={sortOptions}
    renderCard={(p) => <ProductCard product={p} />}
    renderListItem={(p) => <ProductListItem product={p} />}
  />
</StandardPage>

// ─── Monitoring Dashboard ───────────────────────────────────────
<FullWidthLayout>
  <MetricCardGrid metrics={systemMetrics} columns={{ sm: 2, lg: 4 }} />
  <ChartsGrid
    columns={2}
    charts={[
      { id: 'cpu', title: 'CPU Usage', type: 'area', data: cpuData, config: cpuConfig },
      { id: 'mem', title: 'Memory Usage', type: 'area', data: memData, config: memConfig },
      { id: 'errors', title: 'Error Rate', type: 'bar', data: errorData, config: errorConfig },
      { id: 'latency', title: 'Response Time', type: 'area', data: latencyData, config: latencyConfig },
    ]}
  />
  <ActivityFeedPattern items={incidents} groupByDate pollInterval={10000} />
</FullWidthLayout>
```

---

## Dependencies

Patterns consume components and utilities from the parent `@mcv/ui` package. They do not introduce new external dependencies.

| Dependency | Usage |
|-----------|-------|
| `@mcv/ui` (self) | All atomic components, primitives, composites |
| `react-hook-form` | Form state management in StandardForm, WizardForm, FormModal |
| `zod` | Schema validation for all form patterns |
| `@hookform/resolvers` | Zod-to-RHF resolver bridge |
| `@tanstack/react-table` | Table state in DataTablePattern, ResponsiveTable |
| `framer-motion` | Animation patterns, transitions, micro-interactions |
| `next/navigation` | URL-synced tabs (optional — works without Next.js) |

---

## File Structure

```
patterns/
├── layouts/
│   ├── standard-page.tsx
│   ├── split-layout.tsx
│   ├── full-width-layout.tsx
│   ├── sidebar-layout.tsx
│   └── index.ts
├── data/
│   ├── data-table-pattern.tsx
│   ├── detail-view.tsx
│   ├── card-grid.tsx
│   ├── list-view.tsx
│   ├── tree-view.tsx
│   └── index.ts
├── forms/
│   ├── standard-form.tsx
│   ├── wizard-form.tsx
│   ├── inline-edit.tsx
│   ├── bulk-edit.tsx
│   ├── dynamic-fields.tsx
│   └── index.ts
├── dashboard/
│   ├── metric-card-grid.tsx
│   ├── charts-grid.tsx
│   ├── activity-feed.tsx
│   ├── kpi-dashboard.tsx
│   └── index.ts
├── navigation/
│   ├── sidebar-nav.tsx
│   ├── breadcrumb-pattern.tsx
│   ├── tabs-pattern.tsx
│   ├── command-palette.tsx
│   └── index.ts
├── dialogs/
│   ├── confirmation-dialog.tsx
│   ├── form-modal.tsx
│   ├── drawer-pattern.tsx
│   ├── sheet-pattern.tsx
│   ├── lightbox-pattern.tsx
│   └── index.ts
├── empty-states/
│   ├── empty-state.tsx
│   ├── no-search-results.tsx
│   ├── welcome-state.tsx
│   ├── error-state.tsx
│   ├── offline-state.tsx
│   ├── unauthorized-state.tsx
│   └── index.ts
├── loading/
│   ├── skeleton-screen.tsx
│   ├── spinner-pattern.tsx
│   ├── progress-bar-pattern.tsx
│   ├── optimistic-ui.tsx
│   └── index.ts
├── errors/
│   ├── inline-error.tsx
│   ├── error-boundary-pattern.tsx
│   ├── retry-pattern.tsx
│   └── index.ts
├── responsive/
│   ├── responsive-container.tsx
│   ├── responsive-table.tsx
│   ├── use-breakpoint.ts
│   └── index.ts
├── a11y/
│   ├── focus-trap.tsx
│   ├── live-region.tsx
│   ├── use-roving-tab-index.ts
│   ├── use-focus-management.ts
│   └── index.ts
├── animation/
│   ├── animated-presence.tsx
│   ├── page-transition.tsx
│   ├── transition-presets.ts
│   ├── micro-interactions.ts
│   └── index.ts
├── shell/
│   ├── app-shell.tsx
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── index.ts
└── index.ts                    # Barrel export for all patterns
```

---

*@mcv/ui/patterns — Reusable UI Patterns*