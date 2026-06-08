import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Service } from '../../s3/s3.service';
import { ReservationDocument } from '../reservation-document.entity';
import { OrphanUploadCleanupProcessor } from './orphan-upload-cleanup.processor';

describe('OrphanUploadCleanupProcessor', () => {
  let processor: OrphanUploadCleanupProcessor;

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
        OrphanUploadCleanupProcessor,
        {
          provide: getRepositoryToken(ReservationDocument),
          useValue: mockDocsRepo,
        },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    processor = module.get(OrphanUploadCleanupProcessor);
  });

  it('deletes an orphaned upload when no document row references the fileKey', async () => {
    mockDocsRepo.findOne.mockResolvedValue(null);

    await processor.process({
      id: 'job-1',
      data: { fileKey: 'docs/user-123/res-123/PASSPORT-123.jpg' },
    } as any);

    expect(mockS3Service.deleteObject).toHaveBeenCalledWith(
      'docs/user-123/res-123/PASSPORT-123.jpg',
    );
  });

  it('skips deletion when a document row already references the fileKey', async () => {
    mockDocsRepo.findOne.mockResolvedValue({
      id: 'doc-1',
    } as ReservationDocument);

    await processor.process({
      id: 'job-1',
      data: { fileKey: 'docs/user-123/res-123/PASSPORT-123.jpg' },
    } as any);

    expect(mockS3Service.deleteObject).not.toHaveBeenCalled();
  });
});
