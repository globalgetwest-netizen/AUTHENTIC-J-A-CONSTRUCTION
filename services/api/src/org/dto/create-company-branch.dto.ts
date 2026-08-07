import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCompanyBranchDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isHeadquarter?: boolean;
}
