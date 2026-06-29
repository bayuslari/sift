import { useEffect, useRef, useState } from 'react';
import {
  type Profile,
  type Rules,
  ProfileSchema,
  RulesSchema,
  defaultProfile,
  defaultRules,
} from '../core/schema';
import { hasChrome } from './api';
import {
  getProfile,
  setProfile as persistProfile,
  getRules,
  setRules as persistRules,
  getApiKey,
  setApiKey as persistApiKey,
} from '../background/storage';

interface SettingsState {
  profile: Profile;
  rules: Rules;
  apiKey: string;
  loaded: boolean;
  profileError?: string;
  rulesError?: string;
  setProfile: (patch: Partial<Profile>) => void;
  setRules: (patch: Partial<Rules>) => void;
  setApiKey: (key: string) => void;
}

const DEBOUNCE = 400;

export function useSettings(): SettingsState {
  const [profile, setProfileState] = useState<Profile>(defaultProfile());
  const [rules, setRulesState] = useState<Rules>(defaultRules());
  const [apiKey, setApiKeyState] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string>();
  const [rulesError, setRulesError] = useState<string>();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      if (hasChrome) {
        const [p, r, k] = await Promise.all([getProfile(), getRules(), getApiKey()]);
        if (!active) return;
        setProfileState(p);
        setRulesState(r);
        setApiKeyState(k ?? '');
      }
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const debounce = (key: string, fn: () => void) => {
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(fn, DEBOUNCE);
  };

  const setProfile = (patch: Partial<Profile>) => {
    const next = { ...profile, ...patch };
    setProfileState(next);
    const parsed = ProfileSchema.safeParse(next);
    setProfileError(parsed.success ? undefined : parsed.error.issues[0]?.message);
    if (parsed.success && hasChrome) debounce('profile', () => void persistProfile(parsed.data));
  };

  const setRules = (patch: Partial<Rules>) => {
    const next = { ...rules, ...patch };
    setRulesState(next);
    const parsed = RulesSchema.safeParse(next);
    setRulesError(parsed.success ? undefined : parsed.error.issues[0]?.message);
    if (parsed.success && hasChrome) debounce('rules', () => void persistRules(parsed.data));
  };

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (hasChrome) debounce('apiKey', () => void persistApiKey(key));
  };

  return {
    profile,
    rules,
    apiKey,
    loaded,
    profileError,
    rulesError,
    setProfile,
    setRules,
    setApiKey,
  };
}
