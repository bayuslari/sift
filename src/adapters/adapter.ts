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
