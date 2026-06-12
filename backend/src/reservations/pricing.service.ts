import { BadRequestException, Injectable } from '@nestjs/common';

export const PRICING_POLICY_VERSION = 'v1-extra-hour-grace';
export const PRICING_CURRENCY = 'EUR';
export const GRACE_HOURS = 3;
export const HALF_DAY_UNTIL_HOURS = 12;
export const DEPOSIT_EUR_CENTS = 1000;

const HOUR_MS = 1000 * 60 * 60;
const DAY_HOURS = 24;

export enum ExtraBillingType {
  NONE = 'NONE',
  GRACE = 'GRACE',
  HALF_DAY = 'HALF_DAY',
  FULL_DAY = 'FULL_DAY',
}

export type PricingQuote = {
  dailyRateEurCents: number;
  fullDays: number;
  extraHours: number;
  extraBillingType: ExtraBillingType;
  chargedDayUnitsX2: number;
  chargedDayUnits: string;
  subtotalEurCents: number;
  estimatedTotalEurCents: number;
  depositEurCents: number;
  totalDueNowEurCents: number;
  currency: typeof PRICING_CURRENCY;
  pricingPolicyVersion: typeof PRICING_POLICY_VERSION;
};

@Injectable()
export class PricingService {
  calculateReservationPrice(input: {
    pickupAt: Date;
    returnAt: Date;
    dailyRateEurCents: number;
  }): PricingQuote {
    const { pickupAt, returnAt, dailyRateEurCents } = input;

    if (!Number.isInteger(dailyRateEurCents) || dailyRateEurCents <= 0) {
      throw new BadRequestException('Daily rate must be a positive integer.');
    }

    if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime())) {
      throw new BadRequestException('Invalid pickup or return datetime.');
    }

    const diffMs = returnAt.getTime() - pickupAt.getTime();
    if (diffMs <= 0) {
      throw new BadRequestException('returnAt must be after pickupAt.');
    }

    const totalHours = diffMs / HOUR_MS;
    const fullDays = Math.floor(totalHours / DAY_HOURS);
    const extraHoursRaw = totalHours - fullDays * DAY_HOURS;
    const extraHours = extraHoursRaw < 0.01 ? 0 : roundHours(extraHoursRaw);

    let extraBillingType = ExtraBillingType.NONE;
    let chargedDayUnitsX2 = fullDays * 2;
    let extraChargeEurCents = 0;

    if (fullDays === 0) {
      chargedDayUnitsX2 = 2;
    } else if (extraHours === 0) {
      extraBillingType = ExtraBillingType.NONE;
    } else if (extraHours <= GRACE_HOURS) {
      extraBillingType = ExtraBillingType.GRACE;
    } else if (extraHours < HALF_DAY_UNTIL_HOURS) {
      extraBillingType = ExtraBillingType.HALF_DAY;
      chargedDayUnitsX2 += 1;
      extraChargeEurCents = Math.ceil(dailyRateEurCents / 2);
    } else {
      extraBillingType = ExtraBillingType.FULL_DAY;
      chargedDayUnitsX2 += 2;
      extraChargeEurCents = dailyRateEurCents;
    }

    const baseChargeEurCents =
      fullDays === 0 ? dailyRateEurCents : fullDays * dailyRateEurCents;
    const subtotalEurCents = baseChargeEurCents + extraChargeEurCents;

    return {
      dailyRateEurCents,
      fullDays,
      extraHours,
      extraBillingType,
      chargedDayUnitsX2,
      chargedDayUnits: formatChargedUnits(chargedDayUnitsX2),
      subtotalEurCents,
      estimatedTotalEurCents: subtotalEurCents,
      depositEurCents: DEPOSIT_EUR_CENTS,
      totalDueNowEurCents: DEPOSIT_EUR_CENTS,
      currency: PRICING_CURRENCY,
      pricingPolicyVersion: PRICING_POLICY_VERSION,
    };
  }
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatChargedUnits(unitsX2: number): string {
  return unitsX2 % 2 === 0
    ? String(unitsX2 / 2)
    : `${Math.floor(unitsX2 / 2)}.5`;
}
