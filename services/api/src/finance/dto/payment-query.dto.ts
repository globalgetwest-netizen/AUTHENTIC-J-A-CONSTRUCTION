import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryPaymentsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  payeeType?: string;

  @IsOptional()
  @IsString()
  payeeId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}