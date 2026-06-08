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
import { CacheModule } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import * as path from 'path';
const { Client } = require('pg');

import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { VehiclesModule } from '../../src/vehicles/vehicles.module';
import { ReservationsModule } from '../../src/reservations/reservations.module';
import { QrModule } from '../../src/qr/qr.module';
import { AdminModule } from '../../src/admin/admin.module';
import { StripeService } from '../../src/stripe/stripe.service';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

// NOTE: process.env is pre-populated by test/setup/load-env.ts
// (configured as setupFiles in jest-integration.json)

// â”€â”€â”€ Shared mock instances (exported so specs can assert on them) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
const TEST_DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://nexus:nexus_secret@localhost:5433/nexus_test_db';

async function assertTestDatabaseReachable(): Promise<void> {
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  try {
    await client.connect();
  } catch (err) {
    throw new Error(
      `Unable to connect to backend integration database at ${TEST_DATABASE_URL}. ` +
        `Run "npm run docker:dev" and then "npm run db:test:setup" from backend/. ` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

// â”€â”€â”€ Factory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createTestApp(): Promise<INestApplication> {
  await assertTestDatabaseReachable();
  const moduleRef = await Test.createTestingModule({
    imports: [
      // â”€â”€ Env config â€” already loaded into process.env by load-env.ts â”€
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,  // process.env already has .env.test values
        validate: undefined,  // skip Zod â€” all values are present
      }),

      CacheModule.register({
        isGlobal: true,
      }),

      // â”€â”€ Real PostgreSQL â†’ nexus_test_db â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      TypeOrmModule.forRoot({
        type: 'postgres',
        // Hardcoded for test isolation â€” matches .env.test value
        url: TEST_DATABASE_URL,
        ssl: false,
        entities: [path.join(__dirname, '../../src/**/*.entity{.ts,.js}')],
        // âš ï¸ synchronize:true ONLY in test environment â€” auto-creates schema
        synchronize: true,
        dropSchema: false,
        logging: false,
        extra: { max: 5, connectionTimeoutMillis: 5_000 },
      }),

      // â”€â”€ Throttler â€” high limit so rate limiting never blocks tests â”€
      ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 10_000 }]),

      // â”€â”€ BullMQ â€” connects to real Redis, but queue ops are mocked â”€â”€
      BullModule.forRoot({
        connection: {
          url: process.env.REDIS_URL ?? 'redis://localhost:6379',
          lazyConnect: true,
          maxRetriesPerRequest: 0,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        },
      }),

      // â”€â”€ Feature modules (real logic, real DB) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      AuthModule,
      UsersModule,
      VehiclesModule,
      ReservationsModule,
      QrModule,
      AdminModule,
    ],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    // Replace StripeService with mock â€” no real Stripe API calls
    .overrideProvider(StripeService)
    .useValue(mockStripeService)
    // Replace BullMQ queue â€” no real job enqueuing
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

