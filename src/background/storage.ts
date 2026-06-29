import { type Profile, type Rules, defaultProfile, defaultRules } from '../core/schema';
import type { ScoredJob } from '../core/types';
import { type ScanStats, defaultStats } from '../shared/messages';

const K = {
  profile: 'profile',
  rules: 'rules',
  apiKey: 'apiKey',
  history: 'history',
  stats: 'stats',
  enabled: 'enabled',
} as const;

export const HISTORY_CAP = 500;

async function get<T>(key: string, fallback: T): Promise<T> {
  const obj = await chrome.storage.local.get(key);
  return (obj[key] as T) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export const getProfile = () => get<Profile>(K.profile, defaultProfile());
export const setProfile = (p: Profile) => set(K.profile, p);

export const getRules = () => get<Rules>(K.rules, defaultRules());
export const setRules = (r: Rules) => set(K.rules, r);

export const getApiKey = () => get<string>(K.apiKey, '').then((v) => v || undefined);
export const setApiKey = (key: string) => set(K.apiKey, key);

export const getHistory = () => get<ScoredJob[]>(K.history, []);
export const setHistory = (h: ScoredJob[]) => set(K.history, h.slice(0, HISTORY_CAP));

export const getStats = () => get<ScanStats>(K.stats, defaultStats());
export const setStats = (s: ScanStats) => set(K.stats, s);

export const getEnabled = () => get<boolean>(K.enabled, true);
export const setEnabled = (v: boolean) => set(K.enabled, v);

/** Seed defaults on install if absent. */
export async function seedDefaults(): Promise<void> {
  const existing = await chrome.storage.local.get(Object.values(K));
  const patch: Record<string, unknown> = {};
  if (existing[K.profile] === undefined) patch[K.profile] = defaultProfile();
  if (existing[K.rules] === undefined) patch[K.rules] = defaultRules();
  if (existing[K.history] === undefined) patch[K.history] = [];
  if (existing[K.stats] === undefined) patch[K.stats] = defaultStats();
  if (existing[K.enabled] === undefined) patch[K.enabled] = true;
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
}
