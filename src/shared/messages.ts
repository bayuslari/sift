import type { Job, ScoredJob } from '../core/types';

export interface ScanStats {
  enabled: boolean;
  lastCheck: number | null; // epoch ms
  checksRun: number;
  matches: number;
  llmError: boolean; // last scan hit a rejected/expired Gemini key
}

export const defaultStats = (): ScanStats => ({
  enabled: true,
  lastCheck: null,
  checksRun: 0,
  matches: 0,
  llmError: false,
});

export type Message =
  | { type: 'JOBS_FOUND'; jobs: Job[] } // content -> bg
  | { type: 'RESCAN' } // bg/popup -> content
  | { type: 'GET_STATE' } // popup -> bg
  | { type: 'STATE'; matches: ScoredJob[]; history: ScoredJob[]; stats: ScanStats } // bg -> popup
  | { type: 'GENERATE_PROPOSAL'; jobId: string } // popup -> bg
  | { type: 'PROPOSAL_READY'; jobId: string; proposal?: string; error?: string }
  | { type: 'TOGGLE_ENABLED'; enabled: boolean };
