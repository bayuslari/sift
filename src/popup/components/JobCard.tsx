import { Flag, Check, ArrowUpRight, PencilSimpleLine } from '@phosphor-icons/react';
import type { ScoredJob, Verdict } from '../../core/types';

const VERDICT_STYLE: Record<Verdict, string> = {
  GOOD: 'bg-accent/15 text-accent',
  MAYBE: 'bg-amber-400/15 text-amber-300',
  SKIP: 'bg-zinc-700/40 text-zinc-400',
};

function VerdictChip({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wider ${VERDICT_STYLE[verdict]}`}
    >
      {verdict}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2.5 rounded-[1px] ${i < score ? 'bg-accent' : 'bg-zinc-800'}`}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-zinc-400">{score}/10</span>
    </div>
  );
}

export function JobCard({ job, onDraft }: { job: ScoredJob; onDraft: (job: ScoredJob) => void }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="group line-clamp-2 text-sm font-medium leading-snug text-zinc-100 hover:text-accent"
        >
          {job.title}
          <ArrowUpRight
            weight="bold"
            className="ml-0.5 inline opacity-0 transition-opacity group-hover:opacity-100"
            size={12}
          />
        </a>
        <VerdictChip verdict={job.verdict} />
      </div>

      <div className="mt-2">
        <ScoreBar score={job.score} />
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">{job.reason}</p>

      {(job.redFlags.length > 0 || job.greenFlags.length > 0) && (
        <ul className="mt-2 space-y-1">
          {job.redFlags.map((f, i) => (
            <li key={`r${i}`} className="flex items-start gap-1.5 text-xs text-amber-300">
              <Flag weight="fill" size={12} className="mt-0.5 shrink-0 text-amber-400" />
              <span>{f.label}</span>
            </li>
          ))}
          {job.greenFlags.map((f, i) => (
            <li key={`g${i}`} className="flex items-start gap-1.5 text-xs text-emerald-300">
              <Check weight="bold" size={12} className="mt-0.5 shrink-0 text-emerald-400" />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2.5 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {job.platform}
        </span>
        {job.verdict === 'GOOD' && (
          <button
            type="button"
            onClick={() => onDraft(job)}
            className="ml-auto inline-flex items-center gap-1 rounded border border-zinc-800 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:border-accent/40 hover:text-accent active:scale-[0.98]"
          >
            <PencilSimpleLine size={12} weight="bold" />
            Draft proposal
          </button>
        )}
      </div>
    </div>
  );
}
