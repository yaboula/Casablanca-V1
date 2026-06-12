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

  beforeEach(async () => {
    reservationsRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };
    vehiclesRepo = { update: jest.fn() };
    sseService = { emitDeliveryUpdate: jest.fn() };

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
          provide: QrService,
          useValue: { verifyHash: jest.fn() },
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

  it("completes an in-progress delivery and returns a minimized action DTO", async () => {
    const reservation = makeReservation({
      status: ReservationStatus.IN_PROGRESS,
    });
    reservationsRepo.findOne.mockResolvedValue(reservation);
    reservationsRepo.save.mockImplementation(async (entity: Reservation) => ({
      ...entity,
    }));
    reservationsRepo.count.mockResolvedValue(0);

    const result = await service.completeDelivery("res-1");

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
    expect(result.status).toBe(ReservationStatus.COMPLETED);
    expect(JSON.stringify(result)).not.toContain("Sara Client");
    expect(JSON.stringify(result)).not.toContain("pi_sensitive");
  });

  it("returns conflict for invalid completion transitions", async () => {
    reservationsRepo.findOne.mockResolvedValue(
      makeReservation({ status: ReservationStatus.CONFIRMED }),
    );

    await expect(service.completeDelivery("res-1")).rejects.toThrow(
      ConflictException,
    );
    expect(reservationsRepo.save).not.toHaveBeenCalled();
  });
});
