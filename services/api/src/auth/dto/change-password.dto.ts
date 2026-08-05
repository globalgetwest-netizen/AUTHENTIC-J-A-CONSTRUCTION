import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @Matches(/[a-zA-Z]/, { message: 'New password must contain at least one letter' })
  @Matches(/\d/, { message: 'New password must contain at least one number' })
  newPassword!: string;
}
