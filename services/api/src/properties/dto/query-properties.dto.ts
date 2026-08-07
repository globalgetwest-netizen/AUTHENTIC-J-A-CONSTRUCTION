import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PropertyStatus } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryPropertiesDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsUUID()
  typeId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
