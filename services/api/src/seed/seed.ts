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
  'quotations.read',
  'quotations.write',
  'employees.read',
  'employees.write',
  'org.read',
  'org.write',
  'properties.read',
  'properties.write',
  'land.read',
  'land.write',
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
const COMPANY_NAME = 'Authentic J.A. Construction Limited';

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

    // 3b. Company record (single-tenant; org structure scopes to it)
    const company = await prisma.company.findFirst({
      where: { name: COMPANY_NAME },
    });
    if (!company) {
      await prisma.company.create({
        data: {
          name: COMPANY_NAME,
          registrationNo: 'CS212101021',
          taxId: 'C0061318752',
          address: 'Plot 13, Block K, Kenyase – Brofoyedru, Ghana',
          phone: '+233 245 295 866',
          email: 'authenticjaconstruction.gh@gmail.com',
        },
      });
      console.log(`[seed] created company ${COMPANY_NAME}`);
    } else {
      console.log(`[seed] company ${COMPANY_NAME} already exists`);
    }

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

    // 4b. Demo STAFF account — exercise the staff portal end-to-end.
    // Creates a demo branch/department/position only if absent, links one Employee
    // record to a Staff user (STAFF role) with self-scoped /staff access.
    const staffEmail = (process.env.SEED_STAFF_EMAIL ?? 'staff@authenticja.com').toLowerCase();
    let staffCredential = process.env.SEED_STAFF_PASSWORD;
    let isFreshStaff = false;

    const staffCompany = await prisma.company.findFirst({ where: { name: COMPANY_NAME } });
    const staffRoleId = roles.get('STAFF');
    if (!staffCompany) {
      console.log('[seed] demochars: company record missing — skipping demo staff');
    } else {
      const branch = await prisma.companyBranch.upsert({
        where: { code: 'BR-QTDEMO' },
        update: { deletedAt: null },
        create: {
          code: 'BR-QTDEMO',
          name: 'Kumasi HQ',
          location: 'Kumasi, Ghana',
          isHeadquarter: true,
          companyId: staffCompany.id,
        },
      });
      const department = await prisma.department.upsert({
        where: { code: 'DPT-CONOPS' },
        update: { deletedAt: null },
        create: { code: 'DPT-CONOPS', name: 'Construction Operations', companyId: staffCompany.id },
      });
      const position = await prisma.position.upsert({
        where: { code: 'POS-FOREMAN' },
        update: { deletedAt: null },
        create: { code: 'POS-FOREMAN', title: 'Site Foreman', companyId: staffCompany.id },
      });

      let staff = await prisma.user.findUnique({ where: { email: staffEmail } });
      if (!staff) {
        if (!staffCredential) {
          staffCredential = randomBytes(12).toString('base64url');
          console.log('\n[seed] SEED_STAFF_PASSWORD not set — generated for first login:');
          console.log(`[seed]   ${staffEmail} / ${staffCredential}`);
          console.log('[seed] An admin can change it, or re-seed to rotate.\n');
        }
        const staffHash = await hashPassword(staffCredential);
        staff = await prisma.user.create({
          data: { email: staffEmail, passwordHash: staffHash, firstName: 'Ama', lastName: 'Owusu', isActive: true },
        });
        isFreshStaff = true;
        console.log(`[seed] created staff user ${staffEmail}`);
      }
      if (staff.deletedAt) {
        staff = await prisma.user.update({ where: { id: staff.id }, data: { deletedAt: null } });
        console.log(`[seed] restored deleted staff user ${staffEmail}`);
      }

      const linkedEmployee = await prisma.employee.findFirst({ where: { userId: staff.id } });
      if (!linkedEmployee) {
        await prisma.employee.create({
          data: {
            userId: staff.id,
            employeeCode: 'EMP-DEMO-0001',
            firstName: 'Ama',
            lastName: 'Owusu',
            email: staffEmail,
            phone: '+233 245 295 866',
            departmentId: department.id,
            positionId: position.id,
            branchId: branch.id,
            employmentType: 'FULL_TIME',
            hireDate: new Date('2026-08-01'),
            status: 'ACTIVE',
          },
        });
        console.log(`[seed] created demo employee → linked to ${staffEmail}`);
      }

      if (staffRoleId) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: staff.id, roleId: staffRoleId } },
          update: {},
          create: { userId: staff.id, roleId: staffRoleId },
        });
      }

      if (isFreshStaff) {
        await prisma.notification.create({
          data: {
            userId: staff.id,
            type: 'SYSTEM',
            title: 'Welcome to the Employee Portal',
            body: 'Your staff account is ready. Sign in to view your profile and notifications.',
          },
        });
      }
    }

    // 4c. Demo CLIENT account — exercise the client portal end-to-end.
    // Creates a linked Client record (CLIENT role) plus one demo SENT quotation so
    // the portal has a downloadable document to show. Idempotent — safe to re-run.
    const clientEmail = (process.env.SEED_CLIENT_EMAIL ?? 'client@authenticja.com').toLowerCase();
    let clientCredential = process.env.SEED_CLIENT_PASSWORD;
    let isFreshClient = false;

    const clientRoleId = roles.get('CLIENT');
    if (!clientRoleId) {
      console.log('[seed] CLIENT role missing — skipping demo client');
    } else {
      let clientUser = await prisma.user.findUnique({ where: { email: clientEmail } });
      if (!clientUser) {
        if (!clientCredential) {
          clientCredential = randomBytes(12).toString('base64url');
          console.log('\n[seed] SEED_CLIENT_PASSWORD not set — generated for first login:');
          console.log(`[seed]   ${clientEmail} / ${clientCredential}`);
          console.log('[seed] An admin can change it, or re-seed to rotate.\n');
        }
        const clientHash = await hashPassword(clientCredential);
        clientUser = await prisma.user.create({
          data: { email: clientEmail, passwordHash: clientHash, firstName: 'Kwame', lastName: 'Mensah', isActive: true },
        });
        isFreshClient = true;
        console.log(`[seed] created client user ${clientEmail}`);
      }
      if (clientUser.deletedAt) {
        clientUser = await prisma.user.update({ where: { id: clientUser.id }, data: { deletedAt: null } });
        console.log(`[seed] restored deleted client user ${clientEmail}`);
      }

      let client = await prisma.client.findFirst({ where: { userId: clientUser.id } });
      if (!client) {
        client = await prisma.client.create({
          data: {
            userId: clientUser.id,
            clientCode: 'CLI-DEMO-0001',
            type: 'INDIVIDUAL',
            contactName: 'Kwame Mensah',
            email: clientEmail,
            phone: '+233 201 234 567',
            status: 'ACTIVE',
          },
        });
        console.log(`[seed] created demo client → linked to ${clientEmail}`);
      }

      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: clientUser.id, roleId: clientRoleId } },
        update: {},
        create: { userId: clientUser.id, roleId: clientRoleId },
      });

      // One demo SENT quotation so the portal shows a downloadable document.
      const demoQuote = await prisma.quotation.findFirst({ where: { clientId: client.id } });
      if (!demoQuote) {
        const subtotal = 126000;
        const tax = subtotal * 0.15;
        const quotation = await prisma.quotation.create({
          data: {
            quotationNo: 'QT-20260806-DEMO',
            clientId: client.id,
            title: 'Residential foundation & ground works',
            validUntil: new Date('2026-09-05'),
            subtotal,
            tax,
            discount: 0,
            total: subtotal + tax,
            currency: 'GHS',
            status: 'SENT',
            items: {
              create: [
                { description: 'Excavation & earthworks', quantity: 1, unitPrice: 42000, amount: 42000 },
                { description: 'Reinforced concrete foundation', quantity: 1, unitPrice: 84000, amount: 84000 },
              ],
            },
          },
        });
        console.log(`[seed] created demo quotation ${quotation.quotationNo} for ${clientEmail}`);
      }

      if (isFreshClient) {
        await prisma.notification.create({
          data: {
            userId: clientUser.id,
            type: 'SYSTEM',
            title: 'Welcome to the Client Portal',
            body: 'Your client account is ready. Sign in to view your profile and documents.',
          },
        });
      }
    }

    // 4d. Demo PROJECT — exercise the staff project portal end-to-end.
    // Creates one ACTIVE project managed by the demo staff employee, with four
    // phases (one COMPLETED), two work-log entries, a ProjectMember link, and
    // PROJECT notifications. Idempotent — safe to re-run.
    const demoEmployee = await prisma.employee.findFirst({
      where: { employeeCode: 'EMP-DEMO-0001' },
    });
    if (demoEmployee) {
      let demoProject = await prisma.project.findFirst({ where: { code: 'PRJ-DEMO-0001' } });
      if (!demoProject) {
        demoProject = await prisma.project.create({
          data: {
            code: 'PRJ-DEMO-0001',
            name: 'AUTHENTIC J.A. demo site',
            description: 'Demo residential development for exercising the Projects module.',
            projectType: 'CONSTRUCTION',
            status: 'ACTIVE',
            managerId: demoEmployee.id,
            location: 'Kenyase – Brofoyedru, Ghana',
            budgetAmount: 1200000,
            startDate: new Date('2026-08-01'),
            endDate: new Date('2027-03-31'),
          },
        });
        console.log(`[seed] created demo project ${demoProject.code} → manager ${demoEmployee.employeeCode}`);
      }
      if (demoProject.deletedAt) {
        demoProject = await prisma.project.update({
          where: { id: demoProject.id },
          data: { deletedAt: null },
        });
        console.log(`[seed] restored deleted demo project ${demoProject.code}`);
      }

      await prisma.projectMember.upsert({
        where: {
          projectId_employeeId: { projectId: demoProject.id, employeeId: demoEmployee.id },
        },
        update: {},
        create: { projectId: demoProject.id, employeeId: demoEmployee.id, role: 'SITE_SUPERVISOR' },
      });

      const demoMilestones = [
        { title: 'Site clearing', dueDate: new Date('2026-08-15') },
        { title: 'Foundation', dueDate: new Date('2026-09-30') },
        { title: 'Structure', dueDate: new Date('2026-12-15') },
        { title: 'Finishing', dueDate: new Date('2027-03-31') },
      ];
      for (const [index, ms] of demoMilestones.entries()) {
        const existingMilestone = await prisma.projectMilestone.findFirst({
          where: { projectId: demoProject.id, title: ms.title },
        });
        if (!existingMilestone) {
          const first = index === 0;
          await prisma.projectMilestone.create({
            data: {
              projectId: demoProject.id,
              title: ms.title,
              dueDate: ms.dueDate,
              status: first ? 'COMPLETED' : 'NOT_STARTED',
              completedAt: first ? new Date('2026-08-05') : null,
            },
          });
        }
      }

      const demoStaffUser = await prisma.user.findUnique({ where: { email: staffEmail } });
      if (demoStaffUser) {
        const demoUpdates = [
          { content: 'Site cleared and pegged. Excavation starts Monday.', publishedAt: new Date('2026-08-05') },
          { content: 'Survey completed; foundation trench lines marked.', publishedAt: new Date('2026-08-10') },
        ];
        for (const upd of demoUpdates) {
          const existingUpdate = await prisma.projectUpdate.findFirst({
            where: { projectId: demoProject.id, content: upd.content },
          });
          if (!existingUpdate) {
            await prisma.projectUpdate.create({
              data: {
                projectId: demoProject.id,
                authorId: demoStaffUser.id,
                content: upd.content,
                publishedAt: upd.publishedAt,
              },
            });
          }
        }

        const demoNotifications = [
          { type: 'PROJECT', title: 'Milestone completed', body: 'Phase "Site clearing" was marked complete.' },
          { type: 'PROJECT', title: 'New work log', body: 'Ama Owusu logged work on this project.' },
        ] as const;
        for (const notice of demoNotifications) {
          const existingNotice = await prisma.notification.findFirst({
            where: { userId: demoStaffUser.id, type: notice.type, title: notice.title },
          });
          if (!existingNotice) {
            await prisma.notification.create({
              data: {
                userId: demoStaffUser.id,
                type: notice.type,
                title: notice.title,
                body: notice.body,
                data: { projectId: demoProject.id },
                link: `/staff/projects/${demoProject.id}`,
              },
            });
          }
        }
      }
    }

    console.log(
      `[seed] done — ${PERMISSIONS.length} permissions, ${roles.size} roles, admin ${email} linked to SUPER_ADMIN, demo staff ${staffEmail}, demo client ${clientEmail}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[seed] failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
