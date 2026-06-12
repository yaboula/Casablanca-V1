import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { of } from "rxjs";
import { Reservation } from "../reservations/reservation.entity";
import { UserRole } from "../users/user.entity";
import { SseController } from "./sse.controller";
import { SseService } from "./sse.service";

describe("SseController", () => {
  let controller: SseController;
  let reservationsRepo: { findOne: jest.Mock };
  let sseService: {
    subscribeToReservation: jest.Mock;
    subscribeOperatorChat: jest.Mock;
    subscribeOperatorDeliveries: jest.Mock;
    subscribeOperatorDocuments: jest.Mock;
  };

  beforeEach(async () => {
    reservationsRepo = {
      findOne: jest.fn(),
    };
    sseService = {
      subscribeToReservation: jest.fn(() =>
        of({
          data: {
            type: "reservation.status.updated",
            resourceId: "res-1",
            status: "CONFIRMED",
            updatedAt: "2026-06-12T17:00:00.000Z",
          },
        }),
      ),
      subscribeOperatorChat: jest.fn(() => of({ data: { type: "legacy" } })),
      subscribeOperatorDeliveries: jest.fn(() =>
        of({
          data: {
            type: "operator.deliveries.invalidated",
            resourceId: "res-1",
            updatedAt: "2026-06-12T17:00:00.000Z",
          },
        }),
      ),
      subscribeOperatorDocuments: jest.fn(() =>
        of({
          data: {
            type: "operator.documents.invalidated",
            resourceId: "res-1",
            updatedAt: "2026-06-12T17:00:00.000Z",
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SseController],
      providers: [
        { provide: SseService, useValue: sseService },
        { provide: getRepositoryToken(Reservation), useValue: reservationsRepo },
      ],
    }).compile();

    controller = module.get(SseController);
  });

  it("allows only the owning user on customer reservation SSE", async () => {
    reservationsRepo.findOne.mockResolvedValue({ id: "res-1", userId: "user-1" });

    const stream = await controller.subscribeReservation("res-1", {
      id: "user-1",
      role: UserRole.USER,
    } as any);

    await expect(stream.toPromise()).resolves.toEqual({
      data: JSON.stringify({
        type: "reservation.status.updated",
        resourceId: "res-1",
        status: "CONFIRMED",
        updatedAt: "2026-06-12T17:00:00.000Z",
      }),
    });
  });

  it("rejects staff access to the customer reservation stream", async () => {
    await expect(
      controller.subscribeReservation("res-1", {
        id: "operator-1",
        role: UserRole.OPERATOR,
      } as any),
    ).rejects.toThrow(ForbiddenException);

    expect(reservationsRepo.findOne).not.toHaveBeenCalled();
  });

  it("rejects non-owning users on the customer reservation stream", async () => {
    reservationsRepo.findOne.mockResolvedValue({ id: "res-1", userId: "user-2" });

    await expect(
      controller.subscribeReservation("res-1", {
        id: "user-1",
        role: UserRole.USER,
      } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it("returns not found when the reservation does not exist", async () => {
    reservationsRepo.findOne.mockResolvedValue(null);

    await expect(
      controller.subscribeReservation("res-1", {
        id: "user-1",
        role: UserRole.USER,
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it("serializes operator delivery invalidation events without PII", async () => {
    const stream = controller.subscribeOperatorDeliveries();

    await expect(stream.toPromise()).resolves.toEqual({
      data: JSON.stringify({
        type: "operator.deliveries.invalidated",
        resourceId: "res-1",
        updatedAt: "2026-06-12T17:00:00.000Z",
      }),
    });
  });

  it("serializes operator document invalidation events without PII", async () => {
    const stream = controller.subscribeOperatorDocuments();

    await expect(stream.toPromise()).resolves.toEqual({
      data: JSON.stringify({
        type: "operator.documents.invalidated",
        resourceId: "res-1",
        updatedAt: "2026-06-12T17:00:00.000Z",
      }),
    });
  });
});
