import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVehicleDto {
  @IsUUID()
  equipmentId!: string;

  @IsString()
  registrationNo!: string;

  @IsOptional()
  @IsString()
  licensePlate?: string | null;

  @IsOptional()
  @IsString()
  fuelType?: string | null;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @IsDateString()
  inspectionDue?: string;
}