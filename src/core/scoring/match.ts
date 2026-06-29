/**
 * Boundary-aware keyword matching for scoring. Plain `includes()` produced false hits
 * ("Java" inside "JavaScript", "Go"/"C" anywhere), so we match on word boundaries that
 * treat letters, digits and the tech-token chars `+ # .` as part of a word. That keeps
 * `c++`, `c#`, `node.js`, `next.js` intact while stopping `java` ≠ `javascript`.
 */

/** Canonical term (lowercased) -> extra spellings that should also count as a match. */
const ALIASES: Record<string, string[]> = {
  javascript: ['js'],
  typescript: ['ts'],
  'node.js': ['node', 'nodejs', 'node js'],
  react: ['reactjs', 'react.js'],
  'react native': ['reactnative'],
  'next.js': ['nextjs', 'next js'],
  'nuxt.js': ['nuxt', 'nuxtjs'],
  'vue.js': ['vue', 'vuejs'],
  'tailwind css': ['tailwind', 'tailwindcss'],
  postgresql: ['postgres'],
  'e-commerce': ['ecommerce', 'e commerce'],
  fintech: ['financial technology', 'financial tech'],
  saas: ['software as a service'],
  graphql: ['graph ql'],
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when `needle` appears in `haystack` on a word boundary (case-insensitive). */
function boundaryIncludes(haystack: string, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return false;
  const re = new RegExp(`(?<![a-z0-9+#.])${escapeRegex(n)}(?![a-z0-9+#])`, 'i');
  return re.test(haystack);
}

/** Match `term` (and any known aliases) against `haystack` on word boundaries. */
export function termMatches(haystack: string, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return false;
  if (boundaryIncludes(haystack, t)) return true;
  const aliases = ALIASES[t];
  return aliases ? aliases.some((a) => boundaryIncludes(haystack, a)) : false;
}

/** Case-insensitively de-dupe a list of terms, preserving first-seen casing/order. */
export function dedupeTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of terms) {
    const key = t.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
