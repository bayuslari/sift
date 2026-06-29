import type { Job, Platform } from '../core/types';

export interface SiteAdapter {
  platform: Platform;
  matches(url: string): boolean;
  /** Pure DOM read — must not touch chrome.* */
  parse(root: ParentNode): Job[];
}

/** Registry populated by each adapter module's side-effecting register() call. */
export const adapters: SiteAdapter[] = [];

export function registerAdapter(adapter: SiteAdapter): void {
  if (!adapters.some((a) => a.platform === adapter.platform)) adapters.push(adapter);
}

export function adapterFor(url: string): SiteAdapter | undefined {
  return adapters.find((a) => a.matches(url));
}

/** Deterministic, dependency-free string hash (djb2) -> stable job id. */
export function stableId(platform: Platform, key: string): string {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  return `${platform}_${(h >>> 0).toString(36)}`;
}

export function text(el: Element | null | undefined): string {
  return el?.textContent?.trim() ?? '';
}

/** Parse a money string like "$1,200" or "$300+" -> 1200 / 300, else undefined. */
export function parseMoney(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const m = raw.replace(/,/g, '').match(/\$\s*([\d.]+)\s*([kK])?/);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  return m[2] ? n * 1000 : n;
}

const UNIT_MS: Record<string, number> = {
  second: 1000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000, // ~30d
  year: 31_536_000_000,
};

/**
 * Convert a relative date string ("Posted 5 hours ago", "yesterday", "3 days ago",
 * "just now", "last week") to an absolute ISO timestamp, computed from now. Returns
 * undefined when nothing recognizable is found. Used for `Job.postedAt`.
 */
export function parseRelativeDate(raw: string | undefined, now: number = Date.now()): string | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase().replace(/^posted\s+/, '').trim();
  if (/just now|moments? ago|^today\b|^a few seconds/.test(s)) return new Date(now).toISOString();
  if (/yesterday/.test(s)) return new Date(now - UNIT_MS.day).toISOString();
  const m = s.match(/(?:(\d+)|a|an|last)\s*(second|minute|hour|day|week|month|year)s?/);
  if (!m) return undefined;
  const qty = m[1] ? parseInt(m[1], 10) : 1;
  const unit = UNIT_MS[m[2]];
  if (!unit || !Number.isFinite(qty)) return undefined;
  return new Date(now - qty * unit).toISOString();
}
