import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import {
  connectE2EDb,
  seedE2EVehicle,
  truncateAllE2ETables,
} from './fixtures/db.fixture';
import {
  loginUser,
  registerUser,
  uniqueEmail,
} from './fixtures/auth.fixture';

let db: Client;

test.beforeAll(async () => {
  db = await connectE2EDb();
});

test.afterAll(async () => {
  if (db) {
    await db.end();
  }
});

test.beforeEach(async () => {
  await truncateAllE2ETables(db);

  await seedE2EVehicle(db, {
    brand: 'Smoke',
    model: 'Compact',
    category: 'COMPACT',
    pricePerDayEurCents: 6500,
  });
  await seedE2EVehicle(db, {
    brand: 'Smoke',
    model: 'SUV',
    category: 'SUV',
    pricePerDayEurCents: 9900,
  });
  await seedE2EVehicle(db, {
    brand: 'Smoke',
    model: 'Luxury',
    category: 'LUXURY',
    pricePerDayEurCents: 15500,
  });
});

async function uploadCurrentDocument(page: import('@playwright/test').Page, fileName: string) {
  const galleryButton = page.getByRole('button', { name: /Galer[ií]a|Gallery/i });
  if (await galleryButton.isVisible().catch(() => false)) {
    await galleryButton.click();
  }

  await page
    .locator('input[type="file"]')
    .last()
    .setInputFiles({
      name: fileName,
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9Wn8D04AAAAASUVORK5CYII=',
        'base64',
      ),
    });

  await page.getByRole('button', { name: /Usar esta foto|Use this photo/i }).click();
  await expect(page.getByText(/Documento recibido|Document received/i)).toBeVisible({
    timeout: 15_000,
  });
}

test('customer demo booking reaches confirmation, check-in, and operator approval unlocks smart ticket', async ({
  browser,
  page,
}) => {
  test.setTimeout(120_000);

  await registerUser(page, {
    email: uniqueEmail('smoke-customer'),
    password: 'SmokeCustomer123!',
    fullName: 'Smoke Customer',
  });

  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('button', { name: /Buscar coches|Search cars/i }),
  ).toBeVisible();

  await page.getByRole('button', { name: /Buscar coches|Search cars/i }).click();
  await page.getByRole('button', { name: /Elegir.*coche|Choose.*car/i }).click();

  await page.waitForURL(/\/catalog/);
  const targetCard = page
    .locator('[data-testid="vehicle-card"]')
    .filter({ hasText: 'Smoke SUV' })
    .first();
  await expect(targetCard).toBeVisible();
  await targetCard.getByRole('link').click();

  await page.waitForURL(/\/catalog\/.+/);
  await expect(page.getByRole('heading', { name: /Smoke SUV/i })).toBeVisible();

  await page.getByRole('button', { name: /^Reservar/i }).first().click();
  await page.waitForURL(/\/book\/.+/);

  await page.getByRole('button', { name: /^Continuar$/i }).click();
  await page.locator('input[type="tel"]').fill('612345678');
  await page.getByRole('button', { name: /Crear reserva demo/i }).click();

  await page.waitForURL(/\/booking\/confirmed\?id=.*demo=1/);
  await expect(page.getByText(/Modo demo local/i)).toBeVisible();

  const reservationId = new URL(page.url()).searchParams.get('id');
  expect(reservationId).toBeTruthy();

  await page.getByRole('link', { name: /Completar check-in ahora/i }).click();
  await page.waitForURL(new RegExp(`/check-in\\?reservationId=${reservationId}`));

  await uploadCurrentDocument(page, 'passport.png');
  await uploadCurrentDocument(page, 'license.png');

  await page.waitForURL(new RegExp(`/waiting-room\\?reservationId=${reservationId}`), {
    timeout: 20_000,
  });

  const operatorContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:3600',
  });
  const operatorPage = await operatorContext.newPage();

  const operatorEmail = uniqueEmail('smoke-operator');
  const operatorPassword = 'SmokeOperator123!';

  await registerUser(operatorPage, {
    email: operatorEmail,
    password: operatorPassword,
    fullName: 'Smoke Operator',
  });
  await db.query(`UPDATE users SET role = 'OPERATOR' WHERE email = $1`, [operatorEmail]);
  await loginUser(operatorPage, { email: operatorEmail, password: operatorPassword });

  await operatorPage.goto('/operator/documents');
  await expect(operatorPage.getByRole('heading', { name: /Documentos/i })).toBeVisible();
  await expect(operatorPage.getByText(reservationId!)).toBeVisible();

  for (let i = 0; i < 2; i += 1) {
    await expect(
      operatorPage.getByRole('button', { name: /Aprobar/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
    await operatorPage.getByRole('button', { name: /Aprobar/i }).first().click();
    await operatorPage.waitForLoadState('networkidle');
  }

  await page.reload();
  await page.waitForURL(new RegExp(`/smart-ticket\\?reservationId=${reservationId}`), {
    timeout: 20_000,
  });
  await expect(page.getByText(new RegExp(`#${reservationId}`))).toBeVisible();
  await expect(page.getByText(/NEXUS/i).first()).toBeVisible();

  await operatorContext.close();
});
