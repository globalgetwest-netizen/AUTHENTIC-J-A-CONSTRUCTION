import { IsOptional, IsString } from 'class-validator';

export class CreateMaterialCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
