import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseUUIDPipe,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OperatorService } from './operator.service';
import { ScanQrDto, RejectDocumentDto } from './dto/operator.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('operator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPERATOR, UserRole.ADMIN)
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  // ── Deliveries ─────────────────────────────────────────────

  /**
   * GET /api/v1/operator/deliveries?date=2026-02-19
   * Returns CONFIRMED reservations for the given date (default: today).
   */
  @Get('deliveries')
  async getDeliveries(@Query('date') date?: string) {
    const deliveries = await this.operatorService.getDeliveries(date);
    return { data: deliveries, total: deliveries.length };
  }

  /**
   * POST /api/v1/operator/delivery/:reservationId/scan-qr
   * Scans the QR code → marks reservation as IN_PROGRESS.
   */
  @Post('delivery/:reservationId/scan-qr')
  @HttpCode(HttpStatus.OK)
  async scanQr(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Body() dto: ScanQrDto,
    @CurrentUser() operator: User,
  ) {
    const reservation = await this.operatorService.scanQr(
      reservationId,
      dto.qrCodeHash,
      operator.id,
    );
    return { data: reservation, message: 'Entrega confirmada.' };
  }

  // ── Search ─────────────────────────────────────────────────

  /**
   * GET /api/v1/operator/search?q=Ahmed
   * Case-insensitive search by name, phone, or reservation ID.
   */
  @Get('search')
  async search(@Query('q') query: string) {
    const results = await this.operatorService.search(query);
    return { data: results, total: results.length };
  }

  // ── Document Review ────────────────────────────────────────

  /**
   * GET /api/v1/operator/documents/pending
   * Returns documents awaiting review (oldest first — fair queue).
   */
  @Get('documents/pending')
  async getPendingDocuments() {
    const docs = await this.operatorService.getPendingDocuments();
    return { data: docs, total: docs.length };
  }

  /**
   * PATCH /api/v1/operator/documents/:id/approve
   * Approves a document. Triggers Saga for Stripe capture if both docs approved.
   */
  @Patch('documents/:id/approve')
  async approveDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() operator: User,
  ) {
    return this.operatorService.approveDocument(id, operator.id);
  }

  /**
   * PATCH /api/v1/operator/documents/:id/reject
   * Rejects a document with a reason. Emits SSE to customer immediately.
   */
  @Patch('documents/:id/reject')
  async rejectDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentUser() operator: User,
  ) {
    const doc = await this.operatorService.rejectDocument(id, dto.reason, operator.id);
    return { data: doc };
  }
}
