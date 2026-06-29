import type { Job, ScoredJob, RedFlag, GreenFlag, Verdict, QualKind } from '../types';
import type { Profile, Rules } from '../schema';
import { termMatches, dedupeTerms } from './match';

const STACK_POINTS = 1.5;
const DOMAIN_POINTS = 1.5;
const HIGH_PENALTY = 2.5;
const LOW_PENALTY = 1;
const MUSTHAVE_BONUS = 1;
const SENIORITY_BONUS = 0.5;

/** Deterministic, framework-free scoring. Never touches chrome.* */
export function scoreWithRules(job: Job, profile: Profile, rules: Rules): ScoredJob {
  const text = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
  const redFlags: RedFlag[] = [];
  const greenFlags: GreenFlag[] = [];

  // Hard SKIP on any blocklisted keyword.
  const blocked = rules.blocklist.find((kw) => kw && termMatches(text, kw));
  if (blocked) {
    return finalize(job, 1, 'SKIP', [{ label: `Blocked keyword: ${blocked}`, severity: 'high' }], [], `Blocked keyword: ${blocked}`);
  }

  // Stack / domain overlap (boundary-aware, de-duped).
  const stackHits = dedupeTerms(profile.stack).filter((s) => termMatches(text, s));
  const domainHits = dedupeTerms(profile.domains).filter((d) => termMatches(text, d));

  let score = 5 + stackHits.length * STACK_POINTS + domainHits.length * DOMAIN_POINTS;

  if (stackHits.length >= 2) {
    greenFlags.push({ label: `Strong stack match (${stackHits.join(', ')})` });
  } else if (stackHits.length === 1) {
    greenFlags.push({ label: `Matches your stack (${stackHits[0]})` });
  }
  for (const d of domainHits) {
    greenFlags.push({ label: `${cap(d)} domain fits your expertise` });
  }

  // Stack mismatch: none of the must-have terms (or stack, if no must-haves) present.
  const required = rules.mustHaveAny.length ? rules.mustHaveAny : profile.stack;
  const hasRequired = required.some((t) => t && termMatches(text, t));
  if (!hasRequired) {
    redFlags.push({ label: `Stack mismatch - no ${required.slice(0, 2).join('/')}`, severity: 'high' });
    score -= HIGH_PENALTY;
  } else if (rules.mustHaveAny.length) {
    // Explicit must-haves are weighted above generic stack overlap.
    const hit = rules.mustHaveAny.filter((t) => t && termMatches(text, t));
    greenFlags.push({ label: `Has required: ${hit.slice(0, 3).join(', ')}` });
    score += MUSTHAVE_BONUS;
  }

  // Seniority alignment between the profile headline and the job title.
  const profileLevel = seniorityLevel(profile.headline);
  const jobLevel = seniorityLevel(job.title);
  if (profileLevel && jobLevel) {
    if (profileLevel >= 3 && jobLevel <= 1) {
      redFlags.push({ label: 'Seniority mismatch - junior-level role', severity: 'low' });
      score -= LOW_PENALTY;
    } else if (profileLevel >= 3 && jobLevel >= 3) {
      greenFlags.push({ label: 'Seniority matches your level' });
      score += SENIORITY_BONUS;
    }
  }

  // Hourly rate vs target (parsed from budget text / description when present).
  const rate = parseHourlyRate(`${job.budgetRaw ?? ''} ${job.description}`);
  if (rate !== undefined) {
    if (rate < profile.hourlyTarget) {
      redFlags.push({ label: `Rate below target ($${rate}/hr)`, severity: 'low' });
      score -= LOW_PENALTY;
    } else {
      greenFlags.push({ label: `Rate meets your target ($${rate}/hr)` });
    }
  }

  // Budget below target (when known).
  if (job.budget !== undefined && job.budget < profile.minBudget) {
    redFlags.push({ label: `Budget below target ($${job.budget})`, severity: 'low' });
    score -= LOW_PENALTY;
  }

  // --- Upwork-only client signals (skipped when undefined) ---
  if (job.clientSpend !== undefined && job.clientSpend < rules.minClientSpend) {
    redFlags.push({ label: `Client spend very low ($${job.clientSpend})`, severity: 'high' });
    score -= HIGH_PENALTY;
  }
  if (rules.requireHireHistory && job.clientHires === 0) {
    redFlags.push({ label: 'No hire history', severity: 'high' });
    score -= HIGH_PENALTY;
  }

  // --- Upwork job-detail signals (skipped when undefined) ---
  if (job.proposalsMin !== undefined && job.proposalsMin >= rules.maxProposals) {
    const range = job.proposalsMax ? `${job.proposalsMin}-${job.proposalsMax}` : `${job.proposalsMin}+`;
    redFlags.push({ label: `High competition (${range} proposals)`, severity: 'high' });
    score -= HIGH_PENALTY;
  }
  if (rules.avoidIfInterviewing && job.interviewing !== undefined && job.interviewing > 0) {
    redFlags.push({ label: `Client already interviewing ${job.interviewing}`, severity: 'high' });
    score -= HIGH_PENALTY;
  }
  if (rules.failOnUnmetQualification && job.qualifications?.length) {
    for (const q of job.qualifications) {
      if (!q.met) {
        const severity: RedFlag['severity'] = q.kind === 'location' || q.kind === 'jobSuccess' ? 'high' : 'low';
        redFlags.push({ label: `${qualName(q.kind)} requirement not met (${stripLabel(q.label)})`, severity });
        score -= severity === 'high' ? HIGH_PENALTY : LOW_PENALTY;
      }
    }
    if (job.qualifications.every((q) => q.met)) {
      greenFlags.push({ label: 'You meet all preferred qualifications' });
    }
  }
  if (job.lastViewedByClient) {
    greenFlags.push({ label: 'Client active recently' });
  }

  score = clamp(Math.round(score));
  const verdict = toVerdict(score, rules);
  return finalize(job, score, verdict, redFlags, greenFlags, pickReason(verdict, redFlags, greenFlags));
}

function toVerdict(score: number, rules: Rules): Verdict {
  if (score >= rules.goodThreshold) return 'GOOD';
  if (score >= rules.maybeThreshold) return 'MAYBE';
  return 'SKIP';
}

function pickReason(verdict: Verdict, red: RedFlag[], green: GreenFlag[]): string {
  if (verdict === 'GOOD' && green.length) return green[0].label;
  const highFirst = [...red].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'high' ? -1 : 1));
  if (highFirst.length) return highFirst[0].label;
  if (green.length) return green[0].label;
  return 'No strong signals either way';
}

function finalize(
  job: Job,
  score: number,
  verdict: Verdict,
  redFlags: RedFlag[],
  greenFlags: GreenFlag[],
  reason: string,
): ScoredJob {
  return {
    ...job,
    score,
    verdict,
    reason,
    redFlags,
    greenFlags,
    scoredBy: 'rules',
    scoredAt: new Date().toISOString(),
  };
}

const clamp = (n: number) => Math.max(1, Math.min(10, n));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Coarse seniority rank from free text: 1 junior, 2 mid, 3 senior, 4 lead+. 0 = unknown. */
function seniorityLevel(text: string): number {
  const t = text.toLowerCase();
  if (/\b(principal|staff|lead|architect|head of|director)\b/.test(t)) return 4;
  if (/\b(senior|sr\.?|expert)\b/.test(t)) return 3;
  if (/\b(mid[-\s]?level|intermediate)\b/.test(t)) return 2;
  if (/\b(junior|jr\.?|intern|internship|entry[-\s]?level|trainee)\b/.test(t)) return 1;
  return 0;
}

/** Parse an hourly rate (the upper bound of a range) from text, e.g. "$50-80/hr". */
function parseHourlyRate(text: string): number | undefined {
  const m = text.match(/\$\s?(\d+(?:\.\d+)?)\s*(?:-\s*\$?\s?(\d+(?:\.\d+)?))?\s*(?:\/|per\s+)?\s*(?:hr|hour)\b/i);
  if (!m) return undefined;
  const lo = Number(m[1]);
  const hi = m[2] !== undefined ? Number(m[2]) : lo;
  const rate = Math.max(lo, hi);
  return Number.isFinite(rate) ? rate : undefined;
}
const stripLabel = (label: string) => label.split(':').slice(1).join(':').trim() || label;

function qualName(kind: QualKind): string {
  switch (kind) {
    case 'location':
      return 'Location';
    case 'jobSuccess':
      return 'Job Success Score';
    case 'english':
      return 'English level';
    case 'talentType':
      return 'Talent type';
    default:
      return 'Qualification';
  }
}
