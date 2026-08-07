import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { VerificationResult } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/** Query params for the ID card list. */
export class QueryEmployeeIdsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(VerificationResult)
  status?: VerificationResult;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}