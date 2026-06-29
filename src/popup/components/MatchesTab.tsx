import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Binoculars, WarningCircle } from '@phosphor-icons/react';
import type { ScoredJob } from '../../core/types';
import { usePopupStore } from '../store';
import { JobCard } from './JobCard';
import { ProposalModal } from './ProposalModal';
import { AnalyticsPanel } from './AnalyticsPanel';
import { Switch } from './fields';

const postedMs = (j: ScoredJob) => Date.parse(j.postedAt ?? j.scoredAt) || 0;

function Controls() {
  const sort = usePopupStore((s) => s.sort);
  const setSort = usePopupStore((s) => s.setSort);
  const goodOnly = usePopupStore((s) => s.goodOnly);
  const setGoodOnly = usePopupStore((s) => s.setGoodOnly);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-2">
      <div className="inline-flex rounded-md border border-zinc-800 p-0.5">
        {(['best', 'newest'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSort(opt)}
            className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize transition-colors ${
              sort === opt ? 'bg-accent/15 text-accent' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
        Good only
        <Switch checked={goodOnly} onChange={setGoodOnly} />
      </label>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3">
      <div className="relative overflow-hidden rounded bg-zinc-900">
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
        <div className="mt-2 h-1.5 w-1/2 rounded bg-zinc-800" />
        <div className="mt-2 h-3 w-full rounded bg-zinc-800" />
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <Binoculars size={32} weight="duotone" className="text-zinc-600" />
      <p className="mt-3 text-sm font-medium text-zinc-300">No matches yet</p>
      <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-zinc-500">
        Open a job search on Upwork, LinkedIn, or a remote board to start scanning.
      </p>
    </div>
  );
}

function ErrorRow() {
  return (
    <div className="flex items-start gap-2 border-b border-zinc-800 bg-amber-400/5 px-4 py-2.5 text-[11px] text-amber-300">
      <WarningCircle size={14} weight="fill" className="mt-px shrink-0 text-amber-400" />
      <span>Gemini key rejected — using rules-only scoring. Fix it in Settings.</span>
    </div>
  );
}

export function MatchesTab() {
  const history = usePopupStore((s) => s.history);
  const sort = usePopupStore((s) => s.sort);
  const goodOnly = usePopupStore((s) => s.goodOnly);
  const hydrated = usePopupStore((s) => s.hydrated);
  const llmError = usePopupStore((s) => s.stats.llmError);
  const [proposalJob, setProposalJob] = useState<ScoredJob | null>(null);

  const sorted = useMemo(() => {
    const list = history.filter((j) =>
      goodOnly ? j.verdict === 'GOOD' : j.verdict !== 'SKIP',
    );
    const byBest = (a: ScoredJob, b: ScoredJob) => b.score - a.score || postedMs(b) - postedMs(a);
    const byNewest = (a: ScoredJob, b: ScoredJob) => postedMs(b) - postedMs(a) || b.score - a.score;
    return list.sort(sort === 'newest' ? byNewest : byBest);
  }, [history, sort, goodOnly]);

  if (!hydrated) {
    return (
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {llmError && <ErrorRow />}
      <Controls />
      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.ul layout className="divide-y divide-zinc-800">
          <AnimatePresence initial={false}>
            {sorted.map((job, i) => (
              <motion.li
                key={job.id}
                layout
                layoutId={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.03, 0.3) } }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <JobCard job={job} onDraft={setProposalJob} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <AnalyticsPanel />

      <ProposalModal job={proposalJob} onClose={() => setProposalJob(null)} />
    </div>
  );
}
