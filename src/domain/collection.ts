import type {
  Card,
  CardFilters,
  CardSet,
  CollectionStats,
  OwnedMap,
  VariantKey,
} from './types';
import { isVariantKey } from './variants';

/** Ownership key used in localStorage and JSON backups: `${num}|${variant}`. */
export function ownershipKey(card: Pick<Card, 'num'>, variant: VariantKey): string {
  return `${card.num}|${variant}`;
}

export function isOwned(owned: OwnedMap, card: Card, variant: VariantKey): boolean {
  return owned[ownershipKey(card, variant)] === 1;
}

/** Number of owned variants for one card. */
export function ownedCount(owned: OwnedMap, card: Card): number {
  return card.variants.filter((v) => isOwned(owned, card, v)).length;
}

export function isCardComplete(owned: OwnedMap, card: Card): boolean {
  return card.variants.length > 0 && ownedCount(owned, card) === card.variants.length;
}

export function isSecretRare(set: Pick<CardSet, 'baseCount'>, card: Card): boolean {
  return card.num > set.baseCount;
}

export function totalVariants(set: Pick<CardSet, 'cards'>): number {
  return set.cards.reduce((n, c) => n + c.variants.length, 0);
}

export function computeStats(set: CardSet, owned: OwnedMap): CollectionStats {
  const total = totalVariants(set);
  const ownedVariants = set.cards.reduce((n, c) => n + ownedCount(owned, c), 0);
  const completedCards = set.cards.filter((c) => isCardComplete(owned, c)).length;
  const percent = total ? Math.round((ownedVariants / total) * 1000) / 10 : 0;
  return {
    totalCards: set.cards.length,
    totalVariants: total,
    ownedVariants,
    missingVariants: total - ownedVariants,
    completedCards,
    percent,
  };
}

/** Distinct rarities in catalog order (first appearance wins). */
export function rarityOptions(set: Pick<CardSet, 'cards'>): string[] {
  return [...new Set(set.cards.map((c) => c.rarity))];
}

export function matchesStatus(owned: OwnedMap, card: Card, status: CardFilters['status']): boolean {
  const g = ownedCount(owned, card);
  const n = card.variants.length;
  switch (status) {
    case 'all':
      return true;
    case 'missing':
      return g < n;
    case 'none':
      return g === 0;
    case 'partial':
      return g > 0 && g < n;
    case 'complete':
      return g === n;
    case 'have':
      return g > 0;
  }
}

export function filterCards(set: CardSet, owned: OwnedMap, filters: CardFilters): Card[] {
  const q = filters.query.trim().toLocaleLowerCase();
  return set.cards.filter((c) => {
    if (filters.section === 'base' && isSecretRare(set, c)) return false;
    if (filters.section === 'secret' && !isSecretRare(set, c)) return false;
    if (q) {
      const haystack = `${c.name} ${c.number} ${c.rarity} ${c.num}`.toLocaleLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.rarity !== 'all' && c.rarity !== filters.rarity) return false;
    return matchesStatus(owned, c, filters.status);
  });
}

/** Returns a new map with the variant set or cleared. Never mutates the input. */
export function setVariantOwned(
  owned: OwnedMap,
  card: Card,
  variant: VariantKey,
  value: boolean,
): OwnedMap {
  if (!card.variants.includes(variant)) return owned;
  const key = ownershipKey(card, variant);
  if (value) {
    if (owned[key] === 1) return owned;
    return { ...owned, [key]: 1 };
  }
  if (!(key in owned)) return owned;
  const next = { ...owned };
  delete next[key];
  return next;
}

/**
 * Keep only keys that correspond to real card/variant pairs in the set.
 * Protects against stale, malformed or malicious data from storage/import.
 */
export function sanitizeOwned(set: CardSet, raw: unknown): OwnedMap {
  const result: OwnedMap = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  const source = raw as Record<string, unknown>;
  for (const card of set.cards) {
    for (const variant of card.variants) {
      const key = ownershipKey(card, variant);
      if (source[key]) result[key] = 1;
    }
  }
  return result;
}

/** Parse a `num|variant` key back into its parts, or null if malformed. */
export function parseOwnershipKey(key: string): { num: number; variant: VariantKey } | null {
  const idx = key.indexOf('|');
  if (idx <= 0) return null;
  const num = Number(key.slice(0, idx));
  const variant = key.slice(idx + 1);
  if (!Number.isInteger(num) || num < 1 || !isVariantKey(variant)) return null;
  return { num, variant };
}
