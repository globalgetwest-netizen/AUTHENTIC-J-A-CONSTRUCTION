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
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Employee } from '@ajac/database';
import type { Paginated } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { employeePhotosDiskStorage } from '../common/storage/uploads';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const PHOTO_UPLOAD_OPTIONS = {
  storage: employeePhotosDiskStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
};

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

  /** Streams the worker headshot (used for the card PDF + previews). */
  @Get(':id/photo')
  @RequirePermissions('employees.read')
  async photo(@Param('id', ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const { stream, length, type, filename } = await this.employeesService.openPhoto(id);
    return new StreamableFile(stream, { type, length, disposition: `inline; filename="${filename}"` });
  }

  /** Uploads/replaces the worker headshot (multipart field: `photo`). */
  @Post(':id/photo')
  @RequirePermissions('employees.write')
  @UseInterceptors(FileInterceptor('photo', PHOTO_UPLOAD_OPTIONS))
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Employee> {
    return this.employeesService.uploadPhoto(id, file);
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
