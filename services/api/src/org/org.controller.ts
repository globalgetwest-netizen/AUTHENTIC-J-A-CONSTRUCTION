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
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { OrgService } from './org.service';
import { CreateCompanyBranchDto } from './dto/create-company-branch.dto';
import { UpdateCompanyBranchDto } from './dto/update-company-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryOrgDto } from './dto/query-org.dto';

@Controller('company-branches')
export class CompanyBranchesController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  @RequirePermissions('org.read')
  list(@Query() query: QueryOrgDto) {
    return this.orgService.listBranches(query);
  }

  @Get(':id')
  @RequirePermissions('org.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.getBranch(id);
  }

  @Post()
  @RequirePermissions('org.write')
  create(@Body() dto: CreateCompanyBranchDto) {
    return this.orgService.createBranch(dto);
  }

  @Patch(':id')
  @RequirePermissions('org.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyBranchDto) {
    return this.orgService.updateBranch(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('org.write')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.orgService.removeBranch(id);
  }
}

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  @RequirePermissions('org.read')
  list(@Query() query: QueryOrgDto) {
    return this.orgService.listDepartments(query);
  }

  @Get(':id')
  @RequirePermissions('org.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.getDepartment(id);
  }

  @Post()
  @RequirePermissions('org.write')
  create(@Body() dto: CreateDepartmentDto) {
    return this.orgService.createDepartment(dto);
  }

  @Patch(':id')
  @RequirePermissions('org.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepartmentDto) {
    return this.orgService.updateDepartment(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('org.write')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.orgService.removeDepartment(id);
  }
}

@Controller('positions')
export class PositionsController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  @RequirePermissions('org.read')
  list(@Query() query: QueryOrgDto) {
    return this.orgService.listPositions(query);
  }

  @Get(':id')
  @RequirePermissions('org.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.getPosition(id);
  }

  @Post()
  @RequirePermissions('org.write')
  create(@Body() dto: CreatePositionDto) {
    return this.orgService.createPosition(dto);
  }

  @Patch(':id')
  @RequirePermissions('org.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePositionDto) {
    return this.orgService.updatePosition(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('org.write')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.orgService.removePosition(id);
  }
}

@Controller('org')
export class OrgChartController {
  constructor(private readonly orgService: OrgService) {}

  @Get('chart')
  @RequirePermissions('org.read')
  chart() {
    return this.orgService.chart();
  }
}
