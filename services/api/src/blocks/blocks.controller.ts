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
import { BlocksService } from './blocks.service';
import { CreateBlockProductDto } from './dto/create-block-product.dto';
import { UpdateBlockProductDto } from './dto/update-block-product.dto';
import { CreateBlockProductionDto } from './dto/create-block-production.dto';
import { UpdateBlockProductionDto } from './dto/update-block-production.dto';
import { CreateBlockSaleDto } from './dto/create-block-sale.dto';
import { UpdateBlockSaleDto } from './dto/update-block-sale.dto';
import {
  QueryBlockProductsDto,
  QueryBlockProductionsDto,
  QueryBlockSalesDto,
} from './dto/query-blocks.dto';

@Controller('block-products')
export class BlockProductsController {
  constructor(private readonly blocks: BlocksService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryBlockProductsDto) {
    return this.blocks.listProducts(query);
  }

  @Get(':id')
  @RequirePermissions('materials.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.blocks.getProduct(id);
  }

  @Post()
  @RequirePermissions('materials.write')
  create(@Body() dto: CreateBlockProductDto) {
    return this.blocks.createProduct(dto);
  }

  @Patch(':id')
  @RequirePermissions('materials.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlockProductDto) {
    return this.blocks.updateProduct(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('materials.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.blocks.removeProduct(id);
  }
}

@Controller('block-productions')
export class BlockProductionsController {
  constructor(private readonly blocks: BlocksService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryBlockProductionsDto) {
    return this.blocks.listProductions(query);
  }

  @Get(':id')
  @RequirePermissions('materials.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.blocks.getProduction(id);
  }

  @Post()
  @RequirePermissions('materials.write')
  create(@Body() dto: CreateBlockProductionDto) {
    return this.blocks.createProduction(dto);
  }

  @Patch(':id')
  @RequirePermissions('materials.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlockProductionDto) {
    return this.blocks.updateProduction(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('materials.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.blocks.removeProduction(id);
  }
}

@Controller('block-sales')
export class BlockSalesController {
  constructor(private readonly blocks: BlocksService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryBlockSalesDto) {
    return this.blocks.listSales(query);
  }

  @Get(':id')
  @RequirePermissions('materials.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.blocks.getSale(id);
  }

  @Post()
  @RequirePermissions('materials.write')
  create(@Body() dto: CreateBlockSaleDto) {
    return this.blocks.createSale(dto);
  }

  @Patch(':id')
  @RequirePermissions('materials.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlockSaleDto) {
    return this.blocks.updateSale(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('materials.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.blocks.removeSale(id);
  }
}
