import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EmployeeIdType, JobCategory } from '@ajac/database';

/**
 * Body for issuing an ID card. The card can be linked to an existing employee
 * (supply `employeeId`) or created standalone with the holder fields below
 * (used for one-off Worker/Admin/CEO passes). `idType` selects which of the
 * four corporate ID tiers the card belongs to and drives the card layout.
 */
export class CreateEmployeeIdDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(EmployeeIdType)
  idType?: EmployeeIdType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  holderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsEnum(JobCategory)
  jobCategory?: JobCategory;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  photoUrl?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

/** Patch an existing card's type, holder details or expiry. */
export class UpdateEmployeeIdDto {
  @IsOptional()
  @IsEnum(EmployeeIdType)
  idType?: EmployeeIdType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  holderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsEnum(JobCategory)
  jobCategory?: JobCategory;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  photoUrl?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
