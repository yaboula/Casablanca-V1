/**
 * operator.e2e.spec.ts â€” Journey 5: Operator Panel
 *
 * Tests OPERATOR-role access and business logic:
 *   - Regular USER is forbidden from /operator (403/redirect)
 *   - OPERATOR can complete a reservation
 *
 * OPERATOR users are seeded directly into the DB (role INSERT) since
 * there's no public registration endpoint for OPERATOR role.
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

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

/**
 * Register a user via API and then promote them to OPERATOR via direct DB update.
 * Returns { email, password } for login.
 */
async function seedOperatorUser(
  client: Client,
  page: import('@playwright/test').Page,
  opts: { email: string; password: string },
): Promise<{ email: string; password: string }> {
  // Register normally (creates USER role)
  await page.request.post(`${API_URL}/auth/register`, {
    data: { email: opts.email, password: opts.password, fullName: 'E2E Operator' },
  });

  // Promote to OPERATOR via direct DB update
  await client.query(
    `UPDATE users SET role = 'OPERATOR' WHERE email = $1`,
    [opts.email],
  );

  return opts;
}

// â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('PATCH /reservations/:id/complete â€” USER role gets 403', async ({ page }) => {
  const vehicleId = await seedE2EVehicle(db);

  const { accessToken } = await registerUser(page, {
    email: uniqueEmail('user-complete'),
    password: 'UserComplete123!',
    fullName: 'Regular User',
  });

  // Create a reservation
  const resCreate = await page.request.post(`${API_URL}/reservations`, {
    data: {
      vehicleId,
      pickupDate: futureDate(3),
      returnDate: futureDate(5),
      pickupLocation: 'CMN_T1',
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(resCreate.status()).toBe(201);
  const { id: reservationId } = await resCreate.json();

  // USER trying to complete â†’ 403
  const resComplete = await page.request.patch(
    `${API_URL}/reservations/${reservationId}/complete`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  expect(resComplete.status()).toBe(403);
});

test('OPERATOR can complete a reservation', async ({ page }) => {
  const vehicleId = await seedE2EVehicle(db);

  // Seed regular user for the reservation
  const { accessToken: userToken } = await registerUser(page, {
    email: uniqueEmail('user-for-op'),
    password: 'UserForOp123!',
    fullName: 'Customer',
  });

  // Create reservation as user
  const resCreate = await page.request.post(`${API_URL}/reservations`, {
    data: {
      vehicleId,
      pickupDate: futureDate(3),
      returnDate: futureDate(5),
      pickupLocation: 'CMN_T1',
    },
    headers: { Authorization: `Bearer ${userToken}` },
  });
  expect(resCreate.status()).toBe(201);
  const { data: { id: reservationId } } = await resCreate.json();

  // Advance reservation to IN_PROGRESS so complete() is valid
  await db.query(
    `UPDATE reservations SET status = 'IN_PROGRESS' WHERE id = $1`,
    [reservationId],
  );

  // Seed OPERATOR and login
  const opCredentials = await seedOperatorUser(db, page, {
    email: uniqueEmail('operator'),
    password: 'Operator123!',
  });

  const opLoginRes = await page.request.post(`${API_URL}/auth/login`, {
    data: opCredentials,
  });
  expect(opLoginRes.status()).toBe(200);
  const { accessToken: operatorToken } = await opLoginRes.json();

  // OPERATOR completes the reservation â†’ 200
  const resComplete = await page.request.patch(
    `${API_URL}/reservations/${reservationId}/complete`,
    { headers: { Authorization: `Bearer ${operatorToken}` } },
  );
  expect(resComplete.status()).toBe(200);
  const { data: completed } = await resComplete.json();
  expect(completed.status).toBe('COMPLETED');
});

test('OPERATOR endpoint GET /operator/deliveries requires OPERATOR role', async ({ page }) => {
  // Regular user
  const { accessToken } = await registerUser(page, {
    email: uniqueEmail('no-op'),
    password: 'NoOp123456!',
    fullName: 'No Operator',
  });

  const res = await page.request.get(`${API_URL}/operator/deliveries`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Should be 403 (has valid JWT but wrong role)
  expect(res.status()).toBe(403);
});

test('/operator UI page redirects USER role to /login or returns 403', async ({ page }) => {
  await registerUser(page, {
    email: uniqueEmail('ui-op-check'),
    password: 'UiOpCheck123!',
    fullName: 'No Op UI',
  });

  await page.goto('/operator');

  // Middleware should redirect non-OPERATOR away from /operator
  await page.waitForURL(
    (url) => !url.pathname.startsWith('/operator') || url.pathname.includes('/login'),
    { timeout: 10_000 },
  );
  expect(page.url()).not.toMatch(/^http:\/\/localhost:3000\/operator$/);
});

