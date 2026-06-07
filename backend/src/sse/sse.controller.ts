import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  MessageEvent,
  Sse,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Observable, map } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SseService } from "./sse.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User, UserRole } from "../users/user.entity";
import { Reservation } from "../reservations/reservation.entity";

@Controller("sse")
@UseGuards(JwtAuthGuard)
export class SseController {
  constructor(
    private readonly sseService: SseService,
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
  ) {}

  /**
   * GET /api/v1/sse/reservation/:id
   *
   * Emits events when operator approves/rejects documents.
   * Bug 9 fix: validates user ownership before subscribing.
   */
  @Sse("reservation/:id")
  async subscribeReservation(
    @Param("id", ParseUUIDPipe) reservationId: string,
    @CurrentUser() user: User,
  ): Promise<Observable<MessageEvent>> {
    // Bug 9 fix: Ownership check — users can only subscribe to their own reservations
    if (user.role === UserRole.USER) {
      const reservation = await this.reservationsRepo.findOne({
        where: { id: reservationId },
        select: ["id", "userId"],
      });

      if (!reservation) {
        throw new NotFoundException("Reserva no encontrada.");
      }

      if (reservation.userId !== user.id) {
        throw new ForbiddenException("No tienes acceso a esta reserva.");
      }
    }

    return this.sseService.subscribeToReservation(reservationId).pipe(
      map((sseEvent) => ({
        data: JSON.stringify({
          ...sseEvent.data,
          reservationId,
        }),
      })),
    );
  }

  /**
   * GET /api/v1/sse/operator/chat
   *
   * Operator SSE stream — emits when a new customer chat message arrives.
   * Requires OPERATOR or ADMIN role.
   */
  @Sse("operator/chat")
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  subscribeOperatorChat(): Observable<MessageEvent> {
    return this.sseService.subscribeOperatorChat().pipe(
      map((sseEvent) => ({
        data: JSON.stringify(sseEvent.data),
      })),
    );
  }

  /**
   * GET /api/v1/sse/operator/deliveries
   *
   * B3.6 — Operator delivery dashboard live update stream.
   * Emits a DELIVERY_UPDATE event when any reservation changes state.
   * Clients call router.refresh() on receipt to re-fetch Server Component data.
   */
  @Sse("operator/deliveries")
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  subscribeOperatorDeliveries(): Observable<MessageEvent> {
    return this.sseService.subscribeOperatorDeliveries().pipe(
      map((sseEvent) => ({
        data: JSON.stringify(sseEvent.data),
      })),
    );
  }
}
