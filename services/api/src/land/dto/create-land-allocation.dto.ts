import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AllocationStatus } from '@ajac/database';

export class CreateLandAllocationDto {
  @IsUUID()
  landProjectId!: string;

  @IsUUID()
  plotId!: string;

  @IsUUID()
  clientId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  amount!: number;

  @IsOptional()
  @IsEnum(AllocationStatus)
  status?: AllocationStatus;

  @IsOptional()
  @IsDateString()
  allocatedAt?: string;

  @IsOptional()
  @IsDateString()
  signedAt?: string;
}
