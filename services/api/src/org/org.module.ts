import { Module } from '@nestjs/common';
import { OrgService } from './org.service';
import { CompanyBranchesController, DepartmentsController, PositionsController } from './org.controller';

@Module({
  controllers: [CompanyBranchesController, DepartmentsController, PositionsController],
  providers: [OrgService],
})
export class OrgModule {}
