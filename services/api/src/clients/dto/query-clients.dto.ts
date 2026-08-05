import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClientStatus, ClientType } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryClientsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
