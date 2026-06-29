import type { Job } from '../core/types';
import { type SiteAdapter, registerAdapter, stableId, text } from './adapter';

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Authenticated jobs UI: li.scaffold-layout__list-item / [data-job-id] with artdeco lockups. */
function parseAuth(root: ParentNode): Job[] {
  const cards = Array.from(root.querySelectorAll('[data-job-id]')).filter((c) =>
    c.querySelector('.artdeco-entity-lockup__title'),
  );
  const jobs: Job[] = [];
  const seen = new Set<string>();
  for (const card of cards) {
    const jobId = card.getAttribute('data-job-id');
    if (!jobId || seen.has(jobId)) continue;
    const title = text(card.querySelector('.artdeco-entity-lockup__title'));
    if (!title) continue;
    seen.add(jobId);
    const company = text(card.querySelector('.artdeco-entity-lockup__subtitle'));
    const location = text(card.querySelector('.artdeco-entity-lockup__caption'));
    jobs.push({
      id: stableId('linkedin', jobId),
      platform: 'linkedin',
      title,
      description: [company, location].filter(Boolean).join(' — '),
      // Canonical, tracking-param-free job URL.
      url: `https://www.linkedin.com/jobs/view/${jobId}/`,
      tags: location ? [location] : [],
    });
  }
  return jobs;
}

/** Guest/public jobs UI: .base-card / .job-search-card. */
function parseGuest(root: ParentNode): Job[] {
  const cards = Array.from(root.querySelectorAll('.base-card, .job-search-card, .base-search-card'));
  const jobs: Job[] = [];
  const seen = new Set<string>();
  for (const card of cards) {
    const link = card.querySelector<HTMLAnchorElement>(
      'a.base-card__full-link, a[href*="/jobs/view/"]',
    );
    const url = link?.getAttribute('href') ?? '';
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const title = text(card.querySelector('.base-search-card__title, h3'));
    if (!title) continue;
    const company = text(card.querySelector('.base-search-card__subtitle, h4'));
    const location = text(card.querySelector('.job-search-card__location, .job-result-card__location'));
    jobs.push({
      id: stableId('linkedin', url),
      platform: 'linkedin',
      title,
      description: [company, location].filter(Boolean).join(' — '),
      url,
      tags: location ? [location] : [],
    });
  }
  return jobs;
}

export const linkedinAdapter: SiteAdapter = {
  platform: 'linkedin',
  matches: (url) => /(^|\.)linkedin\.com/.test(host(url)),
  parse(root) {
    const auth = parseAuth(root);
    return auth.length ? auth : parseGuest(root);
  },
};

registerAdapter(linkedinAdapter);
