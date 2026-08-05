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
import type { SystemSetting } from '@ajac/database';
import type { Paginated } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { QuerySettingsDto } from './dto/query-settings.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Controller('system/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('system.settings.read')
  list(@Query() query: QuerySettingsDto): Promise<Paginated<SystemSetting>> {
    return this.settingsService.list(query);
  }

  @Get(':key')
  @RequirePermissions('system.settings.read')
  getByKey(@Param('key') key: string): Promise<SystemSetting> {
    return this.settingsService.getByKey(key);
  }

  @Post()
  @RequirePermissions('system.settings.write')
  create(@Body() dto: CreateSettingDto): Promise<SystemSetting> {
    return this.settingsService.create(dto);
  }

  @Patch(':key')
  @RequirePermissions('system.settings.write')
  updateByKey(@Param('key') key: string, @Body() dto: UpdateSettingDto): Promise<SystemSetting> {
    return this.settingsService.updateByKey(key, dto);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('system.settings.write')
  async removeByKey(@Param('key') key: string): Promise<void> {
    await this.settingsService.removeByKey(key);
  }
}
