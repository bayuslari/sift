import type { Job, ScoredJob, RedFlag, GreenFlag } from '../types';
import type { Profile, Rules } from '../schema';
import { buildScoringPrompt, buildProposalPrompt } from './prompts';

const MODEL = 'gemini-2.0-flash';
const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
  } catch (e) {
    throw new LlmError(`Network error calling Gemini: ${(e as Error).message}`);
  }
  if (!res.ok) {
    throw new LlmError(`Gemini request failed (${res.status})`, res.status);
  }
  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new LlmError('Gemini returned no text');
  return text;
}

/** Strip ```json fences and parse the first JSON object found. */
function parseJson<T>(text: string): T {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  return JSON.parse(s) as T;
}

const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));

interface RawScore {
  score: number;
  reason: string;
  redFlags?: RedFlag[];
  greenFlags?: GreenFlag[];
}

export async function scoreWithGemini(
  job: Job,
  profile: Profile,
  rules: Rules,
  apiKey: string,
): Promise<Partial<ScoredJob>> {
  const text = await callGemini(apiKey, buildScoringPrompt(job, profile, rules));
  const raw = parseJson<RawScore>(text);
  const score = clamp(Number(raw.score));
  const verdict = score >= rules.goodThreshold ? 'GOOD' : score >= rules.maybeThreshold ? 'MAYBE' : 'SKIP';
  return {
    score,
    verdict,
    reason: (raw.reason ?? '').trim(),
    redFlags: Array.isArray(raw.redFlags) ? raw.redFlags : [],
    greenFlags: Array.isArray(raw.greenFlags) ? raw.greenFlags : [],
    scoredBy: 'gemini',
    scoredAt: new Date().toISOString(),
  };
}

export async function draftProposal(job: Job, profile: Profile, apiKey: string): Promise<string> {
  const text = await callGemini(apiKey, buildProposalPrompt(job, profile));
  return text.trim();
}
