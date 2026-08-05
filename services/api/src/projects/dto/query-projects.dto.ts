import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectStatus, ProjectType } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryProjectsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
