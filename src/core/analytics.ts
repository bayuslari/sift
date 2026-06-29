import type { Platform, ScoredJob } from './types';

export interface Stats {
  total: number;
  matchRate: number; // GOOD / total, 0..1
  avgScore: number;
  topRedFlags: { label: string; count: number }[];
  byPlatform: Record<Platform, number>;
  bestNiches: string[]; // tags most common among GOOD jobs
}

export function computeStats(history: ScoredJob[]): Stats {
  const total = history.length;
  const byPlatform: Record<Platform, number> = { upwork: 0, linkedin: 0, remote: 0 };
  if (total === 0) {
    return { total: 0, matchRate: 0, avgScore: 0, topRedFlags: [], byPlatform, bestNiches: [] };
  }

  let good = 0;
  let scoreSum = 0;
  const redCounts = new Map<string, number>();
  const nicheCounts = new Map<string, number>();

  for (const job of history) {
    byPlatform[job.platform] += 1;
    scoreSum += job.score;
    if (job.verdict === 'GOOD') {
      good += 1;
      for (const tag of job.tags) nicheCounts.set(tag, (nicheCounts.get(tag) ?? 0) + 1);
    }
    for (const flag of job.redFlags) redCounts.set(flag.label, (redCounts.get(flag.label) ?? 0) + 1);
  }

  const topRedFlags = rank(redCounts).map(([label, count]) => ({ label, count }));
  const bestNiches = rank(nicheCounts).map(([label]) => label);

  return {
    total,
    matchRate: good / total,
    avgScore: scoreSum / total,
    topRedFlags,
    byPlatform,
    bestNiches,
  };
}

/** Sort a count map by count desc, then label asc for stable ordering. */
function rank(counts: Map<string, number>): [string, number][] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
