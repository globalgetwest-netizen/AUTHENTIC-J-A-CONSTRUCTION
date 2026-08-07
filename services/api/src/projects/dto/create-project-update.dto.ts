import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectUpdateDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
}
