import { describe, expect, it } from 'vitest';
import { PITCH_BLACK } from '../data/sets';
import {
  computeStats,
  filterCards,
  isSecretRare,
  ownershipKey,
  parseOwnershipKey,
  rarityOptions,
  sanitizeOwned,
  setVariantOwned,
  totalVariants,
} from './collection';
import { VARIANT_LABELS, isVariantKey } from './variants';
import type { OwnedMap, StatusFilter } from './types';

const set = PITCH_BLACK;
const card = (num: number) => {
  const c = set.cards[num - 1];
  if (!c) throw new Error(`No card #${num}`);
  return c;
};

describe('Pitch Black dataset invariants', () => {
  it('has 120 cards and 194 tracked variants', () => {
    expect(set.cards).toHaveLength(120);
    expect(totalVariants(set)).toBe(194);
  });

  it('numbers cards 1..120 in order with a printed collector number', () => {
    set.cards.forEach((c, i) => {
      expect(c.num).toBe(i + 1);
      expect(c.number).toMatch(/^\d{3}\/084$/);
    });
  });

  it('only uses the four legacy variant keys and never repeats a key on a card', () => {
    for (const c of set.cards) {
      expect(c.variants.length).toBeGreaterThan(0);
      expect(new Set(c.variants).size).toBe(c.variants.length);
      for (const v of c.variants) expect(isVariantKey(v)).toBe(true);
    }
  });

  it('splits base (84) and secret rares (36) at baseCount', () => {
    const secret = set.cards.filter((c) => isSecretRare(set, c));
    expect(set.baseCount).toBe(84);
    expect(secret).toHaveLength(36);
    expect(secret[0]?.number).toBe('085/084');
  });

  it('keeps the legacy localStorage keys and backup id', () => {
    expect(set.id).toBe('me5');
    expect(set.storage.ownedKey).toBe('pokemon-pitch-black-master-194-visual-v1');
    expect(set.storage.preferencesKey).toBe('pokemon-pitch-black-preferences-v2');
  });

  it('maps internal variant keys to English labels', () => {
    expect(VARIANT_LABELS.Normal).toBe('Regular');
    expect(VARIANT_LABELS.Especial).toBe('Special');
    expect(VARIANT_LABELS.Holo).toBe('Holo');
    expect(VARIANT_LABELS['Reverse Holo']).toBe('Reverse Holo');
  });
});

describe('ownership and stats', () => {
  it('builds legacy-compatible ownership keys', () => {
    expect(ownershipKey(card(1), 'Normal')).toBe('1|Normal');
    expect(ownershipKey(card(4), 'Especial')).toBe('4|Especial');
    expect(parseOwnershipKey('12|Reverse Holo')).toEqual({ num: 12, variant: 'Reverse Holo' });
    expect(parseOwnershipKey('nope')).toBeNull();
    expect(parseOwnershipKey('1|Shiny')).toBeNull();
  });

  it('computes progress from the ownership map', () => {
    const owned: OwnedMap = { '1|Normal': 1, '1|Reverse Holo': 1, '4|Especial': 1 };
    const stats = computeStats(set, owned);
    expect(stats.totalCards).toBe(120);
    expect(stats.totalVariants).toBe(194);
    expect(stats.ownedVariants).toBe(3);
    expect(stats.missingVariants).toBe(191);
    expect(stats.completedCards).toBe(2); // Tropius (2/2) and Lurantis ex (1/1)
    expect(stats.percent).toBe(1.5);
  });

  it('setVariantOwned is immutable and ignores variants the card does not have', () => {
    const start: OwnedMap = {};
    const a = setVariantOwned(start, card(1), 'Normal', true);
    expect(a).not.toBe(start);
    expect(a['1|Normal']).toBe(1);
    expect(start['1|Normal']).toBeUndefined();

    // Card #1 (Tropius, Common) has no Holo finish.
    expect(setVariantOwned(a, card(1), 'Holo', true)).toBe(a);

    const b = setVariantOwned(a, card(1), 'Normal', false);
    expect(b['1|Normal']).toBeUndefined();
    expect(setVariantOwned(b, card(1), 'Normal', false)).toBe(b);
  });

  it('sanitizeOwned drops unknown, malformed or malicious keys', () => {
    const raw = {
      '2|Normal': 1,
      '4|Especial': true,
      '999|Especial': 1, // no such card
      '1|Holo': 1, // Tropius has no Holo finish
      '1|Normal': 0, // falsy → not owned
      __proto__: { polluted: 1 },
      constructor: 1,
    };
    const cleaned = sanitizeOwned(set, raw);
    expect(Object.keys(cleaned).sort()).toEqual(['2|Normal', '4|Especial']);
    expect(sanitizeOwned(set, null)).toEqual({});
    expect(sanitizeOwned(set, [1, 2])).toEqual({});
    expect(sanitizeOwned(set, 'junk')).toEqual({});
  });
});

describe('filtering', () => {
  const owned: OwnedMap = { '1|Normal': 1, '4|Especial': 1 }; // #1 partial, #4 complete
  const base = { section: 'all' as const, query: '', rarity: 'all', status: 'all' as const };

  it('section tabs split base and secret cards', () => {
    expect(filterCards(set, owned, base)).toHaveLength(120);
    expect(filterCards(set, owned, { ...base, section: 'base' })).toHaveLength(84);
    const secret = filterCards(set, owned, { ...base, section: 'secret' });
    expect(secret).toHaveLength(36);
    expect(secret.every((c) => c.num > 84)).toBe(true);
  });

  it('search matches name, printed number, rarity and index, case-insensitively', () => {
    expect(filterCards(set, owned, { ...base, query: 'tropius' }).map((c) => c.num)).toEqual([1]);
    expect(filterCards(set, owned, { ...base, query: '085/084' }).map((c) => c.num)).toEqual([85]);
    expect(filterCards(set, owned, { ...base, query: 'Mega Darkrai' }).map((c) => c.num)).toEqual([
      48, 101, 116, 120,
    ]);
    expect(filterCards(set, owned, { ...base, query: 'mega hyper' })).toHaveLength(1);
  });

  it('rarity filter uses exact rarity strings from the catalog', () => {
    const rarities = rarityOptions(set);
    expect(rarities).toContain('Double Rare (ex)');
    expect(rarities).toContain('Illustration Rare');
    const ex = filterCards(set, owned, { ...base, rarity: 'Double Rare (ex)' });
    expect(ex.length).toBeGreaterThan(0);
    expect(ex.every((c) => c.rarity === 'Double Rare (ex)')).toBe(true);
  });

  it('status filter distinguishes none / partial / complete / missing / have', () => {
    const by = (status: StatusFilter) => filterCards(set, owned, { ...base, status }).map((c) => c.num);
    expect(by('complete')).toEqual([4]);
    expect(by('partial')).toEqual([1]);
    expect(by('have').sort((a, b) => a - b)).toEqual([1, 4]);
    expect(by('missing')).toHaveLength(119);
    expect(by('missing')).not.toContain(4);
    expect(by('none')).toHaveLength(118);
  });
});
