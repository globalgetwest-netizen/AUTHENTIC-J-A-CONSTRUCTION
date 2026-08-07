import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { Employee } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
} from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const SORTABLE = [
  'createdAt',
  'updatedAt',
  'employeeCode',
  'firstName',
  'lastName',
  'email',
  'salary',
  'status',
] as const;

const INCLUDE = {
  department: true,
  position: true,
  branch: true,
} satisfies Prisma.EmployeeInclude;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryEmployeesDto): Promise<Paginated<Employee>> {
    const where: Prisma.EmployeeWhereInput = { deletedAt: null };
    if (query.status) {
      where.status = query.status;
    }
    if (query.employmentType) {
      where.employmentType = query.employmentType;
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query.positionId) {
      where.positionId = query.positionId;
    }
    if (query.branchId) {
      where.branchId = query.branchId;
    }
    if (query.search) {
      where.OR = [
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({ where, skip, take, orderBy, include: INCLUDE }),
      this.prisma.employee.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async get(id: string): Promise<Employee> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE,
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    return this.prisma.employee.create({
      data: {
        employeeCode: dto.employeeCode ?? generateBusinessCode('EMP'),
        firstName: dto.firstName,
        lastName: dto.lastName,
        otherNames: dto.otherNames,
        email: dto.email,
        phone: dto.phone,
        nationalId: dto.nationalId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender,
        address: dto.address,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        branchId: dto.branchId,
        employmentType: dto.employmentType,
        hireDate: new Date(dto.hireDate),
        terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : null,
        status: dto.status,
        salary: dto.salary ?? null,
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    await this.ensureExists(id);
    const data: Prisma.EmployeeUncheckedUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.otherNames !== undefined) data.otherNames = dto.otherNames;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.nationalId !== undefined) data.nationalId = dto.nationalId;
    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = dto.dateOfBirth === null ? null : new Date(dto.dateOfBirth);
    }
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.departmentId !== undefined) data.departmentId = dto.departmentId;
    if (dto.positionId !== undefined) data.positionId = dto.positionId;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;
    if (dto.employmentType !== undefined) data.employmentType = dto.employmentType;
    if (dto.hireDate !== undefined) data.hireDate = new Date(dto.hireDate);
    if (dto.terminationDate !== undefined) {
      data.terminationDate = dto.terminationDate === null ? null : new Date(dto.terminationDate);
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.salary !== undefined) data.salary = dto.salary;
    return this.prisma.employee.update({ where: { id }, data, include: INCLUDE });
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.employee.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
  }
}
