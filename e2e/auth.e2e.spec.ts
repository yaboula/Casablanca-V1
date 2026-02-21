/**
 * auth.e2e.spec.ts — Journey 2: Authentication Flow
 *
 * Tests the complete register → login → logout cycle via the browser UI.
 * Also tests redirect behavior for protected routes.
 *
 * Prerequisites:
 *   - Next.js running (started by webServer)
 *   - NestJS backend running at http://localhost:3900
 *   - nexus_e2e_db accessible
 */

import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import {
  connectE2EDb,
  truncateAllE2ETables,
} from './fixtures/db.fixture';
import { registerUser, loginUser, uniqueEmail } from './fixtures/auth.fixture';
import { LoginPage, RegisterPage } from './pages/login.page';

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

// ── Register via UI ────────────────────────────────────────

test('register page renders the form', async ({ page }) => {
  const register = new RegisterPage(page);
  await register.goto();

  await expect(register.nameInput).toBeVisible();
  await expect(register.emailInput).toBeVisible();
  await expect(register.passwordInput).toBeVisible();
  await expect(register.submitButton).toBeVisible();
});

test('successful registration via UI redirects away from /register', async ({ page }) => {
  const email = uniqueEmail('ui-register');
  const register = new RegisterPage(page);
  await register.goto();

  await register.register({
    name: 'E2E Tester',
    email,
    password: 'SecurePass123!',
  });

  // After successful register the app redirects to /
  await page.waitForURL((url) => !url.pathname.startsWith('/register'), {
    timeout: 15_000,
  });
  expect(page.url()).not.toContain('/register');
});

test('duplicate email shows error on register', async ({ page }) => {
  const email = uniqueEmail('dup');

  // Create the user via API first
  await page.request.post(
    `${process.env.E2E_API_URL ?? 'http://localhost:3900/api/v1'}/auth/register`,
    { data: { email, password: 'SecurePass123!', fullName: 'First User' } },
  );

  // Now try to register again via UI with same email
  const register = new RegisterPage(page);
  await register.goto();
  await register.register({ name: 'Second User', email, password: 'SecurePass123!' });

  // Should show 409 error (email taken)
  await register.expectEmailTakenError();
});

// ── Login via UI ────────────────────────────────────────────

test('login page renders the form', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();

  await expect(login.emailInput).toBeVisible();
  await expect(login.passwordInput).toBeVisible();
  await expect(login.submitButton).toBeVisible();
});

test('successful login via UI redirects away from /login', async ({ page }) => {
  const email = uniqueEmail('ui-login');
  const password = 'LoginTest123!';

  // Register via API first
  await page.request.post(
    `${process.env.E2E_API_URL ?? 'http://localhost:3900/api/v1'}/auth/register`,
    { data: { email, password, fullName: 'Login Tester' } },
  );

  const login = new LoginPage(page);
  await login.goto();
  await login.login(email, password);

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  });
  expect(page.url()).not.toContain('/login');
});

test('wrong password shows 401 toast on login page', async ({ page }) => {
  const email = uniqueEmail('wrong-pw');
  await page.request.post(
    `${process.env.E2E_API_URL ?? 'http://localhost:3900/api/v1'}/auth/register`,
    { data: { email, password: 'CorrectPass123!', fullName: 'PW Test' } },
  );

  const login = new LoginPage(page);
  await login.goto();
  await login.login(email, 'WrongPassword!');

  // The sonner toast should appear with an error (stays on /login)
  await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
});

// ── Auth API shortcut (fast login for use in other tests) ────

test('API shortcut registers user and grants access to /dashboard', async ({ page }) => {
  const email = uniqueEmail('api-shortcut');
  await registerUser(page, {
    email,
    password: 'ShortcutPass123!',
    fullName: 'Shortcut User',
  });

  // After registerUser(), the browser context has session cookies
  await page.goto('/dashboard');
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  // Should NOT be redirected to /login
  expect(page.url()).not.toContain('/login');
});

// ── Protected route redirect ─────────────────────────────────

test('unauthenticated user is redirected away from /dashboard', async ({ page }) => {
  // Navigate to dashboard without being logged in
  await page.goto('/dashboard');

  // Middleware should redirect to /login
  await page.waitForURL((url) => url.pathname.startsWith('/login'), {
    timeout: 10_000,
  });
  expect(page.url()).toContain('/login');
});
