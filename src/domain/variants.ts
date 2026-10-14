import type { VariantKey } from './types';

/**
 * Canonical order of variant keys. Used for CSV columns and for stable
 * rendering order when a card lists variants in a different order.
 */
export const VARIANT_KEYS: readonly VariantKey[] = ['Normal', 'Holo', 'Reverse Holo', 'Especial'];

/**
 * English display labels. Only the *labels* changed in the English UI —
 * the keys stay as the legacy strings for backup compatibility.
 */
export const VARIANT_LABELS: Readonly<Record<VariantKey, string>> = Object.freeze({
  Normal: 'Regular',
  Holo: 'Holo',
  'Reverse Holo': 'Reverse Holo',
  Especial: 'Special',
});

export function isVariantKey(value: unknown): value is VariantKey {
  return typeof value === 'string' && (VARIANT_KEYS as readonly string[]).includes(value);
}

export function variantLabel(variant: VariantKey): string {
  return VARIANT_LABELS[variant] ?? variant;
}
