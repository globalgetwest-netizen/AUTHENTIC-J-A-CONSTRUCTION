import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  registrationNo?: string;

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