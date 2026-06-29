import { describe, it, expect } from 'vitest';
import { postedAgo } from './format';

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

describe('postedAgo', () => {
  it('returns null for missing or invalid input', () => {
    expect(postedAgo(undefined)).toBeNull();
    expect(postedAgo('not-a-date')).toBeNull();
  });

  it('formats recent buckets', () => {
    expect(postedAgo(iso(30_000))).toBe('just now');
    expect(postedAgo(iso(5 * 60_000))).toBe('5m ago');
    expect(postedAgo(iso(5 * 3_600_000))).toBe('5h ago');
  });

  it('formats day buckets consistently as "Nd ago"', () => {
    expect(postedAgo(iso(86_400_000))).toBe('1d ago');
    expect(postedAgo(iso(3 * 86_400_000))).toBe('3d ago');
    expect(postedAgo(iso(14 * 86_400_000))).toBe('2w ago');
  });
});
