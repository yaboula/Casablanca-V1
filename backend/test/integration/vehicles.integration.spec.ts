import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { seedVehicle, truncateAllTables } from '../setup/db-helpers';
import { createTestApp } from '../setup/test-app';

const BASE = '/api/v1';

const tomorrow = () =>
  new Date(Date.now() + 86_400_000).toISOString().split('T')[0] + 'T10:00:00.000Z';
const threeDays = () =>
  new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0] + 'T10:00:00.000Z';

describe('Vehicles - Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await truncateAllTables(app);
  });

  describe('GET /vehicles', () => {
    it('returns an empty list when there are no vehicles', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles`)
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('returns seeded public vehicle data without exposing licensePlate', async () => {
      await seedVehicle(app, {
        brand: 'BMW',
        model: 'Serie 5',
        license_plate: 'BK-1234',
      });

      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles`)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].brand).toBe('BMW');
      expect(res.body.data[0].model).toBe('Serie 5');
      expect(res.body.data[0].licensePlate).toBeUndefined();
    });

    it('does not include vehicles in maintenance', async () => {
      await seedVehicle(app, {
        status: 'MAINTENANCE',
        license_plate: 'MT-1000',
      });

      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles`)
        .expect(200);

      expect(res.body.total).toBe(0);
    });

    it('returns 400 for an invalid category', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles?category=MOTORBIKE`)
        .expect(400);
    });
  });

  describe('GET /vehicles with availability dates', () => {
    it('returns available vehicles in the requested range', async () => {
      await seedVehicle(app, {
        brand: 'Toyota',
        model: 'Yaris',
        license_plate: 'TY-2000',
      });

      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles?pickupDate=${tomorrow()}&returnDate=${threeDays()}`)
        .expect(200);

      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].brand).toBe('Toyota');
      expect(res.body.data[0].licensePlate).toBeUndefined();
    });

    it('returns 400 when returnDate is not after pickupDate', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles?pickupDate=${threeDays()}&returnDate=${tomorrow()}`)
        .expect(400);
    });

    it('returns 400 for invalid ISO 8601 dates', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles?pickupDate=not-a-date&returnDate=also-not`)
        .expect(400);
    });
  });

  describe('GET /vehicles/:id', () => {
    it('returns the vehicle detail without exposing licensePlate', async () => {
      const vehicleId = await seedVehicle(app, {
        brand: 'Mercedes',
        model: 'GLE',
        license_plate: 'MR-9000',
      });

      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles/${vehicleId}`)
        .expect(200);

      expect(res.body.data.id).toBe(vehicleId);
      expect(res.body.data.brand).toBe('Mercedes');
      expect(res.body.data.licensePlate).toBeUndefined();
    });

    it('returns 404 for a valid but unknown UUID', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000001';
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles/${fakeId}`)
        .expect(404);
    });

    it('returns 400 for an invalid UUID', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles/not-a-uuid`)
        .expect(400);
    });
  });
});
