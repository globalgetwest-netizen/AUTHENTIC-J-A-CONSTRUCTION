import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController, FeatureFlagsController],
  providers: [SettingsService, FeatureFlagsService],
})
export class SystemModule {}
