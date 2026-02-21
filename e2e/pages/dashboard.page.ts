/**
 * dashboard.page.ts — Page Object for /dashboard
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class DashboardPage {
  readonly reservationCards: Locator;
  readonly reservationCount: Locator;
  readonly noReservationsMessage: Locator;

  constructor(private readonly page: Page) {
    // Relies on data-testid="reservation-card" added to DashboardClient.tsx
    this.reservationCards = page.locator('[data-testid="reservation-card"]');
    this.reservationCount = page.locator('[data-testid="reservation-count"]');
    this.noReservationsMessage = page.locator('[data-testid="no-reservations"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectVisible() {
    // Dashboard has a heading or the page URL matches
    await this.page.waitForURL(/\/dashboard/);
  }

  async getReservationCount(): Promise<number> {
    return this.reservationCards.count();
  }

  async expectReservationCount(n: number) {
    await expect(this.reservationCards).toHaveCount(n, { timeout: 10_000 });
  }

  async expectAtLeastOneReservation() {
    await expect(this.reservationCards.first()).toBeVisible({ timeout: 10_000 });
  }

  async expectNoReservations() {
    await expect(this.reservationCards).toHaveCount(0, { timeout: 10_000 });
  }

  /**
   * Returns the text of the status badge for the first reservation card.
   */
  async getFirstReservationStatus(): Promise<string> {
    const badge = this.reservationCards
      .first()
      .locator('[data-testid="reservation-status"]');
    return badge.innerText();
  }
}
