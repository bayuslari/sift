import { describe, it, expect, vi } from 'vitest';
import { processJobs, type PipelineDeps } from './pipeline';
import { defaultProfile, defaultRules } from '../core/schema';
import { LlmError } from '../core/llm/gemini';
import type { Job, ScoredJob } from '../core/types';

const job = (id: string, title: string, extra: Partial<Job> = {}): Job => ({
  id,
  platform: 'upwork',
  title,
  description: '',
  url: `https://upwork.com/${id}`,
  tags: title.includes('Laravel') ? ['Laravel'] : [],
  ...extra,
});

function makeDeps(over: Partial<PipelineDeps> = {}): { deps: PipelineDeps; saved: ScoredJob[][] } {
  const saved: ScoredJob[][] = [];
  const deps: PipelineDeps = {
    getProfile: async () => defaultProfile(),
    getRules: async () => defaultRules(),
    getApiKey: async () => undefined,
    getHistory: async () => [],
    saveHistory: async (h) => {
      saved.push(h);
    },
    scoreGemini: vi.fn(),
    ...over,
  };
  return { deps, saved };
}

describe('processJobs', () => {
  it('dedupes jobs already in history', async () => {
    const existing: ScoredJob = {
      ...job('a', 'Laravel API'),
      score: 8,
      verdict: 'GOOD',
      reason: '',
      redFlags: [],
      greenFlags: [],
      scoredBy: 'rules',
      scoredAt: '',
    };
    const { deps } = makeDeps({ getHistory: async () => [existing] });
    const res = await processJobs([job('a', 'Laravel API'), job('b', 'Laravel job')], deps);
    expect(res.scannedCount).toBe(1); // only 'b' is new
  });

  it('scores with rules only when no API key', async () => {
    const { deps } = makeDeps();
    const res = await processJobs([job('b', 'Laravel API for fintech')], deps);
    expect(deps.scoreGemini).not.toHaveBeenCalled();
    expect(res.scannedCount).toBe(1);
  });

  it('enriches with Gemini when a key is present', async () => {
    const scoreGemini = vi.fn(async () => ({
      score: 9,
      verdict: 'GOOD' as const,
      reason: 'gemini said good',
      redFlags: [],
      greenFlags: [],
      scoredBy: 'gemini' as const,
      scoredAt: '',
    }));
    const { deps, saved } = makeDeps({ getApiKey: async () => 'KEY', scoreGemini });
    const res = await processJobs([job('b', 'Laravel API for fintech')], deps);
    expect(scoreGemini).toHaveBeenCalledOnce();
    expect(saved[0][0].scoredBy).toBe('gemini');
    expect(res.newMatches[0].reason).toBe('gemini said good');
  });

  it('keeps deterministic red flags after a successful Gemini pass', async () => {
    const scoreGemini = vi.fn(async () => ({
      score: 8,
      verdict: 'GOOD' as const,
      reason: 'gemini said good',
      redFlags: [],
      greenFlags: [],
      scoredBy: 'gemini' as const,
      scoredAt: '',
    }));
    const { deps, saved } = makeDeps({ getApiKey: async () => 'KEY', scoreGemini });
    await processJobs(
      [job('b', 'React app for fintech', { proposalsMin: 20, proposalsMax: 50 })],
      deps,
    );
    expect(saved[0][0].scoredBy).toBe('gemini');
    expect(saved[0][0].redFlags.some((f) => /competition/i.test(f.label))).toBe(true);
  });

  it('falls back to rules and flags llmError on LlmError', async () => {
    const scoreGemini = vi.fn(async () => {
      throw new LlmError('bad key', 400);
    });
    const { deps, saved } = makeDeps({ getApiKey: async () => 'BAD', scoreGemini });
    const res = await processJobs([job('b', 'Laravel API for fintech')], deps);
    expect(res.llmError).toBe(true);
    expect(saved[0][0].scoredBy).toBe('rules');
  });

  it('returns only GOOD jobs as newMatches', async () => {
    const { deps } = makeDeps();
    const res = await processJobs(
      [job('good', 'Laravel API for fintech'), job('bad', 'WordPress tweak', { clientSpend: 50, clientHires: 0 })],
      deps,
    );
    expect(res.newMatches.every((m) => m.verdict === 'GOOD')).toBe(true);
    expect(res.newMatches.some((m) => m.id === 'bad')).toBe(false);
  });
});
