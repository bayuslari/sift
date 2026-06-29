import type { Job } from '../core/types';
import { type SiteAdapter, registerAdapter, stableId, text } from './adapter';

const WWR_BASE = 'https://weworkremotely.com';
const ROK_BASE = 'https://remoteok.com';

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function abs(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function parseRemoteOk(root: ParentNode): Job[] {
  const rows = Array.from(root.querySelectorAll('tr.job'));
  const jobs: Job[] = [];
  for (const row of rows) {
    const href = row.getAttribute('data-url') ?? row.querySelector('a.preventLink')?.getAttribute('href') ?? '';
    if (!href) continue;
    const url = abs(href, ROK_BASE);
    const title = text(row.querySelector('h2[itemprop="title"], h2'));
    const company = text(row.querySelector('h3[itemprop="name"]'));
    const tags = Array.from(row.querySelectorAll('td.tags .tag')).map(text).filter(Boolean);
    if (!title) continue;
    jobs.push({
      id: stableId('remote', url),
      platform: 'remote',
      title,
      description: company,
      url,
      tags,
    });
  }
  return jobs;
}

function parseWwr(root: ParentNode): Job[] {
  // Current WWR markup: <li class="new-listing-container"> with a listing-link.
  const containers = Array.from(root.querySelectorAll('li.new-listing-container'));
  const jobs: Job[] = [];
  const seen = new Set<string>();
  for (const li of containers) {
    const link = li.querySelector<HTMLAnchorElement>(
      'a.listing-link--unlocked, a[href*="/remote-jobs/"]',
    );
    const href = link?.getAttribute('href') ?? '';
    if (!href || seen.has(href)) continue;
    seen.add(href);
    const url = abs(href, WWR_BASE);
    const title = text(li.querySelector('.new-listing__header__title__text, .title'));
    const company = text(li.querySelector('.new-listing__company-name, .company'));
    const hq = text(li.querySelector('.new-listing__company-headquarters'));
    const cats = Array.from(li.querySelectorAll('.new-listing__categories__category'))
      .map(text)
      .filter(Boolean);
    if (!title) continue;
    jobs.push({
      id: stableId('remote', url),
      platform: 'remote',
      title,
      description: [company, hq].filter(Boolean).join(' — '),
      url,
      tags: cats,
    });
  }
  if (jobs.length) return jobs;
  return parseWwrLegacy(root);
}

/** Pre-2024 WWR markup, kept as a fallback. */
function parseWwrLegacy(root: ParentNode): Job[] {
  const links = Array.from(root.querySelectorAll('section.jobs li a[href*="/remote-jobs/"]'));
  const jobs: Job[] = [];
  const seen = new Set<string>();
  for (const link of links) {
    const href = link.getAttribute('href') ?? '';
    if (!href || seen.has(href)) continue;
    seen.add(href);
    const url = abs(href, WWR_BASE);
    const title = text(link.querySelector('.title'));
    if (!title) continue;
    jobs.push({
      id: stableId('remote', url),
      platform: 'remote',
      title,
      description: [text(link.querySelector('.company')), text(link.querySelector('.region'))]
        .filter(Boolean)
        .join(' — '),
      url,
      tags: [],
    });
  }
  return jobs;
}

export const remoteAdapter: SiteAdapter = {
  platform: 'remote',
  matches: (url) => /(^|\.)weworkremotely\.com|(^|\.)remoteok\.com/.test(host(url)),
  parse: (root) => (root.querySelector('tr.job') ? parseRemoteOk(root) : parseWwr(root)),
};

registerAdapter(remoteAdapter);
