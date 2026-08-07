import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaymentStatus } from '@ajac/database';

export class UpdateBlockSaleDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  unitPrice?: number | null;

  @IsOptional()
  @IsDateString()
  soldOn?: string;

  @IsOptional()
  @IsString()
  reference?: string | null;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
