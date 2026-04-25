/**
 * Pure helpers for VisionBrokerPanel — extracted into a sibling
 * module so they're unit-testable without spinning up a React DOM
 * test toolchain.
 *
 * The panel mounts these via direct import; nothing else in the app
 * should depend on this file.
 */

/** Remaining ms between `deadlineAt` and `now`, clamped at zero. */
export function remainingMs(deadlineAt: number, now: number): number {
  return Math.max(0, deadlineAt - now);
}

/** Format remaining time as "MM:SS" (or "00:00" when expired). */
export function formatCountdown(remaining: number): string {
  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Picks the countdown bar color. The MCV palette uses Electric Cyan
 * (#00F5FF) for normal-urgency state and red for the danger band when
 * less than 10 seconds remain — mirrors the brand sigil pattern from
 * the design-system tokens.
 */
export function countdownColor(remaining: number): string {
  if (remaining <= 0) return '#7A0014'; // expired — deep crimson
  if (remaining < 10_000) return '#FF3B30'; // <10s — danger red
  return '#00F5FF'; // normal — Electric Cyan
}

/** Percent of countdown bar still filled, in [0, 1]. */
export function countdownProgress(
  enqueuedAt: number,
  deadlineAt: number,
  now: number,
): number {
  const total = Math.max(1, deadlineAt - enqueuedAt);
  const elapsed = Math.max(0, now - enqueuedAt);
  return Math.max(0, Math.min(1, 1 - elapsed / total));
}

/** Compact age formatter: "5s ago", "2m ago", etc. */
export function formatAge(enqueuedAt: number, now: number): string {
  const ageMs = Math.max(0, now - enqueuedAt);
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

/** Body payload for POST /vision/approvals/:id/decide. */
export interface DecidePayload {
  verdict: 'approved' | 'rejected';
  note?: string;
  decidedBy?: string;
}

export function buildDecidePayload(
  verdict: 'approved' | 'rejected',
  note: string | null | undefined,
  decidedBy: string | null | undefined,
): DecidePayload {
  const trimmed = (note ?? '').trim();
  const trimmedBy = (decidedBy ?? '').trim();
  const payload: DecidePayload = { verdict };
  if (trimmed) payload.note = trimmed;
  if (trimmedBy) payload.decidedBy = trimmedBy;
  return payload;
}
