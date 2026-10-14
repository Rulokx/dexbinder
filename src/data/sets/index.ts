import type { CardSet } from '../../domain/types';
import { PITCH_BLACK } from './pitch-black';

/**
 * Set registry.
 *
 * To add an expansion later:
 *   1. Add `src/data/sets/<set>.json` with its English card list.
 *   2. Add `src/data/sets/<set>.ts` exporting a `CardSet` (new sets should use
 *      storage keys of the form `dexbinder:<id>:owned:v1` / `dexbinder:<id>:prefs:v1`).
 *   3. Append it to `SETS` below. The UI shows a set switcher automatically
 *      once more than one set is registered.
 */
export const SETS: readonly CardSet[] = [PITCH_BLACK];

export const DEFAULT_SET_ID = PITCH_BLACK.id;

export function getSet(id: string): CardSet | undefined {
  return SETS.find((s) => s.id === id);
}

export { PITCH_BLACK };
