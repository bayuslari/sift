import type { Job, ScoredJob, RedFlag, GreenFlag, Verdict, QualKind } from '../types';
import type { Profile, Rules } from '../schema';

const STACK_POINTS = 1.5;
const DOMAIN_POINTS = 1.5;
const HIGH_PENALTY = 2.5;
const LOW_PENALTY = 1;

/** Deterministic, framework-free scoring. Never touches chrome.* */
export function scoreWithRules(job: Job, profile: Profile, rules: Rules): ScoredJob {
  const text = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
  const redFlags: RedFlag[] = [];
  const greenFlags: GreenFlag[] = [];

  // Hard SKIP on any blocklisted keyword.
  const blocked = rules.blocklist.find((kw) => kw && text.includes(kw.toLowerCase()));
  if (blocked) {
    return finalize(job, 1, 'SKIP', [{ label: `Blocked keyword: ${blocked}`, severity: 'high' }], [], `Blocked keyword: ${blocked}`);
  }

  // Stack / domain overlap.
  const stackHits = profile.stack.filter((s) => s && text.includes(s.toLowerCase()));
  const domainHits = profile.domains.filter((d) => d && text.includes(d.toLowerCase()));

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
  const hasRequired = required.some((t) => t && text.includes(t.toLowerCase()));
  if (!hasRequired) {
    redFlags.push({ label: `Stack mismatch - no ${required.slice(0, 2).join('/')}`, severity: 'high' });
    score -= HIGH_PENALTY;
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
