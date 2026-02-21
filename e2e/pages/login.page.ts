/**
 * login.page.ts — Page Object for /login and /register
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/login');
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectRedirectedAfterLogin(expectedPath = '/') {
    await this.page.waitForURL((url) =>
      !url.pathname.startsWith('/login'),
    );
  }
}

export class RegisterPage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page.locator('#name');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/register');
    await this.nameInput.waitFor({ state: 'visible' });
  }

  async register(opts: {
    name: string;
    email: string;
    password: string;
  }) {
    await this.nameInput.fill(opts.name);
    await this.emailInput.fill(opts.email);
    await this.passwordInput.fill(opts.password);
    await this.submitButton.click();
  }

  async expectEmailTakenError() {
    // The register page sets an emailError state — look for the red text
    await expect(
      this.page.locator('p.text-red-500'),
    ).toBeVisible({ timeout: 5_000 });
  }
}
