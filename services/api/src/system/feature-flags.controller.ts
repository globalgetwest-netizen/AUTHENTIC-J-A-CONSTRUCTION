import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { FeatureFlag } from '@ajac/database';
import type { Paginated } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { QueryFeatureFlagsDto } from './dto/query-feature-flags.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@Controller('system/feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @RequirePermissions('system.flags.read')
  list(@Query() query: QueryFeatureFlagsDto): Promise<Paginated<FeatureFlag>> {
    return this.featureFlagsService.list(query);
  }

  @Get(':key')
  @RequirePermissions('system.flags.read')
  getByKey(@Param('key') key: string): Promise<FeatureFlag> {
    return this.featureFlagsService.getByKey(key);
  }

  @Post()
  @RequirePermissions('system.flags.write')
  create(@Body() dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    return this.featureFlagsService.create(dto);
  }

  @Patch(':key')
  @RequirePermissions('system.flags.write')
  updateByKey(@Param('key') key: string, @Body() dto: UpdateFeatureFlagDto): Promise<FeatureFlag> {
    return this.featureFlagsService.updateByKey(key, dto);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system.flags.write')
  async removeByKey(@Param('key') key: string): Promise<void> {
    await this.featureFlagsService.removeByKey(key);
  }
}
