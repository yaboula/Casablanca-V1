import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NON_PENDING_BLOCKING_RESERVATION_STATUSES,
  OPERATIONAL_TURNAROUND_BUFFER_HOURS,
  PENDING_DEPOSIT_HOLD_MINUTES,
} from '../reservations/reservation-policy';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import {
  GRACE_HOURS,
  HALF_DAY_UNTIL_HOURS,
  PRICING_POLICY_VERSION,
} from '../reservations/pricing.service';
import { Vehicle, VehicleCategory, VehicleStatus } from './vehicle.entity';

export interface FindAvailableQuery {
  pickupDate: Date;
  returnDate: Date;
  category?: VehicleCategory;
}

export type VehicleAvailabilityDayStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';

export type VehicleAvailabilityCalendar = {
  vehicleId: string;
  from: string;
  to: string;
  timezone: 'UTC';
  operationalBufferHours: number;
  pendingDepositHoldMinutes: number;
  policy: {
    graceHours: number;
    halfDayUntilHours: number;
    pricingPolicyVersion: string;
  };
  basePricePerDayEurCents: number;
  days: {
    date: string;
    status: VehicleAvailabilityDayStatus;
    pricePerDayEurCents: number;
  }[];
  blockedIntervals: {
    startAt: string;
    endAt: string;
    bufferedEndAt: string;
    status: ReservationStatus;
  }[];
};

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
  ) {}

  /**
   * Returns vehicles that:
   * 1. Are AVAILABLE in status (not RENTED/MAINTENANCE/INACTIVE)
   * 2. Have no confirmed/in-progress reservation overlapping [pickupDate, returnDate)
   *
   * MVP scale: NOT IN subquery is acceptable (<3,000 reservations at launch).
   * Migrate to tsrange + GiST when fleet > 500.
   */
  async findAvailable(query: FindAvailableQuery): Promise<Vehicle[]> {
    const { pickupDate, returnDate, category } = query;

    const qb = this.vehiclesRepo
      .createQueryBuilder('vehicle')
      .where('vehicle.status = :status', { status: VehicleStatus.AVAILABLE })
      .andWhere(
        `vehicle.id NOT IN (
          SELECT r."vehicle_id"
          FROM reservations r
          WHERE (
              (r.status = :pendingStatus AND r."created_at" >= :pendingHoldCutoff)
              OR r.status IN (:...nonPendingBlockingStatuses)
            )
            AND r."pickup_date" < :returnDateWithBuffer
            AND r."return_date" + (:turnaroundBufferHours * INTERVAL '1 hour') > :pickupDate
        )`,
        {
          pickupDate,
          returnDateWithBuffer: addHours(
            returnDate,
            OPERATIONAL_TURNAROUND_BUFFER_HOURS,
          ),
          pendingStatus: ReservationStatus.PENDING_DEPOSIT,
          pendingHoldCutoff: getPendingDepositHoldCutoff(),
          nonPendingBlockingStatuses: NON_PENDING_BLOCKING_RESERVATION_STATUSES,
          turnaroundBufferHours: OPERATIONAL_TURNAROUND_BUFFER_HOURS,
        },
      )
      .orderBy('vehicle.price_per_day_eur_cents', 'ASC');

    if (category) {
      qb.andWhere('vehicle.category = :category', { category });
    }

    return qb.getMany();
  }

  async getAvailabilityCalendar(input: {
    vehicleId: string;
    from: Date;
    to: Date;
  }): Promise<VehicleAvailabilityCalendar> {
    const vehicle = await this.findOne(input.vehicleId);
    const from = startOfUtcDay(input.from);
    const to = startOfUtcDay(input.to);

    const reservations = await this.reservationsRepo
      .createQueryBuilder('reservation')
      .select([
        'reservation.id',
        'reservation.status',
        'reservation.pickupDate',
        'reservation.returnDate',
        'reservation.createdAt',
      ])
      .where('reservation.vehicleId = :vehicleId', { vehicleId: vehicle.id })
      .andWhere(
        `(
          (reservation.status = :pendingStatus AND reservation."created_at" >= :pendingHoldCutoff)
          OR reservation.status IN (:...nonPendingBlockingStatuses)
        )`,
        {
          pendingStatus: ReservationStatus.PENDING_DEPOSIT,
          pendingHoldCutoff: getPendingDepositHoldCutoff(),
          nonPendingBlockingStatuses: NON_PENDING_BLOCKING_RESERVATION_STATUSES,
        },
      )
      .andWhere('reservation."pickup_date" < :to', {
        to: addHours(to, OPERATIONAL_TURNAROUND_BUFFER_HOURS),
      })
      .andWhere(
        `reservation."return_date" + (:turnaroundBufferHours * INTERVAL '1 hour') > :from`,
        {
          from,
          turnaroundBufferHours: OPERATIONAL_TURNAROUND_BUFFER_HOURS,
        },
      )
      .orderBy('reservation.pickupDate', 'ASC')
      .getMany();

    const blockedIntervals = reservations.map((reservation) => ({
      startAt: reservation.pickupDate.toISOString(),
      endAt: reservation.returnDate.toISOString(),
      bufferedEndAt: addHours(
        reservation.returnDate,
        OPERATIONAL_TURNAROUND_BUFFER_HOURS,
      ).toISOString(),
      status: reservation.status,
    }));

    const days = enumerateUtcDates(from, to).map((day) => {
      const status = getDayStatus(day, blockedIntervals);
      return {
        date: toIsoDate(day),
        status,
        pricePerDayEurCents: vehicle.pricePerDayEurCents,
      };
    });

    return {
      vehicleId: vehicle.id,
      from: toIsoDate(from),
      to: toIsoDate(to),
      timezone: 'UTC',
      operationalBufferHours: OPERATIONAL_TURNAROUND_BUFFER_HOURS,
      pendingDepositHoldMinutes: PENDING_DEPOSIT_HOLD_MINUTES,
      policy: {
        graceHours: GRACE_HOURS,
        halfDayUntilHours: HALF_DAY_UNTIL_HOURS,
        pricingPolicyVersion: PRICING_POLICY_VERSION,
      },
      basePricePerDayEurCents: vehicle.pricePerDayEurCents,
      days,
      blockedIntervals,
    };
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo ${id} no encontrado.`);
    }

    return vehicle;
  }

  async findAll(category?: VehicleCategory): Promise<Vehicle[]> {
    return this.vehiclesRepo.find({
      where: {
        status: VehicleStatus.AVAILABLE,
        ...(category ? { category } : {}),
      },
      order: { pricePerDayEurCents: 'ASC' },
    });
  }
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function getPendingDepositHoldCutoff(): Date {
  return new Date(Date.now() - PENDING_DEPOSIT_HOLD_MINUTES * 60 * 1000);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function enumerateUtcDates(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);

  while (current <= to) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function getDayStatus(
  day: Date,
  blockedIntervals: VehicleAvailabilityCalendar['blockedIntervals'],
): VehicleAvailabilityDayStatus {
  const dayStart = day.getTime();
  const dayEnd = addHours(day, 24).getTime();
  const overlaps = blockedIntervals.filter((interval) => {
    const intervalStart = new Date(interval.startAt).getTime();
    const intervalEnd = new Date(interval.bufferedEndAt).getTime();
    return intervalStart < dayEnd && intervalEnd > dayStart;
  });

  if (overlaps.length === 0) return 'AVAILABLE';

  const serviceSlots = Array.from({ length: 29 }, (_, index) => {
    const slot = new Date(day);
    slot.setUTCHours(6, index * 30, 0, 0);
    return slot.getTime();
  });

  const availableSlotCount = serviceSlots.filter(
    (slot) =>
      !overlaps.some((interval) => {
        const intervalStart = new Date(interval.startAt).getTime();
        const intervalEnd = new Date(interval.bufferedEndAt).getTime();
        return slot >= intervalStart && slot < intervalEnd;
      }),
  ).length;

  if (availableSlotCount === 0) return 'UNAVAILABLE';
  return 'PARTIAL';
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
