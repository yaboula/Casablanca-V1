/**
 * catalog.page.ts — Page Object for /catalog
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class CatalogPage {
  readonly vehicleCards: Locator;
  readonly categoryFilter: Locator;
  readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    // Relies on data-testid="vehicle-card" added to VehicleCard.tsx
    this.vehicleCards = page.locator('[data-testid="vehicle-card"]');
    // The category select/button in CatalogHeaderClient
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.emptyState = page.locator('[data-testid="catalog-empty"]');
  }

  async goto(params?: { category?: string; pickupDate?: string; returnDate?: string }) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.pickupDate) qs.set('pickupDate', params.pickupDate);
    if (params?.returnDate) qs.set('returnDate', params.returnDate);
    const query = qs.toString();
    await this.page.goto(`/catalog${query ? `?${query}` : ''}`);
    // Wait for DOM ready — avoid 'networkidle' since background polls
    // (exchange-rate, SSE) keep the network permanently busy on catalog page
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectAtLeastOneVehicle() {
    await expect(this.vehicleCards.first()).toBeVisible({ timeout: 10_000 });
  }

  async expectVehicleCount(n: number) {
    await expect(this.vehicleCards).toHaveCount(n, { timeout: 10_000 });
  }

  async clickFirstVehicle(): Promise<string> {
    const firstCard = this.vehicleCards.first();
    await firstCard.waitFor({ state: 'visible' });
    // The card is wrapped in a Link to /catalog/:id
    // Click and wait for navigation
    const [, id] = await Promise.all([
      firstCard.click(),
      this.page.waitForURL(/\/catalog\/[a-f0-9-]+/),
    ]).then(async ([, response]) => {
      const url = this.page.url();
      const match = url.match(/\/catalog\/([a-f0-9-]+)/);
      return [response, match?.[1] ?? ''];
    });
    return id;
  }

  async getVehicleCardCount(): Promise<number> {
    return this.vehicleCards.count();
  }
}
