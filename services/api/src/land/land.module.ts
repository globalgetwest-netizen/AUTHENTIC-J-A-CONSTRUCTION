import { Module } from '@nestjs/common';
import { LandService } from './land.service';
import {
  LandAllocationsController,
  LandDocumentsController,
  LandPlotsController,
  LandProjectsController,
} from './land.controller';

@Module({
  controllers: [
    LandProjectsController,
    LandPlotsController,
    LandAllocationsController,
    LandDocumentsController,
  ],
  providers: [LandService],
})
export class LandModule {}
