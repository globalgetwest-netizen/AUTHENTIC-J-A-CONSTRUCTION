import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentStatus, TransactionDirection, TransactionType } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryTransactionsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionDirection)
  direction?: TransactionDirection;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}