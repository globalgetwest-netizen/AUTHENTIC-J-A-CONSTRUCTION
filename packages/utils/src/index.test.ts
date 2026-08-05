import { describe, expect, it } from 'vitest';
import { clampNumber, formatDateIso, generateReference, isUuid, slugify, truncate } from './index';

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('AUTHENTIC J.A. Construction')).toBe('authentic-ja-construction');
  });

  it('strips accents and diacritics', () => {
    expect(slugify('Café Résidence')).toBe('cafe-residence');
  });

  it('collapses runs of spaces and dashes', () => {
    expect(slugify('  Land   Development --  Phase  ')).toBe('land-development-phase');
  });

  it('removes trailing and leading dashes', () => {
    expect(slugify('- - -hello- ')).toBe('hello');
  });
});

describe('generateReference', () => {
  it('prefixes with the uppercased prefix', () => {
    expect(generateReference('inv', 8)).toMatch(/^INV-[A-Z0-9]{8}$/);
  });

  it('produces unique values across many draws', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      seen.add(generateReference('ref'));
    }
    expect(seen.size).toBe(5000);
  });
});

describe('isUuid', () => {
  it('accepts a valid v4 uuid', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects non-uuids', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('550e8400e29b41d4a716446655440000')).toBe(false);
  });
});

describe('formatDateIso', () => {
  it('formats a valid date', () => {
    expect(formatDateIso(new Date('2026-01-02T03:04:05.678Z'))).toBe('2026-01-02T03:04:05.678Z');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatDateIso(new Date('invalid'))).toBe('');
  });
});

describe('clampNumber', () => {
  it('clamps into range', () => {
    expect(clampNumber(50, 0, 100)).toBe(50);
    expect(clampNumber(-5, 0, 100)).toBe(0);
    expect(clampNumber(150, 0, 100)).toBe(100);
  });
});

describe('truncate', () => {
  it('truncates and appends an ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hell…');
  });

  it('returns the input unchanged when within length', () => {
    expect(truncate('short', 20)).toBe('short');
  });
});