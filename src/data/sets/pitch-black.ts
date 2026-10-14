import type { Card, CardSet } from '../../domain/types';
import rawCards from './pitch-black.json';

/**
 * Pitch Black (ME05 / PBL).
 *
 * The card list is the snapshot that shipped with the HTML prototype
 * (120 numbered entries, 194 tracked variants). It has NOT been
 * independently verified against an authoritative Pokémon TCG set record —
 * treat rarities/finishes as "as recorded in the prototype", not as ground truth.
 *
 * The storage keys below are the LEGACY keys of the one-file prototype.
 * Keeping them means existing browser saves keep working without a migration.
 */
export const PITCH_BLACK: CardSet = {
  id: 'me5',
  name: 'Pitch Black',
  code: 'ME05 / PBL',
  baseCount: 84,
  cards: rawCards as Card[],
  storage: {
    ownedKey: 'pokemon-pitch-black-master-194-visual-v1',
    preferencesKey: 'pokemon-pitch-black-preferences-v2',
  },
  files: {
    backup: 'DexBinder_PitchBlack_Backup.json',
    csv: 'DexBinder_PitchBlack_Checklist.csv',
  },
  links: {
    images: { label: 'Scrydex', url: 'https://scrydex.com/pokemon/expansions/pitch-black/me5' },
    reference: { label: 'NinePocket', url: 'https://www.ninepocket.net/sets/me5' },
  },
};
