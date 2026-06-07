import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import { CacheModule } from "@nestjs/cache-manager";
import { redisInsStore } from "cache-manager-ioredis-yet";
import Redis from "ioredis";
import { validateEnv } from "./config/env.validation";
import { databaseConfig } from "./config/database.config";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { QrModule } from "./qr/qr.module";
import { StripeModule } from "./stripe/stripe.module";
import { DocumentsModule } from "./documents/documents.module";
import { S3Module } from "./s3/s3.module";
import { SseModule } from "./sse/sse.module";
import { OperatorModule } from "./operator/operator.module";
import { ChatModule } from "./chat/chat.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [".env"],
    }),

    // ── Database ─────────────────────────────────────────────
    TypeOrmModule.forRootAsync(databaseConfig),

    // ── Redis / BullMQ ────────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>(
          "REDIS_URL",
          "redis://localhost:6379",
        );
        const isTls = redisUrl.startsWith("rediss://");
        return {
          connection: {
            url: redisUrl,
            keepAlive: 10000,
            family: 0,
            ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
          },
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: false,
          },
        };
      },
      inject: [ConfigService],
    }),

    // ── Cache (Redis, TTL 60 s) — consumed by AdminStatsService ─────
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("REDIS_URL", "redis://localhost:6379");
        const isTls = url.startsWith("rediss://");
        const client = new Redis(url, {
          family: 0,
          ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
        });
        return {
          store: redisInsStore(client, { ttl: 60_000 }),
          ttl: 60_000,
        };
      },
      inject: [ConfigService],
    }),

    // ── Rate Limiting ─────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: "default",
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
    AdminModule,
  ],
})
export class AppModule {}
