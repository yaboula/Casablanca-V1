import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PresignDocumentDto } from './dto/presign-document.dto';
import { ConfirmDocumentDto } from './dto/confirm-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * POST /api/v1/documents/presign
   * Returns a presigned S3 PUT URL + fileKey.
   * Frontend uploads the file directly to S3 (never through the backend).
   */
  @Post('presign')
  @HttpCode(HttpStatus.OK)
  async presign(
    @Body() dto: PresignDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.presign(dto, user);
  }

  /**
   * POST /api/v1/documents/confirm
   * Called after the frontend successfully PUT the file to S3.
   * Creates/updates the document record with PENDING_REVIEW status.
   */
  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  async confirm(
    @Body() dto: ConfirmDocumentDto,
    @CurrentUser() user: User,
  ) {
    const doc = await this.documentsService.confirm(dto, user);
    return { data: doc };
  }

  /**
   * GET /api/v1/documents/:reservationId
   * Returns documents with fresh presigned read URLs (valid 5 min).
   * User can only see their own reservation's documents.
   * Operator/Admin can see all.
   */
  @Get(':reservationId')
  async findByReservation(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @CurrentUser() user: User,
  ) {
    const docs = await this.documentsService.findByReservation(
      reservationId,
      user,
    );
    return { data: docs };
  }
}
