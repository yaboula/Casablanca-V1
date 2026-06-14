import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { S3Service } from '../s3/s3.service';
import { User, UserRole } from '../users/user.entity';
import { DocumentsService } from './documents.service';
import {
  DocumentStatus,
  DocumentType,
  ReservationDocument,
} from './reservation-document.entity';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'user@test.com',
    fullName: 'Test User',
    role: UserRole.USER,
    isActive: true,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

function makeReservation(
  status: ReservationStatus = ReservationStatus.PENDING_DEPOSIT,
  overrides: Partial<Reservation> = {},
): Reservation {
  return {
    id: 'res-123',
    userId: 'user-123',
    vehicleId: 'veh-123',
    pickupDate: new Date(),
    returnDate: new Date(Date.now() + 86400000),
    totalDays: 1,
    totalPriceEurCents: 10000,
    depositEurCents: 1000,
    pickupLocation: 'CMN_T1' as any,
    status,
    stripePaymentIntentId: null,
    stripeClientSecret: null,
    qrCodeHash: null,
    customerName: null,
    customerPhone: null,
    idempotencyKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Reservation;
}

function makeDocument(
  overrides: Partial<ReservationDocument> = {},
): ReservationDocument {
  return {
    id: 'doc-123',
    userId: 'user-123',
    reservationId: 'res-123',
    type: DocumentType.PASSPORT,
    fileKey: 'docs/user-123/res-123/PASSPORT-old.jpg',
    status: DocumentStatus.REJECTED,
    rejectionReason: 'blurred',
    reviewedBy: 'op-1',
    reviewedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  } as ReservationDocument;
}

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockDocsRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((data) => data),
    save: jest.fn().mockImplementation(async (data) => data),
  } as unknown as jest.Mocked<Repository<ReservationDocument>>;

  const mockReservationsRepo = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<Reservation>>;

  const mockS3Service = {
    generatePresignedUpload: jest.fn().mockResolvedValue({
      uploadUrl: 'https://upload.test',
      fileKey: 'docs/user-123/res-123/PASSPORT-123.jpg',
      expiresIn: 900,
    }),
    generatePresignedRead: jest.fn().mockResolvedValue('https://read.test'),
    isBypassStorageEnabled: jest.fn().mockReturnValue(false),
    saveBypassObject: jest.fn().mockResolvedValue({
      size: 128,
      contentType: 'image/jpeg',
    }),
    readBypassObject: jest.fn().mockResolvedValue({
      bytes: Buffer.from('test'),
      contentType: 'image/jpeg',
    }),
  };

  const mockOrphanUploadCleanupQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(ReservationDocument),
          useValue: mockDocsRepo,
        },
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationsRepo,
        },
        {
          provide: getQueueToken('orphan-upload-cleanup'),
          useValue: mockOrphanUploadCleanupQueue,
        },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  describe('presign', () => {
    it('returns a presigned upload and enqueues orphan cleanup', async () => {
      mockReservationsRepo.findOne.mockResolvedValue(makeReservation());
      mockDocsRepo.findOne.mockResolvedValue(null);

      const result = await service.presign(
        {
          reservationId: 'res-123',
          type: DocumentType.PASSPORT,
          mimeType: 'image/jpeg',
        },
        makeUser(),
      );

      expect(result.fileKey).toContain('PASSPORT');
      expect(mockS3Service.generatePresignedUpload).toHaveBeenCalled();
      expect(mockOrphanUploadCleanupQueue.add).toHaveBeenCalledWith(
        'cleanup-orphan-upload',
        { fileKey: result.fileKey },
        expect.objectContaining({ delay: 2 * 60 * 60 * 1000 }),
      );
    });

    it('rejects uploads for a reservation owned by another user', async () => {
      mockReservationsRepo.findOne.mockResolvedValue(
        makeReservation(ReservationStatus.PENDING_DEPOSIT, { userId: 'other-user' }),
      );

      await expect(
        service.presign(
          {
            reservationId: 'res-123',
            type: DocumentType.PASSPORT,
            mimeType: 'image/jpeg',
          },
          makeUser(),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('confirm', () => {
    it('rejects mismatched fileKey/document type combinations', async () => {
      mockReservationsRepo.findOne.mockResolvedValue(makeReservation());

      await expect(
        service.confirm(
          {
            reservationId: 'res-123',
            type: DocumentType.PASSPORT,
            fileKey: 'docs/user-123/res-123/DRIVING_LICENSE-123.jpg',
          },
          makeUser(),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('replaces an existing non-approved document and enqueues cleanup for the previous file', async () => {
      const existing = makeDocument({
        type: DocumentType.PASSPORT,
        fileKey: 'docs/user-123/res-123/PASSPORT-old.jpg',
        status: DocumentStatus.REJECTED,
      });

      mockReservationsRepo.findOne.mockResolvedValue(makeReservation());
      mockDocsRepo.findOne.mockResolvedValue(existing);

      const saved = await service.confirm(
        {
          reservationId: 'res-123',
          type: DocumentType.PASSPORT,
          fileKey: 'docs/user-123/res-123/PASSPORT-new.jpg',
        },
        makeUser(),
      );

      expect(saved.fileKey).toBe('docs/user-123/res-123/PASSPORT-new.jpg');
      expect(saved.status).toBe(DocumentStatus.PENDING_REVIEW);
      expect(mockOrphanUploadCleanupQueue.add).toHaveBeenCalledWith(
        'cleanup-replaced-upload',
        { fileKey: 'docs/user-123/res-123/PASSPORT-old.jpg' },
        expect.any(Object),
      );
    });

    it('rejects replacing an approved document', async () => {
      mockReservationsRepo.findOne.mockResolvedValue(makeReservation());
      mockDocsRepo.findOne.mockResolvedValue(
        makeDocument({ status: DocumentStatus.APPROVED }),
      );

      await expect(
        service.confirm(
          {
            reservationId: 'res-123',
            type: DocumentType.PASSPORT,
            fileKey: 'docs/user-123/res-123/PASSPORT-new.jpg',
          },
          makeUser(),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findByReservation', () => {
    it('returns documents with presigned read URLs and strips fileKey', async () => {
      mockReservationsRepo.findOne.mockResolvedValue(makeReservation());
      mockDocsRepo.find.mockResolvedValue([makeDocument()]);

      const result = await service.findByReservation('res-123', makeUser());

      expect(result).toHaveLength(1);
      expect(result[0].fileUrl).toBe('https://read.test');
      expect((result[0] as any).fileKey).toBeUndefined();
    });

    it('throws when the reservation does not exist', async () => {
      mockReservationsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findByReservation('missing', makeUser()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('uses authenticated local file URLs when bypass storage is enabled', async () => {
      mockS3Service.isBypassStorageEnabled.mockReturnValue(true);
      mockReservationsRepo.findOne.mockResolvedValue(makeReservation());
      mockDocsRepo.find.mockResolvedValue([makeDocument({ id: 'doc-999' })]);

      const result = await service.findByReservation('res-123', makeUser());

      expect(result[0].fileUrl).toBe('/api/v1/documents/file/doc-999');
      expect(mockS3Service.generatePresignedRead).not.toHaveBeenCalled();
    });
  });
});
