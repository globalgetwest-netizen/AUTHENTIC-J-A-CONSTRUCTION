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

export interface Lead {
  id: string;
  leadNo: string;
  source: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  expectedValue?: number | string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  clientCode: string;
  type: string;
  companyName?: string | null;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
  createdAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  projectType: string;
  status: string;
  clientId?: string | null;
  branchId?: string | null;
  managerId?: string | null;
  location?: string | null;
  address?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budgetAmount?: number | string | null;
  createdAt: string;
  updatedAt?: string;
  /** Enriched relations returned by the detail endpoints. */
  manager?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  client?: Client | null;
  members?: ProjectMember[] | null;
  milestones?: ProjectMilestone[] | null;
  updates?: ProjectUpdate[] | null;
}

export type MilestoneStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
export const MILESTONE_STATUSES: readonly MilestoneStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DELAYED",
];

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: MilestoneStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  authorId?: string | null;
  content: string;
  publishedAt: string;
  /** Resolved from the author's User record — null when the author is gone. */
  authorName?: string | null;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  role: string;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
}

/** A project row on the staff dashboard: base project + work-log/phase summaries. */
export interface StaffProjectSummary extends Project {
  updateCount: number;
  milestoneCount: number;
  completedMilestones: number;
  latestUpdate?: ProjectUpdate | null;
}

export interface StaffProjectDetail {
  project: Project;
  capabilities: { canManage: boolean; canLogWork: boolean };
}

export interface StaffProjectsResult {
  data: StaffProjectSummary[];
  meta: { total: number };
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  amount: number | string;
}

export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "WON"
  | "LOST";

export const QUOTATION_STATUSES: readonly QuotationStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "WON",
  "LOST",
];

export interface Quotation {
  id: string;
  quotationNo: string;
  leadId?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  title: string;
  validUntil?: string | null;
  subtotal: number | string;
  tax: number | string;
  discount: number | string;
  total: number | string;
  currency: string;
  status: QuotationStatus;
  issuedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuotationItem[];
  client?: Client | null;
  project?: Project | null;
}

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "PROBATION";
export const EMPLOYMENT_TYPES: readonly EmploymentType[] = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
  "PROBATION",
];

export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";
export const EMPLOYEE_STATUSES: readonly EmployeeStatus[] = [
  "ACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
];

export type Gender = "MALE" | "FEMALE" | "OTHER";
export const GENDERS: readonly Gender[] = ["MALE", "FEMALE", "OTHER"];

export interface Department {
  id: string;
  name: string;
  code: string;
  _count?: { employees?: number };
}

export interface Position {
  id: string;
  title: string;
  code: string;
  level?: number | null;
  _count?: { employees?: number };
}

export interface CompanyBranch {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  isHeadquarter?: boolean;
  _count?: { employees?: number };
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  email?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  branchId?: string | null;
  employmentType: EmploymentType;
  hireDate: string;
  terminationDate?: string | null;
  status: EmployeeStatus;
  salary?: number | string | null;
  createdAt: string;
  updatedAt: string;
  department?: Department | null;
  position?: Position | null;
  branch?: CompanyBranch | null;
}

export type PropertyStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "RENTED" | "OFF_MARKET";
export const PROPERTY_STATUSES: readonly PropertyStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "RENTED",
  "OFF_MARKET",
];

export type SaleStatus = "PENDING" | "DEPOSIT_PAID" | "PART_PAYMENT" | "COMPLETED" | "CANCELLED";
export const SALE_STATUSES: readonly SaleStatus[] = [
  "PENDING",
  "DEPOSIT_PAID",
  "PART_PAYMENT",
  "COMPLETED",
  "CANCELLED",
];

export interface PropertyType {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string;
  _count?: { properties?: number };
}

export interface Property {
  id: string;
  code: string;
  name: string;
  typeId?: string | null;
  projectId?: string | null;
  status: PropertyStatus;
  description?: string | null;
  address?: string | null;
  location?: string | null;
  price?: number | string | null;
  areaSqm?: number | string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floorPlanUrl?: string | null;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
  propertyType?: PropertyType | null;
  project?: Project | null;
}

export interface PropertySale {
  id: string;
  propertyId: string;
  clientId: string;
  saleCode: string;
  price: number | string;
  depositAmount?: number | string | null;
  balanceAmount?: number | string | null;
  status: SaleStatus;
  saleDate: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: Property | null;
  client?: Client | null;
}

export type LandPlotStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "UNDER_DEVELOPMENT";
export const LAND_PLOT_STATUSES: readonly LandPlotStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "UNDER_DEVELOPMENT",
];

export type AllocationStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DEFAULTED";
export const ALLOCATION_STATUSES: readonly AllocationStatus[] = [
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "DEFAULTED",
];

export interface LandProject {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  description?: string | null;
  totalPlots?: number | null;
  status: string;
  createdAt: string;
  _count?: { plots?: number; allocations?: number };
}

export interface LandPlot {
  id: string;
  landProjectId: string;
  plotNumber: string;
  sizeSqm?: number | string | null;
  pricePerSqm?: number | string | null;
  status: LandPlotStatus;
  coordinates?: string | null;
  address?: string | null;
  createdAt: string;
  landProject?: LandProject | null;
  allocation?: LandAllocation | null;
}

export interface LandAllocation {
  id: string;
  landProjectId: string;
  plotId: string;
  clientId: string;
  allocationCode: string;
  amount: number | string;
  status: AllocationStatus;
  allocatedAt: string;
  signedAt?: string | null;
  createdAt: string;
  landProject?: LandProject | null;
  plot?: LandPlot | null;
  client?: Client | null;
}

export interface LandDocument {
  id: string;
  landProjectId: string;
  title: string;
  fileUrl: string;
  uploadedAt: string;
  landProject?: LandProject | null;
}

/** Human-friendly label for a visible enum value like "NEW" → "New". */
export function label(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

/** Maps a status value to a Badge tone cluster (defaults by keyword). */
export function toneFor(value: string | null | undefined): BadgeTone {
  const v = (value ?? "").toUpperCase();
  if (/WON|COMPLETED|ACTIVE|QUALIFIED|PROPOSAL|PAID|IN/.test(v)) return "success";
  if (/NEW|PLANNING|OUT|TRANSFER|ADJUST|RETURN/.test(v)) return "info";
  if (/CONTACTED|NEGOTIATION|IN_PROGRESS|ON_HOLD|DELAYED|PART_PAID/.test(v)) return "warning";
  if (/LOST|CANCELLED|BLACKLISTED|INACTIVE/.test(v)) return "danger";
  if (/REAL_ESTATE|INDIVIDUAL|CORPORATE/.test(v)) return "brand";
  return "neutral";
}

export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 })
    .format(n);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Materials & block factory (Phase 15) ────────────────────────────────────

export type InventoryTransactionType = "IN" | "OUT" | "ADJUST" | "RETURN" | "TRANSFER";
export const INVENTORY_TRANSACTION_TYPES: readonly InventoryTransactionType[] = [
  "IN",
  "OUT",
  "ADJUST",
  "RETURN",
  "TRANSFER",
];

export type PaymentStatus = "PENDING" | "PART_PAID" | "PAID" | "REFUNDED" | "FAILED" | "CANCELLED";
export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "PENDING",
  "PART_PAID",
  "PAID",
  "REFUNDED",
  "FAILED",
  "CANCELLED",
];

export interface MaterialCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string;
  _count?: { materials?: number };
}

export interface Material {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number | string;
  reorderLevel?: number | string | null;
  costPerUnit?: number | string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: MaterialCategory | null;
  inventory?: Inventory[] | null;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  address?: string | null;
  managerId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { inventory?: number };
}

export interface Inventory {
  id: string;
  materialId: string;
  warehouseId: string;
  quantity: number | string;
  createdAt: string;
  updatedAt: string;
  material?: Material | null;
  warehouse?: Warehouse | null;
}

export interface InventoryTransaction {
  id: string;
  materialId: string;
  warehouseId: string;
  type: InventoryTransactionType;
  quantity: number | string;
  unitCost?: number | string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdAt: string;
  material?: { id: string; name: string; sku: string; unit: string } | null;
  warehouse?: { id: string; name: string; code: string } | null;
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  transactionId?: string | null;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  quantity: number | string;
  movedAt: string;
  notes?: string | null;
  inventory?: {
    material?: { id: string; name: string; sku: string; unit: string } | null;
    warehouse?: { id: string; name: string } | null;
  } | null;
  fromWarehouse?: { id: string; name: string } | null;
  toWarehouse?: { id: string; name: string } | null;
}

export interface BlockProduct {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  unitPrice: number | string;
  specs?: unknown | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { productions?: number; sales?: number };
}

export interface BlockProduction {
  id: string;
  productId: string;
  batchNo: string;
  quantity: number;
  producedOn: string;
  notes?: string | null;
  status: string;
  supervisorId?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: BlockProduct | null;
}

export interface BlockSale {
  id: string;
  productId: string;
  clientId?: string | null;
  quantity: number;
  unitPrice: number | string;
  totalAmount: number | string;
  soldOn: string;
  reference?: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  product?: BlockProduct | null;
  client?: { id: string; companyName?: string | null; contactName?: string | null } | null;
}