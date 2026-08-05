import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import type { Company } from '@ajac/database';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @RequirePermissions('company.read')
  get(): Promise<Company> {
    return this.companyService.get();
  }

  @Post()
  @RequirePermissions('company.write')
  create(@Body() dto: CreateCompanyDto): Promise<Company> {
    return this.companyService.create(dto);
  }

  @Patch()
  @RequirePermissions('company.write')
  update(@Body() dto: UpdateCompanyDto): Promise<Company> {
    return this.companyService.update(dto);
  }
}
