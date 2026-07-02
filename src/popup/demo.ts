import type { ScoredJob } from '../core/types';
import type { ScanStats } from '../shared/messages';

/** Sample data used ONLY in `vite dev` outside the extension, for visual work.
 *  Never bundled into production (guarded by import.meta.env.DEV). */
export const demoStats: ScanStats = {
  enabled: true,
  lastCheck: Date.now() - 62_000,
  checksRun: 772,
  matches: 11,
  llmError: false,
};

export const demoMatches: ScoredJob[] = [
  {
    id: 'd1',
    platform: 'upwork',
    title: 'Senior Next.js Engineer for fintech dashboard (React + TypeScript)',
    description: '',
    url: '#',
    postedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(), // 2h ago
    budgetRaw: 'Hourly: $45.00 - $65.00',
    proposalsMin: 5,
    proposalsMax: 10,
    tags: ['Next.js', 'React', 'fintech'],
    score: 9,
    verdict: 'GOOD',
    reason: 'Strong stack match and the client has real spend history.',
    redFlags: [],
    greenFlags: [
      { label: 'Strong stack match (React, Next.js, TypeScript)' },
      { label: 'Fintech domain fits your expertise' },
    ],
    scoredBy: 'gemini',
    scoredAt: new Date().toISOString(),
  },
  {
    id: 'd2',
    platform: 'upwork',
    title: 'Productionize Insurance Verification App (Laravel / PHP backend)',
    description: '',
    url: '#',
    postedAt: new Date(Date.now() - 86_400_000).toISOString(), // yesterday
    budget: 300,
    budgetRaw: 'Fixed-price: $300.00',
    proposalsMin: 20,
    proposalsMax: 50,
    tags: ['Laravel', 'PHP', 'insurance'],
    score: 5,
    verdict: 'MAYBE',
    reason: 'Stack mismatch - no React/Next.js',
    redFlags: [
      { label: 'Stack mismatch - no React/Next.js', severity: 'high' },
      { label: 'Client spend very low ($300)', severity: 'high' },
      { label: 'High competition (20-50 proposals)', severity: 'high' },
    ],
    greenFlags: [{ label: 'Client active recently' }],
    scoredBy: 'rules',
    scoredAt: new Date().toISOString(),
  },
  {
    id: 'd3',
    platform: 'linkedin',
    title: 'Frontend Engineer — React, Tailwind, Shopify headless (EU remote)',
    description: '',
    url: '#',
    postedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(), // 4d ago
    tags: ['React', 'Tailwind CSS', 'e-commerce'],
    score: 8,
    verdict: 'GOOD',
    reason: 'Matches your stack and the e-commerce domain fits.',
    redFlags: [],
    greenFlags: [
      { label: 'Strong stack match (React, Tailwind CSS)' },
      { label: 'E-commerce domain fits your expertise' },
    ],
    scoredBy: 'gemini',
    scoredAt: new Date().toISOString(),
  },
];
