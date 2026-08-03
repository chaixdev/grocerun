import { Controller, Get } from '@nestjs/common';
import { env } from '../config';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'grocerun-api',
      version: env.APP_VERSION,
    };
  }
}
