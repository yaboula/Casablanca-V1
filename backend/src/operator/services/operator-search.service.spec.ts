import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { PickupLocation, Reservation, ReservationStatus } from "../../reservations/reservation.entity";
import {
  Vehicle,
  VehicleCategory,
} from "../../vehicles/vehicle.entity";
import { OperatorSearchService } from "./operator-search.service";

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "vehicle-1",
    brand: "Dacia",
    model: "Duster",
    category: VehicleCategory.SUV,
    licensePlate: "CMN-123",
    imageUrl: "https://cdn.example.com/duster.jpg",
    ...overrides,
  } as Vehicle;
}

function makeReservation(
  overrides: Partial<Reservation> = {},
): Reservation {
  return {
    id: "res-1",
    status: ReservationStatus.CONFIRMED,
    customerName: "Sara Client",
    customerPhone: "+212 612 345 678",
    pickupDate: new Date("2026-02-19T10:00:00.000Z"),
    returnDate: new Date("2026-02-22T10:00:00.000Z"),
    pickupLocation: PickupLocation.CMN_T1,
    createdAt: new Date("2026-02-18T10:00:00.000Z"),
    stripePaymentIntentId: "pi_sensitive",
    stripeClientSecret: "pi_secret",
    qrCodeHash: "qr_hash",
    vehicle: makeVehicle(),
    ...overrides,
  } as Reservation;
}

describe("OperatorSearchService", () => {
  let service: OperatorSearchService;
  let repo: { createQueryBuilder: jest.Mock };
  let qb: {
    leftJoinAndSelect: jest.Mock;
    select: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[makeReservation()], 1]),
    };

    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorSearchService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get(OperatorSearchService);
  });

  it("rejects search terms shorter than two characters", async () => {
    await expect(service.search("a")).rejects.toThrow(BadRequestException);
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("clamps pagination inputs and returns masked/minimized results", async () => {
    const result = await service.search(" Sara ", 0, 500);

    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(100);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.total).toBe(1);
    expect(result.data[0].customerPhoneMasked).toBe("****5678");

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("+212 612 345 678");
    expect(serialized).not.toContain("pi_sensitive");
    expect(serialized).not.toContain("pi_secret");
    expect(serialized).not.toContain("qr_hash");
  });

  it("selects only the operator-safe reservation and vehicle fields", async () => {
    await service.search("Sara", 2, 20);

    expect(qb.select).toHaveBeenCalledWith([
      "r.id",
      "r.status",
      "r.customerName",
      "r.customerPhone",
      "r.pickupDate",
      "r.returnDate",
      "r.pickupLocation",
      "r.createdAt",
      "v.id",
      "v.brand",
      "v.model",
      "v.category",
      "v.licensePlate",
      "v.imageUrl",
    ]);
    expect(qb.skip).toHaveBeenCalledWith(20);
    expect(qb.take).toHaveBeenCalledWith(20);
  });
});
