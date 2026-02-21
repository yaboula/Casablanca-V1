/**
 * Integration Test Application Factory
 * =====================================================================
 * Creates a real NestJS application connected to nexus_test_db.
 *
 * External services (Stripe, S3, BullMQ jobs) are replaced with mocks
 * so integration tests run without real API keys or job processing.
 *
 * Requires running:  nexus_postgres + nexus_redis (Docker)
 * Target database:   nexus_test_db  (auto-created schema via synchronize)
 * =====================================================================
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import * as path from 'path';

import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { VehiclesModule } from '../../src/vehicles/vehicles.module';
import { ReservationsModule } from '../../src/reservations/reservations.module';
import { QrModule } from '../../src/qr/qr.module';
import { StripeService } from '../../src/stripe/stripe.service';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

// NOTE: process.env is pre-populated by test/setup/load-env.ts
// (configured as setupFiles in jest-integration.json)

// ─── Shared mock instances (exported so specs can assert on them) ──────────────

export const mockStripeService = {
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_integration',
    client_secret: 'pi_test_integration_secret_xxx',
    status: 'requires_payment_method',
  }),
  cancelPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_integration',
    status: 'canceled',
  }),
  capturePaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_integration',
    status: 'succeeded',
  }),
  constructWebhookEvent: jest.fn(),
};

export const mockExpiryQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-integration-1' }),
  close: jest.fn().mockResolvedValue(undefined),
  getJob: jest.fn().mockResolvedValue(null),
};

// ─── Factory ──────────────────────────────────────────────────────────────────

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      // ── Env config — already loaded into process.env by load-env.ts ─
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,  // process.env already has .env.test values
        validate: undefined,  // skip Zod — all values are present
      }),

      // ── Real PostgreSQL → nexus_test_db ──────────────────────────
      TypeOrmModule.forRoot({
        type: 'postgres',
        // Hardcoded for test isolation — matches .env.test value
        url: 'postgresql://nexus:nexus_secret@localhost:5432/nexus_test_db',
        ssl: false,
        entities: [path.join(__dirname, '../../src/**/*.entity{.ts,.js}')],
        // ⚠️ synchronize:true ONLY in test environment — auto-creates schema
        synchronize: true,
        dropSchema: false,
        logging: false,
        extra: { max: 5, connectionTimeoutMillis: 5_000 },
      }),

      // ── Throttler — high limit so rate limiting never blocks tests ─
      ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 10_000 }]),

      // ── BullMQ — connects to real Redis, but queue ops are mocked ──
      BullModule.forRoot({
        connection: {
          url: process.env.REDIS_URL ?? 'redis://localhost:6379',
          lazyConnect: true,
          maxRetriesPerRequest: 0,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        },
      }),

      // ── Feature modules (real logic, real DB) ────────────────────
      AuthModule,
      UsersModule,
      VehiclesModule,
      ReservationsModule,
      QrModule,
    ],
  })
    // Replace StripeService with mock — no real Stripe API calls
    .overrideProvider(StripeService)
    .useValue(mockStripeService)
    // Replace BullMQ queue — no real job enqueuing
    .overrideProvider(getQueueToken('reservation-expiry'))
    .useValue(mockExpiryQueue)
    .compile();

  const app = moduleRef.createNestApplication({ rawBody: true });

  // Mirror the setup from main.ts exactly
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  return app;
}
