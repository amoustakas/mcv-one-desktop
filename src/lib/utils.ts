/** Merge class names — filters falsy values and joins */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Format money values with K/M suffixes */
export function formatMoney(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

/** Compact number formatting: 1200 → "1.2K", 3400000 → "3.4M" */
export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Format percentage with sign prefix: 12.5 → "+12.5%", -3.2 → "-3.2%" */
export function formatPercentage(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Format currency with proper locale formatting */
export function formatCurrency(amount: number, currency = 'USD', compact = false): string {
  if (compact) return `$${formatCompact(amount)}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

/** Relative time ago string */
export function timeAgo(d: string): string {
  if (!d) return '--';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format a date string to readable */
export function formatDate(d: string): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format duration in ms to human readable: 125000 → "2m 5s" */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return rs > 0 ? `${m}m ${rs}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

/** Debounce a function call */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/** Generate a unique ID with optional prefix */
export function generateId(prefix = ''): string {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}_${id}` : id;
}

/** Map status string to CSS color variable */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active': case 'healthy': case 'success': case 'completed': case 'online':
      return 'var(--success)';
    case 'warning': case 'degraded': case 'pending': case 'idle':
      return 'var(--warning)';
    case 'error': case 'unhealthy': case 'failed': case 'offline':
      return 'var(--error)';
    case 'building': case 'running': case 'in_progress':
      return 'var(--cyan)';
    default:
      return 'var(--text-muted)';
  }
}
