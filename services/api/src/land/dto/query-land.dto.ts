import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AllocationStatus, LandPlotStatus } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryLandProjectsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryLandPlotsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  landProjectId?: string;

  @IsOptional()
  @IsEnum(LandPlotStatus)
  status?: LandPlotStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryLandAllocationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  landProjectId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(AllocationStatus)
  status?: AllocationStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryLandDocumentsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  landProjectId?: string;
}
