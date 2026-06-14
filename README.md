# Casablanca V1 - Car Rental MVP

MVP for a car rental / airport mobility platform focused on travelers arriving at Mohammed V Airport in Casablanca, Morocco.

The project has two apps:

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Backend: NestJS, TypeORM, PostgreSQL, Redis/BullMQ, JWT auth, Stripe, S3

## Local URLs

| Service | URL / port | Notes |
| --- | --- | --- |
| Frontend | http://localhost:3600 | Started from the repository root with `npm run dev` |
| Backend API | http://localhost:3900/api/v1 | Started from `backend/` or via Docker/start script |
| Backend Swagger | http://localhost:3900/api/v1/docs | Available outside production |
| PostgreSQL | localhost:5433 | Docker maps host `5433` to container `5432` |
| Redis | localhost:6379 | Used by BullMQ/cache |

Local database names:

| Purpose | Database | URL |
| --- | --- | --- |
| Development | `nexus_db` | `postgresql://nexus:nexus_secret@localhost:5433/nexus_db` |
| Backend integration/e2e tests | `nexus_test_db` | `postgresql://nexus:nexus_secret@localhost:5433/nexus_test_db` |
| Playwright e2e tests | `nexus_e2e_db` | `postgresql://nexus:nexus_secret@localhost:5433/nexus_e2e_db` |

## Local Setup

Install frontend dependencies:

```bash
npm install
cp .env.example .env.local
```

Install backend dependencies:

```bash
cd backend
npm install
cp .env.example .env
cd ..
```

Start infrastructure and backend first:

```bash
npm run docker:dev
npm run db:test:setup
```

Run database migrations and seed data if the database is empty:

```bash
cd backend
npm run migration:run
npm run seed:vehicles
npm run seed:users
cd ..
```

Start the frontend:

```bash
npm run dev
```

Open http://localhost:3600.

You can also use the helper script on Windows:

```powershell
.\start.ps1
```

## Required Environment Variables

Frontend `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3600
NEXT_PUBLIC_API_URL=/api/v1
API_URL=http://localhost:3900/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_KEY
```

Backend `backend/.env`:

```bash
NODE_ENV=development
PORT=3900
API_PREFIX=api/v1
DATABASE_URL=postgresql://nexus:nexus_secret@localhost:5433/nexus_db
DATABASE_SSL=false
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_at_least_32_chars
JWT_REFRESH_SECRET=replace_with_different_32_chars
STRIPE_SECRET_KEY=sk_test_replace_with_real_key
STRIPE_WEBHOOK_SECRET=whsec_replace_with_real_secret
AWS_ACCESS_KEY_ID=replace_with_real_key
AWS_SECRET_ACCESS_KEY=replace_with_real_secret
AWS_REGION=eu-west-3
# Optional for S3-compatible providers such as Cloudflare R2
# AWS_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_S3_BUCKET=nexus-documents
QR_SIGNING_SECRET=replace_with_at_least_32_chars
FRONTEND_URL=http://localhost:3600
OPERATOR_WHATSAPP=212600000000
```

## Demo Mode / Payment Bypass

For local demos, the frontend can use a payment bypass:

```bash
NEXT_PUBLIC_BYPASS_PAYMENT=true
BYPASS_PAYMENT=true
```

When enabled, development-only API routes under `/api/dev/*` may bypass Stripe and write directly to the local database. These routes are for local development and demos only. They are guarded so they are unavailable in production.

Document upload/storage is controlled separately by the backend `BYPASS_S3` flag:

- `BYPASS_STRIPE=true` with `BYPASS_S3=false`:
  payment stays in bypass, but document upload remains real through S3
- `BYPASS_S3=true`:
  document upload uses the authenticated local dev-storage fallback instead of S3

For a production-like document flow with local payment bypass, keep Stripe bypass enabled only on the payment side and set `BYPASS_S3=false` with valid AWS S3 credentials.

### Cloudflare R2 with Stripe bypass

If you want real document upload/storage while keeping `BYPASS_STRIPE=true`, configure the backend with:

```bash
BYPASS_STRIPE=true
BYPASS_S3=false
AWS_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY>
AWS_REGION=auto
AWS_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_S3_BUCKET=<YOUR_BUCKET_NAME>
```

For browser uploads with presigned `PUT` URLs, configure bucket CORS in R2 to allow your frontend origin and the `Content-Type` header. Example for local development:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3600", "http://127.0.0.1:3600"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Recommended local MVP demo path:

1. Log in as the seeded customer: `user@nexus.dev` / `User1234!`
2. Start on `/`, choose dates and terminal, then continue to `/catalog`
3. Open a vehicle detail page and create a reservation
4. In local demo mode, the payment step is explicitly bypassed and the reservation is confirmed for review
5. Complete customer check-in and upload both documents
6. In a separate browser session, log in as `operator@nexus.dev` / `Operator1234!`
7. Review documents at `/operator/documents`
8. Open the delivery workflow from `/operator/dashboard`

Use a separate browser profile or incognito window for the operator flow so the customer session is not replaced.

## MVP Demo Verification

This is the shortest reviewer-friendly path for the current MVP smoke:

Prerequisites:

- Docker Desktop running
- `npm install` at the repo root
- `cd backend && npm install`

Prepare infrastructure and the dedicated Playwright database:

```bash
npm run docker:dev
npm run db:e2e:prepare
```

What `db:e2e:prepare` does:

- creates `nexus_e2e_db` if needed
- runs backend migrations on `nexus_e2e_db`
- seeds demo vehicles
- seeds local demo accounts:
  - `user@nexus.dev` / `User1234!`
  - `operator@nexus.dev` / `Operator1234!`
  - `admin@nexus.dev` / `Admin1234!`

Run the full-stack smoke:

```bash
npm run test:e2e:smoke
```

What the smoke proves:

- frontend starts on `http://localhost:3600`
- backend e2e API starts on `http://localhost:3902/api/v1`
- home screen loads
- catalog loads from the real backend
- vehicle detail opens
- booking creates a real reservation record in explicit local demo mode
- confirmation page labels demo payment honestly
- customer check-in uploads both required documents
- operator review approves the uploaded documents
- customer reaches the smart ticket flow

What is intentionally demo-only:

- payment uses the guarded local demo bypass instead of a real Stripe capture
- document upload uses backend `BYPASS_S3=true` only in the e2e environment, so the flow is exercised without real S3 credentials

## Scripts

Root:

```bash
npm run dev       # Next.js frontend on :3600
npm run build     # Production frontend build
npm run lint      # Frontend/root lint
npm run docker:dev      # Starts Docker Postgres + Redis
npm run db:test:setup   # Creates nexus_db, nexus_test_db, nexus_e2e_db if missing
npm run db:e2e:prepare  # Creates DBs, runs migrations, seeds demo data on nexus_e2e_db
npm run test:e2e        # Full Playwright suite; auto-starts frontend + backend e2e servers
npm run test:e2e:smoke  # Focused MVP smoke for reviewers
```

Backend:

```bash
cd backend
npm run build
npm run docker:dev
npm run db:test:setup
npm test -- --runInBand
npm run test:integration
npm run test:e2e
npm run db:e2e:prepare
npm run migration:run
npm run seed:vehicles
npm run seed:users
```

## Test Notes

Unit tests do not require PostgreSQL.

Backend integration/e2e tests use `nexus_test_db`. From `backend/`, run:

```bash
npm run docker:dev
npm run db:test:setup
npm run test:integration
```

The `test:integration` script runs `db:test:setup` automatically. Backend `test:e2e` is currently a legacy alias to that same integration suite, because this repository does not yet contain a distinct backend-only e2e Jest suite. If Postgres is not reachable, the setup script will tell you to run `npm run docker:dev`.

Playwright e2e tests use `nexus_e2e_db`. Prepare the e2e database schema first:

```bash
npm run docker:dev
npm run db:e2e:prepare
```

Then run either the focused smoke or the full Playwright suite from the repository root:

```bash
npm run test:e2e:smoke
# or
npm run test:e2e
```

Playwright starts both local app servers automatically:

- frontend on `http://localhost:3600`
- backend e2e API on `http://localhost:3902/api/v1`

Current expected test database URLs are documented in:

- `backend/test/setup/test-app.ts`
- `e2e/fixtures/db.fixture.ts`
- `.env.e2e`

If the test database is unavailable, the test setup should fail with the database connection error rather than a teardown crash.

If Postgres is not reachable, run:

```bash
npm run docker:dev
npm run db:test:setup
```
