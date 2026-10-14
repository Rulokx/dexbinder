import { useCallback, useState } from 'react';
import type { CardSet, Preferences } from '../domain/types';
import { loadPreferences, savePreferences } from '../storage/localStorage';

export function usePreferences(set: CardSet) {
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences(set));

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      setPreferences((current) => {
        const next = { ...current, ...patch };
        savePreferences(set, next);
        return next;
      });
    },
    [set],
  );

  return [preferences, update] as const;
}
