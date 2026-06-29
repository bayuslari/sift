import type { Job } from '../types';
import type { Profile, Rules } from '../schema';

function jobBlock(job: Job): string {
  const lines = [
    `Title: ${job.title}`,
    `Platform: ${job.platform}`,
    job.budgetRaw ? `Budget: ${job.budgetRaw}` : undefined,
    job.clientSpend !== undefined ? `Client total spend: $${job.clientSpend}` : undefined,
    job.clientHires !== undefined ? `Client hires: ${job.clientHires}` : undefined,
    job.proposalsMin !== undefined ? `Proposals: ${job.proposalsMin}-${job.proposalsMax ?? '?'}` : undefined,
    job.interviewing !== undefined ? `Interviewing: ${job.interviewing}` : undefined,
    job.tags.length ? `Skills: ${job.tags.join(', ')}` : undefined,
    `Description: ${job.description.slice(0, 1200)}`,
  ].filter(Boolean);
  return lines.join('\n');
}

function profileBlock(profile: Profile): string {
  return [
    `Headline: ${profile.headline}`,
    `Stack: ${profile.stack.join(', ')}`,
    profile.domains.length ? `Domains: ${profile.domains.join(', ')}` : '',
    `Minimum acceptable budget: $${profile.minBudget}`,
    `Target hourly: $${profile.hourlyTarget}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildScoringPrompt(job: Job, profile: Profile, rules: Rules): string {
  return `You are a freelance job-fit evaluator. Score how well this job fits the freelancer.

FREELANCER PROFILE
${profileBlock(profile)}

THRESHOLDS
- GOOD if score >= ${rules.goodThreshold}, MAYBE if >= ${rules.maybeThreshold}, else SKIP.

JOB
${jobBlock(job)}

Respond with STRICT JSON only, no prose, no markdown fences:
{
  "score": <integer 1-10>,
  "reason": "<one concise line on why it is or isn't worth their time>",
  "redFlags": [{"label": "<short>", "severity": "low|high"}],
  "greenFlags": [{"label": "<short>"}]
}`;
}

export function buildProposalPrompt(job: Job, profile: Profile): string {
  return `Write a short, specific Upwork-style proposal (max 90 words) for this freelancer applying to this job.
Open with a concrete hook tied to the job, reference relevant experience from the profile, end with a light call to action.
No greetings like "Dear Hiring Manager", no fluff words ("seamless", "passionate"), first person.

FREELANCER
${profileBlock(profile)}
${profile.bio ? `Bio: ${profile.bio}` : ''}

JOB
${jobBlock(job)}

Return only the proposal text.`;
}
