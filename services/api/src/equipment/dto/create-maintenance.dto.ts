import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { MaintenanceStatus } from '@ajac/database';

export class CreateMaintenanceDto {
  @IsUUID()
  equipmentId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  cost?: number;

  @IsOptional()
  @IsString()
  serviceProvider?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;
}