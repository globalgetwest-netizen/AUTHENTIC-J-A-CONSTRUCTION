import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

/**
 * Shared body for single-warehouse stock operations (IN / OUT / ADJUST).
 * For ADJUST, `quantity` is the new counted value (0 allowed); the service
 * enforces `quantity > 0` for IN and OUT.
 */
export class StockOpDto {
  @IsUUID()
  materialId!: string;

  @IsUUID()
  warehouseId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999999)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  unitCost?: number;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
