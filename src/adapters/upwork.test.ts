import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { upworkAdapter } from './upwork';

const load = (name: string) =>
  new DOMParser().parseFromString(
    readFileSync(resolve(process.cwd(), 'src/adapters/__fixtures__', name), 'utf8'),
    'text/html',
  );

const doc = load('upwork.html');

describe('upworkAdapter', () => {
  it('matches upwork search URLs', () => {
    expect(upworkAdapter.matches('https://www.upwork.com/nx/search/jobs/?q=laravel')).toBe(true);
    expect(upworkAdapter.matches('https://www.linkedin.com/jobs')).toBe(false);
  });

  it('parses jobs with title, url, tags, spend and proposals', () => {
    const jobs = upworkAdapter.parse(doc);
    expect(jobs.length).toBe(2);
    const [first] = jobs;
    expect(first.title).toMatch(/Full-Stack/);
    expect(first.url).toMatch(/^https:\/\/www\.upwork\.com\/jobs\//);
    expect(first.platform).toBe('upwork');
    expect(first.tags).toContain('React');
    expect(first.clientSpend).toBe(100000); // "$100K+ spent"
    expect(first.proposalsMin).toBe(50); // "Proposals: 50+"
    expect(first.clientHires).toBeUndefined(); // not shown on list tile
    // hourly job: numeric budget undefined, raw kept
    expect(first.budget).toBeUndefined();
    expect(first.budgetRaw).toMatch(/Hourly/);
  });

  it('parses a fixed-price low-spend second tile', () => {
    const [, second] = upworkAdapter.parse(doc);
    expect(second.budget).toBe(80); // "Fixed-price: $80.00"
    expect(second.clientSpend).toBe(200);
    expect(second.proposalsMin).toBe(0); // "Less than 5"
    expect(second.proposalsMax).toBe(5);
  });

  it('assigns a stable id derived from the listing url', () => {
    const a = upworkAdapter.parse(doc);
    const b = upworkAdapter.parse(doc);
    expect(a[0].id).toBe(b[0].id);
    expect(a[0].id).not.toBe(a[1].id);
  });

  it('parses the find-work feed layout (job-tile-title cards)', () => {
    const feed = load('upwork-feed.html');
    const jobs = upworkAdapter.parse(feed);
    expect(jobs.length).toBe(2);
    const [first, second] = jobs;
    expect(first.title).toMatch(/Design Engineer/);
    expect(first.url).toMatch(/^https:\/\/www\.upwork\.com\/jobs\//);
    expect(first.tags).toContain('Tailwind CSS'); // attr-item skills
    expect(first.clientSpend).toBe(90000); // client-spendings "$90K+ spent"
    expect(first.proposalsMin).toBe(0); // "Less than 5"
    expect(first.proposalsMax).toBe(5);
    expect(first.budget).toBeUndefined(); // hourly
    expect(second.budget).toBe(60); // "Fixed-price: $60.00"
    expect(second.clientSpend).toBe(300);
    expect(second.proposalsMin).toBe(50);
  });

  it('parses detail-page qualifications and activity signals', () => {
    const detail = load('upwork-detail.html');
    const jobs = upworkAdapter.parse(detail);
    expect(jobs.length).toBe(1);
    const [job] = jobs;
    expect(job.title).toMatch(/Insurance Dashboard/); // from document.title, before " | "
    expect(job.proposalsMin).toBe(20);
    expect(job.proposalsMax).toBe(50);
    expect(job.interviewing).toBe(2);
    expect(job.invitesSent).toBe(0);
    expect(job.lastViewedByClient).toBe('yesterday');
    expect(job.clientSpend).toBe(50000);
    expect(job.qualifications?.some((q) => q.kind === 'location' && q.met === false)).toBe(true);
    expect(job.qualifications?.some((q) => q.kind === 'jobSuccess' && q.met === true)).toBe(true);
    expect(job.qualifications?.some((q) => q.kind === 'english' && q.met === true)).toBe(true);
  });
});
