import { describe, it, expect } from 'vitest';
import { scoreWithRules } from './rules';
import { defaultProfile, defaultRules } from '../schema';
import type { Job } from '../types';

const base = (o: Partial<Job> = {}): Job => ({
  id: 'x',
  platform: 'upwork',
  title: '',
  description: '',
  url: '',
  tags: [],
  ...o,
});

describe('scoreWithRules', () => {
  it('flags low client spend as a high red flag', () => {
    const p = defaultProfile();
    const r = scoreWithRules(
      base({ title: 'Laravel API', tags: ['Laravel'], clientSpend: 100, clientHires: 0 }),
      p,
      defaultRules(),
    );
    expect(r.redFlags.some((f) => /spend/i.test(f.label) && f.severity === 'high')).toBe(true);
  });

  it('rewards stack + domain match with a GOOD verdict', () => {
    const p = { ...defaultProfile(), stack: ['Laravel', 'PHP'], domains: ['insurance'] };
    const r = scoreWithRules(
      base({
        title: 'Laravel dev for insurance platform',
        tags: ['Laravel', 'PHP'],
        clientSpend: 5000,
        clientHires: 12,
      }),
      p,
      defaultRules(),
    );
    expect(r.score).toBeGreaterThanOrEqual(7);
    expect(r.verdict).toBe('GOOD');
    expect(r.greenFlags.length).toBeGreaterThan(0);
  });

  it('hard-SKIPs blocklisted keywords', () => {
    const r = scoreWithRules(base({ title: 'WordPress theme tweak' }), defaultProfile(), {
      ...defaultRules(),
      blocklist: ['wordpress'],
    });
    expect(r.verdict).toBe('SKIP');
    expect(r.score).toBe(1);
  });

  it('flags stack mismatch when no stack term present', () => {
    const r = scoreWithRules(
      base({ title: 'Node.js scraper', tags: ['Node'] }),
      defaultProfile(),
      defaultRules(),
    );
    expect(r.redFlags.some((f) => /stack mismatch/i.test(f.label))).toBe(true);
  });

  it('produces a one-line reason', () => {
    const r = scoreWithRules(
      base({ title: 'Laravel API', tags: ['Laravel'], clientSpend: 5000, clientHires: 3 }),
      defaultProfile(),
      defaultRules(),
    );
    expect(r.reason.length).toBeGreaterThan(0);
    expect(r.reason).not.toContain('\n');
  });

  it('flags high competition from the proposals range', () => {
    const r = scoreWithRules(
      base({ title: 'Laravel API', tags: ['Laravel'], proposalsMin: 20, proposalsMax: 50 }),
      defaultProfile(),
      defaultRules(),
    );
    expect(r.redFlags.some((f) => /competition/i.test(f.label) && f.severity === 'high')).toBe(true);
  });

  it('flags an unmet preferred qualification (location)', () => {
    const job = base({
      title: 'Laravel API',
      tags: ['Laravel'],
      qualifications: [{ kind: 'location', label: 'Location: Europe', met: false }],
    });
    const r = scoreWithRules(job, defaultProfile(), defaultRules());
    expect(r.redFlags.some((f) => /location/i.test(f.label))).toBe(true);
  });

  it('flags an already-interviewing client', () => {
    const r = scoreWithRules(
      base({ title: 'Laravel API', tags: ['Laravel'], interviewing: 2 }),
      defaultProfile(),
      defaultRules(),
    );
    expect(r.redFlags.some((f) => /interviewing/i.test(f.label))).toBe(true);
  });

  it('does not count "Java" as a JavaScript stack hit (boundary match)', () => {
    // Default stack includes "JavaScript"; a Java job must not match it.
    const r = scoreWithRules(
      base({ title: 'Senior Java backend developer', tags: ['Java'] }),
      defaultProfile(),
      defaultRules(),
    );
    expect(r.redFlags.some((f) => /stack mismatch/i.test(f.label))).toBe(true);
  });

  it('matches a stack term through its alias (node -> Node.js)', () => {
    const p = { ...defaultProfile(), stack: ['Node.js'] };
    const r = scoreWithRules(
      base({ title: 'Backend engineer', description: 'We use node for the API' }),
      p,
      defaultRules(),
    );
    expect(r.redFlags.some((f) => /stack mismatch/i.test(f.label))).toBe(false);
    expect(r.greenFlags.some((f) => /stack/i.test(f.label))).toBe(true);
  });

  it('ignores detail-only signals when absent (list-page job)', () => {
    const r = scoreWithRules(
      base({ title: 'Laravel API', tags: ['Laravel'], clientSpend: 5000, clientHires: 3 }),
      defaultProfile(),
      defaultRules(),
    );
    expect(r.redFlags.some((f) => /competition|interviewing|location/i.test(f.label))).toBe(false);
  });
});
