# @mcv/kernel/utils — Utilities Module

**Parent Package:** @mcv/kernel  
**Classification:** INTERNAL  
**Last Updated:** February 9, 2026

---

## Purpose

The `utils` module provides common utility functions for date manipulation, currency handling, string operations, and validation used throughout the MCV.ONE SDK.

---

## Sub-Modules

| Sub-Module | Purpose |
|------------|---------|
| `date` | Date formatting, parsing, manipulation |
| `currency` | Currency formatting, precise arithmetic |
| `string` | String manipulation, ID generation |
| `validation` | Input validation, sanitization |

---

## Date Utilities

### Exports

```typescript
export function formatDate(date: Date, format?: string): string;
export function formatDateTime(date: Date, timezone?: string): string;
export function parseDate(dateString: string): Date;
export function daysBetween(start: Date, end: Date): number;
export function getDateRange(date: Date): { start: Date; end: Date };
export function addDaysToDate(date: Date, days: number): Date;
export function isPast(date: Date): boolean;
export function isFuture(date: Date): boolean;
export function getRelativeTime(date: Date): string;
```

### Usage

```typescript
import { formatDate, formatDateTime, parseDate, daysBetween } from '@mcv/kernel';

// Format date
formatDate(new Date()); // "2026-02-09"
formatDate(new Date(), 'MMM dd, yyyy'); // "Feb 09, 2026"

// Format with timezone
formatDateTime(new Date(), 'America/Toronto');
// "2026-02-09T07:00:00-05:00"

// Parse ISO string
const date = parseDate('2026-02-09T12:00:00Z');

// Calculate difference
const days = daysBetween(startDate, endDate);

// Get day boundaries
const { start, end } = getDateRange(new Date());
// start: 2026-02-09T00:00:00
// end: 2026-02-09T23:59:59

// Relative time
getRelativeTime(pastDate); // "2 hours ago"
getRelativeTime(futureDate); // "in 3 days"
```

---

## Currency Utilities

### Exports

```typescript
export type Currency = 'USD' | 'CAD' | 'EUR' | 'GBP' | 'EDGE';

export function formatCurrency(amount: number | string, currency?: Currency): string;
export function parseCurrency(value: string): number;
export function addCurrency(a: number | string, b: number | string): string;
export function subtractCurrency(a: number | string, b: number | string): string;
export function multiplyCurrency(amount: number | string, multiplier: number): string;
export function compareCurrency(a: number | string, b: number | string): -1 | 0 | 1;
export function isPositive(amount: number | string): boolean;
```

### Usage

```typescript
import { formatCurrency, addCurrency, multiplyCurrency } from '@mcv/kernel';

// Format currency
formatCurrency(1234.56); // "$1234.56"
formatCurrency(1234.56, 'EUR'); // "€1234.56"
formatCurrency(1234.56, 'CAD'); // "C$1234.56"
formatCurrency(1.123456789, 'EDGE'); // "1.123456789 EDGE"

// Precise arithmetic (no floating point errors)
addCurrency('10.10', '20.20'); // "30.30"
subtractCurrency('100', '33.33'); // "66.67"
multiplyCurrency('19.99', 3); // "59.97"

// Compare amounts
compareCurrency('10.00', '10.00'); // 0
compareCurrency('10.00', '20.00'); // -1
compareCurrency('20.00', '10.00'); // 1

// Check if positive
isPositive('100'); // true
isPositive('-50'); // false
isPositive('0'); // false
```

### Why Decimal.js?

JavaScript floating point causes issues:
```javascript
0.1 + 0.2 // 0.30000000000000004 (wrong!)
```

With Decimal.js:
```typescript
addCurrency('0.1', '0.2'); // "0.3" (correct!)
```

---

## String Utilities

### Exports

```typescript
export function slugify(text: string): string;
export function generateId(prefix?: string): string;
export function truncate(str: string, length: number, suffix?: string): string;
export function capitalize(str: string): string;
export function titleCase(str: string): string;
export function maskEmail(email: string): string;
export function maskPhone(phone: string): string;
export function randomString(length: number): string;
export function isBlank(str: string | null | undefined): boolean;
```

### Usage

```typescript
import { slugify, generateId, truncate, maskEmail } from '@mcv/kernel';

// Create URL-safe slug
slugify('Hello World!'); // "hello-world"
slugify('Café & Restaurant'); // "cafe-and-restaurant"

// Generate IDs
generateId(); // "a1b2c3d4e5f6"
generateId('usr'); // "usr_a1b2c3d4e5f6"
generateId('ord'); // "ord_x9y8z7w6v5u4"

// Truncate text
truncate('Long text here', 10); // "Long te..."
truncate('Long text here', 10, '→'); // "Long text→"

// Case conversion
capitalize('hello'); // "Hello"
titleCase('hello world'); // "Hello World"

// Masking for display
maskEmail('user@example.com'); // "us***@example.com"
maskPhone('+14155551234'); // "***-***-1234"

// Random string
randomString(16); // "a8Kd92mNp3Qr5sT1"

// Check for empty
isBlank(''); // true
isBlank('  '); // true
isBlank(null); // true
isBlank('hello'); // false
```

---

## Validation Utilities

### Exports

```typescript
// Zod schemas
export const emailSchema: z.ZodString;
export const phoneSchema: z.ZodString;
export const uuidSchema: z.ZodString;
export const slugSchema: z.ZodString;
export const urlSchema: z.ZodString;

// Validators
export function isValidEmail(email: string): boolean;
export function isValidUUID(uuid: string): boolean;
export function isValidSlug(slug: string): boolean;
export function isValidURL(url: string): boolean;

// Sanitizers
export function sanitizeHtml(html: string): string;
export function normalizeWhitespace(str: string): string;
```

### Usage

```typescript
import { 
  isValidEmail, 
  isValidUUID, 
  sanitizeHtml, 
  emailSchema 
} from '@mcv/kernel';

// Quick validation
isValidEmail('user@example.com'); // true
isValidEmail('invalid'); // false

isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // true
isValidUUID('not-a-uuid'); // false

isValidSlug('hello-world'); // true
isValidSlug('Hello World!'); // false

// Zod schemas for complex validation
const userSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional(),
});

// Sanitize user input
sanitizeHtml('<script>alert("xss")</script>Hello'); // "Hello"
sanitizeHtml('<b>Bold</b> text'); // "Bold text"

// Normalize whitespace
normalizeWhitespace('  hello   world  '); // "hello world"
```

---

## Common Patterns

### ID Generation for Entities

```typescript
import { generateId } from '@mcv/kernel';

// Use consistent prefixes
const userId = generateId('usr');
const orderId = generateId('ord');
const invoiceId = generateId('inv');
const productId = generateId('prd');
```

### Currency in Database

Store amounts as integers (cents):
```typescript
// Store
const priceInCents = Math.round(parseFloat(price) * 100);

// Display
formatCurrency(priceInCents / 100);
```

### Date Range Queries

```typescript
import { getDateRange } from '@mcv/kernel';

const { start, end } = getDateRange(selectedDate);

const orders = await db
  .select()
  .from(schema.orders)
  .where(
    and(
      gte(schema.orders.createdAt, start),
      lte(schema.orders.createdAt, end)
    )
  );
```

---

## Performance Notes

- All utility functions are pure (no side effects)
- Decimal.js operations are slightly slower than native math
- Use lazy evaluation for expensive operations in hot paths
- Memoize repeated calculations when appropriate

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| date-fns | ^3.x | Date manipulation |
| date-fns-tz | ^2.x | Timezone support |
| decimal.js | ^10.x | Precise decimals |
| nanoid | ^5.x | ID generation |
| slugify | ^1.6.x | Slug creation |
| zod | ^3.22.x | Validation schemas |

---

*@mcv/kernel/utils — Utilities Module*
