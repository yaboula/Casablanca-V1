/**
 * catalog.e2e.spec.ts — Journey 1: Public Catalog Browse
 *
 * Tests that run without authentication. Verifies:
 *   - Catalog page loads and renders vehicle cards
 *   - MAINTENANCE vehicles are excluded
 *   - Category filter via URL param
 *   - Vehicle detail page loads on click
 *
 * Prerequisites:
 *   - Next.js running (started by webServer)
 *   - NestJS backend running at http://localhost:3900
 *   - nexus_e2e_db accessible (E2E_DATABASE_URL)
 */

import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import {
  connectE2EDb,
  truncateAllE2ETables,
  seedE2EVehicle,
} from './fixtures/db.fixture';
import { CatalogPage } from './pages/catalog.page';

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

// ── Tests ─────────────────────────────────────────────────────

test('displays empty state when no vehicles are seeded', async ({ page }) => {
  const catalog = new CatalogPage(page);
  await catalog.goto();

  // No vehicle cards should be visible
  await expect(catalog.vehicleCards).toHaveCount(0, { timeout: 8_000 });
});

test('displays vehicle cards after seeding', async ({ page }) => {
  await seedE2EVehicle(db, { brand: 'Tesla', model: 'Model 3', category: 'SEDAN' });
  await seedE2EVehicle(db, { brand: 'BMW', model: 'X5', category: 'SUV' });

  const catalog = new CatalogPage(page);
  await catalog.goto();

  await catalog.expectVehicleCount(2);
});

test('MAINTENANCE vehicles are NOT shown in catalog', async ({ page }) => {
  await seedE2EVehicle(db, { brand: 'Audi', model: 'A4', status: 'AVAILABLE' });
  await seedE2EVehicle(db, { brand: 'Broken', model: 'Car', status: 'MAINTENANCE' });

  const catalog = new CatalogPage(page);
  await catalog.goto();

  // Only the AVAILABLE one should appear
  await catalog.expectVehicleCount(1);
});

test('filters catalog by category via URL param', async ({ page }) => {
  await seedE2EVehicle(db, { brand: 'BMW', model: 'X5', category: 'SUV' });
  await seedE2EVehicle(db, { brand: 'Tesla', model: 'Model 3', category: 'SEDAN' });

  const catalog = new CatalogPage(page);

  // Filter for SUV only
  await catalog.goto({ category: 'SUV' });
  await catalog.expectVehicleCount(1);

  // Filter for SEDAN only
  await catalog.goto({ category: 'SEDAN' });
  await catalog.expectVehicleCount(1);

  // No filter — both shown
  await catalog.goto();
  await catalog.expectVehicleCount(2);
});

test('clicking a vehicle card navigates to detail page', async ({ page }) => {
  const vehicleId = await seedE2EVehicle(db, {
    brand: 'Mercedes',
    model: 'GLE',
    category: 'SUV',
  });

  const catalog = new CatalogPage(page);
  await catalog.goto();
  await catalog.expectAtLeastOneVehicle();

  // Click the first card
  const firstCard = catalog.vehicleCards.first();
  await firstCard.waitFor({ state: 'visible' });

  // Find the link inside the card and navigate
  const cardLink = firstCard.locator(`a[href*="/catalog/${vehicleId}"]`);
  await cardLink.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {
    // Fallback: click the card itself which should have a link
  });
  await firstCard.locator('a').first().click();

  // Should navigate to the vehicle detail page
  await page.waitForURL(/\/catalog\/[a-f0-9-]+/, { timeout: 10_000 });
  expect(page.url()).toContain(vehicleId);
});

test('catalog page title is visible', async ({ page }) => {
  await page.goto('/catalog');
  await expect(page).toHaveTitle(/NEXUS|Catálogo/i, { timeout: 10_000 });
});
