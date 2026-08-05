import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFeatureFlagDto {
  @IsString()
  key!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  updatedById?: string;
}
