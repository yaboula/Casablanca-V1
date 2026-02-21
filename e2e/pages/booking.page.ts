/**
 * booking.page.ts — Page Object for /catalog/:id and /booking
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class VehicleDetailPage {
  readonly bookNowButton: Locator;
  readonly vehicleTitle: Locator;
  readonly priceDisplay: Locator;

  constructor(private readonly page: Page) {
    this.bookNowButton = page.locator('[data-testid="book-now-btn"]');
    this.vehicleTitle = page.locator('[data-testid="vehicle-title"]');
    this.priceDisplay = page.locator('[data-testid="vehicle-price"]');
  }

  async goto(vehicleId: string) {
    await this.page.goto(`/catalog/${vehicleId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async clickBookNow() {
    await this.bookNowButton.waitFor({ state: 'visible' });
    await this.bookNowButton.click();
  }

  async expectVisible() {
    await expect(this.vehicleTitle).toBeVisible({ timeout: 10_000 });
  }
}

export class BookingPage {
  readonly pickupDateInput: Locator;
  readonly returnDateInput: Locator;
  readonly confirmBookingButton: Locator;
  readonly priceSummary: Locator;
  readonly successMessage: Locator;

  constructor(private readonly page: Page) {
    this.pickupDateInput = page.locator('[data-testid="pickup-date"]');
    this.returnDateInput = page.locator('[data-testid="return-date"]');
    this.confirmBookingButton = page.locator('[data-testid="confirm-booking"]');
    this.priceSummary = page.locator('[data-testid="price-summary"]');
    this.successMessage = page.locator('[data-testid="booking-success"]');
  }

  /** Returns a date string in YYYY-MM-DD format, offset from today */
  static futureDate(daysFromNow: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
  }
}
