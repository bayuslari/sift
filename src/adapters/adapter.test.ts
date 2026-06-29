import { describe, it, expect } from 'vitest';
import { parseRelativeDate, parseMoney } from './adapter';

const NOW = Date.parse('2026-06-29T12:00:00.000Z');
const ago = (raw: string) => NOW - Date.parse(parseRelativeDate(raw, NOW)!);

describe('parseRelativeDate', () => {
  it('handles "just now" / "today" as ~now', () => {
    expect(parseRelativeDate('just now', NOW)).toBe(new Date(NOW).toISOString());
    expect(parseRelativeDate('Posted today', NOW)).toBe(new Date(NOW).toISOString());
  });

  it('strips a leading "Posted" and parses units', () => {
    expect(ago('Posted 5 hours ago')).toBe(5 * 3_600_000);
    expect(ago('30 minutes ago')).toBe(30 * 60_000);
    expect(ago('3 days ago')).toBe(3 * 86_400_000);
    expect(ago('2 weeks ago')).toBe(2 * 604_800_000);
  });

  it('handles "yesterday" and singular "an hour ago"', () => {
    expect(ago('yesterday')).toBe(86_400_000);
    expect(ago('an hour ago')).toBe(3_600_000);
    expect(ago('last week')).toBe(604_800_000);
  });

  it('returns undefined for unrecognized or empty input', () => {
    expect(parseRelativeDate(undefined)).toBeUndefined();
    expect(parseRelativeDate('whenever')).toBeUndefined();
  });
});

describe('parseMoney (sanity)', () => {
  it('parses k-suffixed amounts', () => {
    expect(parseMoney('$100K+ spent')).toBe(100000);
    expect(parseMoney('$1,200')).toBe(1200);
  });
});
