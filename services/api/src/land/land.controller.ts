import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { LandService } from './land.service';
import { CreateLandProjectDto } from './dto/create-land-project.dto';
import { UpdateLandProjectDto } from './dto/update-land-project.dto';
import { CreateLandPlotDto } from './dto/create-land-plot.dto';
import { UpdateLandPlotDto } from './dto/update-land-plot.dto';
import { CreateLandAllocationDto } from './dto/create-land-allocation.dto';
import { UpdateLandAllocationDto } from './dto/update-land-allocation.dto';
import { CreateLandDocumentDto } from './dto/create-land-document.dto';
import {
  QueryLandAllocationsDto,
  QueryLandDocumentsDto,
  QueryLandPlotsDto,
  QueryLandProjectsDto,
} from './dto/query-land.dto';

@Controller('land-projects')
export class LandProjectsController {
  constructor(private readonly land: LandService) {}

  @Get()
  @RequirePermissions('land.read')
  list(@Query() query: QueryLandProjectsDto) {
    return this.land.listProjects(query);
  }

  @Get(':id')
  @RequirePermissions('land.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.land.getProject(id);
  }

  @Post()
  @RequirePermissions('land.write')
  create(@Body() dto: CreateLandProjectDto) {
    return this.land.createProject(dto);
  }

  @Patch(':id')
  @RequirePermissions('land.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLandProjectDto) {
    return this.land.updateProject(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('land.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.land.removeProject(id);
  }
}

@Controller('land-plots')
export class LandPlotsController {
  constructor(private readonly land: LandService) {}

  @Get()
  @RequirePermissions('land.read')
  list(@Query() query: QueryLandPlotsDto) {
    return this.land.listPlots(query);
  }

  @Get(':id')
  @RequirePermissions('land.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.land.getPlot(id);
  }

  @Post()
  @RequirePermissions('land.write')
  create(@Body() dto: CreateLandPlotDto) {
    return this.land.createPlot(dto);
  }

  @Patch(':id')
  @RequirePermissions('land.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLandPlotDto) {
    return this.land.updatePlot(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('land.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.land.removePlot(id);
  }
}

@Controller('land-allocations')
export class LandAllocationsController {
  constructor(private readonly land: LandService) {}

  @Get()
  @RequirePermissions('land.read')
  list(@Query() query: QueryLandAllocationsDto) {
    return this.land.listAllocations(query);
  }

  @Get(':id')
  @RequirePermissions('land.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.land.getAllocation(id);
  }

  @Post()
  @RequirePermissions('land.write')
  create(@Body() dto: CreateLandAllocationDto) {
    return this.land.createAllocation(dto);
  }

  @Patch(':id')
  @RequirePermissions('land.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLandAllocationDto) {
    return this.land.updateAllocation(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('land.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.land.removeAllocation(id);
  }
}

@Controller('land-documents')
export class LandDocumentsController {
  constructor(private readonly land: LandService) {}

  @Get()
  @RequirePermissions('land.read')
  list(@Query() query: QueryLandDocumentsDto) {
    return this.land.listDocuments(query);
  }

  @Get(':id')
  @RequirePermissions('land.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.land.getDocument(id);
  }

  @Post()
  @RequirePermissions('land.write')
  create(@Body() dto: CreateLandDocumentDto) {
    return this.land.createDocument(dto);
  }

  @Delete(':id')
  @RequirePermissions('land.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.land.removeDocument(id);
  }
}
