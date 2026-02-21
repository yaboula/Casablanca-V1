# Integration Tests — Level 2 (HTTP + Real PostgreSQL)

> **Status:** ✅ 35/35 passing  
> **Run time:** ~12s  
> **Last updated:** February 2026

---

## 1. What Level 2 Tests Are

Level 2 tests exercise the **complete vertical slice** of a feature:

```
HTTP Client (supertest)
       │
       ▼
  Controller          ← validates DTO, applies guards, sets prefix
       │
       ▼
  Service             ← business logic, authorization checks
       │
       ▼
  Repository          ← TypeORM queries
       │
       ▼
  Real PostgreSQL     ← nexus_test_db (isolated from nexus_db)
```

### Difference vs Level 1 (Unit Tests)

| Aspect              | Level 1 — Unit                    | Level 2 — Integration            |
|---------------------|-----------------------------------|----------------------------------|
| Database            | `jest.fn()` mock                  | Real PostgreSQL (`nexus_test_db`) |
| HTTP layer          | Not tested                        | `supertest` — full HTTP cycle    |
| Guards/Pipes        | Not tested                        | `JwtAuthGuard`, `ValidationPipe`, `RolesGuard` |
| Speed               | ~6s (78 tests)                    | ~12s (35 tests)                  |
| Isolation           | Per-test via `jest.clearAllMocks` | Per-test via `TRUNCATE CASCADE`  |
| External services   | All mocked                        | Stripe + BullMQ mocked; DB real  |

### What Level 2 catches that Level 1 cannot

- HTTP status codes (`201 vs 200`, `403 vs 401`)
- `ValidationPipe` rejections (`@IsEmail`, `@IsUUID`, `@IsISO8601`)
- `ParseUUIDPipe` — UUID format validation in route params
- JWT guard integration (`Bearer` token format, expiry, signature)
- Real TypeORM query behavior (SQL syntax, FK constraints, `NOT IN` subquery)
- Email case normalization persisted in real PostgreSQL
- `TRUNCATE CASCADE` isolation (no FK violations between tests)

---

## 2. Files Structure

```
backend/
├── .env.test                          ← Test environment variables
├── test/
│   ├── jest-integration.json          ← Jest config for Level 2
│   ├── setup/
│   │   ├── load-env.ts                ← setupFiles: loads .env.test before modules
│   │   ├── test-app.ts                ← NestJS test app factory
│   │   └── db-helpers.ts              ← truncateAllTables + seedVehicle
│   └── integration/
│       ├── auth.integration.spec.ts           ← 13 tests
│       ├── vehicles.integration.spec.ts       ← 12 tests
│       └── reservations.integration.spec.ts   ← 10 tests
```

---

## 3. Infrastructure Requirements

### 3.1 Services that must be running

| Service      | Container          | Port  | Role in tests         |
|--------------|--------------------|-------|-----------------------|
| PostgreSQL   | `nexus_postgres` OR local | 5432  | **Real DB** — TypeORM connects here |
| Redis        | `nexus_redis`      | 6379  | BullMQ bootstrap only (queue ops are mocked) |

Start them with:

```bash
cd backend/docker
docker compose up -d postgres redis
```

> **Note:** If you have a LOCAL PostgreSQL installation also running on port 5432,
> Node.js will connect to that one first (OS routes TCP before Docker proxy).
> In that case, you must create `nexus_test_db` in BOTH instances.
> See [Troubleshooting](#6-troubleshooting) for the full procedure.

### 3.2 Test Database Setup

The integration tests use a **completely separate database** (`nexus_test_db`) to
avoid polluting `nexus_db` (the development database).

#### Create in Docker PostgreSQL

```bash
docker exec nexus_postgres psql -U nexus -d postgres \
  -c "CREATE DATABASE nexus_test_db OWNER nexus ENCODING 'UTF8';"
```

#### Create in local PostgreSQL (if installed)

```bash
# On Windows — run with postgres superuser password
$env:PGPASSWORD='<YOUR_POSTGRES_SUPERUSER_PASSWORD>'
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres -c `
  "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nexus') THEN CREATE ROLE nexus LOGIN PASSWORD 'nexus_secret' CREATEDB; END IF; END `$`$;"

& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres -c `
  "CREATE DATABASE nexus_test_db OWNER nexus ENCODING 'UTF8';"
```

The schema is **auto-created** on the first test run via TypeORM `synchronize: true`.
> ⚠️ `synchronize: true` is ONLY used in the test environment — it is strictly
> forbidden in `development` and `production` to prevent accidental schema mutations.

---

## 4. Environment Configuration (`.env.test`)

Located at `backend/.env.test`. Contains dummy-but-valid values for all required
env vars. External services (Stripe, S3) have placeholder credentials because
they are **fully mocked** at the NestJS module level and never make real API calls.

```env
NODE_ENV=test
DATABASE_URL=postgresql://nexus:nexus_secret@localhost:5432/nexus_test_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=test_jwt_secret_minimum_32_chars_abcdef
JWT_REFRESH_SECRET=test_refresh_secret_minimum_32_chars_xyz
STRIPE_SECRET_KEY=sk_test_integration_placeholder_00000000000
STRIPE_WEBHOOK_SECRET=whsec_test_integration_placeholder_000000
QR_SIGNING_SECRET=test_qr_signing_secret_minimum_32_chars!!
FRONTEND_URL=http://localhost:3000
# ... (full file at backend/.env.test)
```

---

## 5. Architecture: TestApp Factory

Located at `test/setup/test-app.ts`. Creates a real NestJS application
with carefully selected overrides.

### 5.1 Module composition

```
TestAppModule
├── ConfigModule.forRoot (ignoreEnvFile:true — process.env already loaded)
├── TypeOrmModule.forRoot → nexus_test_db, synchronize:true
├── ThrottlerModule.forRoot (limit:10000 — never blocks tests)
├── BullModule.forRoot (lazyConnect, no retries — bootstraps but never sends real commands)
│
├── AuthModule          ← real
├── UsersModule         ← real
├── VehiclesModule      ← real
├── ReservationsModule  ← real
└── QrModule            ← real
```

### 5.2 Provider overrides

| Provider                           | Override                                  | Reason                          |
|------------------------------------|-------------------------------------------|---------------------------------|
| `StripeService`                    | `mockStripeService` (`jest.fn()`)         | No real Stripe API key in tests |
| `getQueueToken('reservation-expiry')` | `mockExpiryQueue` (`jest.fn()`)        | No real BullMQ job enqueuing    |

**Omitted modules** (not needed for current test coverage):
- `AdminModule`, `OperatorModule`, `ChatModule`
- `DocumentsModule`, `S3Module`, `SseModule`, `StripeModule` (StripeService is mocked directly)

### 5.3 Global middleware (mirrors `main.ts` exactly)

```typescript
app.setGlobalPrefix('api/v1');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.useGlobalFilters(new AllExceptionsFilter());
```

### 5.4 Environment loading order

```
Jest starts
    │
    ▼
setupFiles: load-env.ts
    │  dotenv.config({ path: '.env.test', override: true })
    ▼
process.env populated with test values
    │
    ▼
test spec's beforeAll()
    │  createTestApp()
    ▼
ConfigModule.forRoot(ignoreEnvFile:true)
    │  Reads from process.env directly
    ▼
TypeOrmModule.forRoot uses process.env.DATABASE_URL → nexus_test_db
```

---

## 6. DB Isolation Strategy

Every test gets a **completely empty database** via `truncateAllTables()`:

```typescript
// test/setup/db-helpers.ts
export async function truncateAllTables(app: INestApplication): Promise<void> {
  const dataSource = app.get<DataSource>(getDataSourceToken());
  const tableNames = dataSource.entityMetadatas.map(e => `"${e.tableName}"`).join(', ');
  await dataSource.query(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`
  );
}
```

**Why `TRUNCATE ... CASCADE`** instead of `DELETE`:
- `TRUNCATE` is ~10× faster than `DELETE` for bulk removal
- `CASCADE` resolves FK dependencies automatically (no ordering needed)
- `RESTART IDENTITY` resets serial sequences to start fresh

**Lifecycle per test:**

```
beforeAll    → createTestApp() — one app instance per spec file
beforeEach   → truncateAllTables() — wipe all rows
[test runs]
afterAll     → app.close() — close DB connection pool
```

---

## 7. Mock Strategy for External Services

### 7.1 StripeService

All Stripe calls in `ReservationsService.create()` are intercepted:

```typescript
export const mockStripeService = {
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_integration',
    client_secret: 'pi_test_integration_secret_xxx',
    status: 'requires_payment_method',
  }),
  cancelPaymentIntent: jest.fn().mockResolvedValue({ ... }),
  capturePaymentIntent: jest.fn().mockResolvedValue({ ... }),
};
```

Tests can **assert** on these calls to verify business logic:
```typescript
expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
  1000,               // deposit = 10 € fixed
  expect.any(String), // reservationId
  expect.any(Object),
);
```

### 7.2 BullMQ Queue

The `reservation-expiry` queue is replaced mid-chain. The BullMQ module
bootstraps (so `ReservationsModule` compiles correctly), but the actual
queue instance is replaced:

```typescript
.overrideProvider(getQueueToken('reservation-expiry'))
.useValue({ add: jest.fn().mockResolvedValue({ id: 'job-1' }) });
```

---

## 8. Test Coverage

### 8.1 Auth (`auth.integration.spec.ts`) — 13 tests

| Test | Endpoint | Expected |
|------|----------|----------|
| Register success | `POST /auth/register` | `201`, has `accessToken` + `refreshToken`, no `passwordHash` |
| Email case normalized | `POST /auth/register` | `201`, `user.email` lowercase |
| Duplicate email | `POST /auth/register` | `409 Conflict` |
| Missing email | `POST /auth/register` | `400 Bad Request` |
| Short password | `POST /auth/register` | `400 Bad Request` |
| Login success | `POST /auth/login` | `200`, has tokens |
| Anti-enum: wrong pass vs no user | `POST /auth/login` | `401`, SAME message |
| User not found | `POST /auth/login` | `401` |
| Valid refresh token | `POST /auth/refresh` | `200`, new tokens |
| Invalid refresh token | `POST /auth/refresh` | `401` |
| Valid Bearer → me | `GET /auth/me` | `200`, user without `passwordHash` |
| No Bearer → me | `GET /auth/me` | `401` |
| Tampered Bearer → me | `GET /auth/me` | `401` |

### 8.2 Vehicles (`vehicles.integration.spec.ts`) — 12 tests

| Test | Endpoint | Expected |
|------|----------|----------|
| Empty catalog | `GET /vehicles` | `200`, `data: []` |
| Seeded vehicle | `GET /vehicles` | `200`, vehicle returned |
| MAINTENANCE status excluded | `GET /vehicles` | `200`, `total: 0` |
| Invalid category | `GET /vehicles?category=MOTORBIKE` | `400` |
| Available with dates | `GET /vehicles?pickupDate=&returnDate=` | `200`, vehicle returned |
| returnDate ≤ pickupDate | `GET /vehicles?...` | `400` |
| Non-ISO dates | `GET /vehicles?...` | `400` |
| Find by UUID | `GET /vehicles/:id` | `200`, `data.id` matches |
| Unknown UUID | `GET /vehicles/:id` | `404` |
| Invalid UUID format | `GET /vehicles/:id` | `400` |

### 8.3 Reservations (`reservations.integration.spec.ts`) — 10 tests

| Test | Endpoint | Expected |
|------|----------|----------|
| No JWT | `POST /reservations` | `401` |
| Happy path | `POST /reservations` | `201`, `PENDING_DEPOSIT`, Stripe called, job enqueued |
| Past date | `POST /reservations` | `400` |
| Unknown vehicleId | `POST /reservations` | `404` |
| No JWT | `GET /reservations/my` | `401` |
| USER isolation | `GET /reservations/my` | `200`, user2 can't see user1's |
| Pagination structure | `GET /reservations/my?page=1&limit=5` | `200`, has `data/total/page` |
| Owner can read | `GET /reservations/:id` | `200` |
| Other user forbidden | `GET /reservations/:id` | `403` |
| Owner cancels | `PATCH /reservations/:id/cancel` | `200`, `CANCELLED` |
| Other user can't cancel | `PATCH /reservations/:id/cancel` | `403` |
| USER can't complete (OPERATOR only) | `PATCH /reservations/:id/complete` | `403` |

---

## 9. How to Run

### Run integration tests only

```bash
cd backend
npm run test:integration
```

### Run unit tests + integration tests together

```bash
cd backend
npm run test:all
```

### Watch mode (re-runs on file save)

```bash
cd backend
npm run test:integration:watch
```

### Run a single spec file

```bash
cd backend
npx jest --config ./test/jest-integration.json --runInBand test/integration/auth.integration.spec.ts
```

---

## 10. Troubleshooting

### "database nexus_test_db does not exist" error

**Cause:** If you have a local PostgreSQL installation AND Docker both running on port 5432, Node.js connects to the local instance (which doesn't have `nexus_test_db`).

**Diagnosis:**
```bash
netstat -ano | findstr :5432
# If you see TWO different PIDs — you have a port conflict
```

**Fix:** Create the DB in BOTH instances:
```bash
# 1. In Docker
docker exec nexus_postgres psql -U nexus -d postgres \
  -c "CREATE DATABASE nexus_test_db OWNER nexus ENCODING 'UTF8';"

# 2. In local PostgreSQL (Windows)
$env:PGPASSWORD='<YOUR_PASSWORD>'
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres `
  -c "CREATE ROLE nexus LOGIN PASSWORD 'nexus_secret' CREATEDB;"
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres `
  -c "CREATE DATABASE nexus_test_db OWNER nexus ENCODING 'UTF8';"
```

### Tests hang / don't exit

Add `--forceExit` if tests don't terminate (BullMQ connection may keep event loop alive):
```bash
npm run test:integration -- --forceExit
```
This is already set in `test:integration` script by default.

### `TypeError: Cannot read properties of undefined (reading 'close')`

`app` is `undefined` because `createTestApp()` threw an error in `beforeAll`.
Check the error above this line in the output — usually a DB connection issue.

### `synchronize:true` warning

This warning is expected in test output:
```
WARN [NestJS] Synchronize: true is enabled; this should not be used in production
```
It is safe in `nexus_test_db` only. The entity schema auto-creates on first run.

---

## 11. CI/CD Integration

For GitHub Actions or similar, add these steps before running integration tests:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: nexus
      POSTGRES_PASSWORD: nexus_secret
      POSTGRES_DB: nexus_test_db  # ← use test DB directly
    ports:
      - 5432:5432

  redis:
    image: redis:7-alpine
    ports:
      - 6379:6379

steps:
  - name: Run unit tests
    run: cd backend && npm run test -- --forceExit

  - name: Run integration tests
    run: cd backend && npm run test:integration
    env:
      DATABASE_URL: postgresql://nexus:nexus_secret@localhost:5432/nexus_test_db
```

> In CI, set `POSTGRES_DB: nexus_test_db` directly — no need to create it separately.

---

## 12. Testing Pyramid Progress

```
         △
        /E2E\         Level 3 — not yet implemented
       /──────\        (Playwright, full stack)
      /  Integ \
     /────────── \     Level 2 — ✅ 35 tests (this document)
    / Unit Tests  \
   /──────────────  \ Level 1 — ✅ 78 tests
  └──────────────────┘
```

| Level | Type        | Tests | Speed  | Infrastructure    |
|-------|-------------|-------|--------|-------------------|
| L1    | Unit        | 78    | ~6s    | None (all mocked) |
| L2    | Integration | 35    | ~12s   | Postgres + Redis  |
| L3    | E2E         | TBD   | TBD    | Full stack        |
| **Total** |         | **113** | **~18s** |               |
