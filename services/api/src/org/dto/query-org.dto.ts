import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/** Shared query params for company-branches, departments and positions lists. */
export class QueryOrgDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
