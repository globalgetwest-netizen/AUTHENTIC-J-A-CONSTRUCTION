import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid UUID');

export const emailSchema = z.string().trim().email('Invalid email address').max(320);

export const nameSchema = z.string().trim().min(1, 'Required').max(160);

export const phoneSchema = z.string().trim().min(7, 'Phone number too short').max(20);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

export const currencyCodeSchema = z.string().length(3).toUpperCase();

export const percentSchema = z.number().min(0).max(100);

export const amountSchema = z.number().min(0, 'Amount cannot be negative').multipleOf(0.01, 'Max two decimal places');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.input<typeof paginationSchema>;
export type Pagination = z.output<typeof paginationSchema>;