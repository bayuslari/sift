import { describe, it, expect } from 'vitest';
import { computeStats } from './analytics';
import type { ScoredJob } from './types';

const sj = (o: Partial<ScoredJob>): ScoredJob => ({
  id: Math.random().toString(36),
  platform: 'upwork',
  title: 't',
  description: '',
  url: '',
  tags: [],
  score: 5,
  verdict: 'MAYBE',
  reason: '',
  redFlags: [],
  greenFlags: [],
  scoredBy: 'rules',
  scoredAt: new Date().toISOString(),
  ...o,
});

describe('computeStats', () => {
  it('returns zeroed stats for empty history', () => {
    const s = computeStats([]);
    expect(s.total).toBe(0);
    expect(s.matchRate).toBe(0);
    expect(s.avgScore).toBe(0);
  });

  it('computes match rate as GOOD / total', () => {
    const s = computeStats([
      sj({ verdict: 'GOOD', score: 8 }),
      sj({ verdict: 'SKIP', score: 2 }),
      sj({ verdict: 'SKIP', score: 3 }),
      sj({ verdict: 'GOOD', score: 9 }),
    ]);
    expect(s.total).toBe(4);
    expect(s.matchRate).toBeCloseTo(0.5, 5);
    expect(s.avgScore).toBeCloseTo(5.5, 5);
  });

  it('ranks top red flags by frequency descending', () => {
    const s = computeStats([
      sj({ redFlags: [{ label: 'Client spend very low', severity: 'high' }] }),
      sj({ redFlags: [{ label: 'Client spend very low', severity: 'high' }] }),
      sj({ redFlags: [{ label: 'No hire history', severity: 'high' }] }),
    ]);
    expect(s.topRedFlags[0]).toEqual({ label: 'Client spend very low', count: 2 });
    expect(s.topRedFlags[1]).toEqual({ label: 'No hire history', count: 1 });
  });

  it('counts jobs by platform', () => {
    const s = computeStats([sj({ platform: 'upwork' }), sj({ platform: 'linkedin' }), sj({ platform: 'upwork' })]);
    expect(s.byPlatform.upwork).toBe(2);
    expect(s.byPlatform.linkedin).toBe(1);
    expect(s.byPlatform.remote).toBe(0);
  });

  it('surfaces best niches from GOOD-job tags', () => {
    const s = computeStats([
      sj({ verdict: 'GOOD', tags: ['Laravel', 'fintech'] }),
      sj({ verdict: 'GOOD', tags: ['Laravel'] }),
      sj({ verdict: 'SKIP', tags: ['WordPress'] }),
    ]);
    expect(s.bestNiches[0]).toBe('Laravel');
    expect(s.bestNiches).not.toContain('WordPress');
  });
});
