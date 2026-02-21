/**
 * booking.e2e.spec.ts — Journey 3: Reservation Creation Flow
 *
 * Tests the complete booking cycle:
 *   register → auth shortcut → POST reservation via API → verify in dashboard
 *
 * Note: The payment step (Stripe) is excluded from these tests because
 * it requires Stripe test card interaction. Those would be in a dedicated
 * stripe.e2e.spec.ts once Stripe webhooks are set up in the test environment.
 *
 * Prerequisites:
 *   - Next.js running (webServer)
 *   - NestJS backend at http://localhost:3900 (with nexus_e2e_db)
 *   - Redis running
 */

import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import { randomUUID } from 'crypto';
import {
  connectE2EDb,
  truncateAllE2ETables,
  seedE2EVehicle,
} from './fixtures/db.fixture';
import { registerUser, uniqueEmail } from './fixtures/auth.fixture';
import { DashboardPage } from './pages/dashboard.page';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3900/api/v1';

let db: Client;

test.beforeAll(async () => {
  db = await connectE2EDb();
});

test.afterAll(async () => {
  await db.end();
});

test.beforeEach(async () => {
  await truncateAllE2ETables(db);
});

// ── Helpers ──────────────────────────────────────────────────

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

// ── Tests ─────────────────────────────────────────────────────

test(
  'unauthenticated POST /reservations returns 401',
  async ({ page }) => {
    const vehicleId = await seedE2EVehicle(db);

    const res = await page.request.post(`${API_URL}/reservations`, {
      data: {
        vehicleId,
        pickupDate: futureDate(5),
        returnDate: futureDate(7),
        pickupLocation: 'CMN_T1',
      },
    });

    expect(res.status()).toBe(401);
  },
);

test(
  'authenticated user can create a reservation (PENDING_DEPOSIT)',
  async ({ page }) => {
    const vehicleId = await seedE2EVehicle(db, {
      brand: 'BMW',
      model: 'X5',
      pricePerDayEurCents: 8000,
    });

    const { accessToken } = await registerUser(page, {
      email: uniqueEmail('booking'),
      password: 'BookingTest123!',
      fullName: 'Booking Tester',
    });

    const res = await page.request.post(`${API_URL}/reservations`, {
      data: {
        vehicleId,
        pickupDate: futureDate(5),
        returnDate: futureDate(8),
        pickupLocation: 'CMN_T1',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status()).toBe(201);
    const { data: reservation } = await res.json();
    expect(reservation).toMatchObject({
      status: 'PENDING_DEPOSIT',
      vehicleId,
    });
    expect(reservation.id).toBeDefined();
    expect(reservation.stripeClientSecret).toBeDefined();
  },
);

test(
  'reservation appears on /dashboard after creation',
  async ({ page }) => {
    const vehicleId = await seedE2EVehicle(db, {
      brand: 'Mercedes',
      model: 'GLE',
    });

    const { accessToken } = await registerUser(page, {
      email: uniqueEmail('dash-booking'),
      password: 'DashBook123!',
      fullName: 'Dashboard Booker',
    });

    // Create reservation via API
    const resCreate = await page.request.post(`${API_URL}/reservations`, {
      data: {
        vehicleId,
        pickupDate: futureDate(3),
        returnDate: futureDate(6),
        pickupLocation: 'CMN_T1',
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resCreate.status()).toBe(201);

    // Now go to dashboard (session cookies already set by registerUser)
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectAtLeastOneReservation();
  },
);

test(
  'booking with past date returns 400',
  async ({ page }) => {
    const vehicleId = await seedE2EVehicle(db);

    const { accessToken } = await registerUser(page, {
      email: uniqueEmail('past-date'),
      password: 'PastDate123!',
      fullName: 'Past Date Tester',
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const res = await page.request.post(`${API_URL}/reservations`, {
      data: {
        vehicleId,
        pickupDate: pastDate.toISOString(),
        returnDate: futureDate(1),
        pickupLocation: 'CMN_T1',
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status()).toBe(400);
  },
);

test(
  'booking for unknown vehicleId returns 404',
  async ({ page }) => {
    const { accessToken } = await registerUser(page, {
      email: uniqueEmail('unknown-vehicle'),
      password: 'UnknownVehicle123!',
      fullName: 'Unknown Vehicle Tester',
    });

    const res = await page.request.post(`${API_URL}/reservations`, {
      data: {
        vehicleId: randomUUID(), // v4 UUID not in DB → 404
        pickupDate: futureDate(5),
        returnDate: futureDate(8),
        pickupLocation: 'CMN_T1',
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status()).toBe(404);
  },
);

test(
  'user can cancel their own reservation',
  async ({ page }) => {
    const vehicleId = await seedE2EVehicle(db);

    const { accessToken } = await registerUser(page, {
      email: uniqueEmail('cancel'),
      password: 'CancelTest123!',
      fullName: 'Cancel Tester',
    });

    // Create
    const resCreate = await page.request.post(`${API_URL}/reservations`, {
      data: {
        vehicleId,
        pickupDate: futureDate(5),
        returnDate: futureDate(8),
        pickupLocation: 'CMN_T1',
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(resCreate.status()).toBe(201);
    const { data: { id } } = await resCreate.json();

    // Cancel
    const resCancel = await page.request.patch(
      `${API_URL}/reservations/${id}/cancel`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(resCancel.status()).toBe(200);
    const { data: cancelled } = await resCancel.json();
    expect(cancelled.status).toBe('CANCELLED');
  },
);
