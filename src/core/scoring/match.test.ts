import { describe, it, expect } from 'vitest';
import { termMatches, dedupeTerms } from './match';

describe('termMatches', () => {
  it('matches whole words case-insensitively', () => {
    expect(termMatches('We build React apps', 'react')).toBe(true);
    expect(termMatches('Strong TypeScript skills', 'TypeScript')).toBe(true);
  });

  it('does not false-match substrings', () => {
    expect(termMatches('Senior JavaScript engineer', 'Java')).toBe(false);
    expect(termMatches('Great at Google Ads', 'Go')).toBe(false);
  });

  it('keeps tech tokens with punctuation intact', () => {
    expect(termMatches('Experience with Node.js required', 'Node.js')).toBe(true);
    expect(termMatches('Strong C++ background', 'C++')).toBe(true);
  });

  it('matches via aliases', () => {
    expect(termMatches('Backend in Node.js', 'Node.js')).toBe(true);
    expect(termMatches('We use node for the API', 'Node.js')).toBe(true);
    expect(termMatches('Frontend with JS', 'JavaScript')).toBe(true);
    expect(termMatches('Built with tailwindcss', 'Tailwind CSS')).toBe(true);
  });
});

describe('dedupeTerms', () => {
  it('removes case-insensitive duplicates, preserving first', () => {
    expect(dedupeTerms(['React', 'react', 'TypeScript'])).toEqual(['React', 'TypeScript']);
  });
});
