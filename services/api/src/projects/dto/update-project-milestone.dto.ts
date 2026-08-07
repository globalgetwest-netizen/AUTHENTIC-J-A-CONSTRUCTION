import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { MilestoneStatus } from '@ajac/database';

export class UpdateProjectMilestoneDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;
}
