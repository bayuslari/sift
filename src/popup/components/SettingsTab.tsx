import { useSettings } from '../useSettings';
import {
  Field,
  Section,
  TextInput,
  TextArea,
  NumberInput,
  Slider,
  TagsInput,
  ToggleRow,
} from './fields';

export function SettingsTab() {
  const s = useSettings();

  return (
    <div className="pb-6">
      <Section title="Profile">
        <Field label="Headline" error={s.profileError}>
          <TextInput
            value={s.profile.headline}
            onChange={(e) => s.setProfile({ headline: e.target.value })}
            placeholder="Senior Laravel Engineer"
          />
        </Field>
        <Field label="Your stack" help="Skills you want jobs scored against.">
          <TagsInput
            values={s.profile.stack}
            onChange={(stack) => s.setProfile({ stack })}
            placeholder="Add a skill, press Enter"
          />
        </Field>
        <Field label="Domains" help="Industries you know well — boosts matching jobs.">
          <TagsInput
            values={s.profile.domains}
            onChange={(domains) => s.setProfile({ domains })}
            placeholder="fintech, insurance…"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min budget">
            <NumberInput
              value={s.profile.minBudget}
              onChange={(minBudget) => s.setProfile({ minBudget })}
              prefix="$"
            />
          </Field>
          <Field label="Target hourly">
            <NumberInput
              value={s.profile.hourlyTarget}
              onChange={(hourlyTarget) => s.setProfile({ hourlyTarget })}
              prefix="$"
            />
          </Field>
        </div>
        <Field label="Bio" help="Used to tailor auto-drafted proposals.">
          <TextArea
            value={s.profile.bio}
            onChange={(e) => s.setProfile({ bio: e.target.value })}
            placeholder="15 years building Laravel backends for fintech and insurance…"
          />
        </Field>
      </Section>

      <Section title="Scoring rules">
        <Field label="GOOD threshold" help="Score at or above this is a match.">
          <Slider value={s.rules.goodThreshold} onChange={(goodThreshold) => s.setRules({ goodThreshold })} />
        </Field>
        <Field label="MAYBE threshold" error={s.rulesError}>
          <Slider value={s.rules.maybeThreshold} onChange={(maybeThreshold) => s.setRules({ maybeThreshold })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min client spend">
            <NumberInput
              value={s.rules.minClientSpend}
              onChange={(minClientSpend) => s.setRules({ minClientSpend })}
              prefix="$"
            />
          </Field>
          <Field label="Max proposals">
            <NumberInput
              value={s.rules.maxProposals}
              onChange={(maxProposals) => s.setRules({ maxProposals })}
            />
          </Field>
        </div>
        <ToggleRow
          label="Require hire history"
          help="Flag clients who have never hired."
          checked={s.rules.requireHireHistory}
          onChange={(requireHireHistory) => s.setRules({ requireHireHistory })}
        />
        <ToggleRow
          label="Avoid if interviewing"
          help="Flag jobs where the client is already interviewing."
          checked={s.rules.avoidIfInterviewing}
          onChange={(avoidIfInterviewing) => s.setRules({ avoidIfInterviewing })}
        />
        <ToggleRow
          label="Flag unmet qualifications"
          help="Penalize jobs you don't qualify for (location, JSS…)."
          checked={s.rules.failOnUnmetQualification}
          onChange={(failOnUnmetQualification) => s.setRules({ failOnUnmetQualification })}
        />
        <Field label="Blocklist" help="Any of these words → instant SKIP.">
          <TagsInput
            values={s.rules.blocklist}
            onChange={(blocklist) => s.setRules({ blocklist })}
            placeholder="wordpress, shopify…"
          />
        </Field>
        <Field label="Must have any" help="Job must mention at least one of these.">
          <TagsInput
            values={s.rules.mustHaveAny}
            onChange={(mustHaveAny) => s.setRules({ mustHaveAny })}
            placeholder="Laravel, PHP…"
          />
        </Field>
      </Section>

      <Section title="AI scoring (optional)">
        <Field
          label="Gemini API key"
          help="Get a free key at Google AI Studio. No key? Sift scores with rules only — still free."
        >
          <TextInput
            type="password"
            value={s.apiKey}
            onChange={(e) => s.setApiKey(e.target.value)}
            placeholder="AIza…"
            autoComplete="off"
          />
        </Field>
      </Section>
    </div>
  );
}
