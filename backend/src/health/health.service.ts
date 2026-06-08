import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { HEALTH_REDIS } from './health.constants';

type DependencyStatus = 'ok' | 'error';

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @Inject(HEALTH_REDIS) private readonly redis: Redis,
  ) {}

  async check() {
    const db = await this.checkDatabase();
    const redis = await this.checkRedis();
    const status = db === 'ok' && redis === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      db,
      redis,
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: Math.floor(process.uptime()),
      environment: this.config.get<string>('NODE_ENV'),
      timestamp: new Date().toISOString(),
    };
  }

  async onModuleDestroy() {
    if (this.redis.status !== 'end') {
      await this.redis.quit().catch((error: unknown) => {
        this.logger.warn(
          `Failed to close health Redis client cleanly: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch (error) {
      this.logger.warn(
        `Database health check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 'error';
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    try {
      await this.redis.ping();
      return 'ok';
    } catch (error) {
      this.logger.warn(
        `Redis health check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 'error';
    }
  }
}
