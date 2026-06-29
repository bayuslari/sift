import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, WarningCircle } from '@phosphor-icons/react';
import type { ScoredJob } from '../../core/types';
import { send, hasChrome } from '../api';

type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; text: string }
  | { kind: 'error'; message: string };

export function ProposalModal({ job, onClose }: { job: ScoredJob | null; onClose: () => void }) {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!job) return;
    setStatus({ kind: 'loading' });
    setCopied(false);

    // Dev preview without the extension runtime (stripped from production builds).
    if (import.meta.env.DEV && !hasChrome) {
      const t = setTimeout(
        () =>
          setStatus({
            kind: 'ready',
            text: `I shipped three Laravel payment integrations last year, including a PCI-scoped gateway handling 40k+ daily transactions. Your ${job.title.toLowerCase()} maps closely to that work. I'd start by auditing the current API boundaries, then lock down the third-party calls behind a typed client. Happy to walk you through a 20-minute plan — when works for you?`,
          }),
        500,
      );
      return () => clearTimeout(t);
    }

    let active = true;
    void send({ type: 'GENERATE_PROPOSAL', jobId: job.id }).then((res) => {
      if (!active) return;
      if (res?.type === 'PROPOSAL_READY') {
        if (res.proposal) setStatus({ kind: 'ready', text: res.proposal });
        else setStatus({ kind: 'error', message: res.error ?? 'Could not draft a proposal.' });
      } else {
        setStatus({ kind: 'error', message: 'No response from background.' });
      }
    });
    return () => {
      active = false;
    };
  }, [job]);

  const copy = async () => {
    if (status.kind !== 'ready') return;
    await navigator.clipboard.writeText(status.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      {job && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.6)]"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Proposal</span>
                <span className="line-clamp-1 text-sm font-medium text-zinc-100">{job.title}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-zinc-500 hover:text-zinc-200"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="px-4 py-4">
              {status.kind === 'loading' && (
                <div className="space-y-2">
                  {[100, 92, 96, 70].map((w) => (
                    <div
                      key={w}
                      className="relative h-3 overflow-hidden rounded bg-zinc-800"
                      style={{ width: `${w}%` }}
                    >
                      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />
                    </div>
                  ))}
                </div>
              )}

              {status.kind === 'error' && (
                <div className="flex items-start gap-2 text-xs text-amber-300">
                  <WarningCircle size={14} weight="fill" className="mt-px shrink-0 text-amber-400" />
                  <span>{status.message}</span>
                </div>
              )}

              {status.kind === 'ready' && (
                <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-200">
                  {status.text}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-zinc-800 px-4 py-2.5">
              <button
                type="button"
                onClick={() => void copy()}
                disabled={status.kind !== 'ready'}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent-fill px-3 py-1.5 text-xs font-medium text-zinc-950 transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
