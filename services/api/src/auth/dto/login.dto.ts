import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  // Email is optional: when omitted, login matches the password against all
  // active accounts (used by the password-only portal sign-in flow).
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
