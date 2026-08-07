import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateBlockSaleDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  /** Optional — falls back to the product's unitPrice. `totalAmount` is always computed server-side. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  unitPrice?: number;

  @IsDateString()
  soldOn!: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
