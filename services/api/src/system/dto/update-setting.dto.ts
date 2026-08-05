import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSettingDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  updatedById?: string;
}
