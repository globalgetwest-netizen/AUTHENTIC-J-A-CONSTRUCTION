import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApp } from '../src/app.factory';

// Every protected endpoint must reject an unauthenticated request with the
// standard 401 envelope — no route may silently fall through to the service.
// Public routes (health, login, refresh, requests, employee-ids/verify) are
// intentionally absent; they are covered in validation.spec.ts / app.spec.ts.
// `:id` placeholders are never reached: the global AuthGuard rejects before
// any param parsing or database access.
const PROTECTED: ReadonlyArray<readonly [string, string]> = [
  // Auth
  ['GET', '/api/v1/auth/me'],
  ['POST', '/api/v1/auth/logout'],
  // Users & roles
  ['GET', '/api/v1/users'],
  ['POST', '/api/v1/users'],
  ['GET', '/api/v1/users/00000000-0000-0000-0000-000000000001'],
  ['PATCH', '/api/v1/users/00000000-0000-0000-0000-000000000001'],
  ['DELETE', '/api/v1/users/00000000-0000-0000-0000-000000000001'],
  ['GET', '/api/v1/roles'],
  ['POST', '/api/v1/roles'],
  // Company & org
  ['GET', '/api/v1/company'],
  ['POST', '/api/v1/company'],
  ['PATCH', '/api/v1/company'],
  ['GET', '/api/v1/company-branches'],
  ['POST', '/api/v1/company-branches'],
  ['GET', '/api/v1/departments'],
  ['POST', '/api/v1/departments'],
  ['GET', '/api/v1/positions'],
  ['POST', '/api/v1/positions'],
  // System
  ['GET', '/api/v1/system/settings'],
  ['POST', '/api/v1/system/settings'],
  ['GET', '/api/v1/system/settings/some.key'],
  ['PATCH', '/api/v1/system/settings/some.key'],
  ['DELETE', '/api/v1/system/settings/some.key'],
  ['GET', '/api/v1/system/feature-flags'],
  ['POST', '/api/v1/system/feature-flags'],
  ['GET', '/api/v1/system/feature-flags/some.key'],
  ['PATCH', '/api/v1/system/feature-flags/some.key'],
  ['DELETE', '/api/v1/system/feature-flags/some.key'],
  // CRM
  ['GET', '/api/v1/clients'],
  ['POST', '/api/v1/clients'],
  ['GET', '/api/v1/leads'],
  ['POST', '/api/v1/leads'],
  ['GET', '/api/v1/quotations'],
  ['POST', '/api/v1/quotations'],
  // Projects
  ['GET', '/api/v1/projects'],
  ['POST', '/api/v1/projects'],
  ['GET', '/api/v1/projects/00000000-0000-0000-0000-000000000001'],
  ['PATCH', '/api/v1/projects/00000000-0000-0000-0000-000000000001'],
  ['POST', '/api/v1/projects/00000000-0000-0000-0000-000000000001/milestones'],
  ['POST', '/api/v1/projects/00000000-0000-0000-0000-000000000001/updates'],
  ['POST', '/api/v1/projects/00000000-0000-0000-0000-000000000001/members'],
  // Employees & HR
  ['GET', '/api/v1/employees'],
  ['POST', '/api/v1/employees'],
  ['GET', '/api/v1/employees/00000000-0000-0000-0000-000000000001'],
  ['PATCH', '/api/v1/employees/00000000-0000-0000-0000-000000000001'],
  ['DELETE', '/api/v1/employees/00000000-0000-0000-0000-000000000001'],
  ['GET', '/api/v1/employee-ids'],
  ['POST', '/api/v1/employee-ids'],
  ['POST', '/api/v1/employee-ids/00000000-0000-0000-0000-000000000001/revoke'],
  // Real estate & land
  ['GET', '/api/v1/property-types'],
  ['POST', '/api/v1/property-types'],
  ['GET', '/api/v1/properties'],
  ['POST', '/api/v1/properties'],
  ['GET', '/api/v1/property-sales'],
  ['POST', '/api/v1/property-sales'],
  ['GET', '/api/v1/land-projects'],
  ['POST', '/api/v1/land-projects'],
  ['GET', '/api/v1/land-plots'],
  ['POST', '/api/v1/land-plots'],
  ['GET', '/api/v1/land-allocations'],
  ['POST', '/api/v1/land-allocations'],
  ['GET', '/api/v1/land-documents'],
  ['POST', '/api/v1/land-documents'],
  // Materials & blocks
  ['GET', '/api/v1/material-categories'],
  ['POST', '/api/v1/material-categories'],
  ['GET', '/api/v1/materials'],
  ['POST', '/api/v1/materials'],
  ['GET', '/api/v1/warehouses'],
  ['POST', '/api/v1/warehouses'],
  ['GET', '/api/v1/inventory'],
  ['POST', '/api/v1/inventory/receipts'],
  ['POST', '/api/v1/inventory/issuances'],
  ['POST', '/api/v1/inventory/adjustments'],
  ['POST', '/api/v1/inventory/transfers'],
  ['GET', '/api/v1/inventory-transactions'],
  ['GET', '/api/v1/stock-movements'],
  ['GET', '/api/v1/block-products'],
  ['POST', '/api/v1/block-products'],
  ['GET', '/api/v1/block-productions'],
  ['POST', '/api/v1/block-productions'],
  ['GET', '/api/v1/block-sales'],
  ['POST', '/api/v1/block-sales'],
  // Equipment & finance
  ['GET', '/api/v1/equipment'],
  ['POST', '/api/v1/equipment'],
  ['GET', '/api/v1/vehicles'],
  ['POST', '/api/v1/vehicles'],
  ['GET', '/api/v1/maintenance'],
  ['POST', '/api/v1/maintenance'],
  ['POST', '/api/v1/maintenance/00000000-0000-0000-0000-000000000001/complete'],
  ['GET', '/api/v1/assets'],
  ['POST', '/api/v1/assets'],
  ['GET', '/api/v1/asset-assignments'],
  ['POST', '/api/v1/asset-assignments'],
  ['GET', '/api/v1/invoices'],
  ['POST', '/api/v1/invoices'],
  ['POST', '/api/v1/invoices/00000000-0000-0000-0000-000000000001/items'],
  ['GET', '/api/v1/receipts'],
  ['POST', '/api/v1/receipts'],
  ['GET', '/api/v1/expenses'],
  ['POST', '/api/v1/expenses'],
  ['GET', '/api/v1/financial-transactions'],
  ['POST', '/api/v1/financial-transactions'],
  ['GET', '/api/v1/payments'],
  ['POST', '/api/v1/payments'],
  // Payroll
  ['GET', '/api/v1/payroll-periods'],
  ['POST', '/api/v1/payroll-periods'],
  ['POST', '/api/v1/payroll-periods/00000000-0000-0000-0000-000000000001/generate'],
  ['POST', '/api/v1/payroll-periods/00000000-0000-0000-0000-000000000001/process'],
  ['POST', '/api/v1/payroll-periods/00000000-0000-0000-0000-000000000001/issue-payslips'],
  ['GET', '/api/v1/payrolls'],
  ['GET', '/api/v1/payslips'],
  // Notifications & documents
  ['GET', '/api/v1/notifications'],
  ['GET', '/api/v1/notifications/unread-count'],
  ['POST', '/api/v1/notifications/read-all'],
  ['POST', '/api/v1/notifications/00000000-0000-0000-0000-000000000001/read'],
  ['GET', '/api/v1/documents'],
  ['POST', '/api/v1/documents'],
  ['GET', '/api/v1/documents/00000000-0000-0000-0000-000000000001'],
  ['GET', '/api/v1/documents/00000000-0000-0000-0000-000000000001/file'],
  ['POST', '/api/v1/documents/00000000-0000-0000-0000-000000000001/versions'],
  ['POST', '/api/v1/documents/00000000-0000-0000-0000-000000000001/status'],
  ['POST', '/api/v1/documents/00000000-0000-0000-0000-000000000001/access'],
  ['DELETE', '/api/v1/documents/00000000-0000-0000-0000-000000000001/access/CLIENT/00000000-0000-0000-0000-000000000001'],
  // Staff & client self-scoped portals
  ['GET', '/api/v1/staff/profile'],
  ['GET', '/api/v1/staff/notifications'],
  ['GET', '/api/v1/staff/payslips'],
  ['GET', '/api/v1/staff/employee-id'],
  ['GET', '/api/v1/staff/projects'],
  ['POST', '/api/v1/staff/projects/00000000-0000-0000-0000-000000000001/updates'],
  ['GET', '/api/v1/client/profile'],
  ['GET', '/api/v1/client/quotations'],
  ['GET', '/api/v1/client/quotations/00000000-0000-0000-0000-000000000001'],
];

describe('API auth boundary (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(PROTECTED)('%s %s returns a 401 envelope without a token', async (method, path) => {
    const res = await request(app.getHttpServer())[method.toLowerCase()](path).expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, error: 'Unauthorized' });
    expect(res.body.path).toBe(path);
    expect(typeof res.body.timestamp).toBe('string');
  });
});
