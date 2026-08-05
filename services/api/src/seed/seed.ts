// Bootstrap seed: permission catalog, canonical roles, SUPER_ADMIN assignment,
// and the first admin user. Idempotent — safe to re-run.
//
// Run from the API workspace: `npm run seed --workspace=@ajac/api`
// The admin password comes from SEED_ADMIN_PASSWORD (dev fallback: generated and
// printed once; change it immediately).

import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@ajac/database';
import { hashPassword } from '@ajac/auth';
import { ROLE_NAMES } from '@ajac/types';

const PERMISSIONS = [
  'company.read',
  'company.write',
  'clients.read',
  'clients.write',
  'leads.read',
  'leads.write',
  'projects.read',
  'projects.write',
  'system.settings.read',
  'system.settings.write',
  'system.flags.read',
  'system.flags.write',
  'users.read',
  'users.write',
  'roles.read',
  'roles.write',
] as const;

const ADMIN_FIRST_NAME = 'System';
const ADMIN_LAST_NAME = 'Administrator';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    // 1. Permissions
    const permissionIds: string[] = [];
    for (const code of PERMISSIONS) {
      const permission = await prisma.permission.upsert({
        where: { code },
        update: { module: code.split('.')[0] ?? 'system' },
        create: { code, module: code.split('.')[0] ?? 'system' },
      });
      permissionIds.push(permission.id);
    }

    // 2. Canonical roles
    const roles = new Map<string, string>();
    for (const name of ROLE_NAMES) {
      const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
      roles.set(name, role.id);
    }

    // 3. SUPER_ADMIN owns every permission
    const superAdminId = roles.get('SUPER_ADMIN');
    if (!superAdminId) {
      throw new Error('SUPER_ADMIN role missing after upsert');
    }
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId: superAdminId, permissionId })),
      skipDuplicates: true,
    });

    // 4. Bootstrap admin
    const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@authenticja.com').toLowerCase();
    let password = process.env.SEED_ADMIN_PASSWORD;
    if (!password) {
      password = randomBytes(12).toString('base64url');
      console.log('\n[seed] SEED_ADMIN_PASSWORD not set — generated for first login:');
      console.log(`[seed]   ${email} / ${password}`);
      console.log('[seed] Change it immediately after first sign-in.\n');
    }
    const passwordHash = await hashPassword(password);

    let admin = await prisma.user.findUnique({ where: { email } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: ADMIN_FIRST_NAME,
          lastName: ADMIN_LAST_NAME,
          isActive: true,
        },
      });
      console.log(`[seed] created admin user ${email}`);
    }
    if (admin.deletedAt) {
      admin = await prisma.user.update({ where: { id: admin.id }, data: { deletedAt: null } });
      console.log(`[seed] restored deleted admin user ${email}`);
    }
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminId } },
      update: {},
      create: { userId: admin.id, roleId: superAdminId },
    });

    console.log(
      `[seed] done — ${PERMISSIONS.length} permissions, ${roles.size} roles, admin ${email} linked to SUPER_ADMIN`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[seed] failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
