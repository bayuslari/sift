export type Platform = 'upwork' | 'linkedin' | 'remote';
export type Verdict = 'GOOD' | 'MAYBE' | 'SKIP';

export interface Job {
  id: string; // stable hash of platform + sourceUrl
  platform: Platform;
  title: string;
  description: string;
  url: string;
  postedAt?: string; // ISO if available
  budget?: number; // normalized USD, undefined if unknown
  budgetRaw?: string; // original text e.g. "$300" or "Hourly"
  clientSpend?: number; // USD, Upwork only
  clientHires?: number; // Upwork only
  tags: string[]; // skills/keywords parsed from listing
  // --- Upwork job-detail signals (present only on a job detail page) ---
  qualifications?: Qualification[]; // "Preferred qualifications" with met/unmet
  proposalsMin?: number; // e.g. "20 to 50" -> 20
  proposalsMax?: number; // e.g. "20 to 50" -> 50
  interviewing?: number; // clients currently interviewing
  invitesSent?: number;
  lastViewedByClient?: string; // raw, e.g. "yesterday"
}

export type QualKind =
  | 'talentType'
  | 'jobSuccess'
  | 'english'
  | 'location'
  | 'other';

export interface Qualification {
  kind: QualKind;
  label: string; // raw e.g. "Location: Europe"
  met: boolean; // parsed from the green/red marker on the page
}

export interface RedFlag {
  label: string;
  severity: 'low' | 'high';
}

export interface GreenFlag {
  label: string;
}

export interface ScoredJob extends Job {
  score: number; // 1..10
  verdict: Verdict;
  reason: string; // one-line "why"
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  scoredBy: 'rules' | 'gemini';
  scoredAt: string; // ISO
  proposal?: string; // lazily generated
}
