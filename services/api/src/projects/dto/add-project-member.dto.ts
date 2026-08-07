import { IsString, IsUUID } from 'class-validator';

export class AddProjectMemberDto {
  @IsUUID()
  employeeId!: string;

  @IsString()
  role!: string;
}
