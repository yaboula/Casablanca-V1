# E2E Tests — Level 3 Plan (Playwright, Full Stack)

> **Status:** PLAN — not yet implemented  
> **Author:** GitHub Copilot  
> **Date:** February 21, 2026  
> **This document is the source of truth — implementation must follow it exactly.**

---

## 1. What Level 3 Means

```
         △
        /E2E\         ← Level 3 (this document)
       /──────\        Playwright · browser · real UI + real API
      /  Integ \
     /────────── \     Level 2 — ✅ 35 tests (supertest, real PostgreSQL)
    / Unit Tests  \
   /──────────────  \ Level 1 — ✅ 78 tests (all mocked)
  └──────────────────┘
```

Level 3 exercises the **complete system** — browser ↔ Next.js ↔ NestJS ↔ PostgreSQL.
No mocking of any layer. Stripe is tested in **test mode** (real API calls to
`https://api.stripe.com/v1` with a `sk_test_*` key).

### Why Playwright

| Criterion            | Playwright ✅          | Cypress               | supertest (L2 reuse) |
|----------------------|------------------------|-----------------------|----------------------|
| Browser automation   | Yes (Chromium/FF/WebKit) | Yes (Chromium only) | No                  |
| API testing built-in | `request` fixture      | Partial               | Yes                 |
| TypeScript support   | First-class            | Good                  | Good                |
| Parallel execution   | Native (shards)        | Needs config          | N/A                 |
| Next.js webServer    | `webServer` config     | Custom               | N/A                 |
| CI-ready             | Docker image available | Yes                   | Yes                 |

---

## 2. Architecture

```
┌─────────────── CI / local machine ───────────────────┐
│                                                        │
│  Playwright Test Runner                                │
│       │                                                │
│       │  browser.goto('http://localhost:3000')         │
│       ▼                                                │
│  Next.js (port 3000)          ← webServer starts it   │
│       │                                                │
│       │  fetch/XHR to http://localhost:3001/api/v1     │
│       ▼                                                │
│  NestJS backend (port 3001)   ← must be running       │
│       │                                                │
│       │  TypeORM                                       │
│       ▼                                                │
│  PostgreSQL nexus_e2e_db      ← separate DB           │
│       +                                                │
│  Redis (queue bootstrap)      ← Docker nexus_redis    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Key decisions:**

| Decision | Choice | Reason |
|----------|--------|--------|
| Playwright location | Root `C:\Users\aboul\Desktop\ACD` | E2E tests belong to the full project |
| Frontend start | `webServer` in `playwright.config.ts` | Playwright auto-starts/stops it |
| Backend start | Must be running before tests | Avoids lifecycle complexity in Playwright |
| Database | `nexus_e2e_db` (separate from `nexus_db` and `nexus_test_db`) | True isolation |
| Stripe | Real test mode (`sk_test_*`) | Tests actual payment intent creation |
| BullMQ | Real Redis, real jobs | No mocking — full E2E |

---

## 3. Scope — User Journeys

### Journey 1 — Public Catalog Browse (`catalog.e2e.spec.ts`)

| Step | Action | Assert |
|------|--------|--------|
| 1 | Navigate to `/catalog` | Page title visible |
| 2 | Cars grid renders | At least one `.vehicle-card` visible |
| 3 | Filter by category SUV | Only SUV cards shown |
| 4 | Enter valid date range | Availability check fires, grid reloads |
| 5 | Click vehicle card | Navigate to `/catalog/:id` |
| 6 | Detail page shows price | `price_per_day` displayed |

### Journey 2 — Auth Flow (`auth.e2e.spec.ts`)

| Step | Action | Assert |
|------|--------|--------|
| 1 | Navigate to `/register` | Form visible |
| 2 | Submit valid registration | Redirect to `/dashboard` or `/catalog` |
| 3 | Sign out | Redirect to `/` |
| 4 | Navigate to `/login` | Form visible |
| 5 | Submit credentials | Redirect to `/dashboard` |
| 6 | Navigate to a protected route while logged out | Redirect to `/login` |

### Journey 3 — Full Booking Flow (`booking.e2e.spec.ts`)

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login (API shortcut via `request` fixture) | Token in localStorage |
| 2 | Navigate to `/catalog` | Grid visible |
| 3 | Select a vehicle | Navigate to detail |
| 4 | Click "Book Now" | Navigate to booking form |
| 5 | Enter pickup / return dates | Price summary updates |
| 6 | Submit form | `POST /reservations` → 201 |
| 7 | Stripe payment intent shown | `client_secret` in page state |
| 8 | Navigate to `/dashboard` | Reservation `PENDING_DEPOSIT` visible |

### Journey 4 — Customer Dashboard (`dashboard.e2e.spec.ts`)

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login (API shortcut) | — |
| 2 | Navigate to `/dashboard` | Reservations list visible |
| 3 | Click "Cancel" on a `PENDING_DEPOSIT` reservation | Status → `CANCELLED` |
| 4 | Cancelled card shown with correct status badge | — |

### Journey 5 — Operator Panel (`operator.e2e.spec.ts`)

| Step | Action | Assert |
|------|--------|--------|
| 1 | Login as OPERATOR user (API shortcut) | — |
| 2 | Navigate to `/operator` | Dashboard visible |
| 3 | See pending reservations | List not empty |
| 4 | Complete a reservation | Status → `COMPLETED` |

---

## 4. File Structure (what will be created)

```
ACD/ (root)
├── playwright.config.ts                     ← Playwright configuration
├── .env.e2e                                 ← E2E environment variables
├── e2e/
│   ├── fixtures/
│   │   ├── auth.fixture.ts                  ← login() API shortcut, token helpers
│   │   └── db.fixture.ts                    ← truncateE2EDb(), seedE2EVehicle()
│   ├── pages/
│   │   ├── catalog.page.ts                  ← Page Object: catalog page
│   │   ├── login.page.ts                    ← Page Object: login/register forms
│   │   ├── booking.page.ts                  ← Page Object: booking flow
│   │   └── dashboard.page.ts                ← Page Object: customer dashboard
│   ├── catalog.e2e.spec.ts
│   ├── auth.e2e.spec.ts
│   ├── booking.e2e.spec.ts
│   ├── dashboard.e2e.spec.ts
│   └── operator.e2e.spec.ts
```

---

## 5. Prerequisites

### 5.1 Services

| Service | How to start | Port |
|---------|-------------|------|
| PostgreSQL | `docker compose up -d postgres` OR local | 5432 |
| Redis | `docker compose up -d redis` | 6379 |
| NestJS backend | `docker compose up -d backend` OR `npm run start:dev` | 3001 |
| Next.js frontend | Playwright `webServer` starts it automatically | 3000 |

### 5.2 E2E Database

```bash
# Docker PostgreSQL
docker exec nexus_postgres psql -U nexus -d postgres \
  -c "CREATE DATABASE nexus_e2e_db OWNER nexus ENCODING 'UTF8';"

# Local PostgreSQL (Windows)
$env:PGPASSWORD='<YOUR_PASSWORD>'
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres `
  -c "CREATE DATABASE nexus_e2e_db OWNER nexus ENCODING 'UTF8';"
```

### 5.3 Backend Running Against E2E DB

The backend must be started with `DATABASE_URL` pointing to `nexus_e2e_db`.
Two options:

**Option A — dedicated `.env.e2e.backend` override:**
```bash
DATABASE_URL=postgresql://nexus:nexus_secret@localhost:5432/nexus_e2e_db \
  npm run start:dev
```

**Option B — Docker Compose override:**
```yaml
# docker/docker-compose.e2e.yml
services:
  backend-e2e:
    extends:
      file: docker-compose.yml
      service: backend
    environment:
      DATABASE_URL: postgresql://nexus:nexus_secret@localhost:5432/nexus_e2e_db
    ports:
      - "3001:3000"
```

---

## 6. `playwright.config.ts` — Key Settings

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,          // sequential — tests share DB state
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Playwright starts and stops Next.js automatically
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    },
  },
});
```

---

## 7. Page Object Pattern

Every page interaction is encapsulated in a **Page Object** to avoid selector duplication.

```typescript
// e2e/pages/login.page.ts — example signature (not yet implemented)
export class LoginPage {
  constructor(private page: Page) {}
  async goto() { ... }
  async login(email: string, password: string) { ... }
  async expectLoggedIn() { ... }
}
```

---

## 8. API Shortcut Fixture (login bypass)

To avoid repeating the UI login flow in every test, an `auth.fixture.ts` will:

1. Call `POST /api/v1/auth/register` directly via Playwright's `request` fixture
2. Store the `accessToken` in `localStorage` via `page.evaluate()`
3. Return the user object + token for assertions

This makes tests like *Journey 3 — Booking* start directly from a logged-in state
without clicking through the login form.

---

## 9. DB Isolation Strategy

Unlike Level 2 (which runs in-process and can call TypeORM directly), Level 3 tests
run against a real running backend. DB cleanup is done by calling:

- A **dedicated E2E cleanup endpoint** `DELETE /api/v1/internal/e2e-reset` (guarded by
  `E2E_CLEANUP_TOKEN` env var, only compiled when `NODE_ENV=test`)
- OR direct PostgreSQL connection from the Playwright process (via `pg` client)

**Chosen approach: direct `pg` client from the Playwright process** (simpler, no backend changes).

```typescript
// e2e/fixtures/db.fixture.ts
import { Client } from 'pg';

export async function truncateE2EDb() {
  const client = new Client({ connectionString: process.env.E2E_DATABASE_URL });
  await client.connect();
  await client.query(`TRUNCATE TABLE reservations, users, vehicles RESTART IDENTITY CASCADE`);
  await client.end();
}
```

---

## 10. Environment Variables (`.env.e2e`)

```env
# Frontend (Next.js) — read by playwright webServer via env:{}
NEXT_PUBLIC_API_URL=http://localhost:3001

# Backend E2E connection (for db.fixture.ts direct pg client)
E2E_DATABASE_URL=postgresql://nexus:nexus_secret@localhost:5432/nexus_e2e_db

# Stripe test keys (real test mode)
STRIPE_SECRET_KEY=sk_test_<YOUR_REAL_TEST_KEY>
STRIPE_PUBLISHABLE_KEY=pk_test_<YOUR_REAL_TEST_KEY>
```

---

## 11. New npm Scripts

### Root `package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## 12. Implementation Order

Steps are executed in this exact order:

| # | Task | File(s) |
|---|------|---------|
| 1 | Install Playwright in project root | `npm init @playwright/test` |
| 2 | Configure `playwright.config.ts` | root `playwright.config.ts` |
| 3 | Create `.env.e2e` | root `.env.e2e` |
| 4 | Create `e2e/` directory structure | all folders |
| 5 | Implement `db.fixture.ts` | `e2e/fixtures/db.fixture.ts` |
| 6 | Implement `auth.fixture.ts` | `e2e/fixtures/auth.fixture.ts` |
| 7 | Implement Page Objects (all 4) | `e2e/pages/*.ts` |
| 8 | Write `catalog.e2e.spec.ts` | `e2e/catalog.e2e.spec.ts` |
| 9 | Write `auth.e2e.spec.ts` | `e2e/auth.e2e.spec.ts` |
| 10 | Write `booking.e2e.spec.ts` | `e2e/booking.e2e.spec.ts` |
| 11 | Write `dashboard.e2e.spec.ts` | `e2e/dashboard.e2e.spec.ts` |
| 12 | Write `operator.e2e.spec.ts` | `e2e/operator.e2e.spec.ts` |
| 13 | Add `test:e2e` scripts to root `package.json` | root `package.json` |
| 14 | Create `nexus_e2e_db` in PostgreSQL | psql command |
| 15 | Verify backend starts against `nexus_e2e_db` | manual check |
| 16 | First run — fix failing tests | iterative |
| 17 | Commit | git |

---

## 13. CI/CD Integration (GitHub Actions)

```yaml
e2e:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_USER: nexus
        POSTGRES_PASSWORD: nexus_secret
        POSTGRES_DB: nexus_e2e_db
      ports: ["5432:5432"]
    redis:
      image: redis:7-alpine
      ports: ["6379:6379"]

  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20', cache: 'npm' }

    - name: Install root dependencies
      run: npm ci

    - name: Install backend dependencies
      run: npm ci --prefix backend

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Start backend
      run: npm run start:prod --prefix backend &
      env:
        DATABASE_URL: postgresql://nexus:nexus_secret@localhost:5432/nexus_e2e_db
        NODE_ENV: test

    - name: Wait for backend
      run: npx wait-on http://localhost:3001/api/v1/health

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CI: true
        E2E_DATABASE_URL: postgresql://nexus:nexus_secret@localhost:5432/nexus_e2e_db

    - name: Upload report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

---

## 14. Troubleshooting

### Backend not reachable (ECONNREFUSED on port 3001)

Backend must be running BEFORE Playwright starts. Run manually:
```bash
cd backend && DATABASE_URL=postgresql://... npm run start:dev
```

### Frontend not starting (`webServer` timeout)

Check `next dev` output — usually a TypeScript error or missing env var.
Playwright logs the `webServer` stdout if start fails.

### DB not clean between tests

If `truncateE2EDb()` is not called in `beforeEach`, tests leak data.
Every spec file must call it in `beforeEach`.

### Stripe payment fails

Use Stripe test card `4242 4242 4242 4242` with any future date + any CVC.

---

*This document is completed before implementation begins, as per Level 3 protocol.*  
*Update status to ✅ when each step in section 12 is finished.*
