import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { LeadSource, LeadStage } from '@ajac/database';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  leadNo?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsEnum(LeadStage)
  status?: LeadStage;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  expectedValue?: number;

  @IsOptional()
  @IsISO8601()
  convertedAt?: string;
}
