import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  DepositStatus,
  DeskCollectionMethod,
  DeskCollectionStatus,
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
import { S3Service } from "../../s3/s3.service";
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
    depositStatus: DepositStatus.CAPTURED,
    deskCollectionStatus: DeskCollectionStatus.RECEIVED,
    deskCollectionMethod: DeskCollectionMethod.CASH,
    deskCollectionReference: "RCPT-001",
    deskCollectionReceivedAt: new Date("2026-02-19T09:00:00.000Z"),
    deskCollectionAmountEurCents: 29000,
    currency: "EUR",
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
        fileKey: "docs/user-1/res-1/PASSPORT-1.jpg",
        rejectionReason: null,
        createdAt: new Date("2026-02-18T10:00:00.000Z"),
      },
      {
        id: "doc-2",
        type: DocumentType.DRIVING_LICENSE,
        status: DocumentStatus.APPROVED,
        fileKey: "docs/user-1/res-1/DRIVING_LICENSE-1.jpg",
        rejectionReason: null,
        createdAt: new Date("2026-02-18T10:05:00.000Z"),
      },
    ],
    ...overrides,
  } as Reservation;
}

function makeQueryBuilder(result: Reservation | null) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
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
  let s3Service: {
    isBypassStorageEnabled: jest.Mock;
    generatePresignedRead: jest.Mock;
  };
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
    s3Service = {
      isBypassStorageEnabled: jest.fn().mockReturnValue(false),
      generatePresignedRead: jest.fn().mockResolvedValue("https://read.test/doc-1"),
    };
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
        {
          provide: S3Service,
          useValue: s3Service,
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
    expect(qb.select).toHaveBeenCalledWith(
      expect.arrayContaining(["r.depositStatus", "r.currency"]),
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      "r.status IN (:...statuses)",
      expect.objectContaining({
        statuses: [
          ReservationStatus.PENDING_DEPOSIT,
          ReservationStatus.AWAITING_CAPTURE,
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
          ReservationStatus.COMPLETED,
          ReservationStatus.CANCELLED,
        ],
      }),
    );
    expect(result.status).toBe(ReservationStatus.COMPLETED);
    expect(result.depositStatus).toBe(DepositStatus.CAPTURED);
    expect(result.currency).toBe("EUR");
    expect(JSON.stringify(result)).not.toContain("pi_sensitive");
    expect(JSON.stringify(result)).not.toContain("qr_sensitive");
    expect(result.documents[0].fileUrl).toBe("https://read.test/doc-1");
  });

  it("returns the complete minimized operator case ledger without a pickup-date window", async () => {
    const qb = makeQueryBuilder(
      makeReservation({
        status: ReservationStatus.CANCELLED,
        pickupDate: new Date("2026-08-14T08:00:00.000Z"),
      }),
    );
    reservationsRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getDeliveries("2026-06-13");

    expect(qb.where).toHaveBeenCalledWith(
      "r.status IN (:...statuses)",
      expect.objectContaining({
        statuses: [
          ReservationStatus.PENDING_DEPOSIT,
          ReservationStatus.AWAITING_CAPTURE,
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
          ReservationStatus.COMPLETED,
          ReservationStatus.CANCELLED,
        ],
      }),
    );
    expect(qb.orderBy).toHaveBeenCalledWith(
      expect.stringContaining("DATE(r.pickupDate"),
      "ASC",
    );
    expect(qb.setParameters).toHaveBeenCalledWith({
      businessDate: "2026-06-13",
      documentVerificationStatuses: [
        DocumentStatus.PENDING_REVIEW,
        DocumentStatus.REJECTED,
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(ReservationStatus.CANCELLED);
  });

  it("includes far-future confirmed pickups in the operator case ledger", async () => {
    const qb = makeQueryBuilder(
      makeReservation({
        status: ReservationStatus.CONFIRMED,
        pickupDate: new Date("2026-10-14T08:00:00.000Z"),
      }),
    );
    reservationsRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getDeliveries("2026-06-13");

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(ReservationStatus.CONFIRMED);
  });

  it("returns dashboard stats for the same complete status set as the ledger", async () => {
    const qb = makeQueryBuilder(null);
    qb.getRawMany.mockResolvedValue([
      { status: ReservationStatus.PENDING_DEPOSIT, count: "2" },
      { status: ReservationStatus.AWAITING_CAPTURE, count: "1" },
      { status: ReservationStatus.CONFIRMED, count: "3" },
      { status: ReservationStatus.IN_PROGRESS, count: "4" },
      { status: ReservationStatus.COMPLETED, count: "5" },
      { status: ReservationStatus.CANCELLED, count: "6" },
    ]);
    reservationsRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getDeliveryStats("2026-06-13");

    expect(qb.where).toHaveBeenCalledWith(
      "r.status IN (:...statuses)",
      expect.objectContaining({
        statuses: [
          ReservationStatus.PENDING_DEPOSIT,
          ReservationStatus.AWAITING_CAPTURE,
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
          ReservationStatus.COMPLETED,
          ReservationStatus.CANCELLED,
        ],
      }),
    );
    expect(result).toEqual({
      date: "2026-06-13",
      total: 21,
      pendingDeposit: 2,
      awaitingCapture: 1,
      confirmed: 3,
      inProgress: 4,
      completed: 5,
      cancelled: 6,
    });
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
        manualCode: "RES1CODE",
        identityConfirmed: true,
        documentsConfirmed: false,
      }),
    ).rejects.toThrow("Manual check-in requiere confirmar identidad");

    expect(reservationsRepo.findOne).not.toHaveBeenCalled();
    expect(auditLogRepo.save).not.toHaveBeenCalled();
  });

  it("rejects manual check-in when the visible reservation code does not match", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({ id: "c1160845-8aae-4de2-8810-cac8b91cb8cb" }),
    );

    await expect(
      service.manualCheckin(
        "c1160845-8aae-4de2-8810-cac8b91cb8cb",
        "operator-1",
        {
          reason: "Camera unavailable at desk",
          manualCode: "WRONG123",
          identityConfirmed: true,
          documentsConfirmed: true,
        },
      ),
    ).rejects.toThrow("codigo manual");

    expect(reservationsRepo.save).not.toHaveBeenCalled();
    expect(auditLogRepo.save).not.toHaveBeenCalled();
  });

  it("rejects manual check-in when backend documents are not approved", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({
        id: "c1160845-8aae-4de2-8810-cac8b91cb8cb",
        status: ReservationStatus.CONFIRMED,
        documents: [
          {
            id: "doc-1",
            type: DocumentType.PASSPORT,
            status: DocumentStatus.APPROVED,
            fileKey: "docs/user-1/res-1/PASSPORT-1.jpg",
            rejectionReason: null,
            createdAt: new Date("2026-02-18T10:00:00.000Z"),
          } as NonNullable<Reservation["documents"]>[number],
          {
            id: "doc-2",
            type: DocumentType.DRIVING_LICENSE,
            status: DocumentStatus.PENDING_REVIEW,
            fileKey: "docs/user-1/res-1/DRIVING_LICENSE-1.jpg",
            rejectionReason: null,
            createdAt: new Date("2026-02-18T10:05:00.000Z"),
          } as NonNullable<Reservation["documents"]>[number],
        ],
      }),
    );

    await expect(
      service.manualCheckin(
        "c1160845-8aae-4de2-8810-cac8b91cb8cb",
        "operator-1",
        {
          reason: "Camera unavailable at desk",
          manualCode: "C1160845",
          identityConfirmed: true,
          documentsConfirmed: true,
        },
      ),
    ).rejects.toThrow("documentos pendientes");

    expect(reservationsRepo.save).not.toHaveBeenCalled();
  });

  it("rejects manual check-in when deposit capture is not secured", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({
        id: "c1160845-8aae-4de2-8810-cac8b91cb8cb",
        status: ReservationStatus.CONFIRMED,
        depositStatus: DepositStatus.PENDING,
      }),
    );

    await expect(
      service.manualCheckin(
        "c1160845-8aae-4de2-8810-cac8b91cb8cb",
        "operator-1",
        {
          reason: "Camera unavailable at desk",
          manualCode: "C1160845",
          identityConfirmed: true,
          documentsConfirmed: true,
        },
      ),
    ).rejects.toThrow("deposito no capturado");

    expect(reservationsRepo.save).not.toHaveBeenCalled();
  });

  it("rejects handoff when desk collection is still pending", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({
        status: ReservationStatus.CONFIRMED,
        deskCollectionStatus: DeskCollectionStatus.PENDING,
        deskCollectionMethod: null,
        deskCollectionReference: null,
        deskCollectionReceivedAt: null,
        deskCollectionAmountEurCents: null,
      }),
    );

    await expect(
      service.confirmHandoff("res-1", "operator-1", {
        identityConfirmed: true,
        documentsConfirmed: true,
      }),
    ).rejects.toThrow("cobro pendiente");
  });

  it("records desk collection with method and receipt reference", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({
        status: ReservationStatus.CONFIRMED,
        deskCollectionStatus: DeskCollectionStatus.PENDING,
        deskCollectionMethod: null,
        deskCollectionReference: null,
        deskCollectionReceivedAt: null,
        deskCollectionAmountEurCents: null,
      }),
    );
    reservationsRepo.save.mockImplementation(async (entity: Reservation) => ({
      ...entity,
    }));

    const result = await service.recordDeskCollection("res-1", "operator-1", {
      method: DeskCollectionMethod.TPE,
      receiptReference: "TPE-77881",
    });

    expect(reservationsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        deskCollectionStatus: DeskCollectionStatus.RECEIVED,
        deskCollectionMethod: DeskCollectionMethod.TPE,
        deskCollectionReference: "TPE-77881",
        deskCollectionAmountEurCents: 29000,
      }),
    );
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DESK_COLLECTION_RECORDED",
        reservationId: "res-1",
        operatorId: "operator-1",
        metadata: expect.objectContaining({
          amountEurCents: 29000,
          method: DeskCollectionMethod.TPE,
          receiptReference: "TPE-77881",
        }),
      }),
    );
    expect(result.status).toBe(ReservationStatus.CONFIRMED);
  });

  it("audits successful manual check-in with reason and confirmation metadata", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({
        id: "c1160845-8aae-4de2-8810-cac8b91cb8cb",
        status: ReservationStatus.CONFIRMED,
      }),
    );
    reservationsRepo.save.mockImplementation(async (entity: Reservation) => ({
      ...entity,
    }));

    await service.manualCheckin("c1160845-8aae-4de2-8810-cac8b91cb8cb", "operator-1", {
      reason: "Customer phone unavailable",
      manualCode: "C116 0845",
      identityConfirmed: true,
      documentsConfirmed: true,
    });

    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "MANUAL_CHECKIN",
        resourceType: "RESERVATION",
        reservationId: "c1160845-8aae-4de2-8810-cac8b91cb8cb",
        operatorId: "operator-1",
        beforeStatus: ReservationStatus.CONFIRMED,
        afterStatus: ReservationStatus.IN_PROGRESS,
        reason: "Customer phone unavailable",
        metadata: {
          identityConfirmed: true,
          documentsConfirmed: true,
          manualCodeMatched: true,
        },
      }),
    );
  });

  it("audits successful QR scan as case lookup without changing reservation state", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({ status: ReservationStatus.CONFIRMED }),
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

    const result = await service.scanQr(
      "res-1",
      "valid-ticket-token",
      "operator-1",
    );

    expect(result).toEqual({
      reservationId: "res-1",
      status: ReservationStatus.CONFIRMED,
      ticketValid: true,
      publicStatus: ReservationStatus.CONFIRMED,
    });
    expect(reservationsRepo.save).not.toHaveBeenCalled();
    expect(vehiclesRepo.update).not.toHaveBeenCalled();
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "QR_SCAN_SUCCESS",
        resourceType: "RESERVATION",
        reservationId: "res-1",
        operatorId: "operator-1",
        beforeStatus: ReservationStatus.CONFIRMED,
        afterStatus: ReservationStatus.CONFIRMED,
        metadata: { ticketVerified: true, purpose: "CASE_LOOKUP" },
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
        metadata: { tokenProvided: true, purpose: "CASE_LOOKUP" },
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
        metadata: { tokenProvided: true, purpose: "CASE_LOOKUP" },
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
        metadata: {
          tokenReservationId: "res-other",
          purpose: "CASE_LOOKUP",
        },
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
          depositCaptured: true,
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
