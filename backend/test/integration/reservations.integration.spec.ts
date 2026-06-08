import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createTestApp,
  mockExpiryQueue,
  mockStripeService,
} from '../setup/test-app';
import { seedVehicle, truncateAllTables } from '../setup/db-helpers';

const BASE = '/api/v1';

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();
const threeDays = () => new Date(Date.now() + 3 * 86_400_000).toISOString();

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
  options: {
    idempotencyKey?: string;
    pickupLocation?: 'CMN_T1' | 'CMN_T2';
    customerName?: string;
    customerPhone?: string;
    pickupDate?: string;
    returnDate?: string;
  } = {},
): Promise<any> {
  const httpRequest = request(app.getHttpServer())
    .post(`${BASE}/reservations`)
    .set('Authorization', `Bearer ${token}`);

  if (options.idempotencyKey) {
    httpRequest.set('Idempotency-Key', options.idempotencyKey);
  }

  const res = await httpRequest
    .send({
      vehicleId,
      pickupDate: options.pickupDate ?? tomorrow(),
      returnDate: options.returnDate ?? threeDays(),
      pickupLocation: options.pickupLocation ?? 'CMN_T1',
      customerName: options.customerName ?? 'Integration Tester',
      customerPhone: options.customerPhone ?? '+34600000001',
    })
    .expect(201);

  return res.body.data;
}

describe('Reservations - Integration', () => {
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
    jest.clearAllMocks();

    mockStripeService.createPaymentIntent.mockResolvedValue({
      id: 'pi_test_integration',
      client_secret: 'pi_test_integration_secret_xxx',
      status: 'requires_payment_method',
    });
    mockExpiryQueue.add.mockResolvedValue({ id: 'job-integration-1' });
  });

  describe('POST /reservations', () => {
    it('returns 401 without JWT', async () => {
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

    it('creates a reservation, calls Stripe, and enqueues expiry', async () => {
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
      expect(res.body.data.stripeClientSecret).toBe(
        'pi_test_integration_secret_xxx',
      );

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        1000,
        expect.any(String),
        expect.any(Object),
      );
      expect(mockExpiryQueue.add).toHaveBeenCalledWith(
        'expire',
        expect.objectContaining({ reservationId: res.body.data.id }),
        expect.objectContaining({ delay: 15 * 60 * 1000 }),
      );
    });

    it('returns the same reservation when the same Idempotency-Key is retried', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);
      const pickupDate = tomorrow();
      const returnDate = threeDays();

      const firstReservation = await createReservation(app, accessToken, vehicleId, {
        idempotencyKey: 'res-create-001',
        pickupDate,
        returnDate,
      });
      const secondReservation = await createReservation(app, accessToken, vehicleId, {
        idempotencyKey: 'res-create-001',
        pickupDate,
        returnDate,
      });

      expect(secondReservation.id).toBe(firstReservation.id);
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(mockExpiryQueue.add).toHaveBeenCalledTimes(1);
    });

    it('returns 409 when the same Idempotency-Key is reused with a different payload', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);
      const pickupDate = tomorrow();
      const returnDate = threeDays();

      await createReservation(app, accessToken, vehicleId, {
        idempotencyKey: 'res-create-002',
        pickupDate,
        returnDate,
      });

      await request(app.getHttpServer())
        .post(`${BASE}/reservations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Idempotency-Key', 'res-create-002')
        .send({
          vehicleId,
          pickupDate,
          returnDate,
          pickupLocation: 'CMN_T2',
          customerName: 'Integration Tester',
          customerPhone: '+34600000001',
        })
        .expect(409);
    });

    it('returns 400 when pickupDate is in the past', async () => {
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

    it('returns 404 for an unknown vehicleId', async () => {
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

  describe('GET /reservations/my', () => {
    it('returns 401 without JWT', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/reservations/my`)
        .expect(401);
    });

    it('shows a user only their own reservations', async () => {
      const vehicleId = await seedVehicle(app);
      const user1 = await registerAndLogin(app, 'user1@nexus-test.com');
      const user2 = await registerAndLogin(app, 'user2@nexus-test.com');

      await createReservation(app, user1.accessToken, vehicleId);

      const res = await request(app.getHttpServer())
        .get(`${BASE}/reservations/my`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('returns paginated structure', async () => {
      const { accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .get(`${BASE}/reservations/my?page=1&limit=5`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
    });
  });

  describe('GET /reservations/:id', () => {
    it('lets the owner view their reservation', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);
      const reservation = await createReservation(app, accessToken, vehicleId);

      const res = await request(app.getHttpServer())
        .get(`${BASE}/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(reservation.id);
    });

    it('returns 403 when another user tries to view the reservation', async () => {
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

  describe('PATCH /reservations/:id/cancel', () => {
    it('allows a user to cancel their own PENDING_DEPOSIT reservation', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);
      const reservation = await createReservation(app, accessToken, vehicleId);

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/reservations/${reservation.id}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('returns 400 when trying to cancel the same reservation twice', async () => {
      const vehicleId = await seedVehicle(app);
      const { accessToken } = await registerAndLogin(app);
      const reservation = await createReservation(app, accessToken, vehicleId);

      await request(app.getHttpServer())
        .patch(`${BASE}/reservations/${reservation.id}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`${BASE}/reservations/${reservation.id}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('returns 403 when another user tries to cancel the reservation', async () => {
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

  describe('PATCH /reservations/:id/complete', () => {
    it('returns 403 for USER role', async () => {
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
