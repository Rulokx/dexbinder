import { describe, expect, it } from 'vitest';
import { PITCH_BLACK } from '../data/sets';
import { buildCsv, createBackup, parseBackup, serializeBackup } from './backup';
import type { OwnedMap } from './types';

const set = PITCH_BLACK;

describe('JSON backup (version 2)', () => {
  it('exports the legacy shape with internal variant keys untouched', () => {
    const owned: OwnedMap = { '1|Normal': 1, '4|Especial': 1, '12|Holo': 1 };
    const backup = createBackup(set, owned, new Date('2026-10-13T12:00:00Z'));
    expect(backup).toEqual({
      set: 'me5',
      version: 2,
      owned: { '1|Normal': 1, '4|Especial': 1, '12|Holo': 1 },
      exported: '2026-10-13T12:00:00.000Z',
    });
    // Display labels must never leak into the file.
    const text = serializeBackup(set, owned);
    expect(text).not.toMatch(/Regular|Special"/);
  });

  it('round-trips export → import without losing ownership', () => {
    const owned: OwnedMap = { '1|Normal': 1, '1|Reverse Holo': 1, '85|Especial': 1, '120|Especial': 1 };
    const result = parseBackup(set, serializeBackup(set, owned));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.owned).toEqual(owned);
      expect(result.ignoredKeys).toBe(0);
    }
  });

  it('imports a legacy backup (Spanish-era keys, no exported timestamp)', () => {
    const legacy = JSON.stringify({ set: 'me5', version: 2, owned: { '2|Normal': 1, '4|Especial': 1 } });
    const result = parseBackup(set, legacy);
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.owned).sort()).toEqual(['2|Normal', '4|Especial']);
  });

  it('drops unknown or invalid keys and reports how many were ignored', () => {
    const text = JSON.stringify({
      set: 'me5',
      version: 2,
      owned: { '2|Normal': 1, '4|Especial': 1, '999|Especial': 1, '1|Holo': 1, 'x|y': 1 },
    });
    const result = parseBackup(set, text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.owned).sort()).toEqual(['2|Normal', '4|Especial']);
      expect(result.ignoredKeys).toBe(3);
    }
  });

  it('rejects files for another set, malformed JSON, and missing owned maps', () => {
    expect(parseBackup(set, JSON.stringify({ set: 'sv1', version: 2, owned: {} }))).toEqual({
      ok: false,
      error: 'Not a valid Pitch Black backup.',
    });
    expect(parseBackup(set, '{not json')).toEqual({ ok: false, error: 'The file is not valid JSON.' });
    expect(parseBackup(set, JSON.stringify({ set: 'me5', version: 2 })).ok).toBe(false);
    expect(parseBackup(set, JSON.stringify({ set: 'me5', version: 2, owned: [1, 2] })).ok).toBe(false);
    expect(parseBackup(set, JSON.stringify([])).ok).toBe(false);
    expect(parseBackup(set, 'null').ok).toBe(false);
  });
});

describe('CSV checklist', () => {
  it('uses English headers and Yes/No/— values, one row per card', () => {
    const owned: OwnedMap = { '1|Normal': 1 };
    const csv = buildCsv(set, owned);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(121);
    expect(lines[0]).toBe(
      '﻿"Card Number","Card Name","Rarity","Regular","Holo","Reverse Holo","Special","Owned","Missing"',
    );
    // Tropius: Regular owned, no Holo finish, Reverse Holo missing, no Special finish.
    expect(lines[1]).toBe('"001/084","Tropius","Common","Yes","—","No","—","1","1"');
    // Lurantis ex: only a Special finish.
    expect(lines[4]).toBe('"004/084","Lurantis ex","Double Rare (ex)","—","—","—","No","0","1"');
    expect(csv).not.toMatch(/Especial|Normal|Sí/);
  });

  it('escapes double quotes inside values', () => {
    const custom = {
      ...set,
      cards: [{ ...set.cards[0]!, name: 'Say "hi"' }],
    };
    const csv = buildCsv(custom, {});
    expect(csv.split('\r\n')[1]).toContain('"Say ""hi"""');
  });
});
