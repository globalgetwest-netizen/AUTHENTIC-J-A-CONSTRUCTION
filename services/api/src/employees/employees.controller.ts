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
import type { Employee } from '@ajac/database';
import type { Paginated } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions('employees.read')
  list(@Query() query: QueryEmployeesDto): Promise<Paginated<Employee>> {
    return this.employeesService.list(query);
  }

  @Get(':id')
  @RequirePermissions('employees.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Employee> {
    return this.employeesService.get(id);
  }

  @Post()
  @RequirePermissions('employees.write')
  create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('employees.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto): Promise<Employee> {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('employees.write')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.employeesService.remove(id);
  }
}
