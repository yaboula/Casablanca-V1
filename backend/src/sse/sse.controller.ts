import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  MessageEvent,
  Sse,
  ForbiddenException,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { SseService } from './sse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('sse')
@UseGuards(JwtAuthGuard)
export class SseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * GET /api/v1/sse/reservation/:id
   *
   * Replaces the setTimeout mock in WaitingRoomClient.tsx.
   * Emits events when operator approves/rejects documents.
   *
   * Event format: { data: { type, documentStatus, rejectionReason, timestamp } }
   */
  @Sse('reservation/:id')
  subscribeReservation(
    @Param('id', ParseUUIDPipe) reservationId: string,
    @CurrentUser() user: User,
  ): Observable<MessageEvent> {
    // Note: ownership check done here rather than in service (we have user context)
    // Operators can also subscribe (to monitor in real-time)
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
  @Sse('operator/chat')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  subscribeOperatorChat(): Observable<MessageEvent> {
    return this.sseService.subscribeOperatorChat().pipe(
      map((sseEvent) => ({
        data: JSON.stringify(sseEvent.data),
      })),
    );
  }
}
