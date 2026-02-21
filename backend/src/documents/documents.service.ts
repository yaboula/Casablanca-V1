import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReservationDocument,
  DocumentType,
  DocumentStatus,
} from './reservation-document.entity';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { User, UserRole } from '../users/user.entity';
import { S3Service } from '../s3/s3.service';
import { PresignDocumentDto } from './dto/presign-document.dto';
import { ConfirmDocumentDto } from './dto/confirm-document.dto';

/** Statuses that allow document uploads */
const UPLOAD_ALLOWED_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING_DEPOSIT,
  ReservationStatus.CONFIRMED,
];

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(ReservationDocument)
    private readonly docsRepo: Repository<ReservationDocument>,
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Step 1: Generate a presigned PUT URL so the frontend can upload directly to S3.
   *
   * Validations:
   * - Reservation exists and belongs to the authenticated user
   * - Reservation is in an uploadable state (not CANCELLED or COMPLETED)
   * - No APPROVED document of the same type exists for this reservation
   */
  async presign(dto: PresignDocumentDto, user: User) {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: dto.reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${dto.reservationId} no encontrada.`);
    }

    if (reservation.userId !== user.id) {
      throw new ForbiddenException('Esta reserva no te pertenece.');
    }

    if (!UPLOAD_ALLOWED_STATUSES.includes(reservation.status)) {
      throw new BadRequestException(
        `No se pueden subir documentos para reservas en estado ${reservation.status}.`,
      );
    }

    // Check if an APPROVED document of same type already exists
    const existingApproved = await this.docsRepo.findOne({
      where: {
        reservationId: dto.reservationId,
        type: dto.type,
        status: DocumentStatus.APPROVED,
      },
    });

    if (existingApproved) {
      throw new ConflictException(
        `Ya existe un ${dto.type} aprobado para esta reserva.`,
      );
    }

    return this.s3Service.generatePresignedUpload(
      user.id,
      dto.reservationId,
      dto.type,
      dto.mimeType ?? 'image/jpeg',
    );
  }

  /**
   * Step 2: After the frontend uploads the file to S3, confirm the document.
   * Creates the ReservationDocument record with PENDING_REVIEW status.
   */
  async confirm(dto: ConfirmDocumentDto, user: User): Promise<ReservationDocument> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: dto.reservationId },
    });

    if (!reservation || reservation.userId !== user.id) {
      throw new ForbiddenException('Reserva inválida.');
    }

    // If there's an existing PENDING_REVIEW/REJECTED doc of same type, replace it
    const existing = await this.docsRepo.findOne({
      where: {
        reservationId: dto.reservationId,
        type: dto.type,
        userId: user.id,
      },
    });

    if (existing && existing.status === DocumentStatus.APPROVED) {
      throw new ConflictException(
        `Ya existe un ${dto.type} aprobado — no se puede reemplazar.`,
      );
    }

    if (existing) {
      // Update the existing pending/rejected document
      existing.fileKey = dto.fileKey;
      existing.status = DocumentStatus.PENDING_REVIEW;
      existing.rejectionReason = null;
      existing.reviewedBy = null;
      existing.reviewedAt = null;
      return this.docsRepo.save(existing);
    }

    const doc = this.docsRepo.create({
      userId: user.id,
      reservationId: dto.reservationId,
      type: dto.type,
      fileKey: dto.fileKey,
      status: DocumentStatus.PENDING_REVIEW,
    });

    return this.docsRepo.save(doc);
  }

  /**
   * Returns all documents for a reservation, with fresh presigned read URLs.
   * USER can only view their own reservation's documents.
   * OPERATOR/ADMIN can view any.
   */
  async findByReservation(
    reservationId: string,
    user: User,
  ): Promise<(ReservationDocument & { fileUrl: string })[]> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${reservationId} no encontrada.`);
    }

    if (
      user.role === UserRole.USER &&
      reservation.userId !== user.id
    ) {
      throw new ForbiddenException('No tienes acceso a esta reserva.');
    }

    const docs = await this.docsRepo.find({
      where: { reservationId },
      order: { createdAt: 'ASC' },
    });

    // Attach fresh presigned read URL — never return the raw fileKey
    return Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        fileKey: undefined as unknown as string, // strip raw key from response
        fileUrl: await this.s3Service.generatePresignedRead(doc.fileKey),
      })),
    );
  }
}
