import { describe, expect, it, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/auth/auth-user.type';
import { ProjectsService } from './projects.service';

type MockCrud = Record<
  | 'findFirst'
  | 'findMany'
  | 'count'
  | 'create'
  | 'update'
  | 'updateMany'
  | 'deleteMany',
  ReturnType<typeof vi.fn>
>;

const BASE_USER: AuthUser = {
  id: 'u-staff',
  email: 'staff@authenticja.com',
  firstName: 'Ama',
  lastName: 'Owusu',
  isActive: true,
  roles: ['STAFF'],
  permissions: [],
};

const PROJECT = {
  id: 'p1',
  code: 'PRJ-1',
  name: 'Demo site',
  description: null,
  projectType: 'CONSTRUCTION',
  status: 'ACTIVE',
  clientId: null,
  branchId: null,
  managerId: 'emp-1',
  location: null,
  address: null,
  startDate: null,
  endDate: null,
  budgetAmount: '1200000',
  createdAt: new Date('2026-08-01'),
  updatedAt: new Date('2026-08-01'),
  deletedAt: null,
  _count: { updates: 2, milestones: 4 },
  milestones: [{ id: 'm1' }],
};

function makeService(): {
  service: ProjectsService;
  project: MockCrud;
  projectMember: MockCrud;
  projectMilestone: MockCrud;
  projectUpdate: MockCrud;
  user: MockCrud;
  notification: { create: ReturnType<typeof vi.fn> };
} {
  const make = (): MockCrud => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  });
  const project = make();
  const projectMember = make();
  const projectMilestone = make();
  const projectUpdate = make();
  const user = make();
  const notification = { create: vi.fn() };
  const prisma = {
    project,
    projectMember,
    projectMilestone,
    projectUpdate,
    user,
    notification,
  } as unknown as PrismaService;
  return { service: new ProjectsService(prisma), project, projectMember, projectMilestone, projectUpdate, user, notification };
}

/** Routes project.findFirst by its select shape so detail/access/notify lookups coexist. */
function routeProjectLookup(project: MockCrud, opts: { access?: unknown; manager?: unknown; detail?: unknown }) {
  project.findFirst.mockImplementation(({ select }: { select?: Record<string, unknown> } = {}) => {
    if (select && 'managerId' in select) return Promise.resolve(opts.access ?? null);
    if (select && 'name' in select) return Promise.resolve(opts.manager ?? null);
    return Promise.resolve(opts.detail ?? null);
  });
}

/** A staff user whose Employee record links to the given employee id. */
function mockEmployee(user: MockCrud, employeeId: string | null) {
  user.findFirst.mockImplementation(({ select }: { select?: Record<string, unknown> } = {}) => {
    if (select && 'employee' in select) {
      return Promise.resolve(employeeId ? { employee: { id: employeeId } } : { employee: null });
    }
    return Promise.resolve(null);
  });
}

describe('ProjectsService', () => {
  it('get nests members/milestones/manager and resolves author names', async () => {
    const { service, project, projectUpdate, user } = makeService();
    routeProjectLookup(project, {
      detail: {
        ...PROJECT,
        manager: { id: 'emp-1', firstName: 'Ama', lastName: 'Owusu', employeeCode: 'EMP-DEMO-0001' },
        client: null,
        members: [{ id: 'pm1', employee: { id: 'emp-1', firstName: 'Ama', lastName: 'Owusu', employeeCode: 'EMP-DEMO-0001' } }],
        milestones: [{ id: 'ms1', title: 'Foundation' }],
      },
    });
    projectUpdate.findMany.mockResolvedValue([
      { id: 'u1', projectId: 'p1', authorId: 'u-staff', content: 'Site works', publishedAt: new Date('2026-08-02') },
    ]);
    user.findMany.mockResolvedValue([{ id: 'u-staff', firstName: 'Ama', lastName: 'Owusu' }]);

    const result = await service.get('p1');

    expect(result.code).toBe('PRJ-1');
    expect(result.manager?.firstName).toBe('Ama');
    expect(result.members[0]?.employee.employeeCode).toBe('EMP-DEMO-0001');
    expect(result.updates[0]?.authorName).toBe('Ama Owusu');
    expect(project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', deletedAt: null } }),
    );
  });

  it('createUpdate forbids a user who is not member/manager/admin', async () => {
    const { service, project, user, projectMember, projectUpdate } = makeService();
    routeProjectLookup(project, { access: { id: 'p1', managerId: 'emp-9' } });
    mockEmployee(user, 'emp-1');
    projectMember.findFirst.mockResolvedValue(null);

    await expect(
      service.createUpdate('p1', { content: 'Site works' }, BASE_USER),
    ).rejects.toThrow(ForbiddenException);
    expect(projectUpdate.create).not.toHaveBeenCalled();
  });

  it('createUpdate succeeds for an assigned member with authorId = caller', async () => {
    const { service, project, user, projectMember, projectUpdate, notification } = makeService();
    routeProjectLookup(project, {
      access: { id: 'p1', managerId: 'emp-9' },
      manager: { name: 'Demo site', manager: { userId: 'u-mgr' } },
    });
    mockEmployee(user, 'emp-1');
    projectMember.findFirst.mockResolvedValue({ id: 'pm1' });
    projectUpdate.create.mockImplementation(({ data }) => Promise.resolve({ id: 'u1', ...data }));

    await service.createUpdate('p1', { content: 'Site works' }, BASE_USER);

    expect(projectUpdate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'p1',
          authorId: 'u-staff',
          content: 'Site works',
        }),
      }),
    );
    expect(notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u-mgr',
          type: 'PROJECT',
          data: { projectId: 'p1' },
          link: '/staff/projects/p1',
        }),
      }),
    );
  });

  it('createUpdate succeeds for a project manager without membership', async () => {
    const { service, project, user, projectMember, projectUpdate } = makeService();
    routeProjectLookup(project, { access: { id: 'p1', managerId: 'emp-1' } });
    mockEmployee(user, 'emp-1');
    projectUpdate.create.mockResolvedValue({ id: 'u1' });

    await service.createUpdate('p1', { content: 'Manager log' }, BASE_USER);

    expect(projectMember.findFirst).not.toHaveBeenCalled();
    expect(projectUpdate.create).toHaveBeenCalled();
  });

  it('createUpdate succeeds for an admin without membership', async () => {
    const { service, project, user, projectMember, projectUpdate } = makeService();
    routeProjectLookup(project, { access: { id: 'p1', managerId: 'emp-9' } });
    const admin: AuthUser = { ...BASE_USER, id: 'u-admin', roles: ['SUPER_ADMIN'] };

    await service.createUpdate('p1', { content: 'Admin log' }, admin);

    expect(user.findFirst).not.toHaveBeenCalled();
    expect(projectMember.findFirst).not.toHaveBeenCalled();
    expect(projectUpdate.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ authorId: 'u-admin' }) }),
    );
  });

  it('completeMilestone forbids a member who is not the manager', async () => {
    const { service, project, user, projectMember, projectMilestone } = makeService();
    routeProjectLookup(project, { access: { id: 'p1', managerId: 'emp-9' } });
    mockEmployee(user, 'emp-1');
    projectMember.findFirst.mockResolvedValue({ id: 'pm1' });

    await expect(service.completeMilestone('p1', 'ms1', BASE_USER)).rejects.toThrow(ForbiddenException);
    expect(projectMilestone.update).not.toHaveBeenCalled();
  });

  it('completeMilestone sets COMPLETED + completedAt and notifies the manager', async () => {
    const { service, project, user, projectMilestone, notification } = makeService();
    routeProjectLookup(project, {
      access: { id: 'p1', managerId: 'emp-1' },
      manager: { name: 'Demo site', manager: { userId: 'u-mgr' } },
    });
    mockEmployee(user, 'emp-1');
    projectMilestone.findFirst.mockResolvedValue({
      id: 'ms1',
      projectId: 'p1',
      title: 'Foundation',
      status: 'IN_PROGRESS',
    });
    projectMilestone.update.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'ms1', projectId: 'p1', title: 'Foundation', ...data }),
    );

    const completed = await service.completeMilestone('p1', 'ms1', BASE_USER);

    expect(completed.status).toBe('COMPLETED');
    expect(projectMilestone.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED', completedAt: expect.any(Date) }),
      }),
    );
    expect(notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u-mgr',
          type: 'PROJECT',
          title: 'Milestone completed',
          data: { projectId: 'p1' },
        }),
      }),
    );
  });

  it('completeMilestone is idempotent when already COMPLETED', async () => {
    const { service, project, user, projectMilestone } = makeService();
    routeProjectLookup(project, { access: { id: 'p1', managerId: 'emp-1' } });
    mockEmployee(user, 'emp-1');
    projectMilestone.findFirst.mockResolvedValue({
      id: 'ms1',
      projectId: 'p1',
      title: 'Foundation',
      status: 'COMPLETED',
      completedAt: new Date('2026-08-01'),
    });

    const result = await service.completeMilestone('p1', 'ms1', BASE_USER);

    expect(result.status).toBe('COMPLETED');
    expect(projectMilestone.update).not.toHaveBeenCalled();
  });

  it('listForStaff returns every project for a manager (manages ≥1 project)', async () => {
    const { service, project, user, projectUpdate } = makeService();
    mockEmployee(user, 'emp-1');
    project.findFirst.mockResolvedValue({ id: 'p9' }); // manages at least one project
    project.findMany.mockResolvedValue([{ ...PROJECT }, { ...PROJECT, id: 'p2', code: 'PRJ-2' }]);
    project.count.mockResolvedValue(2);
    projectUpdate.findMany.mockResolvedValue([]);

    const result = await service.listForStaff(BASE_USER);

    expect(result.meta.total).toBe(2);
    const where = project.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(where.OR).toBeUndefined();
    expect(result.data[0]?.updateCount).toBe(2);
    expect(result.data[0]?.milestoneCount).toBe(4);
    expect(result.data[0]?.completedMilestones).toBe(1);
  });

  it('listForStaff scopes to managed ∪ assigned for a plain member', async () => {
    const { service, project, user, projectUpdate } = makeService();
    mockEmployee(user, 'emp-1');
    project.findFirst.mockResolvedValue(null); // no project managed
    project.findMany.mockResolvedValue([{ ...PROJECT }]);
    project.count.mockResolvedValue(1);
    projectUpdate.findMany.mockResolvedValue([]);

    const result = await service.listForStaff(BASE_USER);

    const where = project.findMany.mock.calls[0]?.[0]?.where;
    expect(where.OR).toEqual([
      { managerId: 'emp-1' },
      { members: { some: { employeeId: 'emp-1' } } },
    ]);
    expect(result.data).toHaveLength(1);
  });

  it('listForStaff returns [] for a user with no Employee and no projects.read', async () => {
    const { service, project, user, projectUpdate } = makeService();
    mockEmployee(user, null);
    project.findMany.mockResolvedValue([]);
    project.count.mockResolvedValue(0);
    projectUpdate.findMany.mockResolvedValue([]);

    const result = await service.listForStaff(BASE_USER);

    expect(result.data).toEqual([]);
    const where = project.findMany.mock.calls[0]?.[0]?.where;
    expect(where.OR).toEqual([{ id: '__none__' }]);
  });

  it('addMember creates projectId + employeeId + role', async () => {
    const { service, project, projectMember } = makeService();
    project.findFirst.mockResolvedValue({ id: 'p1' });
    projectMember.findFirst.mockResolvedValue(null);
    projectMember.create.mockImplementation(({ data }) => Promise.resolve({ id: 'pm1', ...data }));

    const created = await service.addMember('p1', { employeeId: 'emp-2', role: 'SITE_FOREMAN' });

    expect(projectMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ projectId: 'p1', employeeId: 'emp-2', role: 'SITE_FOREMAN' }),
      }),
    );
    expect(created.id).toBe('pm1');
  });

  it('addMember rejects a duplicate member with Conflict', async () => {
    const { service, project, projectMember } = makeService();
    project.findFirst.mockResolvedValue({ id: 'p1' });
    projectMember.findFirst.mockResolvedValue({ id: 'pm1' });

    await expect(
      service.addMember('p1', { employeeId: 'emp-2', role: 'SITE_FOREMAN' }),
    ).rejects.toThrow(ConflictException);
    expect(projectMember.create).not.toHaveBeenCalled();
  });

  it('removeMember hard-deletes and 404s when missing', async () => {
    const { service, projectMember } = makeService();
    projectMember.deleteMany.mockResolvedValue({ count: 1 });
    await service.removeMember('p1', 'pm1');
    expect(projectMember.deleteMany).toHaveBeenCalledWith({ where: { id: 'pm1', projectId: 'p1' } });

    projectMember.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeMember('p1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('getForStaff returns capabilities and 404s for invisible projects', async () => {
    const { service, project, user, projectMember, projectUpdate } = makeService();
    routeProjectLookup(project, {
      access: { id: 'p1', managerId: 'emp-9' },
      detail: { ...PROJECT, manager: null, client: null, members: [], milestones: [] },
    });
    mockEmployee(user, 'emp-1');
    project.findFirst.mockResolvedValueOnce(null); // no managed projects for canViewAll
    projectMember.findFirst.mockResolvedValue(null);
    projectUpdate.findMany.mockResolvedValue([]);

    await expect(service.getForStaff('p1', BASE_USER)).rejects.toThrow(NotFoundException);

    // A manager (of ≥1 project) can view, and capabilities reflect this project.
    mockEmployee(user, 'emp-1');
    routeProjectLookup(project, {
      access: { id: 'p1', managerId: 'emp-1' },
      detail: { ...PROJECT, manager: null, client: null, members: [], milestones: [] },
    });
    projectUpdate.findMany.mockResolvedValue([]);
    const result = await service.getForStaff('p1', BASE_USER);
    expect(result.capabilities).toEqual({ canManage: true, canLogWork: true });
  });
});
