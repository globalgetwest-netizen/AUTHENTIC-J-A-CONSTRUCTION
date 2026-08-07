import { IsString, IsUUID } from 'class-validator';

export class CreateLandDocumentDto {
  @IsUUID()
  landProjectId!: string;

  @IsString()
  title!: string;

  @IsString()
  fileUrl!: string;
}
