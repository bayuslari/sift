import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePopupStore, startStateSync } from './store';
import { HeaderBar } from './components/HeaderBar';
import { MatchesTab } from './components/MatchesTab';
import { SettingsTab } from './components/SettingsTab';

const TABS = [
  { id: 'matches', label: 'Matches' },
  { id: 'settings', label: 'Settings' },
] as const;

export default function App() {
  const tab = usePopupStore((s) => s.tab);
  const setTab = usePopupStore((s) => s.setTab);
  const hydrate = usePopupStore((s) => s.hydrate);
  const matchCount = usePopupStore((s) => s.matches.length);

  useEffect(() => {
    void hydrate();
    startStateSync();
  }, [hydrate]);

  return (
    <div className="flex min-h-[480px] w-[360px] flex-col bg-zinc-950 text-zinc-100">
      <HeaderBar />

      <nav className="flex border-t border-zinc-800">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex-1 px-4 py-2.5 text-xs font-medium tracking-wide transition-colors ${
                active ? 'text-accent' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {t.label}
                {t.id === 'matches' && matchCount > 0 && (
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                    {matchCount}
                  </span>
                )}
              </span>
              {active && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 overflow-y-auto border-t border-zinc-800">
        {tab === 'matches' ? <MatchesTab /> : <SettingsTab />}
      </main>
    </div>
  );
}
