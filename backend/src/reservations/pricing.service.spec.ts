import { BadRequestException } from '@nestjs/common';
import { ExtraBillingType, PricingService } from './pricing.service';

describe('PricingService', () => {
  const service = new PricingService();
  const dailyRateEurCents = 5001;
  const pickupAt = new Date('2026-06-11T14:00:00.000Z');

  it('charges 1 day for an exact 24h rental', () => {
    const quote = service.calculateReservationPrice({
      pickupAt,
      returnAt: new Date('2026-06-12T14:00:00.000Z'),
      dailyRateEurCents,
    });

    expect(quote.fullDays).toBe(1);
    expect(quote.extraHours).toBe(0);
    expect(quote.extraBillingType).toBe(ExtraBillingType.NONE);
    expect(quote.chargedDayUnitsX2).toBe(2);
    expect(quote.subtotalEurCents).toBe(5001);
  });

  it('keeps 2.5h extra inside the free grace period', () => {
    const quote = service.calculateReservationPrice({
      pickupAt,
      returnAt: new Date('2026-06-12T16:30:00.000Z'),
      dailyRateEurCents,
    });

    expect(quote.extraHours).toBe(2.5);
    expect(quote.extraBillingType).toBe(ExtraBillingType.GRACE);
    expect(quote.chargedDayUnitsX2).toBe(2);
    expect(quote.subtotalEurCents).toBe(5001);
  });

  it('charges a rounded-up half-day for 6h extra', () => {
    const quote = service.calculateReservationPrice({
      pickupAt,
      returnAt: new Date('2026-06-12T20:00:00.000Z'),
      dailyRateEurCents,
    });

    expect(quote.extraHours).toBe(6);
    expect(quote.extraBillingType).toBe(ExtraBillingType.HALF_DAY);
    expect(quote.chargedDayUnitsX2).toBe(3);
    expect(quote.chargedDayUnits).toBe('1.5');
    expect(quote.subtotalEurCents).toBe(7502);
  });

  it('charges one extra full day for more than 12h extra', () => {
    const quote = service.calculateReservationPrice({
      pickupAt,
      returnAt: new Date('2026-06-13T04:00:00.000Z'),
      dailyRateEurCents,
    });

    expect(quote.extraHours).toBe(14);
    expect(quote.extraBillingType).toBe(ExtraBillingType.FULL_DAY);
    expect(quote.chargedDayUnitsX2).toBe(4);
    expect(quote.subtotalEurCents).toBe(10002);
  });

  it('applies a minimum 1 day charge', () => {
    const quote = service.calculateReservationPrice({
      pickupAt,
      returnAt: new Date('2026-06-11T18:00:00.000Z'),
      dailyRateEurCents,
    });

    expect(quote.fullDays).toBe(0);
    expect(quote.chargedDayUnitsX2).toBe(2);
    expect(quote.subtotalEurCents).toBe(5001);
  });

  it('rejects return before pickup', () => {
    expect(() =>
      service.calculateReservationPrice({
        pickupAt,
        returnAt: new Date('2026-06-11T13:59:00.000Z'),
        dailyRateEurCents,
      }),
    ).toThrow(BadRequestException);
  });
});
