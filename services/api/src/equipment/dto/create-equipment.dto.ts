import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EquipmentStatus } from '@ajac/database';

export class CreateEquipmentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  model?: string | null;

  @IsOptional()
  @IsString()
  serialNo?: string | null;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  purchasePrice?: number;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}