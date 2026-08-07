import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/**
 * Body for issuing a staff ID card. Only the employee is required; an optional
 * expiry can be supplied (default: no expiry). Re-issuing an employee who
 * already has a live card revokes the old one and links it via `replacedById`.
 */
export class CreateEmployeeIdDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}