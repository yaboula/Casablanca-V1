import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

// ================================================================
// GET /api/v1/health
// Used by Docker / load balancer health checks.
// Response: { status, db, redis, version, uptime }
// ================================================================

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async check() {
    let dbStatus = 'ok';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      db: dbStatus,
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: Math.floor(process.uptime()),
      environment: this.config.get<string>('NODE_ENV'),
      timestamp: new Date().toISOString(),
    };
  }
}
