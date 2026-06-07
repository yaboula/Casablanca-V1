/**
 * auth.fixture.ts
 *
 * Provides a fast "API-shortcut" login that:
 *  1. Calls NestJS directly to register or login a user
 *  2. Calls the Next.js /api/auth/session route to set httpOnly session cookies
 *  3. Returns the user data + tokens for assertions
 *
 * Usage in spec:
 *   const { user, accessToken } = await loginAsUser(page, { email, password });
 *   await page.goto('/dashboard'); // already authenticated
 */

import type { Page } from '@playwright/test';

export interface E2EUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResult {
  user: E2EUser;
  accessToken: string;
  refreshToken: string;
}

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3902/api/v1';

/**
 * Register a brand-new user via NestJS API and set session cookies
 * on the Playwright page context.
 */
export async function registerUser(
  page: Page,
  opts: {
    email: string;
    password: string;
    fullName: string;
  },
): Promise<AuthResult> {
  // 1. Register at NestJS directly
  const regRes = await page.request.post(`${API_URL}/auth/register`, {
    data: {
      email: opts.email,
      password: opts.password,
      fullName: opts.fullName,
    },
  });

  if (!regRes.ok()) {
    const body = await regRes.json().catch(() => ({}));
    throw new Error(
      `registerUser failed ${regRes.status()}: ${JSON.stringify(body)}`,
    );
  }

  const data = (await regRes.json()) as AuthResult & { user: E2EUser };

  // 2. Set session cookies via Next.js (so browser has nexus_token etc.)
  await setSessionCookies(page, data);

  return {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

/**
 * Login an existing user via NestJS API and set session cookies
 * on the Playwright page context.
 */
export async function loginUser(
  page: Page,
  opts: { email: string; password: string },
): Promise<AuthResult> {
  const loginRes = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: opts.email, password: opts.password },
  });

  if (!loginRes.ok()) {
    const body = await loginRes.json().catch(() => ({}));
    throw new Error(
      `loginUser failed ${loginRes.status()}: ${JSON.stringify(body)}`,
    );
  }

  const data = (await loginRes.json()) as AuthResult & { user: E2EUser };

  await setSessionCookies(page, data);

  return {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

/**
 * Call Next.js /api/auth/session to write nexus_token + nexus_user cookies
 * into the page's browser context.
 */
async function setSessionCookies(
  page: Page,
  data: { accessToken: string; refreshToken?: string; user: E2EUser },
) {
  const sessionRes = await page.request.post('/api/auth/session', {
    data: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    },
  });

  if (!sessionRes.ok()) {
    throw new Error(
      `setSessionCookies failed ${sessionRes.status()}`,
    );
  }
}

/**
 * Clear the session by calling Next.js DELETE /api/auth/session.
 */
export async function logoutUser(page: Page) {
  await page.request.delete('/api/auth/session');
}

/**
 * Generate a unique E2E test email to avoid collisions between test runs.
 */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}+${Date.now()}@nexus-e2e-test.com`;
}

