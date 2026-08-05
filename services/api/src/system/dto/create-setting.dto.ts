import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSettingDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

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
