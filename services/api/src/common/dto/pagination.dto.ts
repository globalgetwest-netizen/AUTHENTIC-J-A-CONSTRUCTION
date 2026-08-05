import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const SORT_ORDER = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDER)[number];

/** Query params shared by every list endpoint. */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(SORT_ORDER)
  sortOrder?: SortOrder = 'asc';
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Wraps a page of results with computed pagination metadata. */
export function paginate<T>(data: T[], total: number, query: PaginationQueryDto): Paginated<T> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/** Converts a page/size query into Prisma skip/take. */
export function prismaSkipTake(query: PaginationQueryDto): { skip: number; take: number } {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/**
 * Builds a Prisma orderBy object, restricting the sort field to an allow-list
 * so user input can never target an arbitrary column. `allowed` must include
 * `'createdAt'` (the fallback sort field).
 */
export function buildOrderBy<T extends string>(
  sortBy: string | undefined,
  sortOrder: SortOrder | undefined,
  allowed: readonly T[],
): Partial<Record<T, SortOrder>> {
  const field: T =
    sortBy && (allowed as readonly string[]).includes(sortBy) ? (sortBy as T) : ('createdAt' as T);
  const order: Partial<Record<T, SortOrder>> = {};
  order[field] = sortOrder ?? 'asc';
  return order;
}
