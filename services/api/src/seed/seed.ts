// Bootstrap seed: permission catalog, canonical roles, SUPER_ADMIN assignment,
// and the first admin user. Idempotent — safe to re-run.
//
// Run from the API workspace: `npm run seed --workspace=@ajac/api`
// The admin password comes from SEED_ADMIN_PASSWORD (dev fallback: generated and
// printed once; change it immediately).

import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
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
  'materials.read',
  'materials.write',
  'equipment.read',
  'equipment.write',
  'finance.read',
  'finance.write',
  'payroll.read',
  'payroll.write',
  'employee-ids.read',
  'employee-ids.write',
  'system.settings.read',
  'system.settings.write',
  'system.flags.read',
  'system.flags.write',
  'users.read',
  'users.write',
  'roles.read',
  'roles.write',
  'documents.read',
  'documents.write',
] as const;

const ADMIN_FIRST_NAME = 'System';
const ADMIN_LAST_NAME = 'Administrator';
const COMPANY_NAME = 'Authentic J.A. Construction Limited';

/**
 * Creates or updates a staff user with a linked Employee record under a given
 * department/position/reporting line. When a credential is provided (dev seed
 * passwords) it is made authoritative on every run; otherwise a random one is
 * generated. Idempotent by email — existing employees are relinked to the
 * org structure rather than duplicated.
 */
async function ensureStaffUser(
  prisma: PrismaClient,
  opts: {
    email: string;
    credential: string | undefined;
    firstName: string;
    lastName: string;
    roleId: string;
    employeeCode: string;
    departmentId: string;
    positionId: string;
    branchId: string;
    reportsToId?: string | null;
    salary?: number;
    phone?: string;
  },
): Promise<{ userId: string; employeeId: string; isNew: boolean }> {
  const provided = opts.credential ?? randomBytes(12).toString('base64url');
  const passwordHash = await hashPassword(provided);

  let user = await prisma.user.findUnique({ where: { email: opts.email } });
  const isNew = !user;
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: opts.email,
        passwordHash,
        firstName: opts.firstName,
        lastName: opts.lastName,
        isActive: true,
      },
    });
    console.log(`[seed] created user ${opts.email}`);
  }
  if (user.deletedAt) {
    user = await prisma.user.update({ where: { id: user.id }, data: { deletedAt: null } });
  }
  // Deterministic credentials stay authoritative across re-seeds.
  if (opts.credential) {
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  }
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: opts.roleId } },
    update: {},
    create: { userId: user.id, roleId: opts.roleId },
  });

  let employee = await prisma.employee.findFirst({ where: { userId: user.id } });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeCode: opts.employeeCode,
        firstName: opts.firstName,
        lastName: opts.lastName,
        email: opts.email,
        phone: opts.phone ?? '+233 245 295 866',
        departmentId: opts.departmentId,
        positionId: opts.positionId,
        branchId: opts.branchId,
        reportsToId: opts.reportsToId ?? null,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2026-01-05'),
        status: 'ACTIVE',
        salary: opts.salary ?? 4500,
      },
    });
  } else {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        departmentId: opts.departmentId,
        positionId: opts.positionId,
        branchId: opts.branchId,
        reportsToId: opts.reportsToId ?? null,
      },
    });
  }
  return { userId: user.id, employeeId: employee.id, isNew };
}

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
    // When SEED_ADMIN_PASSWORD is explicitly set, make it authoritative: sync
    // the hash onto the existing user so the admin always signs in with the
    // known credential (not the hash captured at first create / a random one).
    if (process.env.SEED_ADMIN_PASSWORD) {
      await prisma.user.update({ where: { id: admin.id }, data: { passwordHash } });
      console.log('[seed] admin password synced to SEED_ADMIN_PASSWORD');
    }
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminId } },
      update: {},
      create: { userId: admin.id, roleId: superAdminId },
    });

    // 4b. Command hierarchy — the real org structure the staff portal operates
    // against: positions (with command levels), departments, department heads
    // (who approve their department's work), and one operator per core
    // department. Seeded staff log in with SEED_STAFF_PASSWORD. Idempotent.
    const staffEmail = (process.env.SEED_STAFF_EMAIL ?? 'staff@authenticja.com').toLowerCase();
    const staffCredential = process.env.SEED_STAFF_PASSWORD;

    const staffCompany = await prisma.company.findFirst({ where: { name: COMPANY_NAME } });
    const staffRoleId = roles.get('STAFF');
    const managementRoleId = roles.get('MANAGEMENT');
    if (!staffCompany) {
      console.log('[seed] company record missing — skipping command hierarchy seed');
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

      // Positions with command levels (1 = executive … 5 = general worker).
      const demoPositions = [
        { code: 'POS-CEO', title: 'Chief Executive Officer', level: 1 },
        { code: 'POS-DEPT-HEAD', title: 'Department Head', level: 2 },
        { code: 'POS-SUPERVISOR', title: 'Supervisor', level: 3 },
        { code: 'POS-ENGINEER', title: 'Engineer', level: 3 },
        { code: 'POS-OFFICER', title: 'Officer', level: 4 },
        { code: 'POS-FOREMAN', title: 'Site Foreman', level: 3 },
        { code: 'POS-GENERAL', title: 'General Worker', level: 5 },
      ] as const;
      const positionIds = new Map<string, string>();
      for (const pos of demoPositions) {
        const position = await prisma.position.upsert({
          where: { code: pos.code },
          update: { title: pos.title, level: pos.level, companyId: staffCompany.id, deletedAt: null },
          create: { code: pos.code, title: pos.title, level: pos.level, companyId: staffCompany.id },
        });
        positionIds.set(pos.code, position.id);
      }

      // The company's departments — each a command chain beneath the CEO.
      const demoDepartments = [
        { code: 'DPT-ADMIN', name: 'Administration' },
        { code: 'DPT-COMMERCIAL', name: 'Commercial' },
        { code: 'DPT-PROJECTS', name: 'Projects & Construction' },
        { code: 'DPT-ENGINEERING', name: 'Engineering' },
        { code: 'DPT-QS', name: 'Quantity Surveying' },
        { code: 'DPT-PROCUREMENT', name: 'Procurement' },
        { code: 'DPT-STORES', name: 'Stores & Inventory' },
        { code: 'DPT-BLOCKFACTORY', name: 'Block Production' },
        { code: 'DPT-PLANT', name: 'Plant & Equipment' },
        { code: 'DPT-FLEET', name: 'Fleet & Transport' },
        { code: 'DPT-PROPERTY', name: 'Property & Land' },
        { code: 'DPT-FINANCE', name: 'Finance & Accounts' },
        { code: 'DPT-HR', name: 'Human Resources' },
        { code: 'DPT-HSE', name: 'Health, Safety & Quality' },
      ] as const;
      const departmentIds = new Map<string, string>();
      for (const dep of demoDepartments) {
        const department = await prisma.department.upsert({
          where: { code: dep.code },
          update: { name: dep.name, companyId: staffCompany.id, deletedAt: null },
          create: { code: dep.code, name: dep.name, companyId: staffCompany.id },
        });
        departmentIds.set(dep.code, department.id);
      }
      // Retire the placeholder department from earlier seeds once it is empty.
      await prisma.department.updateMany({
        where: { code: 'DPT-CONOPS', deletedAt: null, employees: { none: {} } },
        data: { deletedAt: new Date() },
      });

      const ceoPositionId = positionIds.get('POS-CEO') ?? '';
      const headPositionId = positionIds.get('POS-DEPT-HEAD') ?? '';

      // CEO — Joseph Acquah, founder, top of the command chain.
      const ceo = await ensureStaffUser(prisma, {
        email: 'ceo@authenticja.com',
        credential: staffCredential,
        firstName: 'Joseph',
        lastName: 'Acquah',
        roleId: managementRoleId ?? staffRoleId ?? '',
        employeeCode: 'EMP-CEO-0001',
        departmentId: departmentIds.get('DPT-ADMIN') ?? '',
        positionId: ceoPositionId,
        branchId: branch.id,
      });

      // Department heads — lead each department's chain and approve its work.
      const demoHeads = [
        { code: 'DPT-PROJECTS', firstName: 'Efua', lastName: 'Arthur', email: 'projects@authenticja.com' },
        { code: 'DPT-PROCUREMENT', firstName: 'Kojo', lastName: 'Osei', email: 'procurement@authenticja.com' },
        { code: 'DPT-STORES', firstName: 'Yaw', lastName: 'Boateng', email: 'stores@authenticja.com' },
        { code: 'DPT-BLOCKFACTORY', firstName: 'Adjoa', lastName: 'Tetteh', email: 'blockfactory@authenticja.com' },
        { code: 'DPT-PLANT', firstName: 'Kwesi', lastName: 'Asante', email: 'plant@authenticja.com' },
        { code: 'DPT-FINANCE', firstName: 'Akosua', lastName: 'Mensah', email: 'finance@authenticja.com' },
      ] as const;
      const headEmployeeIds = new Map<string, string>();
      for (const head of demoHeads) {
        const result = await ensureStaffUser(prisma, {
          email: head.email,
          credential: staffCredential,
          firstName: head.firstName,
          lastName: head.lastName,
          roleId: staffRoleId ?? '',
          employeeCode: `EMP-${head.code.replace('DPT-', '')}-HEAD`,
          departmentId: departmentIds.get(head.code) ?? '',
          positionId: headPositionId,
          branchId: branch.id,
          reportsToId: ceo.employeeId,
          salary: 8000,
        });
        headEmployeeIds.set(head.code, result.employeeId);
      }
      for (const head of demoHeads) {
        const employeeId = headEmployeeIds.get(head.code);
        if (!employeeId) continue;
        await prisma.department.update({
          where: { id: departmentIds.get(head.code) ?? '' },
          data: { headId: employeeId },
        });
      }

      // One operator per core department (the existing Ama Owusu account is
      // relinked to Projects & Construction, reporting to its head).
      const demoOperators = [
        { code: 'DPT-PROJECTS', firstName: 'Ama', lastName: 'Owusu', email: staffEmail, employeeCode: 'EMP-DEMO-0001', positionCode: 'POS-FOREMAN' },
        { code: 'DPT-PROCUREMENT', firstName: 'Esi', lastName: 'Sarpong', email: 'procurement.op@authenticja.com', employeeCode: 'EMP-PROC-OP', positionCode: 'POS-OFFICER' },
        { code: 'DPT-STORES', firstName: 'Kofi', lastName: 'Agyeman', email: 'stores.op@authenticja.com', employeeCode: 'EMP-STORES-OP', positionCode: 'POS-OFFICER' },
        { code: 'DPT-BLOCKFACTORY', firstName: 'Nana', lastName: 'Boadu', email: 'blockfactory.op@authenticja.com', employeeCode: 'EMP-BLOCKS-OP', positionCode: 'POS-OFFICER' },
        { code: 'DPT-PLANT', firstName: 'Joe', lastName: 'Nkrumah', email: 'plant.op@authenticja.com', employeeCode: 'EMP-PLANT-OP', positionCode: 'POS-OFFICER' },
        { code: 'DPT-FINANCE', firstName: 'Adwoa', lastName: 'Acheampong', email: 'finance.op@authenticja.com', employeeCode: 'EMP-FIN-OP', positionCode: 'POS-OFFICER' },
      ] as const;
      for (const op of demoOperators) {
        const result = await ensureStaffUser(prisma, {
          email: op.email,
          credential: staffCredential,
          firstName: op.firstName,
          lastName: op.lastName,
          roleId: staffRoleId ?? '',
          employeeCode: op.employeeCode,
          departmentId: departmentIds.get(op.code) ?? '',
          positionId: positionIds.get(op.positionCode) ?? '',
          branchId: branch.id,
          reportsToId: headEmployeeIds.get(op.code) ?? null,
        });
        if (result.isNew) {
          await prisma.notification.create({
            data: {
              userId: result.userId,
              type: 'SYSTEM',
              title: 'Welcome to the Employee Portal',
              body: 'Your staff account is ready. Sign in to operate your department’s work.',
            },
          });
        }
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
      if (process.env.SEED_CLIENT_PASSWORD) {
        const clientHash = await hashPassword(process.env.SEED_CLIENT_PASSWORD);
        await prisma.user.update({ where: { id: clientUser.id }, data: { passwordHash: clientHash } });
        console.log('[seed] client password synced to SEED_CLIENT_PASSWORD');
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

    // 4e. Demo MATERIALS & BLOCK FACTORY — stock the inventory and block-factory
    // admin screens with content on first boot. Idempotent — safe to re-run.
    const demoCategories = [
      { code: 'CAT-DEMO-CMT', name: 'Cement & Binders' },
      { code: 'CAT-DEMO-AGG', name: 'Aggregates' },
      { code: 'CAT-DEMO-BLK', name: 'Blocks' },
      { code: 'CAT-DEMO-STL', name: 'Steel' },
    ] as const;
    const categoryIds = new Map<string, string>();
    for (const cat of demoCategories) {
      let category = await prisma.materialCategory.findFirst({ where: { code: cat.code } });
      if (!category) {
        category = await prisma.materialCategory.create({
          data: { code: cat.code, name: cat.name },
        });
      }
      categoryIds.set(cat.code, category.id);
    }

    const demoMaterials = [
      { sku: 'MAT-DEMO-CMT', name: 'Cement (Ghacem 42.5R)', unit: 'bag', categoryCode: 'CAT-DEMO-CMT' },
      { sku: 'MAT-DEMO-GVL', name: 'Gravel', unit: 'tonne', categoryCode: 'CAT-DEMO-AGG' },
      { sku: 'MAT-DEMO-DST', name: 'Quarry dust', unit: 'tonne', categoryCode: 'CAT-DEMO-AGG' },
    ] as const;
    const materialIds = new Map<string, string>();
    for (const mat of demoMaterials) {
      let material = await prisma.material.findFirst({ where: { sku: mat.sku } });
      if (!material) {
        material = await prisma.material.create({
          data: {
            sku: mat.sku,
            name: mat.name,
            unit: mat.unit,
            categoryId: categoryIds.get(mat.categoryCode) ?? '',
          },
        });
      }
      materialIds.set(mat.sku, material.id);
    }

    const demoWarehouses = [
      { code: 'WH-DEMO-0001', name: 'Main yard — Kenyase', location: 'Kenyase – Brofoyedru' },
      { code: 'WH-DEMO-0002', name: 'Block factory', location: 'Brofoyedru' },
    ] as const;
    const warehouseIds = new Map<string, string>();
    for (const wh of demoWarehouses) {
      let warehouse = await prisma.warehouse.findFirst({ where: { code: wh.code } });
      if (!warehouse) {
        warehouse = await prisma.warehouse.create({
          data: { code: wh.code, name: wh.name, location: wh.location },
        });
      }
      warehouseIds.set(wh.code, warehouse.id);
    }

    // Opening stock for one material so the inventory board is populated.
    const cementId = materialIds.get('MAT-DEMO-CMT');
    const mainYardId = warehouseIds.get('WH-DEMO-0001');
    if (cementId && mainYardId) {
      const existingInv = await prisma.inventory.findUnique({
        where: { materialId_warehouseId: { materialId: cementId, warehouseId: mainYardId } },
      });
      if (!existingInv) {
        await prisma.inventory.create({
          data: { materialId: cementId, warehouseId: mainYardId, quantity: 200 },
        });
        await prisma.inventoryTransaction.create({
          data: {
            materialId: cementId,
            warehouseId: mainYardId,
            type: 'IN',
            quantity: 200,
            notes: 'Opening stock (seed)',
          },
        });
      }
    }

    const demoProducts = [
      { code: 'BLC-DEMO-0001', name: '6-inch solid block', unitPrice: 12.5 },
      { code: 'BLC-DEMO-0002', name: '9-inch solid block', unitPrice: 15 },
    ] as const;
    const productIds = new Map<string, string>();
    for (const prod of demoProducts) {
      let product = await prisma.blockProduct.findFirst({ where: { code: prod.code } });
      if (!product) {
        product = await prisma.blockProduct.create({
          data: { code: prod.code, name: prod.name, unitPrice: prod.unitPrice },
        });
      }
      productIds.set(prod.code, product.id);
    }

    const sixInchId = productIds.get('BLC-DEMO-0001');
    if (sixInchId) {
      const existingProduction = await prisma.blockProduction.findFirst({
        where: { batchNo: 'PRD-DEMO-0001' },
      });
      if (!existingProduction) {
        await prisma.blockProduction.create({
          data: {
            batchNo: 'PRD-DEMO-0001',
            productId: sixInchId,
            quantity: 500,
            producedOn: new Date('2026-08-06'),
            status: 'COMPLETED',
          },
        });
      }
      const existingSale = await prisma.blockSale.findFirst({
        where: { reference: 'SALE-DEMO-0001' },
      });
      if (!existingSale) {
        await prisma.blockSale.create({
          data: {
            productId: sixInchId,
            quantity: 120,
            unitPrice: 12.5,
            totalAmount: 1500,
            soldOn: new Date('2026-08-07'),
            reference: 'SALE-DEMO-0001',
            status: 'PAID',
          },
        });
      }
    }

    // ── Equipment + finance demo data (idempotent) ──────────────────────────
    const existingEquip = await prisma.equipment.findFirst({ where: { assetCode: 'EQP-DEMO-0001' } });
    if (!existingEquip) {
      const equip = await prisma.equipment.create({
        data: {
          assetCode: 'EQP-DEMO-0001',
          name: 'Excavator 30t',
          category: 'HEAVY',
          status: 'AVAILABLE',
          purchasePrice: 850000,
          location: 'Main yard',
        },
      });
      await prisma.vehicle.create({
        data: {
          equipmentId: equip.id,
          registrationNo: 'GW-1234-20',
          fuelType: 'Diesel',
        },
      });
      await prisma.maintenanceRecord.create({
        data: {
          equipmentId: equip.id,
          scheduledAt: new Date('2026-08-20'),
          cost: 2400,
          serviceProvider: 'SiteMech Services',
          description: 'Scheduled hydraulic service',
          status: 'SCHEDULED',
        },
      });
    }

    const existingAsset = await prisma.asset.findFirst({ where: { assetCode: 'AST-DEMO-0001' } });
    if (!existingAsset) {
      const asset = await prisma.asset.create({
        data: {
          assetCode: 'AST-DEMO-0001',
          name: 'Site laptop',
          category: 'IT',
          purchasePrice: 5200,
          currentValue: 4500,
          status: 'ACTIVE',
        },
      });
      if (demoEmployee) {
        await prisma.assetAssignment.create({
          data: { assetId: asset.id, assignedToId: demoEmployee.id, notes: 'Issued by seed' },
        });
      }
    }

    const existingExpense = await prisma.expense.findFirst({ where: { expenseNo: 'EXP-DEMO-0001' } });
    if (!existingExpense) {
      await prisma.expense.create({
        data: {
          expenseNo: 'EXP-DEMO-0001',
          category: 'FUEL',
          description: 'Generator diesel top-up',
          amount: 450,
          incurredOn: new Date('2026-08-06'),
          status: 'PENDING',
        },
      });
    }

    const existingInvoice = await prisma.invoice.findFirst({ where: { invoiceNo: 'INV-DEMO-0001' } });
    if (!existingInvoice) {
      const demoClient = await prisma.client.findFirst({ where: { clientCode: 'CLI-DEMO-0001' } });
      if (demoClient) {
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNo: 'INV-DEMO-0001',
            clientId: demoClient.id,
            issuedOn: new Date('2026-08-01'),
            dueOn: new Date('2026-08-31'),
            subtotal: 1200,
            tax: 50,
            discount: 10,
            total: 1240,
            status: 'PART_PAID',
            items: {
              create: [
                {
                  description: 'Foundation works — demo site',
                  quantity: 2,
                  unitPrice: 500,
                  amount: 1000,
                },
                { description: 'General labour', quantity: 1, unitPrice: 200, amount: 200 },
              ],
            },
          },
        });
        await prisma.receipt.create({
          data: {
            receiptNo: 'RCP-DEMO-0001',
            invoiceId: invoice.id,
            clientId: demoClient.id,
            amount: 600,
            method: 'MOBILE_MONEY',
            reference: `Payment toward ${invoice.invoiceNo}`,
          },
        });
      }
    }

    // 4d. Demo PAYROLL — exercise payroll + payslips end-to-end.
    // A PROCESSED "August 2026" period with one computed payrun + issued payslip
    // for the demo staff employee (salary GHS 4,500). Idempotent by unique keys.
    const payrollDemoEmployee = await prisma.employee.findFirst({
      where: { employeeCode: 'EMP-DEMO-0001' },
    });
    if (payrollDemoEmployee) {
      const demoPeriod = await prisma.payrollPeriod.upsert({
        where: { name: 'August 2026' },
        update: {},
        create: {
          name: 'August 2026',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-08-31'),
          status: 'PROCESSED',
          closedAt: new Date('2026-08-05'),
        },
      });

      const deductions = {
        ssnit: 247.5,
        paye: 565.1,
        total: 812.6,
        lines: [
          { name: 'SSNIT (staff 5.5%)', amount: 247.5 },
          { name: 'PAYE (income tax)', amount: 565.1 },
        ],
        employer: { ssnit: 585, nhil: 123.75 },
      };

      const existingRun = await prisma.payroll.findFirst({
        where: { periodId: demoPeriod.id, employeeId: payrollDemoEmployee.id },
      });
      if (!existingRun) {
        await prisma.payroll.create({
          data: {
            periodId: demoPeriod.id,
            employeeId: payrollDemoEmployee.id,
            grossPay: 4500,
            deductions,
            netPay: 3687.4,
            status: 'PROCESSED',
          },
        });
      }

      const existingPayslip = await prisma.payslip.findFirst({
        where: { periodId: demoPeriod.id, employeeId: payrollDemoEmployee.id },
      });
      if (!existingPayslip) {
        await prisma.payslip.create({
          data: {
            employeeId: payrollDemoEmployee.id,
            periodId: demoPeriod.id,
            payslipNo: 'PSL-DEMO-0001',
            grossPay: 4500,
            deductions,
            netPay: 3687.4,
            status: 'PAID',
            issuedAt: new Date('2026-08-05'),
          },
        });
      }
    }

    // 4g. Demo DOCUMENTS — one published document with a self-hosted placeholder
    // file, shared to the demo client, plus notifications so the bell, the library
    // and the client portal render content on first boot. Idempotent.
    const docsDir = resolve(process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads'), 'documents');
    mkdirSync(docsDir, { recursive: true });
    const demoDocFile = join(docsDir, 'DEMO-DOC-0001.md');
    const demoDocContent = [
      '# Authentic J.A. Construction — Site Safety Handbook',
      '',
      '## 1. Scope',
      'This handbook applies to all personnel on company project sites.',
      '',
      '## 2. Required PPE',
      '- Safety helmet, hi-vis vest and steel-toe boots at all times.',
      '- Gloves when handling cement, lime or reinforcement.',
      '',
      '## 3. Emergencies',
      'Site first-aid checkpoint is at the site office. Dial 112 in an emergency.',
      '',
      '_Seeded demo document — replace with real operations content._',
    ].join('\n');
    if (!existsSync(demoDocFile)) {
      writeFileSync(demoDocFile, demoDocContent, 'utf8');
    }

    const demoClientUser = await prisma.user.findUnique({ where: { email: clientEmail } });
    const demoDoc = await prisma.document.findFirst({ where: { fileUrl: '/uploads/documents/DEMO-DOC-0001.md' } });
    if (!demoDoc && admin) {
      const createdDoc = await prisma.document.create({
        data: {
          title: 'Material safety handbook',
          category: 'safety',
          accessLevel: 'INTERNAL',
          status: 'FINAL',
          uploadedById: admin.id,
          fileUrl: '/uploads/documents/DEMO-DOC-0001.md',
          fileType: 'text/markdown',
          sizeBytes: Buffer.byteLength(demoDocContent),
          versions: {
            create: {
              version: 1,
              uploadedById: admin.id,
              fileUrl: '/uploads/documents/DEMO-DOC-0001.md',
              fileType: 'text/markdown',
              sizeBytes: Buffer.byteLength(demoDocContent),
            },
          },
        },
        include: { versions: true },
      });
      for (const recipient of [demoClientUser, admin]) {
        if (!recipient) continue;
        await prisma.notification.create({
          data: {
            userId: recipient.id,
            type: 'DOCUMENT',
            title: 'New document published',
            body: `"${createdDoc.title}" is now in the document library.`,
            data: { documentId: createdDoc.id },
            link: '/admin/documents',
          },
        });
      }
      console.log(`[seed] created demo document ${createdDoc.title}`);
    }

    // A scannable QR ID card for the demo staff (EMP-DEMO-0001) so the card
    // PDF, the admin list and the staff view render content on first boot.
    const employeeIdDemo = await prisma.employee.findFirst({
      where: { employeeCode: 'EMP-DEMO-0001', deletedAt: null },
    });
    if (employeeIdDemo) {
      const existingCard = await prisma.employeeID.findFirst({
        where: { employeeId: employeeIdDemo.id },
      });
      if (!existingCard) {
        await prisma.employeeID.create({
          data: {
            employeeId: employeeIdDemo.id,
            cardNumber: 'EID-DEMO-0001',
            qrToken: randomBytes(24).toString('hex'),
            status: 'VERIFIED',
            issuedAt: new Date('2026-08-05'),
          },
        });
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
