# @mcv/ui — API Reference
## Component Library Complete API Documentation

**Package:** `@mcv/ui`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Core Components API

### Button

The primary interactive element for user actions.

```typescript
interface ButtonProps {
  // Variants
  variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  
  // State
  isDisabled?: boolean;
  isLoading?: boolean;
  
  // Content
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  spinner?: React.ReactNode;
  spinnerPlacement?: 'start' | 'end';
  
  // Behavior
  disableRipple?: boolean;
  disableAnimation?: boolean;
  fullWidth?: boolean;
  isIconOnly?: boolean;
  
  // Composition
  asChild?: boolean;
  
  // Events
  onPress?: (e: PressEvent) => void;
  onPressStart?: (e: PressEvent) => void;
  onPressEnd?: (e: PressEvent) => void;
  onPressUp?: (e: PressEvent) => void;
  onHoverStart?: (e: HoverEvent) => void;
  onHoverEnd?: (e: HoverEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  
  // HTML
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  formAction?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-controls'?: string;
  'aria-pressed'?: boolean | 'mixed';
  
  // Styling
  className?: string;
  classNames?: {
    base?: string;
    spinner?: string;
    content?: string;
  };
  style?: React.CSSProperties;
  
  // Children
  children?: React.ReactNode;
}
```

**Usage Examples:**

```tsx
// Basic
<Button>Click me</Button>

// With variants
<Button variant="outline" color="primary" size="lg">
  Large Outline Button
</Button>

// Loading state
<Button isLoading loadingText="Submitting...">
  Submit
</Button>

// With icons
<Button startContent={<PlusIcon />}>
  Add Item
</Button>

// Icon only
<Button isIconOnly aria-label="Settings">
  <SettingsIcon />
</Button>

// As child (composition)
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>

// Full width
<Button fullWidth color="success">
  Complete Purchase
</Button>
```

---

### Input

Text input field with validation support.

```typescript
interface InputProps {
  // Type
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  
  // Variants
  variant?: 'flat' | 'bordered' | 'underlined' | 'faded';
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  
  // Content
  label?: React.ReactNode;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode | ((validation: ValidationResult) => React.ReactNode);
  placeholder?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  
  // State
  value?: string;
  defaultValue?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  isClearable?: boolean;
  
  // Behavior
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  
  // Visibility (for password)
  isPasswordVisible?: boolean;
  onVisibilityChange?: (isVisible: boolean) => void;
  
  // Events
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  
  // Validation
  validate?: (value: string) => ValidationResult | true | null | undefined;
  validationBehavior?: 'native' | 'aria';
  
  // Styling
  className?: string;
  classNames?: {
    base?: string;
    label?: string;
    input?: string;
    inputWrapper?: string;
    innerWrapper?: string;
    description?: string;
    errorMessage?: string;
    clearButton?: string;
  };
}
```

**Usage Examples:**

```tsx
// Basic
<Input label="Email" placeholder="Enter your email" />

// With validation
<Input
  type="email"
  label="Email"
  isRequired
  validate={(value) => {
    if (!value.includes('@')) {
      return { isInvalid: true, errorMessage: 'Invalid email' };
    }
  }}
/>

// Password with visibility toggle
<Input
  type={isVisible ? 'text' : 'password'}
  label="Password"
  endContent={
    <button onClick={() => setIsVisible(!isVisible)}>
      {isVisible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  }
/>

// Clearable
<Input
  isClearable
  label="Search"
  placeholder="Search..."
  startContent={<SearchIcon />}
  onClear={() => console.log('cleared')}
/>

// With description and error
<Input
  label="Username"
  description="Choose a unique username"
  isInvalid
  errorMessage="Username is already taken"
/>
```

---

### Select

Dropdown selection component.

```typescript
interface SelectProps<T extends object> {
  // Data
  items?: Iterable<T>;
  children?: React.ReactNode | ((item: T) => React.ReactNode);
  
  // Selection
  selectedKeys?: 'all' | Iterable<Key>;
  defaultSelectedKeys?: 'all' | Iterable<Key>;
  disabledKeys?: Iterable<Key>;
  selectionMode?: 'none' | 'single' | 'multiple';
  
  // Variants
  variant?: 'flat' | 'bordered' | 'underlined' | 'faded';
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  
  // Content
  label?: React.ReactNode;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
  placeholder?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  selectorIcon?: React.ReactNode;
  
  // State
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  isLoading?: boolean;
  
  // Behavior
  isVirtualized?: boolean;
  shouldCloseOnBlur?: boolean;
  
  // Popover
  popoverProps?: PopoverProps;
  listboxProps?: ListboxProps;
  scrollShadowProps?: ScrollShadowProps;
  
  // Events
  onSelectionChange?: (keys: 'all' | Set<Key>) => void;
  onOpenChange?: (isOpen: boolean) => void;
  
  // Rendering
  renderValue?: (items: SelectedItems<T>) => React.ReactNode;
  
  // Styling
  className?: string;
  classNames?: {
    base?: string;
    label?: string;
    trigger?: string;
    value?: string;
    listbox?: string;
    listboxWrapper?: string;
    selectorIcon?: string;
    popoverContent?: string;
  };
}

interface SelectItemProps {
  key: Key;
  textValue?: string;
  description?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  isDisabled?: boolean;
  children?: React.ReactNode;
}
```

**Usage Examples:**

```tsx
// Basic
<Select label="Country">
  <SelectItem key="us">United States</SelectItem>
  <SelectItem key="ca">Canada</SelectItem>
  <SelectItem key="uk">United Kingdom</SelectItem>
</Select>

// With dynamic items
<Select
  label="Select a user"
  items={users}
>
  {(user) => (
    <SelectItem
      key={user.id}
      textValue={user.name}
      startContent={<Avatar src={user.avatar} size="sm" />}
    >
      <div className="flex flex-col">
        <span>{user.name}</span>
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </div>
    </SelectItem>
  )}
</Select>

// Multiple selection
<Select
  label="Tags"
  selectionMode="multiple"
  selectedKeys={selectedTags}
  onSelectionChange={setSelectedTags}
>
  {tags.map((tag) => (
    <SelectItem key={tag.id}>{tag.name}</SelectItem>
  ))}
</Select>

// With sections
<Select label="Status">
  <SelectSection title="Active">
    <SelectItem key="active">Active</SelectItem>
    <SelectItem key="pending">Pending</SelectItem>
  </SelectSection>
  <SelectSection title="Inactive">
    <SelectItem key="paused">Paused</SelectItem>
    <SelectItem key="cancelled">Cancelled</SelectItem>
  </SelectSection>
</Select>
```

---

### Modal

Dialog/modal overlay component.

```typescript
interface ModalProps {
  // State
  isOpen: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
  
  // Variants
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  placement?: 'auto' | 'center' | 'top' | 'top-center' | 'bottom' | 'bottom-center';
  backdrop?: 'transparent' | 'opaque' | 'blur';
  radius?: 'none' | 'sm' | 'md' | 'lg';
  scrollBehavior?: 'inside' | 'outside' | 'normal';
  
  // Behavior
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  hideCloseButton?: boolean;
  closeButton?: React.ReactNode;
  
  // Animation
  motionProps?: MotionProps;
  
  // Events
  onClose?: () => void;
  
  // Accessibility
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  
  // Styling
  className?: string;
  classNames?: {
    wrapper?: string;
    base?: string;
    backdrop?: string;
    header?: string;
    body?: string;
    footer?: string;
    closeButton?: string;
  };
  
  // Children
  children?: React.ReactNode;
}

interface ModalContentProps {
  children: ((onClose: () => void) => React.ReactNode) | React.ReactNode;
}

interface ModalHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children?: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children?: React.ReactNode;
  className?: string;
}
```

**Usage Examples:**

```tsx
// Basic modal
const { isOpen, onOpen, onOpenChange } = useDisclosure();

<Button onPress={onOpen}>Open Modal</Button>
<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader>Modal Title</ModalHeader>
        <ModalBody>
          <p>Modal content goes here.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={onClose}>Confirm</Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>

// With form
<Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
  <ModalContent>
    {(onClose) => (
      <form onSubmit={handleSubmit}>
        <ModalHeader>Create Project</ModalHeader>
        <ModalBody>
          <Input label="Project Name" isRequired />
          <Textarea label="Description" />
          <Select label="Team">
            {teams.map(team => (
              <SelectItem key={team.id}>{team.name}</SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onPress={onClose}>Cancel</Button>
          <Button color="primary" type="submit">Create</Button>
        </ModalFooter>
      </form>
    )}
  </ModalContent>
</Modal>

// Fullscreen modal
<Modal isOpen={isOpen} size="full" scrollBehavior="inside">
  <ModalContent>
    <ModalHeader>Document Editor</ModalHeader>
    <ModalBody>
      <RichTextEditor />
    </ModalBody>
  </ModalContent>
</Modal>
```

---

### DataTable

Advanced data table with sorting, filtering, and pagination.

```typescript
interface DataTableProps<T> {
  // Data
  data: T[];
  columns: ColumnDef<T>[];
  
  // Selection
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Set<Key>;
  defaultSelectedKeys?: Set<Key>;
  onSelectionChange?: (keys: Set<Key>) => void;
  
  // Sorting
  sortDescriptor?: SortDescriptor;
  defaultSortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  
  // Filtering
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  columnFilters?: ColumnFilter[];
  onColumnFiltersChange?: (filters: ColumnFilter[]) => void;
  
  // Pagination
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  
  // Row behavior
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T, event: React.MouseEvent) => void;
  getRowId?: (row: T) => Key;
  isRowDisabled?: (row: T) => boolean;
  
  // Features
  isStriped?: boolean;
  isCompact?: boolean;
  isHeaderSticky?: boolean;
  showPagination?: boolean;
  showPageSizeSelector?: boolean;
  showSelectionCheckbox?: boolean;
  
  // Loading
  isLoading?: boolean;
  loadingContent?: React.ReactNode;
  
  // Empty state
  emptyContent?: React.ReactNode;
  
  // Styling
  className?: string;
  classNames?: {
    base?: string;
    wrapper?: string;
    table?: string;
    thead?: string;
    tbody?: string;
    tr?: string;
    th?: string;
    td?: string;
    emptyWrapper?: string;
    loadingWrapper?: string;
  };
}

interface ColumnDef<T> {
  key: string;
  header: React.ReactNode | ((info: HeaderContext) => React.ReactNode);
  cell?: (info: CellContext<T>) => React.ReactNode;
  footer?: React.ReactNode | ((info: HeaderContext) => React.ReactNode);
  
  // Features
  isSortable?: boolean;
  isFilterable?: boolean;
  isResizable?: boolean;
  isHideable?: boolean;
  isPinned?: 'left' | 'right' | false;
  
  // Sizing
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  
  // Alignment
  align?: 'start' | 'center' | 'end';
  
  // Sorting
  sortingFn?: SortingFn<T>;
  invertSorting?: boolean;
  
  // Filtering
  filterFn?: FilterFn<T>;
  
  // Aggregation
  aggregationFn?: AggregationFn<T>;
  aggregatedCell?: (info: CellContext<T>) => React.ReactNode;
}

interface SortDescriptor {
  column: string;
  direction: 'ascending' | 'descending';
}

interface ColumnFilter {
  id: string;
  value: unknown;
}
```

**Usage Examples:**

```tsx
// Basic table
const columns: ColumnDef<User>[] = [
  {
    key: 'name',
    header: 'Name',
    cell: (info) => (
      <div className="flex items-center gap-2">
        <Avatar src={info.row.avatar} size="sm" />
        <span>{info.row.name}</span>
      </div>
    ),
    isSortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    isSortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (info) => (
      <Badge color={info.row.status === 'active' ? 'success' : 'default'}>
        {info.row.status}
      </Badge>
    ),
    isFilterable: true,
  },
  {
    key: 'actions',
    header: '',
    cell: (info) => (
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly variant="ghost" size="sm">
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem key="edit">Edit</DropdownItem>
          <DropdownItem key="delete" color="danger">Delete</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    ),
    width: 50,
  },
];

<DataTable
  data={users}
  columns={columns}
  selectionMode="multiple"
  isHeaderSticky
  showPagination
  page={page}
  pageSize={10}
  total={totalUsers}
  onPageChange={setPage}
  onRowClick={(row) => router.push(`/users/${row.id}`)}
/>
```

---

## Theme API

### useTheme Hook

```typescript
interface UseThemeReturn {
  // Current theme
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  
  // Theme setter
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Venture
  venture: VentureTheme;
  setVenture: (ventureId: string) => void;
  
  // Tokens
  tokens: DesignTokens;
}

// Usage
const { theme, setTheme, resolvedTheme, venture } = useTheme();
```

### ThemeProvider Props

```typescript
interface ThemeProviderProps {
  // Children
  children: React.ReactNode;
  
  // Defaults
  defaultTheme?: 'light' | 'dark' | 'system';
  defaultVenture?: string;
  
  // Storage
  storageKey?: string;
  
  // Attributes
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  
  // Force theme
  forcedTheme?: string;
  
  // Theme values
  themes?: string[];
  value?: Record<string, string>;
}
```

---

## Hooks API

### useDisclosure

Control modal/popover open state.

```typescript
interface UseDisclosureProps {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onChange?: (isOpen: boolean) => void;
}

interface UseDisclosureReturn {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  getButtonProps: () => ButtonProps;
  getDisclosureProps: () => DisclosureProps;
}

// Usage
const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
```

### useMediaQuery

Responsive breakpoint detection.

```typescript
function useMediaQuery(query: string): boolean;

// Usage
const isMobile = useMediaQuery('(max-width: 640px)');
const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
const isDesktop = useMediaQuery('(min-width: 1025px)');
```

### useBreakpoint

Named breakpoint detection.

```typescript
interface UseBreakpointReturn {
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  isAboveSm: boolean;
  isAboveMd: boolean;
  isAboveLg: boolean;
  isAboveXl: boolean;
  isBelowSm: boolean;
  isBelowMd: boolean;
  isBelowLg: boolean;
  isBelowXl: boolean;
}

// Usage
const { isMobile, isAboveMd } = useBreakpoint();
```

### useDebounce

Debounce a value.

```typescript
function useDebounce<T>(value: T, delay?: number): T;

// Usage
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### useClickOutside

Detect clicks outside an element.

```typescript
function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  enabled?: boolean
): React.RefObject<T>;

// Usage
const ref = useClickOutside<HTMLDivElement>(() => {
  setIsOpen(false);
});

return <div ref={ref}>...</div>;
```

### useLocalStorage

Persist state to localStorage.

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void];

// Usage
const [savedItems, setSavedItems, clearSavedItems] = useLocalStorage<string[]>(
  'saved-items',
  []
);
```

### useCopyToClipboard

Copy text to clipboard.

```typescript
interface UseCopyToClipboardReturn {
  copiedText: string | null;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

// Usage
const { copiedText, copy } = useCopyToClipboard();

<Button 
  onPress={() => copy('Hello, World!')}
  startContent={copiedText ? <CheckIcon /> : <CopyIcon />}
>
  {copiedText ? 'Copied!' : 'Copy'}
</Button>
```

---

## Utility Functions

### cn (className merger)

Merge class names with Tailwind conflict resolution.

```typescript
import { cn } from '@mcv/ui';

// Basic usage
cn('px-4 py-2', 'bg-primary'); // => 'px-4 py-2 bg-primary'

// Conditional classes
cn('base-class', isActive && 'active-class'); // => 'base-class active-class' or 'base-class'

// Override conflicting classes
cn('px-4', 'px-8'); // => 'px-8'

// With arrays
cn(['px-4', 'py-2'], 'bg-primary'); // => 'px-4 py-2 bg-primary'

// With objects
cn({
  'bg-primary': isPrimary,
  'bg-secondary': !isPrimary,
}); // => 'bg-primary' or 'bg-secondary'
```

### tv (tailwind-variants)

Create component variants.

```typescript
import { tv } from '@mcv/ui';

const button = tv({
  base: 'inline-flex items-center justify-center rounded-md font-medium',
  variants: {
    variant: {
      solid: 'bg-primary text-white',
      outline: 'border border-primary text-primary',
      ghost: 'text-primary hover:bg-primary/10',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
});

// Usage
const className = button({ variant: 'outline', size: 'lg' });
```

### formatDate

Format dates consistently.

```typescript
import { formatDate } from '@mcv/ui';

formatDate(new Date()); // => 'Jan 15, 2026'
formatDate(new Date(), 'long'); // => 'January 15, 2026'
formatDate(new Date(), 'relative'); // => '2 days ago'
formatDate(new Date(), 'time'); // => '3:45 PM'
formatDate(new Date(), 'datetime'); // => 'Jan 15, 2026, 3:45 PM'
```

### formatNumber

Format numbers with locale.

```typescript
import { formatNumber, formatCurrency, formatPercent } from '@mcv/ui';

formatNumber(1234567); // => '1,234,567'
formatNumber(1234567, { notation: 'compact' }); // => '1.2M'
formatCurrency(1234.56, 'USD'); // => '$1,234.56'
formatCurrency(1234.56, 'EUR'); // => '€1,234.56'
formatPercent(0.156); // => '15.6%'
```

---

## TypeScript Types

### Core Types

```typescript
// Size variants
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Color variants
type Color = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

// Radius variants
type Radius = 'none' | 'sm' | 'md' | 'lg' | 'full';

// Placement
type Placement = 
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

// Selection
type Key = string | number;
type Selection = 'all' | Set<Key>;

// Sort
type SortDirection = 'ascending' | 'descending';
interface SortDescriptor {
  column: Key;
  direction: SortDirection;
}
```

### Component Slot Types

```typescript
// Slot classNames pattern
interface ButtonClassNames {
  base?: string;
  content?: string;
  spinner?: string;
}

// Using with components
<Button
  classNames={{
    base: 'bg-gradient-to-r from-pink-500 to-violet-500',
    content: 'text-white font-bold',
  }}
>
  Gradient Button
</Button>
```

---

## Related Documentation

- [01-PACKAGE-SPEC.md](./01-PACKAGE-SPEC.md) — Package overview
- [02-TECHNICAL-ARCHITECTURE.md](./02-TECHNICAL-ARCHITECTURE.md) — System design
- [04-IMPLEMENTATION-PLAN.md](./04-IMPLEMENTATION-PLAN.md) — Build roadmap
- [Storybook](https://storybook.mcv.dev) — Interactive examples

---

*@mcv/ui — API Reference v1.0*
