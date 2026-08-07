import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyTypeDto } from './dto/create-property-type.dto';
import { UpdatePropertyTypeDto } from './dto/update-property-type.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreatePropertySaleDto } from './dto/create-property-sale.dto';
import { UpdatePropertySaleDto } from './dto/update-property-sale.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { QueryPropertySalesDto } from './dto/query-property-sales.dto';

@Controller('property-types')
export class PropertyTypesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  @RequirePermissions('properties.read')
  list(@Query() query: QueryPropertiesDto) {
    return this.properties.listTypes(query);
  }

  @Get(':id')
  @RequirePermissions('properties.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.properties.getType(id);
  }

  @Post()
  @RequirePermissions('properties.write')
  create(@Body() dto: CreatePropertyTypeDto) {
    return this.properties.createType(dto);
  }

  @Patch(':id')
  @RequirePermissions('properties.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePropertyTypeDto) {
    return this.properties.updateType(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('properties.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.properties.removeType(id);
  }
}

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  @RequirePermissions('properties.read')
  list(@Query() query: QueryPropertiesDto) {
    return this.properties.list(query);
  }

  @Get(':id')
  @RequirePermissions('properties.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.properties.get(id);
  }

  @Post()
  @RequirePermissions('properties.write')
  create(@Body() dto: CreatePropertyDto) {
    return this.properties.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('properties.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePropertyDto) {
    return this.properties.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('properties.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.properties.remove(id);
  }
}

@Controller('property-sales')
export class PropertySalesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  @RequirePermissions('properties.read')
  list(@Query() query: QueryPropertySalesDto) {
    return this.properties.listSales(query);
  }

  @Get(':id')
  @RequirePermissions('properties.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.properties.getSale(id);
  }

  @Post()
  @RequirePermissions('properties.write')
  create(@Body() dto: CreatePropertySaleDto) {
    return this.properties.createSale(dto);
  }

  @Patch(':id')
  @RequirePermissions('properties.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePropertySaleDto) {
    return this.properties.updateSale(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('properties.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.properties.removeSale(id);
  }
}
