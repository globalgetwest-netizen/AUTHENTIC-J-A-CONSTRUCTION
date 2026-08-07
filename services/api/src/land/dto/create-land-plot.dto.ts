import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { LandPlotStatus } from '@ajac/database';

export class CreateLandPlotDto {
  @IsUUID()
  landProjectId!: string;

  @IsString()
  plotNumber!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  sizeSqm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  pricePerSqm?: number;

  @IsOptional()
  @IsEnum(LandPlotStatus)
  status?: LandPlotStatus;

  @IsOptional()
  @IsString()
  coordinates?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
