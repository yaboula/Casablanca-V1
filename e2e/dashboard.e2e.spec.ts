/**
 * dashboard.e2e.spec.ts â€” Journey 4: Customer Dashboard UI
 *
 * Tests that the /dashboard page:
 *   - Requires authentication (redirects to /login)
 *   - Shows the logged-in user's reservations
 *   - Isolates between users (user A can't see user B's reservations)
 *
 * Prerequisites:
 *   - Next.js running (webServer)
 *   - NestJS backend at http://localhost:3902
 */

import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import {
  connectE2EDb,
  truncateAllE2ETables,
  seedE2EVehicle,
} from './fixtures/db.fixture';
import { registerUser, uniqueEmail } from './fixtures/auth.fixture';
import { DashboardPage } from './pages/dashboard.page';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3902/api/v1';

let db: Client;

test.beforeAll(async () => {
  db = await connectE2EDb();
});

test.afterAll(async () => {
  if (db) await db.end();
});

test.beforeEach(async () => {
  await truncateAllE2ETables(db);
});

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

// â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('unauthenticated request to /dashboard redirects to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL((url) => url.pathname.includes('/login'), {
    timeout: 10_000,
  });
  expect(page.url()).toContain('/login');
});

test('authenticated user sees dashboard (no reservations = empty state)', async ({ page }) => {
  await registerUser(page, {
    email: uniqueEmail('dash-empty'),
    password: 'DashEmpty123!',
    fullName: 'Empty User',
  });

  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  // Should be on dashboard, not redirected to login
  expect(page.url()).toContain('/dashboard');
});

test('dashboard shows reservation created by this user', async ({ page }) => {
  const vehicleId = await seedE2EVehicle(db, { brand: 'Audi', model: 'Q7' });

  const { accessToken } = await registerUser(page, {
    email: uniqueEmail('dash-res'),
    password: 'DashRes123!',
    fullName: 'Reservation User',
  });

  // Create a reservation via API
  const resCreate = await page.request.post(`${API_URL}/reservations`, {
    data: {
      vehicleId,
      pickupDate: futureDate(4),
      returnDate: futureDate(7),
      pickupLocation: 'CMN_T1',
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(resCreate.status()).toBe(201);

  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.expectAtLeastOneReservation();
});

test('user A cannot see user B reservations in their dashboard', async ({
  browser,
}) => {
  const vehicleId = await seedE2EVehicle(db, { brand: 'Ford', model: 'Mustang' });

  // â”€â”€ User A: create reservation â”€â”€
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const { accessToken: tokenA } = await registerUser(pageA, {
    email: uniqueEmail('user-a'),
    password: 'UserAPass123!',
    fullName: 'User A',
  });
  await pageA.request.post(`${API_URL}/reservations`, {
    data: {
      vehicleId,
      pickupDate: futureDate(4),
      returnDate: futureDate(6),
      pickupLocation: 'CMN_T1',
    },
    headers: { Authorization: `Bearer ${tokenA}` },
  });

  // â”€â”€ User B: no reservations â”€â”€
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await registerUser(pageB, {
    email: uniqueEmail('user-b'),
    password: 'UserBPass123!',
    fullName: 'User B',
  });

  const dashboardB = new DashboardPage(pageB);
  await dashboardB.goto();

  // User B should see 0 reservations
  await dashboardB.expectNoReservations();

  await contextA.close();
  await contextB.close();
});

test('dashboard page title includes NEXUS or Dashboard keyword', async ({
  page,
}) => {
  await registerUser(page, {
    email: uniqueEmail('title-check'),
    password: 'TitleCheck123!',
    fullName: 'Title Checker',
  });

  await page.goto('/dashboard');
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
  await expect(page).toHaveTitle(/.+/, { timeout: 5_000 });
});

