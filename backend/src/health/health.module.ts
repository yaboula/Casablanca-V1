import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HEALTH_REDIS } from './health.constants';
import Redis from 'ioredis';

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: HEALTH_REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');
        const isTls = redisUrl.startsWith('rediss://');

        return new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 0,
          enableOfflineQueue: false,
          retryStrategy: () => null,
          tls: isTls ? {} : undefined,
        });
      },
    },
  ],
})
export class HealthModule {}
