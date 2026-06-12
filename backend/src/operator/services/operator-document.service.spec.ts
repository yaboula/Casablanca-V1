import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import {
  DocumentStatus,
  DocumentType,
  ReservationDocument,
} from "../../documents/reservation-document.entity";
import {
  DepositRefundStatus,
  DepositStatus,
  PickupLocation,
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import { QrService } from "../../qr/qr.service";
import { S3Service } from "../../s3/s3.service";
import { SseService } from "../../sse/sse.service";
import { AuditLog } from "../audit-log.entity";
import { OperatorDocumentService } from "./operator-document.service";

function makeDocument(
  overrides: Partial<ReservationDocument> = {},
): ReservationDocument {
  return {
    id: "doc-1",
    userId: "user-1",
    reservationId: "res-1",
    type: DocumentType.PASSPORT,
    fileKey: "docs/user-1/passport.jpg",
    status: DocumentStatus.PENDING_REVIEW,
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date("2026-02-19T10:00:00.000Z"),
    ...overrides,
  } as ReservationDocument;
}

function makeReservation(
  overrides: Partial<Reservation> = {},
): Reservation {
  return {
    id: "res-1",
    userId: "user-1",
    vehicleId: "vehicle-1",
    pickupDate: new Date("2026-02-20T10:00:00.000Z"),
    returnDate: new Date("2026-02-22T10:00:00.000Z"),
    pickupLocation: PickupLocation.CMN_T1,
    totalDays: 2,
    totalPriceEurCents: 20000,
    depositEurCents: 1000,
    depositStatus: DepositStatus.PENDING,
    depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
    status: ReservationStatus.PENDING_DEPOSIT,
    qrCodeHash: null,
    ...overrides,
  } as Reservation;
}

function makeReservationQueryBuilder(reservation: Reservation | null) {
  return {
    where: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(reservation),
  };
}

describe("OperatorDocumentService concurrency", () => {
  let service: OperatorDocumentService;
  let dataSource: { transaction: jest.Mock };
  let docsRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  };
  let reservationRepo: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
  };
  let captureQueue: { add: jest.Mock };
  let cleanupQueue: { add: jest.Mock };
  let auditLogRepo: { create: jest.Mock; save: jest.Mock };
  let sseService: {
    emitDocumentStatus: jest.Mock;
    emitReservationStatus: jest.Mock;
    emitOperatorDocumentQueueInvalidation: jest.Mock;
  };

  beforeEach(async () => {
    docsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(async (doc: ReservationDocument) => doc),
    };
    reservationRepo = {
      createQueryBuilder: jest.fn(),
      save: jest.fn(async (reservation: Reservation) => reservation),
    };
    dataSource = {
      transaction: jest.fn(async (cb) =>
        cb({
          getRepository: (entity: unknown) => {
            if (entity === ReservationDocument) return docsRepo;
            if (entity === Reservation) return reservationRepo;
            return {};
          },
        }),
      ),
    };
    captureQueue = { add: jest.fn() };
    cleanupQueue = { add: jest.fn() };
    auditLogRepo = {
      create: jest.fn((input) => input),
      save: jest.fn(),
    };
    sseService = {
      emitDocumentStatus: jest.fn(),
      emitReservationStatus: jest.fn(),
      emitOperatorDocumentQueueInvalidation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorDocumentService,
        {
          provide: getRepositoryToken(ReservationDocument),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: auditLogRepo,
        },
        {
          provide: getQueueToken("capture-stripe"),
          useValue: captureQueue,
        },
        {
          provide: getQueueToken("document-cleanup"),
          useValue: cleanupQueue,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: QrService,
          useValue: { generateHash: jest.fn(() => "qr-hash") },
        },
        {
          provide: SseService,
          useValue: sseService,
        },
        {
          provide: S3Service,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(OperatorDocumentService);
  });

  it("approves with row locks and enqueues capture exactly once when reservation transitions", async () => {
    const document = makeDocument();
    const reservation = makeReservation();
    const reservationQb = makeReservationQueryBuilder(reservation);
    docsRepo.findOne.mockResolvedValue(document);
    docsRepo.find.mockResolvedValue([
      makeDocument({ type: DocumentType.PASSPORT, status: DocumentStatus.APPROVED }),
      makeDocument({ id: "doc-2", type: DocumentType.DRIVING_LICENSE, status: DocumentStatus.APPROVED }),
    ]);
    reservationRepo.createQueryBuilder.mockReturnValue(reservationQb);

    await service.approveDocument("doc-1", "operator-1");

    expect(docsRepo.findOne).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      lock: { mode: "pessimistic_write" },
    });
    expect(reservationQb.setLock).toHaveBeenCalledWith("pessimistic_write");
    expect(reservationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ReservationStatus.AWAITING_CAPTURE,
        depositStatus: DepositStatus.CAPTURE_QUEUED,
      }),
    );
    expect(captureQueue.add).toHaveBeenCalledTimes(1);
    expect(sseService.emitOperatorDocumentQueueInvalidation).toHaveBeenCalledWith(
      "res-1",
    );
  });

  it("does not enqueue capture again when another transaction already moved reservation", async () => {
    const document = makeDocument();
    const reservation = makeReservation({
      status: ReservationStatus.AWAITING_CAPTURE,
    });
    docsRepo.findOne.mockResolvedValue(document);
    docsRepo.find.mockResolvedValue([
      makeDocument({ type: DocumentType.PASSPORT, status: DocumentStatus.APPROVED }),
      makeDocument({ id: "doc-2", type: DocumentType.DRIVING_LICENSE, status: DocumentStatus.APPROVED }),
    ]);
    reservationRepo.createQueryBuilder.mockReturnValue(
      makeReservationQueryBuilder(reservation),
    );

    const result = await service.approveDocument("doc-1", "operator-1");

    expect(captureQueue.add).not.toHaveBeenCalled();
    expect(result.reservationStatus).toBe(ReservationStatus.AWAITING_CAPTURE);
  });

  it("rejects inside a transaction with a pessimistic document lock", async () => {
    const document = makeDocument();
    docsRepo.findOne.mockResolvedValue(document);

    await service.rejectDocument("doc-1", "Blurry document", "operator-1");

    expect(dataSource.transaction).toHaveBeenCalled();
    expect(docsRepo.findOne).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      lock: { mode: "pessimistic_write" },
    });
    expect(cleanupQueue.add).toHaveBeenCalledWith(
      "cleanup",
      { fileKey: "docs/user-1/passport.jpg", documentId: "doc-1" },
      expect.any(Object),
    );
    expect(sseService.emitOperatorDocumentQueueInvalidation).toHaveBeenCalledWith(
      "res-1",
    );
  });

  it("returns conflict for a reject racing after a prior decision", async () => {
    docsRepo.findOne.mockResolvedValue(
      makeDocument({ status: DocumentStatus.APPROVED }),
    );

    await expect(
      service.rejectDocument("doc-1", "Wrong document", "operator-1"),
    ).rejects.toThrow(ConflictException);

    expect(docsRepo.save).not.toHaveBeenCalled();
    expect(cleanupQueue.add).not.toHaveBeenCalled();
  });
});
