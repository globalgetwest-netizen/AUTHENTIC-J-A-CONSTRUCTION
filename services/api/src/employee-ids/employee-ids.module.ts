import { Module } from '@nestjs/common';
import { EmployeeIdsController, StaffEmployeeIDsController } from './employee-ids.controller';
import { EmployeeIdsService } from './employee-ids.service';

@Module({
  controllers: [EmployeeIdsController, StaffEmployeeIDsController],
  providers: [EmployeeIdsService],
})
export class EmployeeIdsModule {}