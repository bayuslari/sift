import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { remoteAdapter } from './remote';

const load = (name: string) =>
  new DOMParser().parseFromString(
    readFileSync(resolve(process.cwd(), 'src/adapters/__fixtures__', name), 'utf8'),
    'text/html',
  );

describe('remoteAdapter', () => {
  it('matches both remote boards', () => {
    expect(remoteAdapter.matches('https://weworkremotely.com/categories/remote-programming-jobs')).toBe(true);
    expect(remoteAdapter.matches('https://remoteok.com/remote-dev-jobs')).toBe(true);
    expect(remoteAdapter.matches('https://www.upwork.com')).toBe(false);
  });

  it('parses We Work Remotely listings (new-listing markup)', () => {
    const jobs = remoteAdapter.parse(load('wwr.html'));
    expect(jobs.length).toBe(2);
    const [first] = jobs;
    expect(first.platform).toBe('remote');
    expect(first.title).toMatch(/Frontend/);
    expect(first.description).toMatch(/Speechify/);
    expect(first.url).toMatch(/^https:\/\/weworkremotely\.com\/remote-jobs\//);
    expect(first.tags).toContain('Anywhere in the World');
  });

  it('parses RemoteOK listings', () => {
    const jobs = remoteAdapter.parse(load('remoteok.html'));
    expect(jobs.length).toBe(2);
    const [first] = jobs;
    expect(first.platform).toBe('remote');
    expect(first.title).toMatch(/Laravel/);
    expect(first.tags).toContain('Laravel');
    expect(first.url).toMatch(/^https:\/\/remoteok\.com\/remote-jobs\//);
  });
});
