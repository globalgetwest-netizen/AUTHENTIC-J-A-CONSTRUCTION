import { Module } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import {
  BlockProductsController,
  BlockProductionsController,
  BlockSalesController,
} from './blocks.controller';

@Module({
  controllers: [
    BlockProductsController,
    BlockProductionsController,
    BlockSalesController,
  ],
  providers: [BlocksService],
})
export class BlocksModule {}
