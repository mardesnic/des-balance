import { useEffect, useState } from 'react';

import type { Language } from './i18n';

// All the des- games live on one site, so they share storage. Some settings
// are kept in one place for all of them: picking one in a game picks it in
// every game and on the games page.

type Parse<T> = (raw: string | null) => T | undefined;

const LANGUAGES: readonly string[] = ['auto', 'en', 'hr'];

export const parseLanguage: Parse<Language> = (raw) => {
  const value = parse(raw);
  return typeof value === 'string' && LANGUAGES.includes(value)
    ? (value as Language)
    : undefined;
};

export const parseSound: Parse<boolean> = (raw) => {
  const value = parse(raw);
  return typeof value === 'boolean' ? value : undefined;
};

function parse(raw: string | null): unknown {
  try {
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function read<T>(key: string, parseValue: Parse<T>, fallback: T): T {
  try {
    return parseValue(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function useShared<T>(key: string, parseValue: Parse<T>, fallback: T) {
  const [value, setState] = useState<T>(() => read(key, parseValue, fallback));

  // Another game may have changed it meanwhile: in another tab, or while
  // this page waited in the history for Back.
  useEffect(() => {
    const sync = () => setState(read(key, parseValue, fallback));
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [key, parseValue, fallback]);

  const set = (next: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Not saved; it still changes for this visit.
    }
    setState(next);
  };

  return [value, set] as const;
}

// Until one is picked, the phone's language is used.
export const useLanguage = () =>
  useShared<Language>('des-language', parseLanguage, 'auto');

// Sound and vibration, on until turned off.
export const useSound = () => useShared('des-sound', parseSound, true);
