import { Module } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import {
  BlockProductsController,
  BlockProductionsController,
  BlockSalesController,
} from './blocks.controller';
import {
  StaffBlockProductionsController,
  StaffBlockProductsController,
} from './staff-block-productions.controller';

@Module({
  controllers: [
    BlockProductsController,
    BlockProductionsController,
    BlockSalesController,
    StaffBlockProductionsController,
    StaffBlockProductsController,
  ],
  providers: [BlocksService],
})
export class BlocksModule {}
