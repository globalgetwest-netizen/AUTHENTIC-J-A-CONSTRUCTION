import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdatePayrollDto {
  /**
   * A DRAFT payrun's gross can be adjusted by an admin; statutory deductions
   * (SSNIT + PAYE) and net are recomputed from it server-side on save.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999)
  grossPay?: number;
}