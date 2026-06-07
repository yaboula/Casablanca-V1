/**
 * Reservations Integration Tests — Level 2
 * =====================================================================
 * Tests the full HTTP request lifecycle for the reservations module.
 * All endpoints require JWT — tests exercise auth middleware too.
 *
 * External mocks:
 *   - StripeService → mockStripeService (no real Stripe API calls)
 *   - reservation-expiry queue → mockExpiryQueue (no BullMQ enqueue)
 *
 * Isolation: truncateAllTables() before each test
 * DB state: seeded via register + real ReservationsService
 * =====================================================================
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, mockStripeService, mockExpiryQueue } from '../setup/test-app';
import { truncateAllTables, seedVehicle } from '../setup/db-helpers';

const BASE = '/api/v1';

// Dates always in the future
const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();
const threeDays = () => new Date(Date.now() + 3 * 86_400_000).toISOString();

// ─── Shared helper ────────────────────────────────────────────────────────────

async function registerAndLogin(
  app: INestApplication,
  email = 'user@nexus-test.com',
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/auth/register`)
    .send({
      email,
      password: 'SecurePass123!',
      fullName: 'Integration Tester',
      phone: '+34600000001',
    })
    .expect(201);

  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    userId: res.body.user.id,
  };
}

async function createReservation(
  app: INestApplication,
  token: string,
  vehicleId: string,
): Promise<any> {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/reservations`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      vehicleId,
      pickupDate: tomorrow(),
      returnDate: threeDays(),
      pickupLocation: 'CMN_T1',
      customerName: 'Integration Tester',
      customerPhone: '+34600000001',
    })
    .expect(201);

  return res.body.data;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Reservations — Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(app);
    jest.clearAllMocks();

    // Restore default mocks after potential overrides in individual tests
    mockStripeService.createPaymentIntent.mockResolvedValue({
      id: 'pi_test_integration',
      client_secret: 'pi_test_integration_secret_xxx',
      status: 'requires_payment_method',
    });
    mockExpiryQueue.add.mockResolvedValue({ id: 'job-integration-1' });
  });

  // ── POST /reservations ──────────────────────────────────────────────────────

  describe('POST /reservations', () => {
    it('401 — sin JWT devuelve Unauthorized', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/reservations`)
        .send({
          vehicleId: '00000000-0000-4000-a000-000000000001',
          pickupDate: tomorrow(),
          returnDate: threeDays(),
          pickupLocation: 'CMN_T1',
        })
        .expect(401);
    });

    it('201 — happy path: crea reserva, llama Stripe, encola job de expiración', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .post(`${BASE}/reservations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          vehicleId,
          pickupDate: tomorrow(),
          returnDate: threeDays(),
          pickupLocation: 'CMN_T1',
          customerName: 'Test Client',
          customerPhone: '+34600000002',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('PENDING_DEPOSIT');
      expect(res.body.data.stripeClientSecret).toBe('pi_test_integration_secret_xxx');

      // Verificar que se llamó a Stripe con el depósito fijo (1000 = 10 €)
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        1000,
        expect.any(String),
        expect.any(Object),
      );

      // Verificar que se encoló el job de expiración a 15 min
      expect(mockExpiryQueue.add).toHaveBeenCalledWith(
        'expire',
        expect.objectContaining({ reservationId: res.body.data.id }),
        expect.objectContaining({ delay: 15 * 60 * 1000 }),
      );
    });

    it('400 — pickupDate en pasado devuelve Bad Request', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);

      await request(app.getHttpServer())
        .post(`${BASE}/reservations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          vehicleId,
          pickupDate: new Date('2020-01-01').toISOString(),
          returnDate: new Date('2020-01-05').toISOString(),
          pickupLocation: 'CMN_T1',
        })
        .expect(400);
    });

    it('404 — vehicleId inexistente devuelve Not Found', async () => {
      const { accessToken } = await registerAndLogin(app);
      const fakeVehicleId = '00000000-0000-4000-a000-000000000001';

      await request(app.getHttpServer())
        .post(`${BASE}/reservations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          vehicleId: fakeVehicleId,
          pickupDate: tomorrow(),
          returnDate: threeDays(),
          pickupLocation: 'CMN_T1',
        })
        .expect(404);
    });
  });

  // ── GET /reservations/my ────────────────────────────────────────────────────

  describe('GET /reservations/my', () => {
    it('401 — sin JWT devuelve Unauthorized', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/reservations/my`)
        .expect(401);
    });

    it('200 — user con reservas solo ve las suyas', async () => {
      const vehicleId = await seedVehicle(app);
      const user1 = await registerAndLogin(app, 'user1@nexus-test.com');
      const user2 = await registerAndLogin(app, 'user2@nexus-test.com');

      // user1 crea una reserva
      await createReservation(app, user1.accessToken, vehicleId);

      // user2 no ve la reserva de user1
      const res = await request(app.getHttpServer())
        .get(`${BASE}/reservations/my`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('200 — paginación: page=1&limit=5 devuelve estructura correcta', async () => {
      const { accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .get(`${BASE}/reservations/my?page=1&limit=5`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
    });
  });

  // ── GET /reservations/:id ───────────────────────────────────────────────────

  describe('GET /reservations/:id', () => {
    it('200 — dueño puede ver su propia reserva', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);
      const reservation = await createReservation(app, accessToken, vehicleId);

      const res = await request(app.getHttpServer())
        .get(`${BASE}/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(reservation.id);
    });

    it('403 — usuario diferente no puede ver la reserva de otro', async () => {
      const vehicleId = await seedVehicle(app);
      const user1 = await registerAndLogin(app, 'owner@nexus-test.com');
      const user2 = await registerAndLogin(app, 'intruder@nexus-test.com');

      const reservation = await createReservation(app, user1.accessToken, vehicleId);

      await request(app.getHttpServer())
        .get(`${BASE}/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });
  });

  // ── PATCH /reservations/:id/cancel ─────────────────────────────────────────

  describe('PATCH /reservations/:id/cancel', () => {
    it('200 — usuario cancela su reserva PENDING_DEPOSIT', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);
      const reservation = await createReservation(app, accessToken, vehicleId);

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/reservations/${reservation.id}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('403 — otro usuario no puede cancelar la reserva ajena', async () => {
      const vehicleId = await seedVehicle(app);
      const owner = await registerAndLogin(app, 'owner2@nexus-test.com');
      const intruder = await registerAndLogin(app, 'intruder2@nexus-test.com');

      const reservation = await createReservation(app, owner.accessToken, vehicleId);

      await request(app.getHttpServer())
        .patch(`${BASE}/reservations/${reservation.id}/cancel`)
        .set('Authorization', `Bearer ${intruder.accessToken}`)
        .expect(403);
    });
  });

  // ── PATCH /reservations/:id/complete ───────────────────────────────────────

  describe('PATCH /reservations/:id/complete', () => {
    it('403 — rol USER no puede completar una reserva (OPERATOR only)', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app, 'user3@nexus-test.com');
      const reservation = await createReservation(app, accessToken, vehicleId);

      await request(app.getHttpServer())
        .patch(`${BASE}/reservations/${reservation.id}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });
});
