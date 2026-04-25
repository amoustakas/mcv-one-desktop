// panel-helpers.test.ts — pure-function coverage for the
// VisionBrokerPanel helpers. No React, no DOM.

import { describe, expect, it } from 'vitest';

import {
  buildDecidePayload,
  countdownColor,
  countdownProgress,
  formatAge,
  formatCountdown,
  remainingMs,
} from '../panel-helpers';

describe('vision-broker · panel-helpers · remainingMs', () => {
  it('returns positive remaining when deadline is in the future', () => {
    expect(remainingMs(1_000, 600)).toBe(400);
  });
  it('clamps to zero when deadline has passed', () => {
    expect(remainingMs(500, 1_000)).toBe(0);
  });
  it('returns 0 exactly at the deadline', () => {
    expect(remainingMs(1_000, 1_000)).toBe(0);
  });
});

describe('vision-broker · panel-helpers · formatCountdown', () => {
  it('renders zero as 00:00', () => {
    expect(formatCountdown(0)).toBe('00:00');
  });
  it('renders sub-minute as 00:SS', () => {
    expect(formatCountdown(45_000)).toBe('00:45');
  });
  it('pads single-digit seconds', () => {
    expect(formatCountdown(5_000)).toBe('00:05');
  });
  it('renders 1m as 01:00', () => {
    expect(formatCountdown(60_000)).toBe('01:00');
  });
  it('renders 1m30s as 01:30', () => {
    expect(formatCountdown(90_000)).toBe('01:30');
  });
});

describe('vision-broker · panel-helpers · countdownColor', () => {
  it('uses Electric Cyan (#00F5FF) for normal urgency', () => {
    expect(countdownColor(45_000)).toBe('#00F5FF');
  });
  it('switches to danger red at <10s', () => {
    expect(countdownColor(9_999)).toBe('#FF3B30');
    expect(countdownColor(1_000)).toBe('#FF3B30');
  });
  it('shows expired crimson at zero', () => {
    expect(countdownColor(0)).toBe('#7A0014');
  });
  it('treats exactly 10s as normal urgency', () => {
    expect(countdownColor(10_000)).toBe('#00F5FF');
  });
});

describe('vision-broker · panel-helpers · countdownProgress', () => {
  it('returns 1 at the start of the window', () => {
    expect(countdownProgress(1_000, 61_000, 1_000)).toBe(1);
  });
  it('returns 0 at or past the deadline', () => {
    expect(countdownProgress(1_000, 61_000, 61_000)).toBe(0);
    expect(countdownProgress(1_000, 61_000, 70_000)).toBe(0);
  });
  it('returns 0.5 at midpoint', () => {
    expect(countdownProgress(1_000, 61_000, 31_000)).toBe(0.5);
  });
  it('handles zero-duration deadline gracefully', () => {
    expect(countdownProgress(1_000, 1_000, 500)).toBeGreaterThanOrEqual(0);
    expect(countdownProgress(1_000, 1_000, 500)).toBeLessThanOrEqual(1);
  });
});

describe('vision-broker · panel-helpers · formatAge', () => {
  it('returns Ns ago under 1 minute', () => {
    expect(formatAge(0, 5_000)).toBe('5s ago');
  });
  it('returns Nm ago under 1 hour', () => {
    expect(formatAge(0, 5 * 60_000)).toBe('5m ago');
  });
  it('returns Nh ago beyond 1 hour', () => {
    expect(formatAge(0, 2 * 60 * 60_000)).toBe('2h ago');
  });
  it('clamps negative-age (clock skew) to 0s', () => {
    expect(formatAge(1_000, 500)).toBe('0s ago');
  });
});

describe('vision-broker · panel-helpers · buildDecidePayload', () => {
  it('returns just the verdict when note + decidedBy are blank', () => {
    expect(buildDecidePayload('approved', '', '')).toEqual({ verdict: 'approved' });
  });
  it('omits note/decidedBy when null/undefined', () => {
    expect(buildDecidePayload('rejected', null, undefined)).toEqual({
      verdict: 'rejected',
    });
  });
  it('trims whitespace from note + decidedBy', () => {
    expect(buildDecidePayload('approved', '  go  ', '  tony.atlas  ')).toEqual({
      verdict: 'approved',
      note: 'go',
      decidedBy: 'tony.atlas',
    });
  });
  it('drops note when only whitespace', () => {
    expect(buildDecidePayload('approved', '   ', 'tony.atlas')).toEqual({
      verdict: 'approved',
      decidedBy: 'tony.atlas',
    });
  });
});
