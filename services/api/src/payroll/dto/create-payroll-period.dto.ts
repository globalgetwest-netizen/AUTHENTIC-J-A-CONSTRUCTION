import { IsDateString, IsString, Length } from 'class-validator';

export class CreatePayrollPeriodDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}