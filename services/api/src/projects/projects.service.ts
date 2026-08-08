import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@ajac/database';
import type {
  Project,
  ProjectMember,
  ProjectMilestone,
  ProjectUpdate,
} from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
} from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import type { AuthUser } from '../common/auth/auth-user.type';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { UpdateProjectMilestoneDto } from './dto/update-project-milestone.dto';
import { CreateProjectUpdateDto } from './dto/create-project-update.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'code', 'name', 'status', 'budgetAmount'] as const;

/** Enriched project payload for a single-project detail view. */
const PROJECT_DETAIL_INCLUDE = {
  manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  client: true,
  members: {
    include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
  },
  milestones: { orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }] },
} satisfies Prisma.ProjectInclude;

/** Staff-dashboard summary: work-log/milestone counts plus completed milestone ids. */
const STAFF_SUMMARY_INCLUDE = {
  _count: { select: { updates: true, milestones: true } },
  milestones: { where: { status: 'COMPLETED' }, select: { id: true } },
} satisfies Prisma.ProjectInclude;

const LATEST_UPDATES_LIMIT = 200;

type ProjectDetail = Prisma.ProjectGetPayload<{ include: typeof PROJECT_DETAIL_INCLUDE }> & {
  updates: ProjectUpdateWithAuthor[];
};

type ProjectUpdateWithAuthor = ProjectUpdate & { authorName: string | null };

type MemberWithEmployee = ProjectMember & {
  employee: { id: string; firstName: string; lastName: string; employeeCode: string };
};

/** Admins bypass every project-membership gate (role check only — no permissions). */
function isAdminUser(user: AuthUser): boolean {
  return user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN');
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: QueryProjectsDto): Promise<Paginated<Project>> {
    const where: Prisma.ProjectWhereInput = { deletedAt: null };
    if (query.projectType) {
      where.projectType = query.projectType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.clientId) {
      where.clientId = query.clientId;
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({ where, skip, take, orderBy }),
      this.prisma.project.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async get(id: string): Promise<ProjectDetail> {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: PROJECT_DETAIL_INCLUDE,
    });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    const updates = await this.prisma.projectUpdate.findMany({
      where: { projectId: id },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });
    const withAuthor = await this.attachAuthorNames(updates);
    return { ...project, updates: withAuthor };
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: { ...dto, code: dto.code ?? generateBusinessCode('PRJ') },
    });
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.ensureExists(id);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.project.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Project ${id} not found`);
    }
  }

  // --- Milestones (phases) ---------------------------------------------------

  async listMilestones(projectId: string): Promise<ProjectMilestone[]> {
    await this.ensureExists(projectId);
    return this.prisma.projectMilestone.findMany({
      where: { projectId },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createMilestone(
    projectId: string,
    dto: CreateProjectMilestoneDto,
  ): Promise<ProjectMilestone> {
    await this.ensureExists(projectId);
    return this.prisma.projectMilestone.create({ data: { ...dto, projectId } });
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    dto: UpdateProjectMilestoneDto,
  ): Promise<ProjectMilestone> {
    const milestone = await this.findMilestoneOrThrow(projectId, milestoneId);
    const data: Prisma.ProjectMilestoneUpdateInput = { ...dto };
    // Keep completedAt consistent with the status transition.
    if (dto.status !== undefined) {
      if (dto.status === 'COMPLETED' && milestone.status !== 'COMPLETED') {
        data.completedAt = new Date();
      }
      if (dto.status !== 'COMPLETED' && milestone.status === 'COMPLETED') {
        data.completedAt = null;
      }
    }
    return this.prisma.projectMilestone.update({ where: { id: milestoneId }, data });
  }

  async removeMilestone(projectId: string, milestoneId: string): Promise<void> {
    await this.findMilestoneOrThrow(projectId, milestoneId);
    await this.prisma.projectMilestone.deleteMany({ where: { id: milestoneId, projectId } });
  }

  /**
   * "Mark phase done" — manager/admin only. Idempotent: completing an already
   * completed milestone is a no-op rather than an error.
   */
  async completeMilestone(
    projectId: string,
    milestoneId: string,
    user: AuthUser,
  ): Promise<ProjectMilestone> {
    const { canManage } = await this.resolveAccess(projectId, user);
    if (!canManage) {
      throw new ForbiddenException('Only the project manager or an admin can complete milestones');
    }
    const milestone = await this.findMilestoneOrThrow(projectId, milestoneId);
    if (milestone.status === 'COMPLETED') {
      return milestone;
    }
    const updated = await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    await this.notifyManager(
      projectId,
      'Milestone completed',
      `Phase "${milestone.title}" was marked complete.`,
    );
    return updated;
  }

  // --- Work log (updates) ----------------------------------------------------

  async listUpdates(projectId: string): Promise<ProjectUpdateWithAuthor[]> {
    await this.ensureExists(projectId);
    const updates = await this.prisma.projectUpdate.findMany({
      where: { projectId },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });
    return this.attachAuthorNames(updates);
  }

  /** Member-gated: only assigned members (or the manager/admin) may log work. */
  async createUpdate(
    projectId: string,
    dto: CreateProjectUpdateDto,
    user: AuthUser,
  ): Promise<ProjectUpdate> {
    const { canLogWork } = await this.resolveAccess(projectId, user);
    if (!canLogWork) {
      throw new ForbiddenException('You must be a project member to log work on this project');
    }
    const update = await this.prisma.projectUpdate.create({
      data: { projectId, authorId: user.id, ...dto },
    });
    await this.notifyManager(
      projectId,
      'New work log',
      `${user.firstName} ${user.lastName} logged work on this project.`,
    );
    return update;
  }

  // --- Members ---------------------------------------------------------------

  async listMembers(projectId: string): Promise<MemberWithEmployee[]> {
    await this.ensureExists(projectId);
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(projectId: string, dto: AddProjectMemberDto): Promise<ProjectMember> {
    await this.ensureExists(projectId);
    const existing = await this.prisma.projectMember.findFirst({
      where: { projectId, employeeId: dto.employeeId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('That employee is already a member of this project');
    }
    return this.prisma.projectMember.create({
      data: { projectId, employeeId: dto.employeeId, role: dto.role },
    });
  }

  async removeMember(projectId: string, memberId: string): Promise<void> {
    const result = await this.prisma.projectMember.deleteMany({
      where: { id: memberId, projectId },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Project member ${memberId} not found`);
    }
  }

  // --- Staff self-scoped portal ----------------------------------------------

  /**
   * Projects visible to the calling staff principal, with work-log + phase
   * summaries for the dashboard cards. Admins and anyone holding `projects.read`
   * see every project; a project manager (manager of ≥1 project) sees all too;
   * everyone else sees only the projects they manage or are a member of.
   */
  async listForStaff(user: AuthUser) {
    const employeeId = await this.employeeIdOf(user.id);
    const admin = isAdminUser(user);
    let seesAll = admin || user.permissions.includes('projects.read');
    if (!seesAll && employeeId !== null) {
      const managesAny = await this.prisma.project.findFirst({
        where: { managerId: employeeId, deletedAt: null },
        select: { id: true },
      });
      seesAll = managesAny !== null;
    }

    const where: Prisma.ProjectWhereInput = { deletedAt: null };
    if (!seesAll) {
      where.OR =
        employeeId !== null
          ? [{ managerId: employeeId }, { members: { some: { employeeId } } }]
          : [{ id: '__none__' }];
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: STAFF_SUMMARY_INCLUDE,
      }),
      this.prisma.project.count({ where }),
    ]);

    const latest = await this.latestUpdateFor(data.map((p) => p.id));
    const rows = data.map((p) => ({
      ...p,
      updateCount: p._count.updates,
      milestoneCount: p._count.milestones,
      completedMilestones: p.milestones.length,
      latestUpdate: latest.get(p.id) ?? null,
    }));
    return { data: rows, meta: { total } };
  }

  /**
   * One project for the staff portal with full detail + the caller's
   * capabilities. 404 when the project is not visible to the caller (never
   * leaks existence).
   */
  async getForStaff(id: string, user: AuthUser) {
    const employeeId = await this.employeeIdOf(user.id);
    const admin = isAdminUser(user);
    let canViewAll = admin || user.permissions.includes('projects.read');
    if (!canViewAll && employeeId !== null) {
      const managesAny = await this.prisma.project.findFirst({
        where: { managerId: employeeId, deletedAt: null },
        select: { id: true },
      });
      canViewAll = managesAny !== null;
    }

    const { canManage, canLogWork } = await this.resolveAccess(id, user);
    if (!canViewAll && !canManage && !canLogWork) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return { project: await this.get(id), capabilities: { canManage, canLogWork } };
  }

  // --- Access helpers (single enforcement point) ------------------------------

  /**
   * Resolves the caller's standing on a project: canManage (manager/admin) and
   * canLogWork (manager/admin/member). Throws 404 if the project is gone.
   */
  private async resolveAccess(
    projectId: string,
    user: AuthUser,
  ): Promise<{ project: { id: string; managerId: string | null }; canManage: boolean; canLogWork: boolean }> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, managerId: true },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    if (isAdminUser(user)) {
      return { project, canManage: true, canLogWork: true };
    }

    const employeeId = await this.employeeIdOf(user.id);
    const isManager = employeeId !== null && project.managerId === employeeId;
    let isMember = false;
    if (employeeId !== null && !isManager) {
      const membership = await this.prisma.projectMember.findFirst({
        where: { projectId, employeeId },
        select: { id: true },
      });
      isMember = membership !== null;
    }
    return { project, canManage: isManager, canLogWork: isManager || isMember };
  }

  /** The caller's linked Employee id, or null when they have none. */
  private async employeeIdOf(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { employee: { select: { id: true } } },
    });
    return user?.employee?.id ?? null;
  }

  // --- Notifications ----------------------------------------------------------

  /** Notifies the project manager's user when a phase is completed / work logged. */
  private async notifyManager(projectId: string, title: string, body: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: {
        name: true,
        manager: { select: { userId: true } },
      },
    });
    const managerUserId = project?.manager?.userId;
    if (!managerUserId) {
      return;
    }
    await this.notifications.notify({
      userId: managerUserId,
      type: NotificationType.PROJECT,
      title,
      body,
      data: { projectId },
      link: `/staff/projects/${projectId}`,
    });
  }

  // --- Internals ---------------------------------------------------------------

  /**
   * ProjectUpdate.authorId has no FK relation, so author names are resolved via
   * a User lookup and attached as `authorName` ("First Last", null when absent).
   */
  private async attachAuthorNames(updates: ProjectUpdate[]): Promise<ProjectUpdateWithAuthor[]> {
    const authorIds = [
      ...new Set(
        updates.map((u) => u.authorId).filter((id): id is string => Boolean(id)),
      ),
    ];
    const withAuthor: ProjectUpdateWithAuthor[] = updates.map((u) => ({
      ...u,
      authorName: null,
    }));
    if (authorIds.length === 0) {
      return withAuthor;
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const byId = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    for (const update of withAuthor) {
      if (update.authorId) {
        update.authorName = byId.get(update.authorId) ?? null;
      }
    }
    return withAuthor;
  }

  /** Latest update per project (single deduped query), for the dashboard cards. */
  private async latestUpdateFor(
    projectIds: string[],
  ): Promise<Map<string, ProjectUpdateWithAuthor>> {
    const latest = new Map<string, ProjectUpdateWithAuthor>();
    if (projectIds.length === 0) {
      return latest;
    }
    const recent = await this.prisma.projectUpdate.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { publishedAt: 'desc' },
      take: LATEST_UPDATES_LIMIT,
    });
    const withAuthor = await this.attachAuthorNames(recent);
    for (const update of withAuthor) {
      if (!latest.has(update.projectId)) {
        latest.set(update.projectId, update);
      }
    }
    return latest;
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Project ${id} not found`);
    }
  }

  private async findMilestoneOrThrow(
    projectId: string,
    milestoneId: string,
  ): Promise<ProjectMilestone> {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone ${milestoneId} not found on project ${projectId}`);
    }
    return milestone;
  }
}
