import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { validateEnv } from './config/env.validation';
import { databaseConfig } from './config/database.config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ReservationsModule } from './reservations/reservations.module';
import { QrModule } from './qr/qr.module';
import { StripeModule } from './stripe/stripe.module';
import { DocumentsModule } from './documents/documents.module';
import { S3Module } from './s3/s3.module';
import { SseModule } from './sse/sse.module';
import { OperatorModule } from './operator/operator.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
    }),

    // ── Database ─────────────────────────────────────────────
    TypeOrmModule.forRootAsync(databaseConfig),

    // ── Redis / BullMQ ────────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),

    // ── Rate Limiting ─────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 60,
      },
    ]),

    // ── Feature Modules ───────────────────────────────────────
    HealthModule,
    UsersModule,
    AuthModule,
    VehiclesModule,
    ReservationsModule,
    QrModule,
    StripeModule,
    S3Module,
    DocumentsModule,
    SseModule,
    OperatorModule,
    ChatModule,
  ],
})
export class AppModule {}
