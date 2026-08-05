/**
 * Shared domain types for the AUTHENTIC J.A. CONSTRUCTION LTD. ecosystem.
 *
 * NOTE: The database schema (Prisma, packages/database) is the authoritative
 * source of entity structure once configured (Phase 3). These TypeScript types
 * form the transport/domain contracts shared by web, mobile, and API, and will
 * be kept in sync with the Prisma models.
 */

// --- Service health ----------------------------------------------------------
export type ServiceStatus = 'operational' | 'degraded' | 'down';

export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
}

// --- Roles -------------------------------------------------------------------
export const ROLE_NAMES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGEMENT',
  'STAFF',
  'EMPLOYEE',
  'CLIENT',
] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const EMPLOYEE_ROLES = [
  'SITE_WORKER',
  'SITE_SUPERVISOR',
  'ENGINEER',
  'ARCHITECT',
  'QUANTITY_SURVEYOR',
  'PROJECT_MANAGER',
  'HR',
  'FINANCE',
  'PROCUREMENT',
  'STOREKEEPER',
  'MANAGEMENT',
  'ADMINISTRATOR',
] as const;
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

// --- Projects ----------------------------------------------------------------
export const PROJECT_STATUSES = [
  'PLANNING',
  'PRE_CONSTRUCTION',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
  'MAINTENANCE',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// --- Real estate -------------------------------------------------------------
export const PROPERTY_STATUSES = [
  'FOR_SALE',
  'FOR_RENT',
  'UNDER_CONSTRUCTION',
  'COMING_SOON',
  'SOLD',
  'RENTED',
  'RESERVED',
  'AVAILABLE',
  'UNAVAILABLE',
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

// --- Land --------------------------------------------------------------------
export const LAND_PLOT_STATUSES = ['AVAILABLE', 'RESERVED', 'ALLOCATED', 'SOLD', 'UNAVAILABLE'] as const;
export type LandPlotStatus = (typeof LAND_PLOT_STATUSES)[number];

// --- CRM / leads -------------------------------------------------------------
export const LEAD_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

// --- API conventions ---------------------------------------------------------
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}