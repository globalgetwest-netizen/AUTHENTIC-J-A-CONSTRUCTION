import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { InventoryTransactionType } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryMaterialCategoriesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryMaterialsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryWarehousesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryInventoryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryInventoryTransactionsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(InventoryTransactionType)
  type?: InventoryTransactionType;

  @IsOptional()
  @IsUUID()
  materialId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

export class QueryStockMovementsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}
