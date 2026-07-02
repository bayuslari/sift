export function relativeTime(ts: number | null): string {
  if (!ts) return 'never';
  const diff = Date.now() - ts;
  const s = Math.round(diff / 1000);
  if (s < 60) return s <= 3 ? 'just now' : `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/**
 * Compact budget label from the parsed job, e.g. "$15–25/hr", "$80 fixed", "Hourly".
 * Uses `budgetRaw` (original Upwork text) to keep the hourly/fixed distinction; falls
 * back to the numeric `budget` (fixed-price only).
 */
export function formatBudget(job: { budget?: number; budgetRaw?: string }): string | null {
  const raw = job.budgetRaw?.trim();
  if (raw) {
    const hourly = /hour|hr/i.test(raw);
    const fixed = /fixed/i.test(raw);
    const nums = raw.match(/\$\s?[\d,]+(?:\.\d+)?/g);
    if (nums?.length) {
      const clean = nums.map((n) => n.replace(/\s/g, '').replace(/\.00(?!\d)/, ''));
      const amount = clean[1] ? `${clean[0]}–${clean[1].replace('$', '')}` : clean[0];
      if (hourly) return `${amount}/hr`;
      if (fixed) return `${amount} fixed`;
      return amount;
    }
    if (hourly) return 'Hourly';
    if (fixed) return 'Fixed price';
  }
  if (typeof job.budget === 'number') return `$${job.budget.toLocaleString()}`;
  return null;
}

/** Proposals-sent label from the parsed range, e.g. "20–50 proposals", "50+ proposals". */
export function formatProposals(job: { proposalsMin?: number; proposalsMax?: number }): string | null {
  const lo = job.proposalsMin;
  const hi = job.proposalsMax;
  if (lo === undefined && hi === undefined) return null;
  let n: string;
  if (lo !== undefined && hi !== undefined) n = lo === 0 ? `<${hi}` : `${lo}–${hi}`;
  else if (lo !== undefined) n = `${lo}+`;
  else n = `<${hi}`;
  return `${n} proposals`;
}

/** Friendly "posted ago" label from an ISO timestamp, e.g. "5h ago", "yesterday", "2w ago". */
export function postedAgo(iso: string | undefined): string | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  const m = Math.round(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  return `${Math.round(d / 30)}mo ago`;
}
