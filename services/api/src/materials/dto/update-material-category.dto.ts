import { IsOptional, IsString } from 'class-validator';

export class UpdateMaterialCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
