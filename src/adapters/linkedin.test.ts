import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { linkedinAdapter } from './linkedin';

const doc = new DOMParser().parseFromString(
  readFileSync(resolve(process.cwd(), 'src/adapters/__fixtures__/linkedin.html'), 'utf8'),
  'text/html',
);

describe('linkedinAdapter', () => {
  it('matches linkedin URLs only', () => {
    expect(linkedinAdapter.matches('https://www.linkedin.com/jobs/search/?keywords=react')).toBe(true);
    expect(linkedinAdapter.matches('https://www.upwork.com/nx/search')).toBe(false);
  });

  it('parses authenticated job cards, deduped by job id', () => {
    const jobs = linkedinAdapter.parse(doc);
    expect(jobs.length).toBe(2); // duplicate data-job-id nodes collapse to one
    const [first] = jobs;
    expect(first.platform).toBe('linkedin');
    expect(first.title).toMatch(/Frontend/);
    expect(first.description).toMatch(/Crossing Hurdles/);
    expect(first.url).toBe('https://www.linkedin.com/jobs/view/4418828826/'); // tracking params stripped
    expect(first.tags).toContain('Jakarta, Indonesia (Remote)');
  });

  it('tolerates missing budget/spend (undefined)', () => {
    const [first] = linkedinAdapter.parse(doc);
    expect(first.budget).toBeUndefined();
    expect(first.clientSpend).toBeUndefined();
  });

  it('gives stable distinct ids', () => {
    const jobs = linkedinAdapter.parse(doc);
    expect(jobs[0].id).not.toBe(jobs[1].id);
    expect(linkedinAdapter.parse(doc)[0].id).toBe(jobs[0].id);
  });

  it('falls back to guest .base-card markup', () => {
    const guest = new DOMParser().parseFromString(
      `<ul><li><div class="base-card">
         <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/999/"></a>
         <h3 class="base-search-card__title">React Developer</h3>
         <h4 class="base-search-card__subtitle">Acme</h4>
         <span class="job-search-card__location">Berlin</span>
       </div></li></ul>`,
      'text/html',
    );
    const jobs = linkedinAdapter.parse(guest);
    expect(jobs.length).toBe(1);
    expect(jobs[0].title).toBe('React Developer');
  });
});
