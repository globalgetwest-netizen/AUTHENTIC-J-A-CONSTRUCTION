/**
 * Shared utilities for the AUTHENTIC J.A. CONSTRUCTION LTD. ecosystem.
 *
 * This package is intentionally dependency-free and free of Node-only APIs so
 * it can be imported from web (client + server), mobile, and the API alike.
 */

const SLUG_NON_ALNUM = /[^a-z0-9\s-]/g;
const SLUG_PADDING = /^-+|-+$/g;
// Any Unicode combining mark (diatritics), stripped after NFKD normalization.
const COMBINING_MARKS = /\p{M}/gu;

/**
 * Convert any string into a URL/route-safe slug.
 * Normalizes accents, lowercases, and collapses runs of spaces/dashes.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .trim()
    .replace(SLUG_NON_ALNUM, '')
    .replace(/[\s_-]+/g, '-')
    .replace(SLUG_PADDING, '');
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

/**
 * Generates a human-friendly reference code, e.g. `INV-A1B2C3D4E5`.
 *
 * Used for invoice numbers, order references, quotation numbers, etc.
 * These are presentational/unique identifiers, NOT security tokens — for
 * cryptographic randomness use the auth/security packages.
 */
export function generateReference(prefix: string, length = 10): string {
  const upper = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let body = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * REFERENCE_ALPHABET.length);
    body += REFERENCE_ALPHABET[idx] ?? '';
  }
  return `${upper}-${body}`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Returns true when the value is a well-formed RFC 4122 UUID. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Formats a Date as an ISO-8601 string. Returns an empty string for invalid dates. */
export function formatDateIso(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

/** Clamps a number into the inclusive [min, max] range. */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Returns a truncated string with an ellipsis. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}