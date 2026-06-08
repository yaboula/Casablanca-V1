import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

// ================================================================
// GET /api/v1/health
// Used by Docker / load balancer health checks.
// Response: { status, db, redis, version, uptime }
// ================================================================

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.check();
  }
}
