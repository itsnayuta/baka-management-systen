import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health & Monitoring')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Liveness & Readiness probe cho Docker / Kubernetes / Cloudflare' })
  health() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
