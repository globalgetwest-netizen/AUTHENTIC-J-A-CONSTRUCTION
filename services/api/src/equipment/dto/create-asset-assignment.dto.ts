import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAssetAssignmentDto {
  @IsUUID()
  assetId!: string;

  @IsUUID()
  assignedToId!: string;

  @IsOptional()
  @IsUUID()
  assignedById?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}