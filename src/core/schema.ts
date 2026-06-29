import { z } from 'zod';

export const ProfileSchema = z.object({
  headline: z.string().default('Senior Frontend Developer'),
  stack: z
    .array(z.string())
    .default(['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'JavaScript', 'GraphQL']), // primary skills
  domains: z.array(z.string()).default(['fintech', 'e-commerce', 'SaaS']),
  minBudget: z.number().nonnegative().default(500), // USD
  hourlyTarget: z.number().nonnegative().default(50),
  bio: z
    .string()
    .default(
      '10+ years building performant React/Next.js apps for international clients across fintech, e-commerce, and SaaS. Pixel-perfect UIs, strong TypeScript, and end-to-end ownership.',
    ),
});

export const RulesSchema = z.object({
  goodThreshold: z.number().min(1).max(10).default(7), // >= -> GOOD
  maybeThreshold: z.number().min(1).max(10).default(5), // >= -> MAYBE else SKIP
  minClientSpend: z.number().nonnegative().default(300), // below -> red flag (Upwork)
  requireHireHistory: z.boolean().default(true),
  blocklist: z.array(z.string()).default([]), // keywords -> hard SKIP
  mustHaveAny: z.array(z.string()).default([]), // none present -> stack mismatch flag
  maxProposals: z.number().nonnegative().default(20), // proposalsMin >= this -> high-competition flag
  avoidIfInterviewing: z.boolean().default(true), // interviewing > 0 -> red flag
  failOnUnmetQualification: z.boolean().default(true), // any unmet preferred qual -> red flag
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Rules = z.infer<typeof RulesSchema>;

export const defaultProfile = (): Profile => ProfileSchema.parse({});
export const defaultRules = (): Rules => RulesSchema.parse({});
