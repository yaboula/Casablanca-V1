import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { Repository } from "typeorm";
import { Reservation, ReservationStatus } from "../reservations/reservation.entity";
import { S3Service } from "../s3/s3.service";
import { User, UserRole } from "../users/user.entity";
import { ConfirmDocumentDto } from "./dto/confirm-document.dto";
import { PresignDocumentDto } from "./dto/presign-document.dto";
import {
  DocumentStatus,
  ReservationDocument,
} from "./reservation-document.entity";

const UPLOAD_ALLOWED_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING_DEPOSIT,
  ReservationStatus.CONFIRMED,
];
const ORPHAN_UPLOAD_CLEANUP_DELAY_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(ReservationDocument)
    private readonly docsRepo: Repository<ReservationDocument>,
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    @InjectQueue("orphan-upload-cleanup")
    private readonly orphanUploadCleanupQueue: Queue,
    private readonly s3Service: S3Service,
  ) {}

  async presign(dto: PresignDocumentDto, user: User) {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: dto.reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reserva ${dto.reservationId} no encontrada.`,
      );
    }

    if (reservation.userId !== user.id) {
      throw new ForbiddenException("Esta reserva no te pertenece.");
    }

    if (!UPLOAD_ALLOWED_STATUSES.includes(reservation.status)) {
      throw new BadRequestException(
        `No se pueden subir documentos para reservas en estado ${reservation.status}.`,
      );
    }

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

    const presignedUpload = await this.s3Service.generatePresignedUpload(
      user.id,
      dto.reservationId,
      dto.type,
      dto.mimeType ?? "image/jpeg",
    );

    await this.orphanUploadCleanupQueue.add(
      "cleanup-orphan-upload",
      { fileKey: presignedUpload.fileKey },
      {
        delay: ORPHAN_UPLOAD_CLEANUP_DELAY_MS,
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return presignedUpload;
  }

  async confirm(
    dto: ConfirmDocumentDto,
    user: User,
  ): Promise<ReservationDocument> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: dto.reservationId },
    });

    if (!reservation || reservation.userId !== user.id) {
      throw new ForbiddenException("Reserva inválida.");
    }

    if (!UPLOAD_ALLOWED_STATUSES.includes(reservation.status)) {
      throw new BadRequestException(
        `No se pueden confirmar documentos para reservas en estado ${reservation.status}.`,
      );
    }

    const expectedPrefix = `docs/${user.id}/${dto.reservationId}/`;
    if (dto.fileKey.includes("..") || !dto.fileKey.startsWith(expectedPrefix)) {
      throw new BadRequestException("fileKey inválido.");
    }
    if (!dto.fileKey.includes(`/${dto.type}-`)) {
      throw new BadRequestException(
        "fileKey no coincide con el tipo de documento confirmado.",
      );
    }

    const existing = await this.docsRepo.findOne({
      where: {
        reservationId: dto.reservationId,
        type: dto.type,
        userId: user.id,
      },
    });

    if (existing && existing.status === DocumentStatus.APPROVED) {
      throw new ConflictException(
        `Ya existe un ${dto.type} aprobado - no se puede reemplazar.`,
      );
    }

    if (existing) {
      const previousFileKey = existing.fileKey;
      existing.fileKey = dto.fileKey;
      existing.status = DocumentStatus.PENDING_REVIEW;
      existing.rejectionReason = null;
      existing.reviewedBy = null;
      existing.reviewedAt = null;
      const saved = await this.docsRepo.save(existing);

      if (previousFileKey !== dto.fileKey) {
        await this.orphanUploadCleanupQueue.add(
          "cleanup-replaced-upload",
          { fileKey: previousFileKey },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 10_000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }

      return saved;
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

  async findByReservation(
    reservationId: string,
    user: User,
  ): Promise<(Omit<ReservationDocument, "fileKey"> & { fileUrl: string })[]> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${reservationId} no encontrada.`);
    }

    if (user.role === UserRole.USER && reservation.userId !== user.id) {
      throw new ForbiddenException("No tienes acceso a esta reserva.");
    }

    const docs = await this.docsRepo.find({
      where: { reservationId },
      order: { createdAt: "ASC" },
    });

    return Promise.all(
      docs.map(async (doc) => {
        const { fileKey, ...safeDoc } = doc;
        return {
          ...safeDoc,
          fileUrl: await this.s3Service.generatePresignedRead(fileKey),
        };
      }),
    );
  }
}
