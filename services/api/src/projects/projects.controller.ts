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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
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
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Project> {
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
