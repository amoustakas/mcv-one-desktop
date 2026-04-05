# @mcv/ui — Package Specification
## Tier 6: Presentation Layer

**Package:** `@mcv/ui`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/ui` is the comprehensive design system and component library for the MCV.ONE ecosystem. Built on HeroUI (formerly NextUI), it provides 508 components across 71 categories, unified theming, venture-specific branding, and accessibility-first patterns. Every MCV application uses this package for consistent user experiences across all 9 ventures.

**This is the face of MCV.ONE — every pixel, interaction, and animation flows from this package.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MCV APPLICATIONS                                   │
│                                                                              │
│  super-admin  │  venture-admin  │  betedge.app  │  serpspace.com  │  ...   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ uses
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/ui                                         │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         COMPONENTS (508)                               │  │
│  │  primitives │ forms │ data │ navigation │ feedback │ layout │ etc.   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          BRANDING                                      │  │
│  │  tokens │ themes │ venture-themes │ dynamic-branding │ assets         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          PATTERNS                                      │  │
│  │  auth │ commerce │ dashboards │ forms │ data │ settings │ onboarding │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL DEPENDENCIES                               │
│                                                                              │
│  @heroui/react  │  tailwindcss  │  framer-motion  │  lucide-icons          │
│  react-aria     │  zustand       │  clsx           │  tailwind-variants     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Component Count |
|--------|---------|-----------------|
| **components** | Complete component library | 508 components |
| **branding** | Theming, tokens, venture customization | — |
| **patterns** | Pre-built UI patterns for common flows | 85 patterns |

---

## Module: components

### Purpose

The complete component library providing every UI building block needed to build MCV applications. Components are organized into 71 categories spanning primitives, forms, data display, navigation, feedback, layout, overlays, and specialized venture-specific components.

### Component Categories (71)

#### Foundation (8 categories)
| Category | Components | Description |
|----------|------------|-------------|
| **primitives** | 12 | Button, Link, Icon, Avatar, Badge, Chip, Tag, Dot, Skeleton, Spinner, Progress, Divider |
| **typography** | 8 | Heading, Text, Label, Caption, Code, Blockquote, List, Highlight |
| **layout** | 15 | Container, Grid, Stack, Box, Flex, Center, Spacer, AspectRatio, Columns, Masonry, Split, Sticky, Float, Absolute, Fixed |
| **surfaces** | 10 | Card, Panel, Paper, Tile, Well, Sheet, Glass, Gradient, Mesh, Noise |
| **media** | 8 | Image, Video, Audio, Iframe, Avatar, AvatarGroup, MediaObject, AspectMedia |
| **icons** | 6 | Icon, IconButton, IconBadge, AnimatedIcon, IconStack, BrandIcon |
| **animations** | 7 | FadeIn, SlideIn, ScaleIn, Rotate, Pulse, Bounce, Stagger |
| **accessibility** | 5 | VisuallyHidden, FocusTrap, SkipLink, LiveRegion, A11yAnnouncer |

#### Forms (12 categories)
| Category | Components | Description |
|----------|------------|-------------|
| **inputs** | 18 | Input, Textarea, NumberInput, PasswordInput, SearchInput, PhoneInput, EmailInput, UrlInput, ColorInput, DateInput, TimeInput, DateTimeInput, CurrencyInput, PercentInput, TagInput, MentionInput, AutocompleteInput, OTPInput |
| **selects** | 8 | Select, MultiSelect, Combobox, AsyncSelect, Creatable, GroupedSelect, TreeSelect, VirtualizedSelect |
| **checkboxes** | 5 | Checkbox, CheckboxGroup, Switch, ToggleGroup, Tristate |
| **radios** | 4 | Radio, RadioGroup, RadioCards, SegmentedControl |
| **sliders** | 4 | Slider, RangeSlider, StepSlider, CircularSlider |
| **pickers** | 8 | DatePicker, DateRangePicker, TimePicker, DateTimePicker, ColorPicker, FilePicker, EmojiPicker, IconPicker |
| **editors** | 6 | RichTextEditor, MarkdownEditor, CodeEditor, JSONEditor, SQLEditor, DiffEditor |
| **uploads** | 5 | FileUpload, ImageUpload, DragDrop, MultiUpload, AvatarUpload |
| **signatures** | 3 | SignaturePad, Initials, HandwrittenInput |
| **validation** | 5 | FormField, FormError, FormHint, FormLabel, RequiredIndicator |
| **form-layouts** | 6 | Form, FormSection, FormRow, FormGrid, InlineForm, StepForm |
| **buttons** | 8 | Button, IconButton, ButtonGroup, SplitButton, LoadingButton, ConfirmButton, CopyButton, ShareButton |

#### Data Display (15 categories)
| Category | Components | Description |
|----------|------------|-------------|
| **tables** | 12 | Table, DataTable, VirtualTable, TreeTable, PivotTable, ComparisonTable, EditableTable, SortableTable, ResizableTable, StickyTable, GroupedTable, AggregateTable |
| **lists** | 8 | List, VirtualList, GroupedList, SortableList, SelectableList, CheckboxList, RadioList, ActionList |
| **grids** | 6 | DataGrid, CardGrid, MasonryGrid, VirtualGrid, ImageGrid, ProductGrid |
| **trees** | 5 | Tree, TreeView, FileTree, OrgChart, MindMap |
| **charts** | 18 | LineChart, AreaChart, BarChart, PieChart, DonutChart, RadarChart, ScatterChart, BubbleChart, Heatmap, Treemap, Sankey, Funnel, Gauge, Sparkline, MiniChart, ComposedChart, ComboChart, CandlestickChart |
| **metrics** | 8 | Stat, StatCard, StatGroup, Trend, Delta, Comparison, KPI, ScoreCard |
| **badges** | 6 | Badge, StatusBadge, CountBadge, DotBadge, RibbonBadge, VerifiedBadge |
| **tags** | 5 | Tag, TagGroup, RemovableTag, EditableTag, ColorTag |
| **timelines** | 5 | Timeline, VerticalTimeline, HorizontalTimeline, ActivityFeed, Changelog |
| **avatars** | 6 | Avatar, AvatarGroup, UserAvatar, OrgAvatar, InitialsAvatar, StatusAvatar |
| **cards** | 12 | Card, ProfileCard, ProductCard, PricingCard, StatCard, ArticleCard, EventCard, TeamCard, TestimonialCard, FeatureCard, IntegrationCard, ActionCard |
| **calendars** | 6 | Calendar, EventCalendar, DateCalendar, WeekView, DayView, Scheduler |
| **maps** | 4 | Map, HeatmapMap, ClusterMap, RouteMap |
| **code** | 5 | CodeBlock, SyntaxHighlight, DiffView, TerminalOutput, JSONView |
| **empty-states** | 4 | EmptyState, NoResults, ErrorState, LoadingState |

#### Navigation (8 categories)
| Category | Components | Description |
|----------|------------|-------------|
| **navbar** | 6 | Navbar, MobileNav, StickyNav, TransparentNav, BrandBar, AppBar |
| **sidebar** | 6 | Sidebar, CollapsibleSidebar, DockSidebar, FloatingSidebar, MiniSidebar, DoubleSidebar |
| **tabs** | 6 | Tabs, VerticalTabs, PillTabs, UnderlineTabs, IconTabs, ScrollableTabs |
| **breadcrumbs** | 4 | Breadcrumb, CollapsibleBreadcrumb, BreadcrumbDropdown, StepBreadcrumb |
| **pagination** | 5 | Pagination, CursorPagination, LoadMore, InfiniteScroll, PageIndicator |
| **menus** | 8 | Menu, DropdownMenu, ContextMenu, CommandMenu, ActionMenu, IconMenu, MegaMenu, AccountMenu |
| **links** | 5 | Link, NavLink, ExternalLink, AnchorLink, BackLink |
| **stepper** | 4 | Stepper, VerticalStepper, DotStepper, ProgressStepper |

#### Feedback (7 categories)
| Category | Components | Description |
|----------|------------|-------------|
| **alerts** | 6 | Alert, AlertDialog, Banner, Callout, Notice, SystemAlert |
| **toasts** | 4 | Toast, ToastStack, Notification, Snackbar |
| **modals** | 8 | Modal, Drawer, Sheet, Dialog, ConfirmDialog, AlertDialog, CommandDialog, FullscreenModal |
| **popovers** | 6 | Popover, Tooltip, HoverCard, InfoTip, ContextualHelp, Annotation |
| **progress** | 6 | Progress, ProgressBar, CircularProgress, StepProgress, MultiProgress, UploadProgress |
| **loading** | 6 | Spinner, Skeleton, LoadingDots, LoadingBar, LoadingOverlay, Shimmer |
| **errors** | 5 | ErrorBoundary, ErrorMessage, ErrorPage, CrashReport, RetryButton |

#### Overlays (5 categories)
| Category | Components | Description |
|----------|------------|-------------|
| **modals** | 8 | Modal, CenteredModal, SlideModal, FullscreenModal, StackedModal, NestedModal, ModalHeader, ModalFooter |
| **drawers** | 6 | Drawer, SlideDrawer, StackDrawer, ResponsiveDrawer, DrawerHeader, DrawerFooter |
| **dialogs** | 6 | Dialog, AlertDialog, ConfirmDialog, PromptDialog, FormDialog, WizardDialog |
| **sheets** | 5 | Sheet, BottomSheet, ActionSheet, MenuSheet, FilterSheet |
| **lightbox** | 4 | Lightbox, ImageLightbox, GalleryLightbox, VideoLightbox |

#### Specialized (16 categories)
| Category | Components | Description |
|----------|------------|-------------|
| **auth** | 12 | LoginForm, RegisterForm, ForgotPassword, ResetPassword, OTPVerify, PasskeyLogin, SocialLogin, MagicLink, SessionExpired, LogoutButton, AuthGuard, ProtectedRoute |
| **commerce** | 18 | ProductCard, ProductGrid, ProductDetail, Cart, CartItem, CartSummary, Checkout, CheckoutForm, PaymentForm, ShippingForm, OrderSummary, OrderHistory, Wishlist, Compare, QuickView, PriceTag, DiscountBadge, StockIndicator |
| **finance** | 10 | TransactionList, BalanceCard, AccountCard, PaymentMethod, InvoiceTable, ExpenseChart, BudgetProgress, CashflowChart, TaxSummary, FinancialReport |
| **gaming** | 12 | Leaderboard, AchievementCard, QuestCard, PointsDisplay, LevelProgress, RewardCard, StreakIndicator, XPBar, BadgeShowcase, TierIndicator, DailyBonus, SpinWheel |
| **analytics** | 10 | DashboardCard, MetricTile, ChartCard, FunnelVisualization, CohortTable, SegmentCard, FilterPanel, DateRangeFilter, ExportButton, ReportBuilder |
| **social** | 10 | ProfileCard, PostCard, CommentThread, ReactionButtons, ShareButtons, FollowButton, ActivityFeed, NotificationList, MentionInput, SocialProof |
| **messaging** | 8 | ChatBubble, MessageList, ConversationList, TypingIndicator, ReadReceipts, MessageInput, EmojiPicker, AttachmentPreview |
| **scheduling** | 8 | CalendarPicker, TimeSlotPicker, AvailabilityGrid, BookingForm, AppointmentCard, ScheduleView, RecurrenceInput, TimezoneSelect |
| **files** | 8 | FileCard, FileList, FileTree, FilePreview, FolderBreadcrumb, StorageUsage, UploadQueue, VersionHistory |
| **settings** | 8 | SettingsLayout, SettingsSection, ToggleSetting, SelectSetting, ProfileSettings, NotificationSettings, SecuritySettings, BillingSettings |
| **onboarding** | 8 | WelcomeScreen, OnboardingWizard, FeatureTour, Spotlight, CoachMark, ProgressChecklist, SetupCard, GettingStarted |
| **support** | 8 | HelpCenter, ArticleCard, SearchHelp, ContactForm, TicketList, TicketDetail, ChatWidget, FeedbackForm |
| **admin** | 15 | AdminLayout, AdminSidebar, AdminHeader, UserTable, RoleManager, PermissionMatrix, AuditLog, SystemStatus, ConfigPanel, FeatureFlags, APIKeys, WebhookManager, IntegrationCard, UsageMetrics, BillingDashboard |
| **web3** | 12 | WalletButton, ConnectWallet, WalletModal, TokenBalance, NFTCard, NFTGallery, TransactionStatus, GasFeeEstimate, ChainSelector, AddressDisplay, TokenTransfer, StakingCard |
| **ai** | 8 | AIChat, PromptInput, StreamingText, SuggestionChips, ConfidenceIndicator, SourceCitation, FeedbackButtons, AIAvatar |
| **content** | 12 | ArticleLayout, BlogPost, ContentCard, TableOfContents, ReadingProgress, AuthorCard, RelatedContent, ShareWidget, CommentSection, LikeButton, BookmarkButton, PrintButton |

### Component API Standard

Every component follows this API pattern:

```typescript
// Component props interface
interface ButtonProps {
  // Visual variants
  variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  
  // State
  isDisabled?: boolean;
  isLoading?: boolean;
  isActive?: boolean;
  
  // Icons
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  
  // Interaction
  onClick?: (e: React.MouseEvent) => void;
  onHover?: (e: React.MouseEvent) => void;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Children
  children?: React.ReactNode;
}

// Usage
<Button 
  variant="solid" 
  color="primary" 
  size="md"
  startIcon={<PlusIcon />}
  isLoading={submitting}
>
  Create Project
</Button>
```

### Compound Components Pattern

Complex components use the compound pattern:

```typescript
<DataTable data={users}>
  <DataTable.Toolbar>
    <DataTable.Search placeholder="Search users..." />
    <DataTable.Filters>
      <DataTable.Filter field="role" options={roles} />
      <DataTable.Filter field="status" options={statuses} />
    </DataTable.Filters>
    <DataTable.Actions>
      <Button>Export</Button>
      <Button>Add User</Button>
    </DataTable.Actions>
  </DataTable.Toolbar>
  
  <DataTable.Header>
    <DataTable.Column field="name" sortable />
    <DataTable.Column field="email" sortable />
    <DataTable.Column field="role" filterable />
    <DataTable.Column field="status" />
    <DataTable.Column field="actions" />
  </DataTable.Header>
  
  <DataTable.Body>
    {(row) => (
      <DataTable.Row key={row.id}>
        <DataTable.Cell>
          <UserAvatar user={row} />
        </DataTable.Cell>
        <DataTable.Cell>{row.email}</DataTable.Cell>
        <DataTable.Cell>
          <Badge>{row.role}</Badge>
        </DataTable.Cell>
        <DataTable.Cell>
          <StatusBadge status={row.status} />
        </DataTable.Cell>
        <DataTable.Cell>
          <ActionMenu items={rowActions} />
        </DataTable.Cell>
      </DataTable.Row>
    )}
  </DataTable.Body>
  
  <DataTable.Footer>
    <DataTable.Pagination />
    <DataTable.PageSize options={[10, 25, 50, 100]} />
  </DataTable.Footer>
</DataTable>
```

---

## Module: branding

### Purpose

Provides the design token system, theming infrastructure, venture-specific brand customization, and asset management. Every MCV venture gets a consistent foundation with custom branding on top.

### Design Tokens

```typescript
// @mcv/ui/branding/tokens.ts
export const tokens = {
  colors: {
    // Brand colors
    primary: {
      50: 'hsl(var(--primary-50))',
      100: 'hsl(var(--primary-100))',
      200: 'hsl(var(--primary-200))',
      300: 'hsl(var(--primary-300))',
      400: 'hsl(var(--primary-400))',
      500: 'hsl(var(--primary-500))',  // Main brand color
      600: 'hsl(var(--primary-600))',
      700: 'hsl(var(--primary-700))',
      800: 'hsl(var(--primary-800))',
      900: 'hsl(var(--primary-900))',
      950: 'hsl(var(--primary-950))',
    },
    secondary: { /* ... */ },
    accent: { /* ... */ },
    
    // Semantic colors
    success: { /* green scale */ },
    warning: { /* amber scale */ },
    danger: { /* red scale */ },
    info: { /* blue scale */ },
    
    // Neutral colors
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    
    // Backgrounds
    background: {
      default: 'hsl(var(--background))',
      muted: 'hsl(var(--background-muted))',
      subtle: 'hsl(var(--background-subtle))',
      elevated: 'hsl(var(--background-elevated))',
    },
    
    // Foregrounds
    foreground: {
      default: 'hsl(var(--foreground))',
      muted: 'hsl(var(--foreground-muted))',
      subtle: 'hsl(var(--foreground-subtle))',
    },
    
    // Borders
    border: {
      default: 'hsl(var(--border))',
      muted: 'hsl(var(--border-muted))',
      focus: 'hsl(var(--border-focus))',
    },
  },
  
  typography: {
    fonts: {
      sans: 'var(--font-sans)',
      serif: 'var(--font-serif)',
      mono: 'var(--font-mono)',
      display: 'var(--font-display)',
    },
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
      '7xl': '4.5rem',   // 72px
    },
    fontWeights: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeights: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacings: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    32: '8rem',       // 128px
  },
  
  radii: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  transitions: {
    durations: {
      fastest: '50ms',
      faster: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '400ms',
      slowest: '500ms',
    },
    easings: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },
  
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
  
  zIndices: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
};
```

### Venture Themes

Each venture has a custom theme that extends the base:

```typescript
// @mcv/ui/branding/themes/betedge.ts
export const betedgeTheme: VentureTheme = {
  id: 'betedge',
  name: 'BetEdge AI',
  
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // BetEdge Green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    secondary: {
      // Gold/amber for premium tier
      500: '#f59e0b',
    },
    accent: {
      // Electric blue for highlights
      500: '#3b82f6',
    },
  },
  
  typography: {
    fonts: {
      sans: '"Inter", system-ui, sans-serif',
      display: '"Clash Display", "Inter", sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
  },
  
  components: {
    Button: {
      defaultProps: {
        radius: 'lg',
      },
    },
    Card: {
      defaultProps: {
        shadow: 'md',
        radius: 'xl',
      },
    },
  },
  
  assets: {
    logo: '/ventures/betedge/logo.svg',
    logomark: '/ventures/betedge/logomark.svg',
    favicon: '/ventures/betedge/favicon.ico',
    ogImage: '/ventures/betedge/og-image.png',
  },
};
```

### Theme Provider

```typescript
// @mcv/ui/branding/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { tokens } from './tokens';
import { ventureThemes } from './themes';

interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  venture: VentureTheme;
  tokens: typeof tokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  ventureId = 'mcv',
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(defaultTheme);
  const venture = ventureThemes[ventureId] ?? ventureThemes.mcv;
  
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply venture CSS variables
    applyVentureTokens(root, venture);
    
    // Handle theme class
    const effectiveTheme = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
  }, [theme, venture]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, venture, tokens }}>
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### Dynamic Branding

Runtime brand customization for white-label scenarios:

```typescript
// @mcv/ui/branding/dynamic.ts
import { z } from 'zod';

export const dynamicBrandSchema = z.object({
  // Identity
  name: z.string(),
  tagline: z.string().optional(),
  
  // Colors (hex or HSL)
  colors: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
  }),
  
  // Typography
  fonts: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
  }).optional(),
  
  // Assets (URLs)
  assets: z.object({
    logo: z.string().url(),
    logomark: z.string().url().optional(),
    favicon: z.string().url().optional(),
    ogImage: z.string().url().optional(),
  }),
  
  // Social
  social: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    discord: z.string().optional(),
  }).optional(),
});

export type DynamicBrand = z.infer<typeof dynamicBrandSchema>;

export function applyDynamicBrand(brand: DynamicBrand) {
  const root = document.documentElement;
  
  // Convert hex to HSL and apply
  if (brand.colors.primary) {
    const hsl = hexToHSL(brand.colors.primary);
    root.style.setProperty('--primary-500', hsl);
    // Generate full scale from primary
    generateColorScale('primary', brand.colors.primary).forEach((color, i) => {
      root.style.setProperty(`--primary-${i * 100 || 50}`, color);
    });
  }
  
  // Apply fonts if specified
  if (brand.fonts?.heading) {
    root.style.setProperty('--font-display', brand.fonts.heading);
  }
  if (brand.fonts?.body) {
    root.style.setProperty('--font-sans', brand.fonts.body);
  }
  
  // Update favicon
  if (brand.assets.favicon) {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) link.href = brand.assets.favicon;
  }
}
```

---

## Module: patterns

### Purpose

Pre-built UI patterns for common flows like authentication, onboarding, dashboards, settings, and more. These patterns combine multiple components into production-ready implementations.

### Available Patterns (85)

#### Authentication Patterns (12)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **LoginPage** | LoginForm, SocialLogin, Link | Complete login page with social options |
| **RegisterPage** | RegisterForm, PasswordStrength, Terms | Full registration with validation |
| **ForgotPasswordPage** | Input, Button, Alert | Password reset request |
| **ResetPasswordPage** | PasswordInput, PasswordStrength | Password reset form |
| **VerifyEmailPage** | OTPInput, ResendButton | Email verification flow |
| **VerifyPhonePage** | OTPInput, PhoneInput | Phone verification flow |
| **TwoFactorPage** | OTPInput, RecoveryCode | 2FA verification |
| **PasskeySetupPage** | PasskeyButton, Fingerprint | Passkey registration |
| **MagicLinkSent** | Icon, Text, Button | Magic link confirmation |
| **SessionExpired** | Modal, Button | Session timeout handler |
| **AccountLocked** | Alert, ContactSupport | Account lockout page |
| **AuthLayout** | Split, Logo, Form | Shared auth page layout |

#### Dashboard Patterns (10)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **DashboardLayout** | Sidebar, Header, Main | Full dashboard shell |
| **MetricsDashboard** | StatCards, Charts, Grid | KPI overview layout |
| **AnalyticsDashboard** | Charts, Filters, DateRange | Data visualization layout |
| **ActivityDashboard** | ActivityFeed, Timeline | User activity overview |
| **StatusDashboard** | StatusCards, SystemHealth | System monitoring |
| **SalesDashboard** | Funnel, Pipeline, Metrics | Sales performance |
| **FinanceDashboard** | Cashflow, Budget, Expenses | Financial overview |
| **TeamDashboard** | TeamGrid, Availability | Team management view |
| **ProjectDashboard** | Kanban, Timeline, Tasks | Project overview |
| **WelcomeDashboard** | OnboardingChecklist, QuickActions | New user dashboard |

#### Form Patterns (15)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **ProfileForm** | Avatar, Input, Select | User profile editing |
| **AddressForm** | Input, Select, Map | Address with autocomplete |
| **PaymentForm** | CardInput, Billing | Credit card input |
| **ContactForm** | Input, Textarea, Button | Contact us form |
| **SubscribeForm** | EmailInput, Button | Newsletter signup |
| **FeedbackForm** | Rating, Textarea, Tags | Feedback collection |
| **SurveyForm** | Questions, Progress | Multi-step survey |
| **ApplicationForm** | MultiStep, FileUpload | Job/grant application |
| **CheckoutForm** | Cart, Shipping, Payment | E-commerce checkout |
| **BookingForm** | Calendar, TimeSlots | Appointment booking |
| **SettingsForm** | Sections, Toggles, Inputs | Settings page layout |
| **FilterForm** | Filters, Reset, Apply | Data filtering panel |
| **SearchForm** | SearchInput, Suggestions | Search with autocomplete |
| **ImportForm** | FileUpload, Mapping, Preview | Data import wizard |
| **ExportForm** | FormatSelect, Filters, Button | Data export options |

#### Data Patterns (12)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **DataTablePage** | DataTable, Toolbar, Pagination | Full CRUD table page |
| **MasterDetailPage** | List, Detail, Split | Master-detail layout |
| **KanbanBoard** | Columns, Cards, DragDrop | Kanban project board |
| **TimelineView** | Timeline, Filters, Export | Event timeline display |
| **CalendarView** | Calendar, Events, Modal | Calendar with events |
| **GalleryView** | Grid, Lightbox, Filters | Image/asset gallery |
| **ListPage** | List, Filters, Actions | Filterable list page |
| **TreeView** | Tree, ContextMenu, Search | Hierarchical data |
| **ComparisonView** | Side-by-side, Diff | Compare items |
| **HistoryView** | Timeline, Diff, Restore | Version history |
| **SearchResults** | Results, Filters, Pagination | Search results page |
| **EmptySearchResults** | EmptyState, Suggestions | No results found |

#### Commerce Patterns (10)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **ProductListPage** | ProductGrid, Filters, Sort | Product listing |
| **ProductDetailPage** | Gallery, Info, Actions | Product details |
| **CartPage** | CartItems, Summary, Promo | Shopping cart |
| **CheckoutPage** | Steps, Forms, Summary | Multi-step checkout |
| **OrderConfirmation** | Summary, NextSteps | Order success |
| **OrderHistoryPage** | OrderList, Filters, Detail | Order history |
| **WishlistPage** | ProductGrid, Remove, Move | Saved items |
| **ComparePage** | ComparisonTable, Remove | Product comparison |
| **CategoryPage** | Breadcrumb, Grid, Sidebar | Category browse |
| **QuickView** | Modal, ProductInfo, AddCart | Quick product view |

#### Account Patterns (8)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **AccountSettingsPage** | Tabs, Forms, Save | Account settings |
| **ProfilePage** | Avatar, Details, Edit | Public profile |
| **SecuritySettingsPage** | Password, 2FA, Sessions | Security options |
| **NotificationSettingsPage** | Toggles, Channels | Notification preferences |
| **BillingPage** | Plans, PaymentMethods, History | Billing management |
| **TeamSettingsPage** | Members, Roles, Invites | Team management |
| **IntegrationsPage** | Connected, Available, Settings | Integration management |
| **APIKeysPage** | KeyList, Create, Revoke | API key management |

#### Onboarding Patterns (8)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **WelcomeWizard** | Steps, Progress, Forms | Initial setup wizard |
| **ProductTour** | Spotlight, Steps, Skip | Feature tour overlay |
| **FeatureAnnouncement** | Modal, Features, CTA | New feature modal |
| **OnboardingChecklist** | Checklist, Progress | Getting started tasks |
| **TipsCarousel** | Carousel, Tips, Dismiss | Tip slides |
| **ContextualHelp** | Tooltip, Link, Video | In-context help |
| **EmptyStateGuide** | Empty, Steps, Action | First-use guidance |
| **UpgradePrompt** | Modal, Features, Plans | Upgrade suggestion |

#### Error Patterns (5)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **NotFoundPage** | 404, Search, Links | 404 error page |
| **ServerErrorPage** | 500, Retry, Contact | 500 error page |
| **MaintenancePage** | Status, Countdown, Social | Maintenance mode |
| **OfflinePage** | Icon, Message, Retry | Offline state |
| **AccessDeniedPage** | 403, Request, Back | Permission denied |

#### Misc Patterns (5)
| Pattern | Components Used | Description |
|---------|-----------------|-------------|
| **PricingPage** | Plans, Features, Toggle | Pricing comparison |
| **LandingHero** | Headline, CTA, Media | Landing page hero |
| **TestimonialSection** | Cards, Carousel, Quotes | Customer testimonials |
| **FAQSection** | Accordion, Search, Contact | FAQ layout |
| **FooterSection** | Links, Social, Newsletter | Site footer |

### Pattern Usage

```typescript
// Import and use patterns
import { 
  LoginPage, 
  DashboardLayout, 
  DataTablePage,
  ProductDetailPage 
} from '@mcv/ui/patterns';

// Authentication
export default function Login() {
  return (
    <LoginPage
      logo={<BetEdgeLogo />}
      onLogin={handleLogin}
      onSocialLogin={handleSocial}
      providers={['google', 'apple', 'discord']}
      showRememberMe
      showForgotPassword
    />
  );
}

// Dashboard
export default function Dashboard() {
  return (
    <DashboardLayout
      sidebar={<AppSidebar />}
      header={<AppHeader />}
    >
      <MetricsDashboard metrics={metrics} />
    </DashboardLayout>
  );
}

// Data table
export default function Users() {
  return (
    <DataTablePage
      title="Users"
      description="Manage user accounts"
      data={users}
      columns={userColumns}
      actions={userActions}
      filters={userFilters}
      onRowClick={handleRowClick}
      onCreate={handleCreate}
    />
  );
}
```

---

## Dependencies

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@heroui/react` | ^2.x | Base component library |
| `tailwindcss` | ^3.4.x | Utility CSS framework |
| `tailwind-variants` | ^0.2.x | Variant management |
| `framer-motion` | ^11.x | Animations |
| `lucide-react` | ^0.x | Icon library |
| `react-aria` | ^3.x | Accessibility primitives |
| `@radix-ui/react-*` | ^1.x | Headless UI primitives |
| `cmdk` | ^1.x | Command palette |
| `react-hook-form` | ^7.x | Form management |
| `zustand` | ^4.x | State management |
| `date-fns` | ^3.x | Date formatting |
| `recharts` | ^2.x | Charts |
| `@tanstack/react-table` | ^8.x | Table primitives |
| `@tanstack/react-virtual` | ^3.x | Virtualization |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.x | React framework |
| `react-dom` | ^18.x | React DOM |
| `next` | ^15.x | Next.js framework (optional) |

---

## Package Exports

```typescript
// @mcv/ui/index.ts

// Components - organized by category
export * from './components/primitives';
export * from './components/forms';
export * from './components/data';
export * from './components/navigation';
export * from './components/feedback';
export * from './components/overlays';
export * from './components/specialized';

// Branding
export * from './branding/tokens';
export * from './branding/themes';
export * from './branding/ThemeProvider';
export * from './branding/dynamic';
export { useTheme } from './branding/ThemeProvider';

// Patterns
export * from './patterns/auth';
export * from './patterns/dashboard';
export * from './patterns/forms';
export * from './patterns/data';
export * from './patterns/commerce';
export * from './patterns/account';
export * from './patterns/onboarding';
export * from './patterns/errors';

// Hooks
export * from './hooks/useMediaQuery';
export * from './hooks/useBreakpoint';
export * from './hooks/useClickOutside';
export * from './hooks/useCopyToClipboard';
export * from './hooks/useDebounce';
export * from './hooks/useMounted';
export * from './hooks/useLocalStorage';

// Utils
export * from './utils/cn';
export * from './utils/slot';
export * from './utils/responsive';
```

---

## Testing

### Component Testing

```typescript
// @mcv/ui/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/primitives/Button';

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
  
  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
  
  it('is disabled when isDisabled is true', () => {
    render(<Button isDisabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Visual Regression Testing

```typescript
// @mcv/ui/__tests__/visual/Button.visual.test.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from '../components/primitives/Button';

test.describe('Button visual', () => {
  test('default variant', async ({ mount }) => {
    const component = await mount(<Button>Default</Button>);
    await expect(component).toHaveScreenshot('button-default.png');
  });
  
  test('all variants', async ({ mount }) => {
    const component = await mount(
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="solid">Solid</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    );
    await expect(component).toHaveScreenshot('button-variants.png');
  });
});
```

---

## Storybook

Components are documented in Storybook with:
- Interactive examples
- Props documentation
- Accessibility annotations
- Design tokens display
- Dark mode preview

Access at: `https://storybook.mcv.dev`

---

## Related Documentation

- [components Module Details](./components/MODULE.md)
- [branding Module Details](./branding/MODULE.md)
- [patterns Module Details](./patterns/MODULE.md)
- [Design System Figma](https://figma.com/mcv-design-system)

---

*@mcv/ui — The Visual Language of MCV.ONE*
