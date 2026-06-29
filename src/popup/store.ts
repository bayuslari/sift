import { create } from 'zustand';
import type { ScoredJob } from '../core/types';
import { type ScanStats, defaultStats } from '../shared/messages';
import { send, onStorageChanged, hasChrome } from './api';

type Tab = 'matches' | 'settings';

interface PopupState {
  matches: ScoredJob[];
  history: ScoredJob[];
  stats: ScanStats;
  tab: Tab;
  hydrated: boolean;
  setTab: (tab: Tab) => void;
  hydrate: () => Promise<void>;
  toggle: () => Promise<void>;
}

export const usePopupStore = create<PopupState>((set, get) => ({
  matches: [],
  history: [],
  stats: defaultStats(),
  tab: 'matches',
  hydrated: false,

  setTab: (tab) => set({ tab }),

  hydrate: async () => {
    // Dev-only: outside the extension, show sample data for visual work.
    if (import.meta.env.DEV && !hasChrome) {
      const { demoMatches, demoStats } = await import('./demo');
      set({ matches: demoMatches, history: demoMatches, stats: demoStats, hydrated: true });
      return;
    }
    const res = await send({ type: 'GET_STATE' });
    if (res?.type === 'STATE') {
      set({ matches: res.matches, history: res.history, stats: res.stats, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },

  toggle: async () => {
    const enabled = !get().stats.enabled;
    set((s) => ({ stats: { ...s.stats, enabled } }));
    await send({ type: 'TOGGLE_ENABLED', enabled });
  },
}));

/** Re-pull state whenever background writes to local storage. */
let started = false;
export function startStateSync(): void {
  if (started) return;
  started = true;
  onStorageChanged(() => {
    void usePopupStore.getState().hydrate();
  });
}
