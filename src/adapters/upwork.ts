import type { Job, Qualification, QualKind } from '../core/types';
import { type SiteAdapter, registerAdapter, stableId, text, parseMoney, parseRelativeDate } from './adapter';

const BASE = 'https://www.upwork.com';

function abs(href: string): string {
  try {
    return new URL(href, BASE).href;
  } catch {
    return href;
  }
}

/** "Proposals: 50+" / "20 to 50" / "Less than 5" -> {min,max}. */
function parseProposals(raw: string): { min?: number; max?: number } {
  const s = raw.toLowerCase();
  const range = s.match(/(\d+)\s*to\s*(\d+)/);
  if (range) return { min: parseInt(range[1], 10), max: parseInt(range[2], 10) };
  const plus = s.match(/(\d+)\s*\+/);
  if (plus) return { min: parseInt(plus[1], 10) };
  const less = s.match(/less than\s*(\d+)/);
  if (less) return { min: 0, max: parseInt(less[1], 10) };
  const n = s.match(/(\d+)/);
  return n ? { min: parseInt(n[1], 10) } : {};
}

/**
 * Collect job tiles from either layout:
 *  - Search results (`/nx/search/jobs`): `[data-test="JobTile"]`.
 *  - Find-work feed (`/nx/find-work/*`: Best Matches / Most Recent / My Feed /
 *    Saved Jobs): one card per `h3.job-tile-title`, scoped to its closest section.
 */
function collectTiles(root: ParentNode): Element[] {
  const tiles: Element[] = [...root.querySelectorAll('[data-test="JobTile"]')];
  for (const h of root.querySelectorAll('h3.job-tile-title')) {
    const card = h.closest('section') ?? h.parentElement;
    if (card && !tiles.includes(card)) tiles.push(card);
  }
  return tiles;
}

// Relative ("5 hours ago", "yesterday", "last week") or absolute ("Posted on Jun 5, 2025").
const POSTED_RE =
  /\d+\s*(?:sec|second|min|minute|hr|hour|day|week|month|year)s?\s+ago|a\s+(?:day|week|month|year)\s+ago|just now|yesterday|today|last\s+(?:week|month|year)|posted\s+on\s+[a-z]+\s+\d{1,2},?\s*\d{4}/i;

/** Read a posted date from a tile/page: prefer the data-test node, fall back to tile text. */
function readPostedAt(scope: Element | ParentNode): string | undefined {
  const el = scope.querySelector('[data-test="posted-on"], [data-test="job-pubilshed-date"]');
  const raw = text(el) || ((scope as HTMLElement).textContent ?? '').match(POSTED_RE)?.[0];
  return parseRelativeDate(raw ?? undefined);
}

function parseList(root: ParentNode): Job[] {
  const jobs: Job[] = [];
  const seen = new Set<string>();
  for (const tile of collectTiles(root)) {
    // Title data-test is space-separated on search ("job-tile-title-link UpLink");
    // the feed uses h3.job-tile-title. Fall back to any job href.
    const link = tile.querySelector<HTMLAnchorElement>(
      '[data-test~="job-tile-title-link"], h3.job-tile-title a, a[href*="/jobs/"]',
    );
    const href = link?.getAttribute('href');
    if (!link || !href) continue;
    const url = abs(href);
    const id = stableId('upwork', new URL(url).pathname);
    if (seen.has(id)) continue;
    seen.add(id);

    // Skills: search uses [data-test="token"], the feed uses [data-test="attr-item"].
    const tags = Array.from(tile.querySelectorAll('[data-test="token"], [data-test="attr-item"]'))
      .map(text)
      .filter(Boolean);

    // Budget: search "job-type-label", feed "job-type". Only fixed-price is a real budget.
    const jobType =
      text(tile.querySelector('[data-test="job-type-label"], [data-test="job-type"]')) || undefined;
    const budget = /fixed/i.test(jobType ?? '') ? parseMoney(jobType) : undefined;

    const clientSpend = parseMoney(
      text(tile.querySelector('[data-test="total-spent"], [data-test="client-spendings"]')),
    );
    const description = text(
      tile.querySelector('[data-test~="JobDescription"], [data-test="job-description-text"]'),
    );
    const proposals = parseProposals(text(tile.querySelector('[data-test="proposals-tier"]')));

    jobs.push({
      id,
      platform: 'upwork',
      title: text(link),
      description,
      url,
      postedAt: readPostedAt(tile),
      budget,
      budgetRaw: jobType,
      clientSpend,
      // hires no longer shown on list/feed tiles -> leave undefined (don't flag as 0)
      tags,
      proposalsMin: proposals.min,
      proposalsMax: proposals.max,
    });
  }
  return jobs;
}

function qualKind(label: string): QualKind {
  if (/talent type/i.test(label)) return 'talentType';
  if (/job success/i.test(label)) return 'jobSuccess';
  if (/english/i.test(label)) return 'english';
  if (/location/i.test(label)) return 'location';
  return 'other';
}

function qualMet(li: Element): boolean {
  // Upwork marks met quals with a green check (.text-success) and unmet with .text-error.
  if (li.querySelector('.text-success, .text-positive, [data-met="true"]')) return true;
  if (li.querySelector('.text-error, .text-warning, .text-danger, [data-met="false"]')) return false;
  return true; // assume met when no negative marker present
}

function findSectionByHeading(root: ParentNode, re: RegExp): Element | null {
  for (const h of Array.from(root.querySelectorAll('h1, h2, h3, h4, h5'))) {
    const t = (h.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (t.length < 40 && re.test(t)) return h.closest('section') ?? h.parentElement;
  }
  return null;
}

function parseQualifications(root: ParentNode): Qualification[] {
  const section = findSectionByHeading(root, /preferred qualifications/i);
  if (!section) return [];
  return Array.from(section.querySelectorAll('li')).map((li) => {
    // Drop tooltip/helper text that follows the value.
    const label = (li.textContent ?? '').replace(/\s+/g, ' ').trim();
    return { kind: qualKind(label), label, met: qualMet(li) };
  });
}

function parseActivity(root: ParentNode): Partial<Job> {
  // Activity values render with the label and value on separate lines
  // ("Proposals:\n50+"), and `textContent` is polluted with embedded JSON and
  // tooltip copy — so use rendered innerText (keeping newlines), falling back
  // to textContent for jsdom. Labels require a colon so the nav "Proposals"
  // menu link can't match.
  const el = ((root as Document).body ?? root) as HTMLElement;
  const t = el.innerText || el.textContent || '';
  const out: Partial<Job> = {};
  let m: RegExpMatchArray | null;
  if ((m = t.match(/Proposals:\s*(less than\s*\d+|\d+\s*to\s*\d+|\d+\s*\+|\d+)/i))) {
    const p = parseProposals(m[1]);
    out.proposalsMin = p.min;
    out.proposalsMax = p.max;
  }
  if ((m = t.match(/Interviewing:\s*(\d+)/i))) out.interviewing = parseInt(m[1], 10);
  if ((m = t.match(/Invites sent:\s*(\d+)/i))) out.invitesSent = parseInt(m[1], 10);
  if ((m = t.match(/Last viewed by client:\s*([^\n]{1,25})/i)))
    out.lastViewedByClient = m[1].trim() || undefined;
  return out;
}

function cleanDocTitle(t: string): string {
  return t
    .split(' - Upwork')[0]
    .split(' | ')[0]
    .trim();
}

function parseDetail(root: ParentNode): Job[] {
  const doc = root as Document;
  const titleEl = root.querySelector('[data-test="job-title"], h1');
  const title = (titleEl ? text(titleEl) : '') || cleanDocTitle(doc.title ?? '');
  if (!title) return [];

  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const jobLink = root.querySelector<HTMLAnchorElement>('a[href*="/jobs/~"]')?.getAttribute('href');
  const url = abs(canonical ?? jobLink ?? (typeof location !== 'undefined' ? location.href : ''));
  const tags = Array.from(root.querySelectorAll('[data-test="token"]')).map(text).filter(Boolean);
  const description = text(root.querySelector('[data-test~="JobDescription"]'));
  const clientSpend = parseMoney(text(root.querySelector('[data-test="total-spent"]')));

  return [
    {
      id: stableId('upwork', new URL(url).pathname),
      platform: 'upwork',
      title,
      description,
      url,
      postedAt: readPostedAt(root),
      clientSpend,
      tags,
      qualifications: parseQualifications(root),
      ...parseActivity(root),
    },
  ];
}

function isDetailPage(root: ParentNode): boolean {
  if (root.querySelector('[data-test="JobTile"]')) return false; // it's a search list
  return !!(
    root.querySelector('[data-test="about-client-container"]') ||
    findSectionByHeading(root, /preferred qualifications/i) ||
    findSectionByHeading(root, /activity on this job/i)
  );
}

export const upworkAdapter: SiteAdapter = {
  platform: 'upwork',
  matches: (url) => /(^|\.)upwork\.com/.test(safeHost(url)),
  parse: (root) => (isDetailPage(root) ? parseDetail(root) : parseList(root)),
};

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

registerAdapter(upworkAdapter);
