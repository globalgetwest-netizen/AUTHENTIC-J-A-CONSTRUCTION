import { Module } from '@nestjs/common';
import { OrgService } from './org.service';
import {
  CompanyBranchesController,
  DepartmentsController,
  PositionsController,
  OrgChartController,
} from './org.controller';

@Module({
  controllers: [CompanyBranchesController, DepartmentsController, PositionsController, OrgChartController],
  providers: [OrgService],
})
export class OrgModule {}
