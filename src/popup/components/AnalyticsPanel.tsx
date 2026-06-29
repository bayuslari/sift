import { useState } from 'react';
import { CaretDown, ChartBar } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { computeStats } from '../../core/analytics';
import { usePopupStore } from '../store';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className="font-mono text-sm text-zinc-100">{value}</span>
    </div>
  );
}

export function AnalyticsPanel() {
  const history = usePopupStore((s) => s.history);
  const [open, setOpen] = useState(false);
  if (history.length === 0) return null;

  const s = computeStats(history);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const maxFlag = s.topRedFlags[0]?.count ?? 1;

  return (
    <div className="border-t border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <ChartBar size={14} weight="bold" className="text-zinc-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Analytics
        </span>
        <span className="font-mono text-[11px] text-zinc-600">{s.total} scanned</span>
        <CaretDown
          size={14}
          weight="bold"
          className={`ml-auto text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="divide-y divide-zinc-800/60">
                <Metric label="Match rate" value={pct(s.matchRate)} />
                <Metric label="Average score" value={`${s.avgScore.toFixed(1)}/10`} />
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-600">By platform</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['upwork', 'linkedin', 'remote'] as const).map((p) => (
                    <div key={p} className="rounded-md border border-zinc-800 px-2 py-1.5">
                      <div className="font-mono text-sm text-zinc-100">{s.byPlatform[p]}</div>
                      <div className="text-[10px] uppercase tracking-wide text-zinc-600">{p}</div>
                    </div>
                  ))}
                </div>
              </div>

              {s.topRedFlags.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-600">Top red flags</p>
                  <ul className="space-y-1.5">
                    {s.topRedFlags.slice(0, 4).map((f) => (
                      <li key={f.label} className="flex items-center gap-2">
                        <span className="flex-1 truncate text-[11px] text-zinc-400">{f.label}</span>
                        <span className="h-1.5 rounded-full bg-amber-400/70" style={{ width: `${(f.count / maxFlag) * 56}px` }} />
                        <span className="w-4 text-right font-mono text-[11px] text-zinc-500">{f.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {s.bestNiches.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-600">Best niches</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.bestNiches.slice(0, 6).map((n) => (
                      <span key={n} className="rounded bg-accent/10 px-1.5 py-0.5 text-[11px] text-accent">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
