# @mcv/ui — Technical Architecture
## Component Library System Design

**Package:** `@mcv/ui`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/ui                                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        COMPONENT LAYER                                  │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │ Primitives  │  │   Forms     │  │   Data      │  │ Navigation  │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  │ 71 items    │  │ 86 items    │  │ 109 items   │  │ 52 items    │   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │ │
│  │         │                │                │                │          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  Feedback   │  │  Overlays   │  │ Specialized │  │  Patterns   │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  │ 40 items    │  │ 29 items    │  │ 121 items   │  │ 85 patterns │   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │ │
│  │         │                │                │                │          │ │
│  └─────────┼────────────────┼────────────────┼────────────────┼──────────┘ │
│            │                │                │                │            │
│  ┌─────────┴────────────────┴────────────────┴────────────────┴──────────┐ │
│  │                        VARIANT LAYER                                   │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    tailwind-variants                             │   │ │
│  │  │                                                                  │   │ │
│  │  │  • Compound variants    • Responsive variants                    │   │ │
│  │  │  • Slot variants        • Default variants                       │   │ │
│  │  │  • Boolean variants     • Class composition                      │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         TOKEN LAYER                                     │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Colors    │  │ Typography  │  │   Spacing   │  │   Effects   │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  │ 200+ tokens │  │ 45 tokens   │  │ 30 tokens   │  │ 40 tokens   │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        THEMING LAYER                                    │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Light     │  │    Dark     │  │  Venture    │  │  Dynamic    │   │ │
│  │  │   Theme     │  │   Theme     │  │   Themes    │  │  Branding   │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Layer Model

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Layer 5: PAGE PATTERNS                                                    │
│  (LoginPage, DashboardLayout, DataTablePage)                               │
├───────────────────────────────────────────────────────────────────────────┤
│  Layer 4: COMPOUND COMPONENTS                                              │
│  (DataTable, Form, Modal, Navigation)                                      │
├───────────────────────────────────────────────────────────────────────────┤
│  Layer 3: COMPOSITE COMPONENTS                                             │
│  (Card, Alert, Toast, Dropdown)                                            │
├───────────────────────────────────────────────────────────────────────────┤
│  Layer 2: ATOMIC COMPONENTS                                                │
│  (Button, Input, Badge, Avatar)                                            │
├───────────────────────────────────────────────────────────────────────────┤
│  Layer 1: PRIMITIVES                                                       │
│  (Box, Text, Icon, Slot)                                                   │
├───────────────────────────────────────────────────────────────────────────┤
│  Layer 0: TOKENS                                                           │
│  (Colors, Typography, Spacing, Effects)                                    │
└───────────────────────────────────────────────────────────────────────────┘
```

### Component Composition Model

```typescript
// Base component structure
interface ComponentProps {
  // Variant props (handled by tailwind-variants)
  variant?: VariantType;
  size?: SizeType;
  color?: ColorType;
  
  // State props
  isDisabled?: boolean;
  isLoading?: boolean;
  isSelected?: boolean;
  
  // Slot props
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  
  // DOM props (forwarded)
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  
  // Event handlers
  onPress?: (e: PressEvent) => void;
  onHover?: (e: HoverEvent) => void;
  onFocus?: (e: FocusEvent) => void;
}

// Variant definition with tailwind-variants
const button = tv({
  base: [
    'inline-flex items-center justify-center',
    'font-medium transition-all',
    'focus:outline-none focus-visible:ring-2',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
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
    color: {
      primary: '',
      secondary: '',
      success: '',
      warning: '',
      danger: '',
    },
    isIconOnly: {
      true: 'aspect-square p-0',
    },
  },
  compoundVariants: [
    {
      variant: 'solid',
      color: 'primary',
      class: 'bg-primary text-primary-foreground',
    },
    {
      variant: 'solid',
      color: 'danger',
      class: 'bg-destructive text-destructive-foreground',
    },
    // ... more compound variants
  ],
  defaultVariants: {
    variant: 'solid',
    size: 'md',
    color: 'primary',
  },
});
```

---

## Theming Architecture

### CSS Variable System

```css
/* Root theme variables */
:root {
  /* Color system - HSL format for easy manipulation */
  --primary-h: 222;
  --primary-s: 47%;
  --primary-l: 11%;
  
  /* Color scales (50-950) */
  --primary-50: hsl(var(--primary-h), var(--primary-s), 97%);
  --primary-100: hsl(var(--primary-h), var(--primary-s), 94%);
  --primary-200: hsl(var(--primary-h), var(--primary-s), 86%);
  --primary-300: hsl(var(--primary-h), var(--primary-s), 77%);
  --primary-400: hsl(var(--primary-h), var(--primary-s), 66%);
  --primary-500: hsl(var(--primary-h), var(--primary-s), 50%);
  --primary-600: hsl(var(--primary-h), var(--primary-s), 41%);
  --primary-700: hsl(var(--primary-h), var(--primary-s), 32%);
  --primary-800: hsl(var(--primary-h), var(--primary-s), 24%);
  --primary-900: hsl(var(--primary-h), var(--primary-s), 16%);
  --primary-950: hsl(var(--primary-h), var(--primary-s), 10%);
  
  /* Semantic tokens */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 222 47% 50%;
  
  /* Component tokens */
  --radius: 0.5rem;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;
}

/* Dark theme overrides */
.dark {
  --background: 222 47% 5%;
  --foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --popover: 222 47% 8%;
  --popover-foreground: 210 40% 98%;
  --card: 222 47% 8%;
  --card-foreground: 210 40% 98%;
  --border: 217 33% 17%;
  --input: 217 33% 17%;
}

/* Venture theme overrides */
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

### Theme Provider Implementation

```typescript
// @mcv/ui/branding/ThemeProvider.tsx
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { VentureTheme } from './types';
import { ventureThemes } from './themes';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  venture: VentureTheme;
  setVenture: (ventureId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultVenture = 'mcv',
  storageKey = 'mcv-theme',
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultVenture?: string;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });
  
  const [ventureId, setVentureId] = useState(defaultVenture);
  const venture = ventureThemes[ventureId] ?? ventureThemes.mcv;
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const root = document.documentElement;
    
    // Determine resolved theme
    let resolved: 'light' | 'dark';
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      resolved = theme;
    }
    
    setResolvedTheme(resolved);
    
    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    
    // Apply venture data attribute
    root.setAttribute('data-venture', ventureId);
    
    // Apply venture-specific CSS variables
    Object.entries(venture.colors.primary).forEach(([shade, value]) => {
      root.style.setProperty(`--primary-${shade}`, value);
    });
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        root.classList.remove('light', 'dark');
        root.classList.add(newResolved);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, ventureId, venture]);
  
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  }, [storageKey]);
  
  const setVenture = useCallback((newVentureId: string) => {
    setVentureId(newVentureId);
  }, []);
  
  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, venture, setVenture }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

---

## Component Patterns

### Compound Component Pattern

```typescript
// DataTable compound component
import { createContext, useContext } from 'react';

interface DataTableContextType<T> {
  data: T[];
  columns: Column<T>[];
  selectedRows: Set<string>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
}

const DataTableContext = createContext<DataTableContextType<any> | null>(null);

function useDataTable<T>() {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error('DataTable components must be used within DataTable');
  }
  return context as DataTableContextType<T>;
}

// Root component
function DataTableRoot<T>({
  data,
  columns,
  children,
  defaultSort,
  onSelectionChange,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSort?.column ?? null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSort?.direction ?? 'asc'
  );
  
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);
  
  const handleSelect = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);
  
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = data.map((row: any) => row.id);
      setSelectedRows(new Set(allIds));
      onSelectionChange?.(allIds);
    }
  }, [data, selectedRows.size, onSelectionChange]);
  
  return (
    <DataTableContext.Provider
      value={{
        data,
        columns,
        selectedRows,
        sortColumn,
        sortDirection,
        onSort: handleSort,
        onSelect: handleSelect,
        onSelectAll: handleSelectAll,
      }}
    >
      <div className="w-full overflow-auto">{children}</div>
    </DataTableContext.Provider>
  );
}

// Sub-components
function DataTableToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4">
      {children}
    </div>
  );
}

function DataTableSearch({ placeholder = 'Search...' }) {
  const [value, setValue] = useState('');
  
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="max-w-sm"
      startContent={<SearchIcon className="h-4 w-4 text-muted-foreground" />}
    />
  );
}

function DataTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="[&_tr]:border-b">
      <tr className="border-b transition-colors hover:bg-muted/50">
        {children}
      </tr>
    </thead>
  );
}

function DataTableColumn({
  field,
  header,
  sortable = false,
  width,
}: {
  field: string;
  header?: React.ReactNode;
  sortable?: boolean;
  width?: string;
}) {
  const { sortColumn, sortDirection, onSort } = useDataTable();
  const isSorted = sortColumn === field;
  
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
        sortable && 'cursor-pointer select-none',
      )}
      style={{ width }}
      onClick={sortable ? () => onSort(field) : undefined}
    >
      <div className="flex items-center gap-2">
        {header ?? field}
        {sortable && (
          <span className="inline-flex">
            {isSorted && sortDirection === 'asc' && <ChevronUpIcon className="h-4 w-4" />}
            {isSorted && sortDirection === 'desc' && <ChevronDownIcon className="h-4 w-4" />}
            {!isSorted && <ChevronsUpDownIcon className="h-4 w-4 opacity-50" />}
          </span>
        )}
      </div>
    </th>
  );
}

function DataTableBody<T>({ children }: { children: (row: T) => React.ReactNode }) {
  const { data, sortColumn, sortDirection } = useDataTable<T>();
  
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortColumn];
      const bVal = (b as any)[sortColumn];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);
  
  return (
    <tbody className="[&_tr:last-child]:border-0">
      {sortedData.map((row) => children(row))}
    </tbody>
  );
}

function DataTableRow({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const { selectedRows, onSelect } = useDataTable();
  const isSelected = selectedRows.has(id);
  
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted',
      )}
      data-state={isSelected ? 'selected' : undefined}
    >
      {children}
    </tr>
  );
}

function DataTableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="p-4 align-middle">{children}</td>
  );
}

function DataTablePagination() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data } = useDataTable();
  
  const totalPages = Math.ceil(data.length / pageSize);
  
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.length)} of {data.length} results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          isDisabled={page === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          isDisabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Compose the compound component
export const DataTable = Object.assign(DataTableRoot, {
  Toolbar: DataTableToolbar,
  Search: DataTableSearch,
  Header: DataTableHeader,
  Column: DataTableColumn,
  Body: DataTableBody,
  Row: DataTableRow,
  Cell: DataTableCell,
  Pagination: DataTablePagination,
});
```

### Slot Pattern

```typescript
// Slot-based component composition
import { Slot, Slottable } from '@radix-ui/react-slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'solid',
      size = 'md',
      asChild = false,
      startContent,
      endContent,
      isLoading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Spinner className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!isLoading && startContent && (
          <span className="mr-2">{startContent}</span>
        )}
        <Slottable>
          {isLoading && loadingText ? loadingText : children}
        </Slottable>
        {!isLoading && endContent && (
          <span className="ml-2">{endContent}</span>
        )}
      </Comp>
    );
  }
);

// Usage with asChild for composition
<Button asChild variant="ghost">
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

---

## Data Flow

### State Management

```typescript
// Component-level state with hooks
function useDisclosure(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, onOpen, onClose, onToggle };
}

// Form state with react-hook-form
function useFormField<T extends FieldValues>() {
  const fieldContext = useFormContext<T>();
  const { getFieldState, formState } = fieldContext;
  const fieldState = getFieldState(name, formState);
  
  return {
    ...fieldContext,
    ...fieldState,
  };
}

// Global UI state with Zustand
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  commandPaletteOpen: boolean;
  
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'system',
  commandPaletteOpen: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
}));
```

### Props Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│                                                                              │
│  Page Component                                                              │
│  ├── Layout Props (theme, venture, user)                                    │
│  ├── Data Props (from tRPC/API)                                             │
│  └── Event Handlers (mutations, navigation)                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PATTERN LAYER                                      │
│                                                                              │
│  DataTablePage                                                               │
│  ├── data: T[] (from parent)                                                │
│  ├── columns: Column<T>[] (config)                                          │
│  ├── actions: Action[] (config)                                             │
│  ├── onRowClick: (row: T) => void (callback)                                │
│  └── onCreate: () => void (callback)                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPOUND LAYER                                      │
│                                                                              │
│  DataTable                                                                   │
│  ├── Toolbar (search, filters, bulk actions)                                │
│  ├── Header (column headers, sort controls)                                 │
│  ├── Body (rows, cells, selection)                                          │
│  └── Footer (pagination, page size)                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ATOMIC LAYER                                       │
│                                                                              │
│  Button, Input, Badge, Checkbox, Avatar, etc.                               │
│  ├── variant/size/color (styling)                                           │
│  ├── isDisabled/isLoading (state)                                           │
│  ├── startContent/endContent (slots)                                        │
│  └── onClick/onChange (events)                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimizations

### Code Splitting

```typescript
// Lazy load heavy components
const RichTextEditor = lazy(() => import('./editors/RichTextEditor'));
const Chart = lazy(() => import('./charts/Chart'));
const DataTable = lazy(() => import('./data/DataTable'));

// Use with Suspense
function EditorSection() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <RichTextEditor />
    </Suspense>
  );
}
```

### Virtualization

```typescript
// Virtual list for large datasets
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ListItem item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Memoization

```typescript
// Memoize expensive computations
const sortedData = useMemo(() => {
  return [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    return sortDirection === 'asc' 
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });
}, [data, sortKey, sortDirection]);

// Memoize callback handlers
const handleRowClick = useCallback((row: RowData) => {
  onRowClick?.(row);
}, [onRowClick]);

// Memoize components with React.memo
const TableRow = memo(function TableRow({ row, columns }: TableRowProps) {
  return (
    <tr>
      {columns.map((col) => (
        <td key={col.key}>{col.render(row)}</td>
      ))}
    </tr>
  );
});
```

---

## Accessibility Architecture

### ARIA Patterns

```typescript
// Accessible component implementation
function Accordion({
  items,
  type = 'single',
  collapsible = true,
}: AccordionProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  
  const toggle = (id: string) => {
    if (type === 'single') {
      setExpanded(prev => 
        prev.includes(id) && collapsible ? [] : [id]
      );
    } else {
      setExpanded(prev =>
        prev.includes(id)
          ? prev.filter(i => i !== id)
          : [...prev, id]
      );
    }
  };
  
  return (
    <div role="region" aria-label="Accordion">
      {items.map((item) => {
        const isExpanded = expanded.includes(item.id);
        
        return (
          <div key={item.id} className="border-b">
            <h3>
              <button
                id={`accordion-header-${item.id}`}
                aria-expanded={isExpanded}
                aria-controls={`accordion-panel-${item.id}`}
                className="w-full flex items-center justify-between p-4"
                onClick={() => toggle(item.id)}
              >
                <span>{item.title}</span>
                <ChevronDownIcon
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>
            </h3>
            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              hidden={!isExpanded}
              className="p-4"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Focus Management

```typescript
// Focus trap for modals
import { FocusTrap } from '@radix-ui/react-focus-scope';

function Modal({ isOpen, onClose, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Focus first focusable element on open
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);
  
  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg shadow-xl"
        >
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-4 right-4"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
          {children}
        </div>
      </FocusTrap>
    </Portal>
  );
}
```

---

## Testing Architecture

### Testing Pyramid

```
         ┌────────────────────┐
         │   E2E Tests        │  ← Playwright (critical paths)
         │   (10%)            │
         └─────────┬──────────┘
                   │
         ┌─────────┴──────────┐
         │  Integration Tests │  ← Testing Library (patterns)
         │  (30%)             │
         └─────────┬──────────┘
                   │
         ┌─────────┴──────────┐
         │   Unit Tests       │  ← Vitest (components, hooks)
         │   (60%)            │
         └────────────────────┘
```

### Test Utilities

```typescript
// Custom render with providers
import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider } from '../branding/ThemeProvider';

function render(ui: React.ReactElement, options: RenderOptions = {}) {
  const { venture = 'mcv', theme = 'light', ...renderOptions } = options;
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider defaultVenture={venture} defaultTheme={theme}>
        {children}
      </ThemeProvider>
    );
  }
  
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { render };
```

---

## Build Configuration

### Package Structure

```
@mcv/ui/
├── src/
│   ├── components/
│   │   ├── primitives/
│   │   ├── forms/
│   │   ├── data/
│   │   ├── navigation/
│   │   ├── feedback/
│   │   ├── overlays/
│   │   └── specialized/
│   ├── branding/
│   │   ├── tokens.ts
│   │   ├── themes/
│   │   └── ThemeProvider.tsx
│   ├── patterns/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   └── ...
│   ├── hooks/
│   └── utils/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

### Build Output

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        primitives: 'src/components/primitives/index.ts',
        forms: 'src/components/forms/index.ts',
        data: 'src/components/data/index.ts',
        patterns: 'src/patterns/index.ts',
        branding: 'src/branding/index.ts',
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'next'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
```

---

## Related Documentation

- [01-PACKAGE-SPEC.md](./01-PACKAGE-SPEC.md) — Package overview
- [03-API-REFERENCE.md](./03-API-REFERENCE.md) — Component API docs
- [04-IMPLEMENTATION-PLAN.md](./04-IMPLEMENTATION-PLAN.md) — Build roadmap
- [components/MODULE.md](./components/MODULE.md) — Component catalog
- [branding/MODULE.md](./branding/MODULE.md) — Theming system
- [patterns/MODULE.md](./patterns/MODULE.md) — UI patterns

---

*@mcv/ui — Technical Architecture v1.0*
