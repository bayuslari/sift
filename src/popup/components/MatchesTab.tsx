import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Binoculars, WarningCircle } from '@phosphor-icons/react';
import type { ScoredJob } from '../../core/types';
import { usePopupStore } from '../store';
import { JobCard } from './JobCard';
import { ProposalModal } from './ProposalModal';
import { AnalyticsPanel } from './AnalyticsPanel';

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
  const matches = usePopupStore((s) => s.matches);
  const hydrated = usePopupStore((s) => s.hydrated);
  const llmError = usePopupStore((s) => s.stats.llmError);
  const [proposalJob, setProposalJob] = useState<ScoredJob | null>(null);

  if (!hydrated) {
    return (
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  const sorted = [...matches].sort((a, b) => b.score - a.score);

  return (
    <div>
      {llmError && <ErrorRow />}
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
