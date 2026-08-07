import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { ProjectsService } from './projects.service';
import { CreateProjectUpdateDto } from './dto/create-project-update.dto';

/**
 * Staff self-scoped project portal — authenticated-only (no permission codes),
 * mirroring the /client module. Visibility + write gates are enforced per-user
 * inside ProjectsService, never by the route itself.
 */
@Controller('staff/projects')
export class StaffProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.projectsService.listForStaff(user);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getForStaff(id, user);
  }

  @Post(':id/updates')
  createUpdate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProjectUpdateDto,
  ) {
    return this.projectsService.createUpdate(id, dto, user);
  }

  @Post(':id/milestones/:milestoneId/complete')
  completeMilestone(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.projectsService.completeMilestone(id, milestoneId, user);
  }
}
