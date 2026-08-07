import { IsOptional, IsString } from 'class-validator';

export class CreatePropertyTypeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
