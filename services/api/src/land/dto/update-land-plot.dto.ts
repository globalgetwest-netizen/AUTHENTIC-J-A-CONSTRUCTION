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

export class UpdateLandPlotDto {
  @IsOptional()
  @IsUUID()
  landProjectId?: string;

  @IsOptional()
  @IsString()
  plotNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  sizeSqm?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  pricePerSqm?: number | null;

  @IsOptional()
  @IsEnum(LandPlotStatus)
  status?: LandPlotStatus;

  @IsOptional()
  @IsString()
  coordinates?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;
}
