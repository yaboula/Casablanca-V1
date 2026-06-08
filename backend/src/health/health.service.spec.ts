import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HEALTH_REDIS } from './health.constants';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: { query: jest.Mock };
  let redis: { ping: jest.Mock; status: string; quit: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    redis = {
      ping: jest.fn().mockResolvedValue('PONG'),
      status: 'ready',
      quit: jest.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
        {
          provide: HEALTH_REDIS,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok when database and redis are healthy', async () => {
    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.db).toBe('ok');
    expect(result.redis).toBe('ok');
  });

  it('returns degraded when redis fails', async () => {
    redis.ping.mockRejectedValueOnce(new Error('redis down'));

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.db).toBe('ok');
    expect(result.redis).toBe('error');
  });

  it('returns degraded when database fails', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('db down'));

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.db).toBe('error');
    expect(result.redis).toBe('ok');
  });

  it('closes the Redis client on module destroy', async () => {
    await service.onModuleDestroy();

    expect(redis.quit).toHaveBeenCalledTimes(1);
  });

  it('skips Redis quit when the client is already closed', async () => {
    redis.status = 'end';

    await service.onModuleDestroy();

    expect(redis.quit).not.toHaveBeenCalled();
  });
});
