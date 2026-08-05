import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ClientStatus, ClientType } from '@ajac/database';

export class CreateClientDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  clientCode?: string;

  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsString()
  contactName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
