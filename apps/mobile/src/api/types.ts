/**
 * Typed views of the self-hosted API responses the mobile app consumes.
 * Field names mirror what the NestJS controllers/services return.
 */

export interface AuthUserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult extends AuthTokens {
  user: AuthUserView;
}

/** What the app keeps while signed in. */
export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUserView;
}

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'STAFF'
  | 'EMPLOYEE'
  | 'CLIENT'
  | 'CUSTOMER';

export interface Keyed {
  name: string;
}

export interface EmployeeRef {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department?: { name: string } | null;
  position?: { title: string } | null;
  branch?: { name: string } | null;
}

export interface StaffProfile {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  employee: (EmployeeRef & {
    department?: { id: string; name: string } | null;
    position?: { id: string; title: string } | null;
    branch?: { id: string; name: string } | null;
  }) | null;
}

export interface ClientProfile {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  client: { id: string; name: string; email?: string | null; phone?: string | null } | null;
}

export interface PeriodRef {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Payslip {
  id: string;
  payslipNo: string;
  grossPay: string;
  netPay: string;
  deductions: PayrollDeductions | null;
  issuedAt: string;
  status: string;
  periodId: string;
  period?: PeriodRef;
  employee?: EmployeeRef;
  url?: string | null;
}

export interface PayrollDeductions {
  ssnit: number;
  paye: number;
  total: number;
  lines?: { label?: string; amount: number }[];
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  title: string;
  status: string;
  total: string;
  currency: string;
  validUntil?: string | null;
  issuedAt: string;
  items?: QuotationItem[];
  client?: { id: string; name: string } | null;
  project?: { id: string; name?: string; title?: string } | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface EmployeeListItem extends EmployeeRef {
  status: string;
  phone?: string | null;
  email?: string | null;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number; hasNext: boolean };
}

export interface NotificationsResult {
  data: NotificationItem[];
  meta: { total: number; totalUnread: number; limit: number };
 }

export interface EmployeeIdCard {
  id: string;
  cardNumber: string;
  qrToken?: string | null;
  status: string;
  issuedAt: string;
  expiresAt?: string | null;
  employee: EmployeeRef | null;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
}