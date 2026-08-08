import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
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
  imports: [NotificationsModule],
  providers: [ProjectsService],
})
export class ProjectsModule {}
