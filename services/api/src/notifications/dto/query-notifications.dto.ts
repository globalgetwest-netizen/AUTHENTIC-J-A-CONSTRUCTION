import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/** Query params for the caller's own notifications list. */
export class QueryNotificationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  /** Show only notifications that haven't been read yet. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;
}