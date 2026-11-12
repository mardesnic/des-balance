import { useEffect, useState } from 'react';

// useState that survives reloads. Storage can be missing or blocked
// (private mode), so every access is guarded and falls back to `initial`.
export function useStoredState<T extends object>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? { ...initial, ...JSON.parse(saved) } : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Not saved; the app still works for this visit.
    }
  }, [key, state]);

  return [state, setState] as const;
}
