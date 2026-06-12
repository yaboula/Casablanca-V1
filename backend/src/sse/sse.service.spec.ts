import { firstValueFrom } from "rxjs";
import { take } from "rxjs/operators";
import { DocumentStatus } from "../documents/reservation-document.entity";
import { ReservationStatus } from "../reservations/reservation.entity";
import { SseService } from "./sse.service";

describe("SseService", () => {
  let service: SseService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new SseService();
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  it("emits normalized customer document events without sensitive fields", async () => {
    const eventPromise = firstValueFrom(
      service.subscribeToReservation("res-1").pipe(take(1)),
    );

    service.emitDocumentStatus("res-1", DocumentStatus.APPROVED);

    const event = await eventPromise;

    expect(event.data).toEqual({
      type: "reservation.document.updated",
      resourceId: "res-1",
      status: DocumentStatus.APPROVED,
      updatedAt: expect.any(String),
    });
    expect(event.data).not.toHaveProperty("rejectionReason");
    expect(event.data).not.toHaveProperty("documentType");
    expect(event.data).not.toHaveProperty("fileUrl");
  });

  it("emits normalized customer reservation status events without secrets", async () => {
    const eventPromise = firstValueFrom(
      service.subscribeToReservation("res-2").pipe(take(1)),
    );

    service.emitReservationStatus("res-2", ReservationStatus.CONFIRMED);

    const event = await eventPromise;

    expect(event.data).toEqual({
      type: "reservation.status.updated",
      resourceId: "res-2",
      status: ReservationStatus.CONFIRMED,
      updatedAt: expect.any(String),
    });
    expect(event.data).not.toHaveProperty("stripePaymentIntentId");
    expect(event.data).not.toHaveProperty("ticketToken");
    expect(event.data).not.toHaveProperty("qrCodeHash");
  });

  it("emits operator delivery invalidation events only", async () => {
    const eventPromise = firstValueFrom(
      service.subscribeOperatorDeliveries().pipe(take(1)),
    );

    service.emitDeliveryUpdate("res-3", ReservationStatus.IN_PROGRESS);

    const event = await eventPromise;

    expect(event.data).toEqual({
      type: "operator.deliveries.invalidated",
      resourceId: "res-3",
      updatedAt: expect.any(String),
    });
    expect(event.data).not.toHaveProperty("status");
    expect(event.data).not.toHaveProperty("customerPhone");
  });

  it("emits operator document queue invalidation events only", async () => {
    const eventPromise = firstValueFrom(
      service.subscribeOperatorDocuments().pipe(take(1)),
    );

    service.emitOperatorDocumentQueueInvalidation("res-4");

    const event = await eventPromise;

    expect(event.data).toEqual({
      type: "operator.documents.invalidated",
      resourceId: "res-4",
      updatedAt: expect.any(String),
    });
    expect(event.data).not.toHaveProperty("documentUrl");
  });

  it("closes reservation streams after terminal status without leaving pending timers", async () => {
    const eventPromise = firstValueFrom(
      service.subscribeToReservation("res-5").pipe(take(1)),
    );

    service.emitReservationStatus("res-5", ReservationStatus.CONFIRMED);

    const event = await eventPromise;
    expect(event.data).toEqual({
      type: "reservation.status.updated",
      resourceId: "res-5",
      status: ReservationStatus.CONFIRMED,
      updatedAt: expect.any(String),
    });

    jest.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(jest.getTimerCount()).toBe(0);
  });
});
