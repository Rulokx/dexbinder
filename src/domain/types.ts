/**
 * Core DexBinder domain types.
 *
 * IMPORTANT — backward compatibility:
 * `VariantKey` values are the *legacy internal strings* used by every
 * existing JSON backup and localStorage save (`1|Normal`, `4|Especial`, …).
 * They are storage identifiers, not display text. English display labels
 * live in `variants.ts` (`VARIANT_LABELS`). Do not rename these keys without
 * writing an explicit, tested migration.
 */
export type VariantKey = 'Normal' | 'Holo' | 'Reverse Holo' | 'Especial';

export interface Card {
  /** 1-based position inside the set. Used in ownership keys (`${num}|${variant}`). */
  num: number;
  /** Printed collector number, e.g. `001/084` or `085/084` for secret rares. */
  number: string;
  /** English card name as printed. */
  name: string;
  /** English rarity label as shown in the UI and in the rarity filter. */
  rarity: string;
  /** Only the finishes that actually exist for this card. Never invent extra ones. */
  variants: VariantKey[];
  /** Thumbnail URL (remote). */
  image: string;
  /** Full-size image URL (remote). */
  large: string;
}

export interface ExternalLink {
  label: string;
  url: string;
}

/**
 * A Pokémon TCG expansion. Everything the UI, storage layer and backup
 * format need to know about a set is declared here so that adding a new
 * expansion is a data change, not a code change.
 */
export interface CardSet {
  /** Stable identifier used in backups (`set: "me5"`). Never change once released. */
  id: string;
  /** Human-readable English name, e.g. `Pitch Black`. */
  name: string;
  /** Short printed code shown in the hero eyebrow, e.g. `ME05 / PBL`. */
  code: string;
  /** Number of cards in the base (non-secret) numbering; cards above it are secret rares. */
  baseCount: number;
  /** Full card list, ordered by `num`. */
  cards: Card[];
  /** localStorage keys. Pitch Black keeps its legacy keys on purpose. */
  storage: {
    ownedKey: string;
    preferencesKey: string;
  };
  /** Suggested file names for exports. */
  files: {
    backup: string;
    csv: string;
  };
  /** Attribution links shown in the footer. */
  links: {
    images: ExternalLink;
    reference: ExternalLink;
  };
}

/**
 * Ownership map. Keys are `${card.num}|${variantKey}`; a value of `1`
 * means the variant is owned. Absent keys mean "not owned".
 */
export type OwnedMap = Record<string, 1>;

export type ViewMode = 'album' | 'list';
export type SectionFilter = 'all' | 'base' | 'secret';
export type StatusFilter = 'all' | 'missing' | 'none' | 'partial' | 'complete' | 'have';

export interface Preferences {
  view: ViewMode;
  section: SectionFilter;
}

export interface CardFilters {
  section: SectionFilter;
  query: string;
  rarity: string; // 'all' or an exact rarity string
  status: StatusFilter;
}

export interface CollectionStats {
  totalCards: number;
  totalVariants: number;
  ownedVariants: number;
  missingVariants: number;
  completedCards: number;
  /** Rounded to one decimal, e.g. 12.4 */
  percent: number;
}

/** JSON backup format, version 2 (unchanged from the HTML prototype). */
export interface BackupV2 {
  set: string;
  version: 2;
  owned: OwnedMap;
  exported?: string;
}
