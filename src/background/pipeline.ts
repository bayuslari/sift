import type { Job, ScoredJob } from '../core/types';
import type { Profile, Rules } from '../core/schema';
import { scoreWithRules } from '../core/scoring/rules';
import { scoreWithGemini, LlmError } from '../core/llm/gemini';
import { HISTORY_CAP } from './storage';

export interface PipelineDeps {
  getProfile(): Promise<Profile>;
  getRules(): Promise<Rules>;
  getApiKey(): Promise<string | undefined>;
  getHistory(): Promise<ScoredJob[]>;
  saveHistory(history: ScoredJob[]): Promise<void>;
  /** Injectable for tests; defaults to the real Gemini call. */
  scoreGemini?: typeof scoreWithGemini;
}

export interface PipelineResult {
  newMatches: ScoredJob[]; // verdict === 'GOOD'
  scannedCount: number;
  llmError: boolean;
}

export async function processJobs(jobs: Job[], deps: PipelineDeps): Promise<PipelineResult> {
  const [profile, rules, apiKey, history] = await Promise.all([
    deps.getProfile(),
    deps.getRules(),
    deps.getApiKey(),
    deps.getHistory(),
  ]);
  const gemini = deps.scoreGemini ?? scoreWithGemini;

  const known = new Set(history.map((j) => j.id));
  const seen = new Set<string>();
  const newJobs = jobs.filter((j) => !known.has(j.id) && !seen.has(j.id) && seen.add(j.id));

  const scored: ScoredJob[] = [];
  let llmError = false;

  for (const job of newJobs) {
    const base = scoreWithRules(job, profile, rules);
    let result = base;
    // Only spend an LLM call when a key exists and the job cleared the cheap pre-filter.
    if (apiKey && base.score >= rules.maybeThreshold - 1) {
      try {
        const enriched = await gemini(job, profile, rules, apiKey);
        result = { ...base, ...enriched };
      } catch (e) {
        if (e instanceof LlmError) llmError = true;
        result = base; // graceful fallback to deterministic rules
      }
    }
    scored.push(result);
  }

  const merged = [...scored, ...history].slice(0, HISTORY_CAP);
  await deps.saveHistory(merged);

  return {
    newMatches: scored.filter((j) => j.verdict === 'GOOD'),
    scannedCount: newJobs.length,
    llmError,
  };
}
