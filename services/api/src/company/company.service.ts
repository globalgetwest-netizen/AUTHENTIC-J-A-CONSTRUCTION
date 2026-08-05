import { Injectable, NotFoundException } from '@nestjs/common';
import type { Company } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<Company> {
    const company = await this.prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!company) {
      throw new NotFoundException('Company profile has not been set up');
    }
    return company;
  }

  create(dto: CreateCompanyDto): Promise<Company> {
    return this.prisma.company.create({ data: dto });
  }

  async update(dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!company) {
      throw new NotFoundException('Company profile has not been set up');
    }
    return this.prisma.company.update({ where: { id: company.id }, data: dto });
  }
}
