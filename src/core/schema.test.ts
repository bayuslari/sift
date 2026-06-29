import { describe, it, expect } from 'vitest';
import { defaultProfile, defaultRules, RulesSchema } from './schema';

describe('schema defaults', () => {
  it('produces a valid default profile', () => {
    expect(defaultProfile().minBudget).toBe(500);
    expect(defaultProfile().stack).toContain('React');
    expect(defaultProfile().domains).toContain('e-commerce');
  });
  it('rejects out-of-range thresholds', () => {
    expect(() => RulesSchema.parse({ goodThreshold: 99 })).toThrow();
  });
  it('default rules block nothing by default', () => {
    expect(defaultRules().blocklist).toEqual([]);
  });
  it('default rules flag high competition at 20 proposals', () => {
    expect(defaultRules().maxProposals).toBe(20);
    expect(defaultRules().avoidIfInterviewing).toBe(true);
  });
});
