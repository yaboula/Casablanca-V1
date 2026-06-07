/**
 * Vehicles Integration Tests — Level 2
 * =====================================================================
 * Tests the full HTTP request lifecycle for the vehicles module.
 * Vehicles endpoints are PUBLIC (no auth required).
 *
 * External mocks: none (vehicles module has no external dependencies)
 * Isolation: truncateAllTables() + seedVehicle() per test
 * =====================================================================
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../setup/test-app';
import { truncateAllTables, seedVehicle } from '../setup/db-helpers';

const BASE = '/api/v1';

// Dates always in the future — tests are date-stable
const tomorrow = () =>
  new Date(Date.now() + 86_400_000).toISOString().split('T')[0] + 'T10:00:00.000Z';
const threeDays = () =>
  new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0] + 'T10:00:00.000Z';

describe('Vehicles — Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(app);
  });

  // ── GET /vehicles ───────────────────────────────────────────────────────────

  describe('GET /vehicles (catálogo sin fechas)', () => {
    it('200 — sin vehículos semilla devuelve array vacío', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles`)
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('200 — con vehículo semilla devuelve el vehículo', async () => {
      await seedVehicle(app, { brand: 'BMW', model: 'Serie 5' });

      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles`)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].brand).toBe('BMW');
      expect(res.body.data[0].model).toBe('Serie 5');
    });

    it('200 — vehículo en estado MAINTENANCE no aparece en el catálogo', async () => {
      await seedVehicle(app, { status: 'MAINTENANCE' });

      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles`)
        .expect(200);

      expect(res.body.total).toBe(0);
    });

    it('400 — categoría inválida devuelve Bad Request', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles?category=MOTORBIKE`)
        .expect(400);
    });
  });

  // ── GET /vehicles?pickupDate=&returnDate= (disponibilidad) ─────────────────

  describe('GET /vehicles?pickupDate=&returnDate= (disponibilidad)', () => {
    it('200 — devuelve vehículos disponibles en el rango de fechas', async () => {
      await seedVehicle(app, { brand: 'Toyota', model: 'Yaris' });

      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles?pickupDate=${tomorrow()}&returnDate=${threeDays()}`)
        .expect(200);

      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].brand).toBe('Toyota');
    });

    it('400 — returnDate <= pickupDate devuelve Bad Request', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles?pickupDate=${threeDays()}&returnDate=${tomorrow()}`)
        .expect(400);
    });

    it('400 — fechas no son ISO 8601 válidas devuelve Bad Request', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles?pickupDate=not-a-date&returnDate=also-not`)
        .expect(400);
    });
  });

  // ── GET /vehicles/:id ───────────────────────────────────────────────────────

  describe('GET /vehicles/:id', () => {
    it('200 — devuelve el vehículo por UUID', async () => {
      const vehicleId = await seedVehicle(app, { brand: 'Mercedes', model: 'GLE' });

      const res = await request(app.getHttpServer())
        .get(`${BASE}/vehicles/${vehicleId}`)
        .expect(200);

      // Controller wraps in { data: vehicle }
      expect(res.body.data.id).toBe(vehicleId);
      expect(res.body.data.brand).toBe('Mercedes');
    });

    it('404 — UUID válido pero no existente devuelve Not Found', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000001';
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles/${fakeId}`)
        .expect(404);
    });

    it('400 — UUID inválido devuelve Bad Request (ParseUUIDPipe)', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/vehicles/not-a-uuid`)
        .expect(400);
    });
  });
});
