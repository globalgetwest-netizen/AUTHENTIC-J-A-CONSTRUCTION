import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@ajac/types';
import { Public } from '../common/auth/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'authentic-ja-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }
}