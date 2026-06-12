import { Test, TestingModule } from "@nestjs/testing";
import { OperatorController } from "./operator.controller";
import { OperatorService } from "./operator.service";
import { PickupLocation, ReservationStatus } from "../reservations/reservation.entity";
import { UserRole } from "../users/user.entity";

describe("OperatorController", () => {
  let controller: OperatorController;
  let operatorService: {
    getDeliveryDetail: jest.Mock;
    manualCheckin: jest.Mock;
    scanQr: jest.Mock;
    completeDelivery: jest.Mock;
    search: jest.Mock;
    getPendingDocuments: jest.Mock;
  };

  beforeEach(async () => {
    operatorService = {
      getDeliveryDetail: jest.fn().mockResolvedValue({
        id: "res-1",
        status: ReservationStatus.CONFIRMED,
      }),
      manualCheckin: jest.fn().mockResolvedValue({
        id: "res-1",
        status: ReservationStatus.IN_PROGRESS,
        vehicleId: "vehicle-1",
        pickupLocation: PickupLocation.CMN_T1,
      }),
      scanQr: jest.fn().mockResolvedValue({
        id: "res-1",
        status: ReservationStatus.IN_PROGRESS,
        vehicleId: "vehicle-1",
        pickupLocation: PickupLocation.CMN_T1,
      }),
      completeDelivery: jest.fn().mockResolvedValue({
        id: "res-1",
        status: ReservationStatus.COMPLETED,
        vehicleId: "vehicle-1",
        pickupLocation: PickupLocation.CMN_T1,
      }),
      search: jest.fn().mockResolvedValue({
        data: [
          {
            id: "res-1",
            status: ReservationStatus.CONFIRMED,
            customerName: "Sara Client",
            customerPhoneMasked: "****5678",
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      }),
      getPendingDocuments: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OperatorController],
      providers: [{ provide: OperatorService, useValue: operatorService }],
    }).compile();

    controller = module.get(OperatorController);
  });

  it("wraps delivery detail in a data envelope", async () => {
    await expect(controller.getDeliveryDetail("res-1")).resolves.toEqual({
      data: {
        id: "res-1",
        status: ReservationStatus.CONFIRMED,
      },
    });
  });

  it("delegates manual check-in with the actor id and returns a stable message", async () => {
    const result = await controller.manualCheckin(
      "res-1",
      {
        reason: "Identity checked at desk",
        identityConfirmed: true,
        documentsConfirmed: true,
      },
      { id: "operator-1", role: UserRole.OPERATOR } as any,
    );

    expect(operatorService.manualCheckin).toHaveBeenCalledWith(
      "res-1",
      "operator-1",
      {
        reason: "Identity checked at desk",
        identityConfirmed: true,
        documentsConfirmed: true,
      },
    );
    expect(result).toEqual({
      data: {
        id: "res-1",
        status: ReservationStatus.IN_PROGRESS,
        vehicleId: "vehicle-1",
        pickupLocation: PickupLocation.CMN_T1,
      },
      message: "Check-in confirmado.",
    });
  });

  it("delegates signed ticket scans without exposing token material in the response", async () => {
    const result = await controller.scanQr(
      "res-1",
      { ticketToken: "signed-ticket-token" },
      { id: "operator-1", role: UserRole.OPERATOR } as any,
    );

    expect(operatorService.scanQr).toHaveBeenCalledWith(
      "res-1",
      "signed-ticket-token",
      "operator-1",
    );
    expect(JSON.stringify(result)).not.toContain("signed-ticket-token");
    expect(result.message).toBe("Entrega confirmada.");
  });

  it("passes search through as minimized operator search DTOs", async () => {
    const result = await controller.search("Sara");
    const serialized = JSON.stringify(result);

    expect(operatorService.search).toHaveBeenCalledWith("Sara");
    expect(result.data[0].customerPhoneMasked).toBe("****5678");
    expect(serialized).not.toContain("+212 612 345 678");
    expect(serialized).not.toContain("stripeClientSecret");
  });
});
