import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { getQueueToken } from "@nestjs/bullmq";
import { DataSource } from "typeorm";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import {
  DepositRefundStatus,
  DepositStatus,
  Reservation,
  ReservationStatus,
  PickupLocation,
} from "./reservation.entity";
import { Vehicle, VehicleStatus } from "../vehicles/vehicle.entity";
import { User, UserRole } from "../users/user.entity";
import { StripeService } from "../stripe/stripe.service";
import { QrService } from "../qr/qr.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { PricingService } from "./pricing.service";

// ─── Constantes de dominio ────────────────────────────────────────────────────

const DEPOSIT_EUR_CENTS = 1000; // 10 € fijo
const ONE_DAY_MS = 86_400_000;

// ─── Factories ────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    email: "customer@test.com",
    fullName: "Test User",
    role: UserRole.USER,
    isActive: true,
    phone: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  } as User;
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "vehicle-abc",
    brand: "Toyota",
    model: "Camry",
    status: VehicleStatus.AVAILABLE,
    pricePerDayEurCents: 5000, // 50 €/día
    ...overrides,
  } as Vehicle;
}

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "res-999",
    userId: "user-123",
    vehicleId: "vehicle-abc",
    status: ReservationStatus.PENDING_DEPOSIT,
    totalDays: 3,
    totalPriceEurCents: 15000,
    depositEurCents: DEPOSIT_EUR_CENTS,
    pickupDate: new Date(Date.now() + ONE_DAY_MS),
    returnDate: new Date(Date.now() + 4 * ONE_DAY_MS),
    pickupLocation: PickupLocation.CMN_T1,
    stripePaymentIntentId: "pi_test_abc123",
    stripeClientSecret: "pi_test_secret_xxx",
    depositStatus: DepositStatus.PENDING,
    depositCapturedAt: null,
    depositLastFailureAt: null,
    depositLastFailureReason: null,
    depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
    depositRefundAttemptedAt: null,
    depositRefundFailureAt: null,
    depositRefundFailureReason: null,
    qrCodeHash: null,
    ticketTokenVersion: 0,
    ticketRevokedAt: null,
    customerName: null,
    customerPhone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Reservation;
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

/**
 * Crea un QueryRunner simulado que controla:
 *  - qué vehículo devuelve la query de lock
 *  - cuántas reservas solapadas hay
 *  - si la transacción debe fallar en save
 */
function makeQueryRunner(
  vehicleRow: Vehicle | null,
  conflictCount = 0,
  failOnSave = false,
) {
  const repoMocks = {
    createdData: null as any,
    findOne: jest.fn().mockResolvedValue(vehicleRow),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(conflictCount),
    }),
    create: jest.fn().mockImplementation((data: any) => {
      repoMocks.createdData = data;
      return data;
    }),
    save: failOnSave
      ? jest.fn().mockRejectedValue(new Error("DB error"))
      : jest
          .fn()
          .mockImplementation((r: any) =>
            Promise.resolve({ ...r, id: "res-999" }),
          ),
  };

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      getRepository: jest.fn().mockImplementation((entity: any) => {
        if (entity === Vehicle) return { findOne: repoMocks.findOne };
        if (entity === Reservation) return repoMocks;
        return {};
      }),
    },
    _repoMocks: repoMocks,
  };
}

// ─── Mocks de dependencias externas ──────────────────────────────────────────────

const mockReservationsRepo = {
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getOne: jest.fn().mockImplementation(() => mockReservationsRepo.findOne()),
  }),
  find: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  count: jest.fn().mockResolvedValue(0),
};

const mockVehiclesRepo = {
  findOne: jest.fn(),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
};
const mockDataSource = {
  createQueryRunner: jest.fn(),
  getRepository: jest.fn().mockImplementation((entity: any) => {
    if (entity === Vehicle) return mockVehiclesRepo;
    if (entity === Reservation) return mockReservationsRepo;
    return {};
  }),
  transaction: jest
    .fn()
    .mockImplementation(async (cb: (manager: any) => Promise<any>) => {
      // Simulate a transaction by calling the callback with a mock manager
      const transactionManager = {
        getRepository: jest.fn().mockImplementation((entity: any) => {
          if (entity === Reservation)
            return {
              findOne: mockReservationsRepo.findOne,
              createQueryBuilder: mockReservationsRepo.createQueryBuilder,
              save: mockReservationsRepo.save,
              count: mockReservationsRepo.count,
            };
          if (entity === Vehicle)
            return {
              update: mockVehiclesRepo.update,
            };
          return {};
        }),
      };
      return cb(transactionManager);
    }),
};

const mockStripeService = {
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: "pi_test_abc123",
    client_secret: "pi_test_secret_xxx",
  }),
  cancelPaymentIntent: jest.fn().mockResolvedValue({}),
  refundPaymentIntent: jest.fn().mockResolvedValue({}),
};

const mockQrService = {
  generateHash: jest.fn().mockReturnValue("mock-qr-hash-64chars"),
  issueTicketToken: jest.fn().mockReturnValue({
    ticketToken: "signed-ticket-token",
    expiresAt: "2026-02-19T10:00:00.000Z",
  }),
};

const mockExpiryQueue = {
  add: jest.fn().mockResolvedValue({ id: "job-1" }),
};

// ─── Suite principal ────────────────────────────────────────────────────────────────

describe("ReservationsService", () => {
  let service: ReservationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockReservationsRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getOne: jest.fn().mockImplementation(() => mockReservationsRepo.findOne()),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        PricingService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationsRepo,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehiclesRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: QrService,
          useValue: mockQrService,
        },
        {
          provide: getQueueToken("reservation-expiry"),
          useValue: mockExpiryQueue,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // create()
  // ══════════════════════════════════════════════════════════════════════════

  describe("quote()", () => {
    const quoteDto = {
      vehicleId: "vehicle-abc",
      pickupAt: "2027-06-11T14:00:00.000Z",
      returnAt: "2027-06-12T20:00:00.000Z",
      pickupLocation: PickupLocation.CMN_T1,
    };

    it("returns authoritative pricing and availability", async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(makeVehicle());
      mockReservationsRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });

      const result = await service.quote(quoteDto);

      expect(result.available).toBe(true);
      expect(result.pricing.extraBillingType).toBe("HALF_DAY");
      expect(result.pricing.chargedDayUnits).toBe("1.5");
      expect(result.pricing.subtotalEurCents).toBe(7500);
      expect(result.policy.graceHours).toBe(3);
    });

    it("marks overlapping active reservations as unavailable", async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(makeVehicle());
      mockReservationsRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      const result = await service.quote(quoteDto);

      expect(result.available).toBe(false);
      expect(mockStripeService.createPaymentIntent).not.toHaveBeenCalled();
    });
  });

  describe("create()", () => {
    const tomorrow = new Date(Date.now() + ONE_DAY_MS).toISOString();
    const threeDaysLater = new Date(Date.now() + 3 * ONE_DAY_MS).toISOString();

    const dto: CreateReservationDto = {
      vehicleId: "vehicle-abc",
      pickupDate: tomorrow,
      returnDate: threeDaysLater,
      pickupLocation: PickupLocation.CMN_T1,
      customerName: "Test User",
      customerPhone: "+34600000000",
    };

    it("happy path — reserva creada, transacción commiteada, job de expiración encolado", async () => {
      // Temporary override so Stripe PI is created instead of mocked natively in code
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const vehicle = makeVehicle();
      const qr = makeQueryRunner(vehicle, 0);
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      try {
        const result = await service.create(dto, makeUser());

        // Transacción ACID completa
        expect(qr.connect).toHaveBeenCalledTimes(1);
        expect(qr.startTransaction).toHaveBeenCalledTimes(1);
        expect(qr.commitTransaction).toHaveBeenCalledTimes(1);
        expect(qr.rollbackTransaction).not.toHaveBeenCalled();
        expect(qr.release).toHaveBeenCalledTimes(1);

        // Stripe: PI created AFTER transaction commit (Bug 11 fix)
        expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
          DEPOSIT_EUR_CENTS,
          expect.any(String),
          expect.any(Object),
        );

        // Update called to persist Stripe data after PI creation
        expect(mockReservationsRepo.update).toHaveBeenCalled();

        // BullMQ: job de expiración a exactamente 15 minutos
        expect(mockExpiryQueue.add).toHaveBeenCalledWith(
          "expire",
          { reservationId: "res-999" },
          expect.objectContaining({ delay: 15 * 60 * 1000 }),
        );

        expect(result.id).toBe("res-999");
        expect(result.stripeClientSecret).toBe("pi_test_secret_xxx");
        expect(result.depositStatus).toBe(DepositStatus.PENDING);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it("rechaza pickupDate en el pasado — sin abrir transacción", async () => {
      const yesterday = new Date(Date.now() - ONE_DAY_MS).toISOString();

      await expect(
        service.create({ ...dto, pickupDate: yesterday }, makeUser()),
      ).rejects.toThrow(BadRequestException);

      // Validación antes de tocar la BD
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it("rechaza returnDate igual a pickupDate", async () => {
      await expect(
        service.create({ ...dto, returnDate: tomorrow }, makeUser()),
      ).rejects.toThrow(BadRequestException);

      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it("rechaza returnDate anterior a pickupDate", async () => {
      const dayAfterTomorrow = new Date(
        Date.now() + 2 * ONE_DAY_MS,
      ).toISOString();

      await expect(
        service.create(
          { ...dto, pickupDate: dayAfterTomorrow, returnDate: tomorrow },
          makeUser(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("lanza NotFoundException si el vehículo no existe — hace rollback", async () => {
      const qr = makeQueryRunner(null);
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await expect(service.create(dto, makeUser())).rejects.toThrow(
        NotFoundException,
      );
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });

    it("lanza ConflictException si hay reserva solapada — hace rollback", async () => {
      const qr = makeQueryRunner(makeVehicle(), 1); // 1 reserva solapada
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await expect(service.create(dto, makeUser())).rejects.toThrow(
        ConflictException,
      );
      expect(qr.rollbackTransaction).toHaveBeenCalled();
    });

    it("precio calculado server-side — Zero Trust (cliente no puede alterar el precio)", async () => {
      const vehicle = makeVehicle({ pricePerDayEurCents: 10000 }); // 100 €/día
      const qr = makeQueryRunner(vehicle, 0);
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await service.create(dto, makeUser());

      const saved = qr._repoMocks.createdData;
      expect(saved).toBeDefined();

      // totalPriceEurCents viene del servidor: pricePerDay × days
      expect(saved.totalPriceEurCents).toBe(20000);
      expect(saved.dailyRateEurCentsSnapshot).toBe(10000);
      expect(saved.subtotalEurCents).toBe(saved.totalPriceEurCents);
      expect(saved.totalDueNowEurCents).toBe(DEPOSIT_EUR_CENTS);
      expect(saved.pricingPolicyVersion).toBe("v1-extra-hour-grace");
      // Depósito siempre fijo en 1000 (10 €) — nunca del cliente
      expect(saved.depositEurCents).toBe(DEPOSIT_EUR_CENTS);
    });

    it("hace rollback si el save en BD falla — libera el queryRunner", async () => {
      const qr = makeQueryRunner(makeVehicle(), 0, true); // failOnSave
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await expect(service.create(dto, makeUser())).rejects.toThrow();
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // cancel()
  // ══════════════════════════════════════════════════════════════════════════

  describe("cancel()", () => {
    it("owner cancela su reserva PENDING_DEPOSIT — Stripe PI cancelado", async () => {
      const reservation = makeReservation();
      mockReservationsRepo.findOne.mockResolvedValue(reservation);
      mockReservationsRepo.save.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CANCELLED,
        depositStatus: DepositStatus.CANCELLED,
      });

      const result = await service.cancel("res-999", makeUser());

      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(result.depositStatus).toBe(DepositStatus.CANCELLED);
      // Stripe cancel is async fire-and-forget; verify it was called
      expect(mockStripeService.cancelPaymentIntent).toHaveBeenCalledWith(
        "pi_test_abc123",
      );
    });

    it("owner cancela reserva AWAITING_CAPTURE", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.AWAITING_CAPTURE,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);
      mockReservationsRepo.save.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CANCELLED,
        depositStatus: DepositStatus.CANCELLED,
      });

      const result = await service.cancel("res-999", makeUser());
      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(result.depositStatus).toBe(DepositStatus.CANCELLED);
    });

    it("owner cancela reserva CONFIRMED y registra refund exitoso", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.CONFIRMED,
        depositStatus: DepositStatus.CAPTURED,
        depositRefundStatus: DepositRefundStatus.NOT_REQUESTED,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);
      mockReservationsRepo.save.mockImplementation(async (value) => value);

      const result = await service.cancel("res-999", makeUser());

      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(mockStripeService.refundPaymentIntent).toHaveBeenCalledWith(
        "pi_test_abc123",
      );
      expect(mockReservationsRepo.update).toHaveBeenCalledWith(
        { id: "res-999" },
        expect.objectContaining({
          depositRefundStatus: DepositRefundStatus.SUCCEEDED,
        }),
      );
      expect(result.depositRefundStatus).toBe(DepositRefundStatus.SUCCEEDED);
    });

    it("owner cancela reserva CONFIRMED y deja refund failure visible si Stripe falla", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.CONFIRMED,
        depositStatus: DepositStatus.CAPTURED,
        depositRefundStatus: DepositRefundStatus.NOT_REQUESTED,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);
      mockReservationsRepo.save.mockImplementation(async (value) => value);
      mockStripeService.refundPaymentIntent.mockRejectedValueOnce(
        new Error("refund unavailable"),
      );

      const result = await service.cancel("res-999", makeUser());

      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(result.depositRefundStatus).toBe(DepositRefundStatus.FAILED);
      expect(result.depositRefundFailureReason).toBe("refund unavailable");
      expect(mockReservationsRepo.update).toHaveBeenCalledWith(
        { id: "res-999" },
        expect.objectContaining({
          depositRefundStatus: DepositRefundStatus.FAILED,
          depositRefundFailureReason: "refund unavailable",
        }),
      );
    });

    it("OPERATOR no puede cancelar por endpoint customer", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.CONFIRMED,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(
        service.cancel("res-999", makeUser({ role: UserRole.OPERATOR })),
      ).rejects.toThrow(ForbiddenException);
      expect(mockReservationsRepo.findOne).not.toHaveBeenCalled();
    });

    it("ADMIN no puede cancelar por endpoint customer", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.CONFIRMED,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(
        service.cancel("res-999", makeUser({ role: UserRole.ADMIN })),
      ).rejects.toThrow(ForbiddenException);
      expect(mockReservationsRepo.findOne).not.toHaveBeenCalled();
    });

    it("USER no puede cancelar la reserva de otro — ForbiddenException", async () => {
      const reservation = makeReservation({ userId: "otro-user-999" });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(
        service.cancel("res-999", makeUser({ id: "user-123" })),
      ).rejects.toThrow(ForbiddenException);
    });

    it("USER no puede cancelar reserva IN_PROGRESS — BadRequestException", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.IN_PROGRESS,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(service.cancel("res-999", makeUser())).rejects.toThrow(
        BadRequestException,
      );
    });

    it("USER no puede cancelar reserva COMPLETED", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.COMPLETED,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(service.cancel("res-999", makeUser())).rejects.toThrow(
        BadRequestException,
      );
    });

    it("lanza NotFoundException para reserva inexistente", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(null);

      await expect(service.cancel("no-existe", makeUser())).rejects.toThrow(
        NotFoundException,
      );
    });

    it("no llama cancelPaymentIntent si stripePaymentIntentId es null", async () => {
      const reservation = makeReservation({ stripePaymentIntentId: null });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);
      mockReservationsRepo.save.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CANCELLED,
      });

      await service.cancel("res-999", makeUser());
      // Wait for any async fire-and-forget
      await new Promise((r) => setTimeout(r, 50));
      expect(mockStripeService.cancelPaymentIntent).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // complete()
  // ══════════════════════════════════════════════════════════════════════════

  describe("complete()", () => {
    it("reserva IN_PROGRESS → COMPLETED", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.IN_PROGRESS,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);
      mockReservationsRepo.save.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.COMPLETED,
      });

      const result = await service.complete("res-999");

      expect(result.status).toBe(ReservationStatus.COMPLETED);
      expect(mockReservationsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReservationStatus.COMPLETED }),
      );
    });

    it("lanza BadRequestException si estado es CONFIRMED (no IN_PROGRESS)", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.CONFIRMED,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(service.complete("res-999")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("lanza BadRequestException si estado es PENDING_DEPOSIT", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.PENDING_DEPOSIT,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(service.complete("res-999")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("lanza BadRequestException si estado es CANCELLED", async () => {
      const reservation = makeReservation({
        status: ReservationStatus.CANCELLED,
      });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(service.complete("res-999")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("lanza NotFoundException para reserva inexistente", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(null);

      await expect(service.complete("no-existe")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // findMy()
  // ══════════════════════════════════════════════════════════════════════════

  describe("findMy()", () => {
    it("USER recibe solo sus reservas — where tiene userId", async () => {
      const reservations = [
        makeReservation({
          qrCodeHash: "raw-hash-must-not-leak",
          ticketTokenVersion: 5,
          ticketRevokedAt: new Date("2026-01-01T00:00:00.000Z"),
        }),
      ];
      mockReservationsRepo.findAndCount.mockResolvedValue([reservations, 1]);

      const result = await service.findMy(makeUser());

      expect(mockReservationsRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-123" } }),
      );
      expect(result.data[0]).toEqual(
        expect.not.objectContaining({
          qrCodeHash: expect.anything(),
          ticketTokenVersion: expect.anything(),
          ticketRevokedAt: expect.anything(),
          stripeClientSecret: expect.anything(),
          stripePaymentIntentId: expect.anything(),
        }),
      );
      expect(JSON.stringify(result.data)).not.toContain("raw-hash-must-not-leak");
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it("OPERATOR no puede usar /reservations/my como backdoor", async () => {
      const reservations = [
        makeReservation(),
        makeReservation({ id: "res-888" }),
      ];
      mockReservationsRepo.findAndCount.mockResolvedValue([reservations, 2]);

      await expect(
        service.findMy(makeUser({ role: UserRole.OPERATOR })),
      ).rejects.toThrow(ForbiddenException);

      expect(mockReservationsRepo.findAndCount).not.toHaveBeenCalled();
    });

    it("ADMIN no puede usar /reservations/my como backdoor", async () => {
      mockReservationsRepo.findAndCount.mockResolvedValue([
        [makeReservation()],
        1,
      ]);

      await expect(
        service.findMy(makeUser({ role: UserRole.ADMIN })),
      ).rejects.toThrow(ForbiddenException);

      expect(mockReservationsRepo.findAndCount).not.toHaveBeenCalled();
    });

    it("paginación — skip y take calculados correctamente", async () => {
      mockReservationsRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findMy(makeUser(), { page: 3, limit: 10 });

      expect(mockReservationsRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // findById()
  // ══════════════════════════════════════════════════════════════════════════

  describe("findById()", () => {
    it("USER puede ver su propia reserva", async () => {
      const reservation = makeReservation({ userId: "user-123" });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      const result = await service.findById(
        "res-999",
        makeUser({ id: "user-123" }),
      );
      expect(result.id).toBe("res-999");
      expect(result).toEqual(
        expect.not.objectContaining({
          qrCodeHash: expect.anything(),
          ticketTokenVersion: expect.anything(),
          ticketRevokedAt: expect.anything(),
          stripeClientSecret: expect.anything(),
          stripePaymentIntentId: expect.anything(),
        }),
      );
    });

    it("USER no puede ver la reserva de otro — ForbiddenException", async () => {
      const reservation = makeReservation({ userId: "otro-user" });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(
        service.findById("res-999", makeUser({ id: "user-123" })),
      ).rejects.toThrow(ForbiddenException);
    });

    it("OPERATOR no puede leer reservas por endpoint customer", async () => {
      const reservation = makeReservation({ userId: "otro-user" });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(
        service.findById("res-999", makeUser({ role: UserRole.OPERATOR })),
      ).rejects.toThrow(ForbiddenException);
      expect(mockReservationsRepo.findOne).not.toHaveBeenCalled();
    });

    it("ADMIN no puede leer reservas por endpoint customer", async () => {
      const reservation = makeReservation({ userId: "otro-user" });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(
        service.findById("res-999", makeUser({ role: UserRole.ADMIN })),
      ).rejects.toThrow(ForbiddenException);
      expect(mockReservationsRepo.findOne).not.toHaveBeenCalled();
    });

    it("lanza NotFoundException si la reserva no existe", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(null);

      await expect(service.findById("no-existe", makeUser())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("issueTicketToken()", () => {
    it("issues a signed ticket only for the owning customer and confirmed reservation", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({
          status: ReservationStatus.CONFIRMED,
          depositStatus: DepositStatus.CAPTURED,
          ticketTokenVersion: 3,
        }),
      );

      const result = await service.issueTicketToken("res-999", makeUser());

      expect(result).toEqual({
        ticketToken: "signed-ticket-token",
        expiresAt: "2026-02-19T10:00:00.000Z",
      });
      expect(mockQrService.issueTicketToken).toHaveBeenCalledWith({
        reservationId: "res-999",
        userId: "user-123",
        ticketVersion: 3,
      });
    });

    it("forbids operators from issuing customer tickets", async () => {
      await expect(
        service.issueTicketToken(
          "res-999",
          makeUser({ role: UserRole.OPERATOR }),
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockReservationsRepo.findOne).not.toHaveBeenCalled();
      expect(mockQrService.issueTicketToken).not.toHaveBeenCalled();
    });

    it("forbids ticket issuance for another customer's reservation", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({
          userId: "other-user",
          status: ReservationStatus.CONFIRMED,
          depositStatus: DepositStatus.CAPTURED,
        }),
      );

      await expect(
        service.issueTicketToken("res-999", makeUser()),
      ).rejects.toThrow(ForbiddenException);

      expect(mockQrService.issueTicketToken).not.toHaveBeenCalled();
    });

    it("rejects ticket issuance before the reservation is confirmed", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({ status: ReservationStatus.AWAITING_CAPTURE }),
      );

      await expect(
        service.issueTicketToken("res-999", makeUser()),
      ).rejects.toThrow(ConflictException);

      expect(mockQrService.issueTicketToken).not.toHaveBeenCalled();
    });

    it("rejects ticket issuance after ticket revocation", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({
          status: ReservationStatus.CONFIRMED,
          depositStatus: DepositStatus.CAPTURED,
          ticketRevokedAt: new Date("2026-02-19T09:00:00.000Z"),
        }),
      );

      await expect(
        service.issueTicketToken("res-999", makeUser()),
      ).rejects.toThrow(ConflictException);

      expect(mockQrService.issueTicketToken).not.toHaveBeenCalled();
    });

    it("rejects ticket issuance when capture never succeeded", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({
          status: ReservationStatus.CONFIRMED,
          depositStatus: DepositStatus.FAILED,
          depositLastFailureReason: "capture failed",
        }),
      );

      await expect(
        service.issueTicketToken("res-999", makeUser()),
      ).rejects.toThrow(ConflictException);

      expect(mockQrService.issueTicketToken).not.toHaveBeenCalled();
    });
  });

  describe("getPaymentIntentRecovery()", () => {
    it("returns the minimal recovery payload for the owning customer in PENDING_DEPOSIT", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({
          status: ReservationStatus.PENDING_DEPOSIT,
          depositStatus: DepositStatus.PENDING,
          totalDueNowEurCents: 1000,
          currency: "EUR",
        }),
      );

      const result = await service.getPaymentIntentRecovery(
        "res-999",
        makeUser(),
      );

      expect(result).toEqual({
        reservationId: "res-999",
        clientSecret: "pi_test_secret_xxx",
        depositEurCents: DEPOSIT_EUR_CENTS,
        totalDueNowEurCents: 1000,
        currency: "EUR",
        depositPaymentStatus: DepositStatus.PENDING,
        expiresAt: null,
      });
      expect(result).toEqual(
        expect.not.objectContaining({
          stripePaymentIntentId: expect.anything(),
          vehicle: expect.anything(),
          user: expect.anything(),
          qrCodeHash: expect.anything(),
        }),
      );
    });

    it("forbids operators from using the customer recovery endpoint", async () => {
      await expect(
        service.getPaymentIntentRecovery(
          "res-999",
          makeUser({ role: UserRole.OPERATOR }),
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockReservationsRepo.findOne).not.toHaveBeenCalled();
    });

    it("forbids admins from using the customer recovery endpoint", async () => {
      await expect(
        service.getPaymentIntentRecovery(
          "res-999",
          makeUser({ role: UserRole.ADMIN }),
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockReservationsRepo.findOne).not.toHaveBeenCalled();
    });

    it("forbids recovery for another customer's reservation", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({ userId: "other-user" }),
      );

      await expect(
        service.getPaymentIntentRecovery("res-999", makeUser()),
      ).rejects.toThrow(ForbiddenException);
    });

    it("rejects recovery when the reservation is no longer PENDING_DEPOSIT", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({ status: ReservationStatus.AWAITING_CAPTURE }),
      );

      await expect(
        service.getPaymentIntentRecovery("res-999", makeUser()),
      ).rejects.toThrow(ConflictException);
    });

    it("rejects recovery when the payment intent cannot be restored safely", async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation({
          status: ReservationStatus.PENDING_DEPOSIT,
          depositStatus: DepositStatus.PENDING,
          stripeClientSecret: null,
        }),
      );

      await expect(
        service.getPaymentIntentRecovery("res-999", makeUser()),
      ).rejects.toThrow(ConflictException);
    });
  });
});
