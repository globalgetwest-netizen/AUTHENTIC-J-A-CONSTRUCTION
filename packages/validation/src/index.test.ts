import { describe, expect, it } from 'vitest';
import { amountSchema, paginationSchema, passwordSchema, uuidSchema } from './index';

describe('uuidSchema', () => {
  it('accepts a valid v4 uuid', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
  });

  it('rejects a non-uuid', () => {
    expect(uuidSchema.safeParse('nope').success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('defaults page and pageSize', () => {
    const parsed = paginationSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it('coerces string numbers', () => {
    expect(paginationSchema.parse({ page: '3', pageSize: '50' })).toEqual({ page: 3, pageSize: 50 });
  });

  it('accepts the maximum pageSize', () => {
    expect(paginationSchema.parse({ pageSize: 100 }).pageSize).toBe(100);
  });

  it('rejects a pageSize above the maximum', () => {
    expect(paginationSchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('rejects short passwords', () => {
    expect(passwordSchema.safeParse('Aa1').success).toBe(false);
  });

  it('rejects passwords without a digit', () => {
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false);
  });

  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Str0ng!Pass').success).toBe(true);
  });
});

describe('amountSchema', () => {
  it('rejects negative amounts', () => {
    expect(amountSchema.safeParse(-1).success).toBe(false);
  });

  it('rejects more than two decimal places', () => {
    expect(amountSchema.safeParse(10.999).success).toBe(false);
  });
});