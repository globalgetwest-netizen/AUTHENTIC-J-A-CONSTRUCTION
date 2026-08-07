import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import {
  PropertiesController,
  PropertySalesController,
  PropertyTypesController,
} from './properties.controller';

@Module({
  controllers: [PropertiesController, PropertySalesController, PropertyTypesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
