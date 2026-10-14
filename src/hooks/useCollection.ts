import { useCallback, useMemo, useRef, useState } from 'react';
import type { Card, CardSet, OwnedMap, VariantKey } from '../domain/types';
import { computeStats, sanitizeOwned, setVariantOwned } from '../domain/collection';
import { loadOwned, probeStorage, saveOwned } from '../storage/localStorage';

export interface CollectionApi {
  owned: OwnedMap;
  stats: ReturnType<typeof computeStats>;
  /** False when the browser refuses to persist (session-only mode). */
  saveAvailable: boolean;
  setVariant: (card: Card, variant: VariantKey, value: boolean) => void;
  replaceAll: (owned: OwnedMap) => void;
  clearAll: () => void;
}

/**
 * Owns the ownership map for one set and keeps localStorage in sync.
 * Pure logic lives in `domain/collection.ts`; this hook only wires state.
 */
export function useCollection(set: CardSet): CollectionApi {
  const [owned, setOwned] = useState<OwnedMap>(() => loadOwned(set));
  const [saveAvailable, setSaveAvailable] = useState<boolean>(() => probeStorage());

  // Latest map, readable synchronously so rapid successive clicks never
  // overwrite each other and persistence happens exactly once per change.
  const latest = useRef(owned);
  latest.current = owned;

  const persist = useCallback(
    (next: OwnedMap) => {
      latest.current = next;
      setOwned(next);
      setSaveAvailable(saveOwned(set, next));
    },
    [set],
  );

  const setVariant = useCallback(
    (card: Card, variant: VariantKey, value: boolean) => {
      const next = setVariantOwned(latest.current, card, variant, value);
      if (next !== latest.current) persist(next);
    },
    [persist],
  );

  const replaceAll = useCallback((next: OwnedMap) => persist(sanitizeOwned(set, next)), [persist, set]);
  const clearAll = useCallback(() => persist({}), [persist]);

  const stats = useMemo(() => computeStats(set, owned), [set, owned]);

  return { owned, stats, saveAvailable, setVariant, replaceAll, clearAll };
}
