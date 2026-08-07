import { Module } from '@nestjs/common';
import {
  ProjectMembersController,
  ProjectMilestonesController,
  ProjectsController,
  ProjectUpdatesController,
} from './projects.controller';
import { StaffProjectsController } from './staff-projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [
    ProjectsController,
    ProjectMilestonesController,
    ProjectUpdatesController,
    ProjectMembersController,
    StaffProjectsController,
  ],
  providers: [ProjectsService],
})
export class ProjectsModule {}
