import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scoreWithGemini, draftProposal, LlmError } from './gemini';
import { defaultProfile, defaultRules } from '../schema';
import type { Job } from '../types';

const job: Job = {
  id: 'x',
  platform: 'upwork',
  title: 'Laravel API',
  description: 'Build a Laravel API',
  url: 'https://upwork.com/job/x',
  tags: ['Laravel'],
};

const ok = (text: string) => ({
  ok: true,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

beforeEach(() => vi.restoreAllMocks());

describe('scoreWithGemini', () => {
  it('parses a clamped score and reason from JSON', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        ok('{"score": 12, "reason": "Strong Laravel fit", "redFlags": [], "greenFlags": [{"label":"Laravel match"}]}'),
      );
    const r = await scoreWithGemini(job, defaultProfile(), defaultRules(), 'KEY');
    expect(r.score).toBe(10); // clamped from 12
    expect(r.reason).toMatch(/Laravel/);
    expect(r.scoredBy).toBe('gemini');
  });

  it('tolerates code-fenced JSON', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(ok('```json\n{"score":7,"reason":"ok","redFlags":[],"greenFlags":[]}\n```'));
    const r = await scoreWithGemini(job, defaultProfile(), defaultRules(), 'KEY');
    expect(r.score).toBe(7);
  });

  it('throws LlmError on HTTP failure (e.g. bad key)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });
    await expect(scoreWithGemini(job, defaultProfile(), defaultRules(), 'BAD')).rejects.toBeInstanceOf(
      LlmError,
    );
  });
});

describe('draftProposal', () => {
  it('returns the model text trimmed', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(ok('  Hi, I built three Laravel APIs last year. \n'));
    const text = await draftProposal(job, defaultProfile(), 'KEY');
    expect(text).toBe('Hi, I built three Laravel APIs last year.');
  });
});
