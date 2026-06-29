import { memo } from 'react';
import { motion } from 'framer-motion';
import { usePopupStore } from '../store';
import { relativeTime } from '../format';

/** Isolated, memoized so the perpetual breathing animation never re-renders the header. */
const StatusDot = memo(function StatusDot({ on }: { on: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {on && (
        <span className="absolute inline-flex h-full w-full animate-breathe rounded-full bg-accent/70" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          on ? 'bg-accent shadow-[0_0_8px_theme(colors.accent.DEFAULT)]' : 'bg-zinc-600'
        }`}
      />
    </span>
  );
});

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors active:scale-[0.97] ${
        on ? 'justify-end bg-accent-fill' : 'justify-start bg-zinc-700'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="h-5 w-5 rounded-full bg-zinc-950 shadow-sm"
      />
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-0.5 font-mono text-sm text-zinc-100">{value}</div>
    </div>
  );
}

export function HeaderBar() {
  const stats = usePopupStore((s) => s.stats);
  const toggle = usePopupStore((s) => s.toggle);

  return (
    <header className="bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <StatusDot on={stats.enabled} />
          <span className="text-sm font-semibold tracking-tight text-zinc-100">SIFT</span>
        </div>
        <Toggle on={stats.enabled} onClick={() => void toggle()} />
      </div>

      <div className="grid grid-cols-3 border-t border-zinc-800 divide-x divide-zinc-800">
        <Stat label="Last check" value={relativeTime(stats.lastCheck)} />
        <Stat label="Checks run" value={String(stats.checksRun)} />
        <Stat label="Matches" value={String(stats.matches)} />
      </div>
    </header>
  );
}
