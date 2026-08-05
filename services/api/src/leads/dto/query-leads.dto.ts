import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LeadSource, LeadStage } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryLeadsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsEnum(LeadStage)
  status?: LeadStage;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
