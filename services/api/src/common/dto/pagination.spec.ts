import { describe, expect, it } from 'vitest';
import { buildOrderBy, paginate, prismaSkipTake } from './pagination.dto';

describe('pagination helpers', () => {
  it('paginate computes pagination metadata', () => {
    const result = paginate(['a', 'b', 'c'], 25, { page: 2, pageSize: 10 });
    expect(result.data).toEqual(['a', 'b', 'c']);
    expect(result.meta).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('paginate clamps totalPages to at least 1 for empty results', () => {
    const result = paginate([], 0, { page: 1, pageSize: 20 });
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasNext).toBe(false);
    expect(result.meta.hasPrev).toBe(false);
  });

  it('prismaSkipTake converts page/size into offset', () => {
    expect(prismaSkipTake({ page: 3, pageSize: 15 })).toEqual({ skip: 30, take: 15 });
    expect(prismaSkipTake({ page: 1, pageSize: 20 })).toEqual({ skip: 0, take: 20 });
  });

  it('buildOrderBy falls back to createdAt for unknown sort fields', () => {
    expect(buildOrderBy('name;drop', 'asc', ['name', 'createdAt'] as const)).toEqual({
      createdAt: 'asc',
    });
  });

  it('buildOrderBy respects allow-listed fields and order', () => {
    expect(buildOrderBy('name', 'desc', ['name', 'createdAt'] as const)).toEqual({ name: 'desc' });
  });
});
