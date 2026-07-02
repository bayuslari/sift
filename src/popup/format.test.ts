import { describe, it, expect } from 'vitest';
import { postedAgo, formatBudget, formatProposals } from './format';

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

describe('formatBudget', () => {
  it('formats an hourly range from budgetRaw', () => {
    expect(formatBudget({ budgetRaw: 'Hourly: $15.00 - $25.00' })).toBe('$15–25/hr');
  });

  it('formats a single fixed-price amount from budgetRaw', () => {
    expect(formatBudget({ budgetRaw: 'Fixed-price: $80.00' })).toBe('$80 fixed');
  });

  it('falls back to the numeric budget when no raw text amount is present', () => {
    expect(formatBudget({ budget: 1200 })).toBe('$1,200');
  });

  it('returns a bare label when budgetRaw has no amount and no numeric budget', () => {
    expect(formatBudget({ budgetRaw: 'Hourly' })).toBe('Hourly');
  });

  it('uses the numeric budget when the raw text names the type but not the amount', () => {
    // Fixed-price tiles put the amount in a separate node, so budgetRaw may lack it.
    expect(formatBudget({ budgetRaw: 'Fixed-price', budget: 200 })).toBe('$200 fixed');
  });

  it('returns null when nothing is present', () => {
    expect(formatBudget({})).toBeNull();
  });
});

describe('formatProposals', () => {
  it('formats a min-max range', () => {
    expect(formatProposals({ proposalsMin: 20, proposalsMax: 50 })).toBe('20–50 proposals');
  });

  it('formats a min-only "+"', () => {
    expect(formatProposals({ proposalsMin: 50 })).toBe('50+ proposals');
  });

  it('formats a "less than" range as "<max"', () => {
    expect(formatProposals({ proposalsMin: 0, proposalsMax: 5 })).toBe('<5 proposals');
  });

  it('returns null when absent', () => {
    expect(formatProposals({})).toBeNull();
  });
});
