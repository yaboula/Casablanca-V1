import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Reservation } from "../reservations/reservation.entity";
import { ReservationDocument } from "../documents/reservation-document.entity";
import { Vehicle } from "../vehicles/vehicle.entity";
import { QrService } from "../qr/qr.service";
import { SseService } from "../sse/sse.service";
import { S3Service } from "../s3/s3.service";
import { OperatorDeliveryService } from "./services/operator-delivery.service";
import { OperatorDocumentService } from "./services/operator-document.service";
import { OperatorSearchService } from "./services/operator-search.service";
import {
  DeliveryActionResponseDto,
  DeliveryResponseDto,
} from "./dto/delivery-response.dto";
import {
  DocumentReviewResultDto,
  ReviewedDocumentResponseDto,
} from "./dto/document-response.dto";
import { ManualCheckinDto } from "./dto/operator.dto";
import { OperatorSearchResponseDto } from "./dto/search-response.dto";

/**
 * Facade â€” delegates to the three focused sub-services.
 * Kept for backwards compatibility: the controller and any
 * other modules that inject OperatorService do not need changes.
 *
 * Architecture: see docs/REFACTORING_PLAN_ADMIN_OPERATOR.md Â§ ADR-001.
 */
@Injectable()
export class OperatorService {
  constructor(
    private readonly deliveryService: OperatorDeliveryService,
    private readonly documentService: OperatorDocumentService,
    private readonly searchService: OperatorSearchService,
    // â”€â”€ Legacy injections kept so operator.module.ts providers list is stable â”€â”€
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    @InjectRepository(ReservationDocument)
    private readonly docsRepo: Repository<ReservationDocument>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectQueue("capture-stripe")
    private readonly captureStripeQueue: Queue,
    @InjectQueue("reservation-expiry")
    private readonly reservationExpiryQueue: Queue,
    @InjectQueue("document-cleanup")
    private readonly documentCleanupQueue: Queue,
    private readonly dataSource: DataSource,
    private readonly qrService: QrService,
    private readonly sseService: SseService,
    private readonly s3Service: S3Service,
  ) {}

  // â”€â”€ Deliveries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getDeliveries(dateStr?: string): Promise<DeliveryResponseDto[]> {
    return this.deliveryService.getDeliveries(dateStr);
  }

  async getDeliveryStats(dateStr?: string) {
    return this.deliveryService.getDeliveryStats(dateStr);
  }

  async getDeliveryDetail(
    reservationId: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.getDeliveryDetail(reservationId);
  }

  async manualCheckin(
    reservationId: string,
    operatorId: string,
    dto: ManualCheckinDto,
  ): Promise<DeliveryActionResponseDto> {
    return this.deliveryService.manualCheckin(reservationId, operatorId, dto);
  }

  async scanQr(
    reservationId: string,
    qrCodeHash: string,
    operatorId: string,
  ): Promise<DeliveryActionResponseDto> {
    return this.deliveryService.scanQr(reservationId, qrCodeHash, operatorId);
  }

  async completeDelivery(
    reservationId: string,
    operatorId: string,
  ): Promise<DeliveryActionResponseDto> {
    return this.deliveryService.completeDelivery(reservationId, operatorId);
  }

  // â”€â”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async search(query: string): Promise<OperatorSearchResponseDto> {
    return this.searchService.search(query);
  }

  // â”€â”€ Document Review â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getPendingDocuments() {
    return this.documentService.getPendingDocuments();
  }

  async approveDocument(
    documentId: string,
    operatorId: string,
  ): Promise<DocumentReviewResultDto> {
    return this.documentService.approveDocument(documentId, operatorId);
  }

  async rejectDocument(
    documentId: string,
    reason: string,
    operatorId: string,
  ): Promise<ReviewedDocumentResponseDto> {
    return this.documentService.rejectDocument(documentId, reason, operatorId);
  }
}
