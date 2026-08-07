import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { Project } from '@ajac/database';
import type { Paginated } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { UpdateProjectMilestoneDto } from './dto/update-project-milestone.dto';
import { CreateProjectUpdateDto } from './dto/create-project-update.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions('projects.read')
  list(@Query() query: QueryProjectsDto): Promise<Paginated<Project>> {
    return this.projectsService.list(query);
  }

  @Get(':id')
  @RequirePermissions('projects.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.get(id);
  }

  @Post()
  @RequirePermissions('projects.write')
  create(@Body() dto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('projects.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto): Promise<Project> {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('projects.write')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projectsService.remove(id);
  }
}

@Controller('projects/:projectId/milestones')
export class ProjectMilestonesController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions('projects.read')
  list(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectsService.listMilestones(projectId);
  }

  @Post()
  @RequirePermissions('projects.write')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProjectMilestoneDto,
  ) {
    return this.projectsService.createMilestone(projectId, dto);
  }

  @Patch(':milestoneId')
  @RequirePermissions('projects.write')
  update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() dto: UpdateProjectMilestoneDto,
  ) {
    return this.projectsService.updateMilestone(projectId, milestoneId, dto);
  }

  @Delete(':milestoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('projects.write')
  async remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ): Promise<void> {
    await this.projectsService.removeMilestone(projectId, milestoneId);
  }

  @Post(':milestoneId/complete')
  @RequirePermissions('projects.write')
  complete(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projectsService.completeMilestone(projectId, milestoneId, user);
  }
}

@Controller('projects/:projectId/updates')
export class ProjectUpdatesController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions('projects.read')
  list(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectsService.listUpdates(projectId);
  }

  @Post()
  @RequirePermissions('projects.write')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProjectUpdateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projectsService.createUpdate(projectId, dto, user);
  }
}

@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions('projects.read')
  list(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectsService.listMembers(projectId);
  }

  @Post()
  @RequirePermissions('projects.write')
  add(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: AddProjectMemberDto) {
    return this.projectsService.addMember(projectId, dto);
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('projects.write')
  async remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    await this.projectsService.removeMember(projectId, memberId);
  }
}
