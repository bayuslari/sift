# Sift — AI Job Filter & Scorer for Upwork, LinkedIn & Remote Jobs

> Your job feed, pre-filtered.

Sift is a Chrome extension that reads job listings as you browse Upwork, LinkedIn Jobs, and remote boards, scores each one **1–10** against your profile, flags red flags, and tells you in one line whether a job is worth your time — so you reply to the 10 good ones instead of scrolling past 700.

**Chrome Web Store listing**

- **Title:** Sift — AI Job Filter & Scorer for Upwork, LinkedIn & Remote Jobs
- **Short description:** Auto-score every job 1–10 against your stack, flag red flags, and skip the noise — for Upwork, LinkedIn & remote boards.

## Features

- **1–10 scoring** of every job against your stack, domains, and budget rules.
- **Red / green flags** — low client spend, no hire history, stack mismatch, high competition (20–50 proposals), already-interviewing clients, unmet preferred qualifications (location, Job Success Score, English).
- **One-line verdict** (GOOD / MAYBE / SKIP) explaining why.
- **Editable profile + rules** — define your stack, domains, budget floor, blocklist, and thresholds.
- **Auto-drafted proposals** for strong matches (optional, needs a Gemini key).
- **Saved history + analytics** — match rate, average score, jobs by platform, your most common red flags, and best-paying niches.
- **Desktop notifications + auto-refresh** so a new strong match finds you.

## Scoring: free, no paid API

Sift never uses a paid Anthropic key. Two modes, both **$0**:

1. **Rules only (default, no key needed).** Deterministic scoring from your profile + rules. Instant, private, free.
2. **Gemini-enhanced (optional).** Paste a **free** Google Gemini API key for a sharper score, a nuanced one-line reason, and proposal drafting.
   - Get a key at [Google AI Studio](https://aistudio.google.com/app/apikey) — the free tier covers normal use, no billing required.
   - The rules engine pre-filters obvious junk first, so most jobs never spend an API call.

> A Claude Pro subscription does **not** include API access, so Sift does not use Claude. The rules-only path means it works fully without any key at all.

**Privacy:** profile, rules, key, and history live in `chrome.storage.local` on your machine. Job text is sent to Google **only** when you have configured a Gemini key.

## Supported sites

- Upwork (search results **and** job detail pages, including the "Activity on this job" and "Preferred qualifications" panels)
- LinkedIn Jobs
- We Work Remotely
- RemoteOK

## Develop

```bash
npm install
npm run dev      # vite dev server (popup at /src/popup/index.html)
npm test         # vitest unit suite (scoring, adapters, pipeline, analytics)
npm run build    # type-check + production build into dist/
```

Load it in Chrome:

1. `npm run build`
2. Open `chrome://extensions`, enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder
4. Open Settings in the popup, set your profile, and (optionally) paste a free Gemini key
5. Browse a job search on any supported site — matches appear in the popup and the toolbar badge

## Tech

TypeScript · React · Vite + CRXJS (Manifest V3) · Tailwind CSS · Zustand · Zod · Framer Motion · Google Gemini (`gemini-2.0-flash`).

The pure scoring/adapter core (`src/core`, `src/adapters`) never touches `chrome.*` and is fully unit-tested.
