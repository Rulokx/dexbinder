import { describe, expect, it, vi } from 'vitest';
import { PITCH_BLACK } from '../data/sets';
import { loadOwned, loadPreferences, probeStorage, saveOwned, savePreferences } from './localStorage';

const set = PITCH_BLACK;

describe('localStorage adapter', () => {
  it('reads an existing legacy save from the original key', () => {
    localStorage.setItem(set.storage.ownedKey, JSON.stringify({ '1|Normal': 1, '4|Especial': 1, '999|Normal': 1 }));
    expect(loadOwned(set)).toEqual({ '1|Normal': 1, '4|Especial': 1 });
  });

  it('returns an empty map for missing or corrupted saves', () => {
    expect(loadOwned(set)).toEqual({});
    localStorage.setItem(set.storage.ownedKey, '{broken');
    expect(loadOwned(set)).toEqual({});
    localStorage.setItem(set.storage.ownedKey, '[1,2,3]');
    expect(loadOwned(set)).toEqual({});
  });

  it('writes under the legacy key and reports success', () => {
    expect(saveOwned(set, { '2|Normal': 1 })).toBe(true);
    expect(JSON.parse(localStorage.getItem(set.storage.ownedKey) ?? '{}')).toEqual({ '2|Normal': 1 });
    expect(probeStorage()).toBe(true);
  });

  it('reports failure instead of throwing when storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(saveOwned(set, { '2|Normal': 1 })).toBe(false);
    expect(probeStorage()).toBe(false);
    spy.mockRestore();
  });

  it('round-trips preferences and ignores invalid values', () => {
    expect(loadPreferences(set)).toEqual({ view: 'album', section: 'all' });
    savePreferences(set, { view: 'list', section: 'secret' });
    expect(loadPreferences(set)).toEqual({ view: 'list', section: 'secret' });
    localStorage.setItem(set.storage.preferencesKey, JSON.stringify({ view: 'grid', section: 'nope' }));
    expect(loadPreferences(set)).toEqual({ view: 'album', section: 'all' });
  });
});
