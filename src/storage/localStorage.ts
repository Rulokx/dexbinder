import type { CardSet, OwnedMap, Preferences } from '../domain/types';
import { sanitizeOwned } from '../domain/collection';

/**
 * Thin localStorage adapter. Every function is defensive: `file://` pages,
 * private windows and locked-down browsers can throw on access, and the app
 * must keep working in "session only" mode when that happens.
 */

export const DEFAULT_PREFERENCES: Preferences = { view: 'album', section: 'all' };

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** True when localStorage can be written. */
export function probeStorage(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const probe = '__dexbinder_test__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function loadOwned(set: CardSet): OwnedMap {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(set.storage.ownedKey);
    if (!raw) return {};
    return sanitizeOwned(set, JSON.parse(raw));
  } catch {
    return {};
  }
}

/** Returns true on success, false when the browser refused the write. */
export function saveOwned(set: CardSet, owned: OwnedMap): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(set.storage.ownedKey, JSON.stringify(owned));
    return true;
  } catch {
    return false;
  }
}

export function loadPreferences(set: CardSet): Preferences {
  const storage = getStorage();
  const prefs: Preferences = { ...DEFAULT_PREFERENCES };
  if (!storage) return prefs;
  try {
    const raw = storage.getItem(set.storage.preferencesKey);
    if (!raw) return prefs;
    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
    if (parsed.view === 'list' || parsed.view === 'album') prefs.view = parsed.view;
    if (parsed.section === 'all' || parsed.section === 'base' || parsed.section === 'secret') {
      prefs.section = parsed.section;
    }
    return prefs;
  } catch {
    return prefs;
  }
}

export function savePreferences(set: CardSet, prefs: Preferences): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(set.storage.preferencesKey, JSON.stringify(prefs));
  } catch {
    /* ignore — preferences are a convenience */
  }
}
