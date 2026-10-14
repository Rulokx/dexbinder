import type { BackupV2, CardSet, OwnedMap } from './types';
import { isOwned, ownedCount, sanitizeOwned } from './collection';
import { VARIANT_KEYS, VARIANT_LABELS } from './variants';

export const BACKUP_VERSION = 2 as const;

/** Build the JSON backup object (same shape as the HTML prototype). */
export function createBackup(set: CardSet, owned: OwnedMap, now: Date = new Date()): BackupV2 {
  return {
    set: set.id,
    version: BACKUP_VERSION,
    owned: sanitizeOwned(set, owned),
    exported: now.toISOString(),
  };
}

export function serializeBackup(set: CardSet, owned: OwnedMap, now?: Date): string {
  return JSON.stringify(createBackup(set, owned, now), null, 2);
}

export type ParseBackupResult =
  | { ok: true; owned: OwnedMap; ignoredKeys: number }
  | { ok: false; error: string };

/**
 * Parse and validate a backup file for the given set.
 * - Rejects files for another set, or without an `owned` object.
 * - Accepts legacy backups (version 1/2 with `Normal`/`Especial` keys).
 * - Drops unknown/invalid ownership keys instead of importing them.
 */
export function parseBackup(set: CardSet, text: string): ParseBackupResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: `Not a valid ${set.name} backup.` };
  }
  const record = data as Record<string, unknown>;
  if (record.set !== set.id) {
    return { ok: false, error: `Not a valid ${set.name} backup.` };
  }
  const rawOwned = record.owned;
  if (!rawOwned || typeof rawOwned !== 'object' || Array.isArray(rawOwned)) {
    return { ok: false, error: `Not a valid ${set.name} backup.` };
  }
  const owned = sanitizeOwned(set, rawOwned);
  const ignoredKeys = Object.keys(rawOwned as object).length - Object.keys(owned).length;
  return { ok: true, owned, ignoredKeys };
}

const CSV_HEADER = [
  'Card Number',
  'Card Name',
  'Rarity',
  ...VARIANT_KEYS.map((v) => VARIANT_LABELS[v]),
  'Owned',
  'Missing',
];

function csvCell(value: string | number): string {
  return '"' + String(value).replaceAll('"', '""') + '"';
}

/** English CSV checklist. One row per card; `—` when a finish does not exist for that card. */
export function buildCsv(set: CardSet, owned: OwnedMap): string {
  const lines: (string | number)[][] = [CSV_HEADER];
  for (const card of set.cards) {
    const finishes = VARIANT_KEYS.map((v) =>
      card.variants.includes(v) ? (isOwned(owned, card, v) ? 'Yes' : 'No') : '—',
    );
    const got = ownedCount(owned, card);
    lines.push([card.number, card.name, card.rarity, ...finishes, got, card.variants.length - got]);
  }
  return '﻿' + lines.map((cols) => cols.map(csvCell).join(',')).join('\r\n');
}
