import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MaintenanceStatus } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryMaintenanceDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;
}