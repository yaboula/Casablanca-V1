import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  PickupLocation,
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import {
  DocumentStatus,
  DocumentType,
} from "../../documents/reservation-document.entity";
import {
  Vehicle,
  VehicleCategory,
  VehicleStatus,
} from "../../vehicles/vehicle.entity";
import { QrService } from "../../qr/qr.service";
import { SseService } from "../../sse/sse.service";
import { AuditLog } from "../audit-log.entity";
import { OperatorDeliveryService } from "./operator-delivery.service";

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "vehicle-1",
    brand: "Dacia",
    model: "Duster",
    category: VehicleCategory.SUV,
    licensePlate: "CMN-123",
    imageUrl: "https://cdn.example.com/duster.jpg",
    status: VehicleStatus.RENTED,
    ...overrides,
  } as Vehicle;
}

function makeReservation(
  overrides: Partial<Reservation> = {},
): Reservation {
  const vehicle = makeVehicle();

  return {
    id: "res-1",
    userId: "user-1",
    vehicleId: vehicle.id,
    vehicle,
    pickupDate: new Date("2026-02-19T10:00:00.000Z"),
    returnDate: new Date("2026-02-22T10:00:00.000Z"),
    pickupLocation: PickupLocation.CMN_T1,
    totalDays: 3,
    totalPriceEurCents: 30000,
    depositEurCents: 1000,
    status: ReservationStatus.IN_PROGRESS,
    customerName: "Sara Client",
    customerPhone: "+212 612 345 678",
    stripePaymentIntentId: "pi_sensitive",
    stripeClientSecret: "secret_sensitive",
    qrCodeHash: "qr_sensitive",
    ticketTokenVersion: 0,
    ticketRevokedAt: null,
    documents: [
      {
        id: "doc-1",
        type: DocumentType.PASSPORT,
        status: DocumentStatus.APPROVED,
      },
    ],
    ...overrides,
  } as Reservation;
}

function makeQueryBuilder(result: Reservation | null) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result ? [result] : []),
    getOne: jest.fn().mockResolvedValue(result),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
}

describe("OperatorDeliveryService", () => {
  let service: OperatorDeliveryService;
  let reservationsRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };
  let vehiclesRepo: { update: jest.Mock };
  let sseService: { emitDeliveryUpdate: jest.Mock };
  let auditLogRepo: { create: jest.Mock; save: jest.Mock };
  let qrService: { verifyTicketToken: jest.Mock };

  beforeEach(async () => {
    reservationsRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };
    vehiclesRepo = { update: jest.fn() };
    sseService = { emitDeliveryUpdate: jest.fn() };
    qrService = { verifyTicketToken: jest.fn() };
    auditLogRepo = {
      create: jest.fn((input) => input),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorDeliveryService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: reservationsRepo,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: vehiclesRepo,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: auditLogRepo,
        },
        {
          provide: QrService,
          useValue: qrService,
        },
        {
          provide: SseService,
          useValue: sseService,
        },
      ],
    }).compile();

    service = module.get(OperatorDeliveryService);
  });

  it("returns stable delivery detail for lifecycle statuses with minimized data", async () => {
    const reservation = makeReservation({
      status: ReservationStatus.COMPLETED,
    });
    const qb = makeQueryBuilder(reservation);
    reservationsRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getDeliveryDetail("res-1");

    expect(qb.where).toHaveBeenCalledWith("r.id = :reservationId", {
      reservationId: "res-1",
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      "r.status IN (:...statuses)",
      expect.objectContaining({
        statuses: [
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
          ReservationStatus.COMPLETED,
        ],
      }),
    );
    expect(result.status).toBe(ReservationStatus.COMPLETED);
    expect(JSON.stringify(result)).not.toContain("pi_sensitive");
    expect(JSON.stringify(result)).not.toContain("qr_sensitive");
  });

  it("throws not found when delivery detail is outside supported lifecycle states", async () => {
    reservationsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(null));

    await expect(service.getDeliveryDetail("res-1")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("requires manual check-in reason and confirmations before mutation", async () => {
    await expect(
      service.manualCheckin("res-1", "operator-1", {
        reason: "Customer phone unavailable",
        identityConfirmed: true,
        documentsConfirmed: false,
      }),
    ).rejects.toThrow("Manual check-in requiere confirmar identidad");

    expect(reservationsRepo.findOne).not.toHaveBeenCalled();
    expect(auditLogRepo.save).not.toHaveBeenCalled();
  });

  it("audits successful manual check-in with reason and confirmation metadata", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({ status: ReservationStatus.CONFIRMED }),
    );
    reservationsRepo.save.mockImplementation(async (entity: Reservation) => ({
      ...entity,
    }));

    await service.manualCheckin("res-1", "operator-1", {
      reason: "Customer phone unavailable",
      identityConfirmed: true,
      documentsConfirmed: true,
    });

    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "MANUAL_CHECKIN",
        resourceType: "RESERVATION",
        reservationId: "res-1",
        operatorId: "operator-1",
        beforeStatus: ReservationStatus.CONFIRMED,
        afterStatus: ReservationStatus.IN_PROGRESS,
        reason: "Customer phone unavailable",
        metadata: {
          identityConfirmed: true,
          documentsConfirmed: true,
        },
      }),
    );
  });

  it("audits successful QR scan", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({ status: ReservationStatus.CONFIRMED }),
    );
    reservationsRepo.save.mockImplementation(async (entity: Reservation) => ({
      ...entity,
    }));
    qrService.verifyTicketToken.mockReturnValue({
      valid: true,
      payload: {
        typ: "reservation-ticket",
        reservationId: "res-1",
        userId: "user-1",
        ticketVersion: 0,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
    });

    await service.scanQr("res-1", "valid-ticket-token", "operator-1");

    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "QR_SCAN_SUCCESS",
        resourceType: "RESERVATION",
        reservationId: "res-1",
        operatorId: "operator-1",
        beforeStatus: ReservationStatus.CONFIRMED,
        afterStatus: ReservationStatus.IN_PROGRESS,
        metadata: { ticketVerified: true },
      }),
    );
  });

  it("audits failed ticket scan without exposing token contents", async () => {
    qrService.verifyTicketToken.mockReturnValue({
      valid: false,
      reason: "BAD_SIGNATURE",
    });

    await expect(
      service.scanQr("res-1", "invalid-ticket-token", "operator-1"),
    ).rejects.toThrow(NotFoundException);

    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "QR_SCAN_FAILURE",
        reservationId: "res-1",
        operatorId: "operator-1",
        beforeStatus: null,
        afterStatus: null,
        reason: "Invalid ticket token: BAD_SIGNATURE.",
        metadata: { tokenProvided: true },
      }),
    );
    expect(JSON.stringify(auditLogRepo.create.mock.calls)).not.toContain(
      "invalid-ticket-token",
    );
  });

  it("rejects expired ticket tokens before reservation lookup", async () => {
    qrService.verifyTicketToken.mockReturnValue({
      valid: false,
      reason: "EXPIRED",
    });

    await expect(
      service.scanQr("res-1", "expired-ticket-token", "operator-1"),
    ).rejects.toThrow(NotFoundException);

    expect(reservationsRepo.findOne).not.toHaveBeenCalled();
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "QR_SCAN_FAILURE",
        reservationId: "res-1",
        operatorId: "operator-1",
        reason: "Invalid ticket token: EXPIRED.",
        metadata: { tokenProvided: true },
      }),
    );
  });

  it("rejects wrong-reservation ticket tokens safely", async () => {
    qrService.verifyTicketToken.mockReturnValue({
      valid: true,
      payload: {
        typ: "reservation-ticket",
        reservationId: "res-other",
        userId: "user-1",
        ticketVersion: 0,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
    });

    await expect(
      service.scanQr("res-1", "wrong-reservation-token", "operator-1"),
    ).rejects.toThrow(NotFoundException);

    expect(reservationsRepo.findOne).not.toHaveBeenCalled();
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "QR_SCAN_FAILURE",
        reservationId: "res-1",
        operatorId: "operator-1",
        beforeStatus: null,
        afterStatus: null,
        reason: "Ticket reservation mismatch.",
        metadata: { tokenReservationId: "res-other" },
      }),
    );
  });

  it("rejects revoked ticket tokens safely", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({
        status: ReservationStatus.CONFIRMED,
        ticketRevokedAt: new Date("2026-02-19T09:00:00.000Z"),
      }),
    );
    qrService.verifyTicketToken.mockReturnValue({
      valid: true,
      payload: {
        typ: "reservation-ticket",
        reservationId: "res-1",
        userId: "user-1",
        ticketVersion: 0,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
    });

    await expect(
      service.scanQr("res-1", "revoked-ticket-token", "operator-1"),
    ).rejects.toThrow(NotFoundException);

    expect(reservationsRepo.save).not.toHaveBeenCalled();
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "QR_SCAN_FAILURE",
        reservationId: "res-1",
        operatorId: "operator-1",
        beforeStatus: ReservationStatus.CONFIRMED,
        afterStatus: ReservationStatus.CONFIRMED,
        reason: "Ticket failed reservation state validation.",
        metadata: expect.objectContaining({
          ticketRevoked: true,
          reservationStatus: ReservationStatus.CONFIRMED,
        }),
      }),
    );
  });

  it("completes an in-progress delivery and returns a minimized action DTO", async () => {
    const reservation = makeReservation({
      status: ReservationStatus.IN_PROGRESS,
    });
    reservationsRepo.findOne.mockResolvedValue(reservation);
    reservationsRepo.save.mockImplementation(async (entity: Reservation) => ({
      ...entity,
    }));
    reservationsRepo.count.mockResolvedValue(0);

    const result = await service.completeDelivery("res-1", "operator-1");

    expect(reservationsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReservationStatus.COMPLETED }),
    );
    expect(vehiclesRepo.update).toHaveBeenCalledWith(
      { id: "vehicle-1" },
      { status: VehicleStatus.AVAILABLE },
    );
    expect(sseService.emitDeliveryUpdate).toHaveBeenCalledWith(
      "res-1",
      ReservationStatus.COMPLETED,
    );
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELIVERY_COMPLETED",
        resourceType: "RESERVATION",
        reservationId: "res-1",
        operatorId: "operator-1",
        beforeStatus: ReservationStatus.IN_PROGRESS,
        afterStatus: ReservationStatus.COMPLETED,
      }),
    );
    expect(result.status).toBe(ReservationStatus.COMPLETED);
    expect(JSON.stringify(result)).not.toContain("Sara Client");
    expect(JSON.stringify(result)).not.toContain("pi_sensitive");
  });

  it("returns conflict for invalid completion transitions", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({ status: ReservationStatus.CONFIRMED }),
    );

    await expect(service.completeDelivery("res-1", "operator-1")).rejects.toThrow(
      ConflictException,
    );
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELIVERY_COMPLETION_FAILED",
        reservationId: "res-1",
        operatorId: "operator-1",
        beforeStatus: ReservationStatus.CONFIRMED,
        afterStatus: ReservationStatus.CONFIRMED,
      }),
    );
    expect(reservationsRepo.save).not.toHaveBeenCalled();
  });
});
