import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Service } from '../../s3/s3.service';
import {
  DocumentStatus,
  ReservationDocument,
} from '../reservation-document.entity';
import { DocumentCleanupProcessor } from './document-cleanup.processor';

function makeDocument(
  status: DocumentStatus = DocumentStatus.REJECTED,
  overrides: Partial<ReservationDocument> = {},
): ReservationDocument {
  return {
    id: 'doc-123',
    userId: 'user-123',
    reservationId: 'res-123',
    type: 'PASSPORT' as any,
    fileKey: 'docs/user-123/res-123/PASSPORT-123.jpg',
    status,
    rejectionReason: 'blurred',
    reviewedBy: 'op-1',
    reviewedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  } as ReservationDocument;
}

describe('DocumentCleanupProcessor', () => {
  let processor: DocumentCleanupProcessor;

  const mockDocsRepo = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<ReservationDocument>>;

  const mockS3Service = {
    deleteObject: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentCleanupProcessor,
        {
          provide: getRepositoryToken(ReservationDocument),
          useValue: mockDocsRepo,
        },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    processor = module.get(DocumentCleanupProcessor);
  });

  it('deletes the S3 object when the document is still REJECTED', async () => {
    mockDocsRepo.findOne.mockResolvedValue(makeDocument(DocumentStatus.REJECTED));

    await processor.process({
      id: 'job-1',
      data: {
        documentId: 'doc-123',
        fileKey: 'docs/user-123/res-123/PASSPORT-123.jpg',
      },
    } as any);

    expect(mockS3Service.deleteObject).toHaveBeenCalledWith(
      'docs/user-123/res-123/PASSPORT-123.jpg',
    );
  });

  it('skips deletion when the document is no longer rejected', async () => {
    mockDocsRepo.findOne.mockResolvedValue(makeDocument(DocumentStatus.APPROVED));

    await processor.process({
      id: 'job-1',
      data: {
        documentId: 'doc-123',
        fileKey: 'docs/user-123/res-123/PASSPORT-123.jpg',
      },
    } as any);

    expect(mockS3Service.deleteObject).not.toHaveBeenCalled();
  });
});
