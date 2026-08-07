import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentStatus } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryBlockProductsDto extends PaginationQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryBlockProductionsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class QueryBlockSalesDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
