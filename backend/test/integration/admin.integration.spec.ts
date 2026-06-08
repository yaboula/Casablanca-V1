import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { UserRole } from '../../src/users/user.entity';
import { truncateAllTables } from '../setup/db-helpers';
import { createTestApp } from '../setup/test-app';

const BASE = '/api/v1';

const ADMIN_USER = {
  email: 'admin@nexus-test.com',
  password: 'SecurePass123!',
  fullName: 'Admin Test',
  phone: '+34600000001',
};

const REGULAR_USER = {
  email: 'member@nexus-test.com',
  password: 'SecurePass123!',
  fullName: 'Member Test',
  phone: '+34600000002',
};

const VEHICLE_PAYLOAD = {
  brand: 'Audi',
  model: 'Q5',
  licensePlate: ' ab-1234 ',
  category: 'SUV',
  pricePerDayEurCents: 19000,
  imageUrl: 'https://example.com/audi-q5.jpg',
  imageUrls: ['https://example.com/audi-q5.jpg'],
  transmission: 'AUTOMATIC',
  seats: 5,
  luggageCount: 3,
  features: ['GPS', 'Jawaz'],
  status: 'AVAILABLE',
};

describe('Admin - Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await truncateAllTables(app);
  });

  async function registerAndPromoteAdmin(): Promise<string> {
    await request(app.getHttpServer())
      .post(`${BASE}/auth/register`)
      .send(ADMIN_USER)
      .expect(201);

    await dataSource.query(`UPDATE users SET role = $1 WHERE email = $2`, [
      UserRole.ADMIN,
      ADMIN_USER.email,
    ]);

    const loginRes = await request(app.getHttpServer())
      .post(`${BASE}/auth/login`)
      .send({ email: ADMIN_USER.email, password: ADMIN_USER.password })
      .expect(200);

    return loginRes.body.accessToken as string;
  }

  async function registerRegularUser(): Promise<string> {
    const registerRes = await request(app.getHttpServer())
      .post(`${BASE}/auth/register`)
      .send(REGULAR_USER)
      .expect(201);

    return registerRes.body.user.id as string;
  }

  it('blocks an admin from changing their own role', async () => {
    const adminToken = await registerAndPromoteAdmin();

    const meRes = await request(app.getHttpServer())
      .get(`${BASE}/auth/me`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`${BASE}/admin/users/${meRes.body.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: UserRole.USER })
      .expect(400);
  });

  it('creates vehicles with a normalized unique license plate', async () => {
    const adminToken = await registerAndPromoteAdmin();

    const res = await request(app.getHttpServer())
      .post(`${BASE}/admin/vehicles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(VEHICLE_PAYLOAD)
      .expect(201);

    expect(res.body.data.brand).toBe('Audi');
    expect(res.body.data.licensePlate).toBe('AB-1234');
  });

  it('rejects duplicate vehicle license plates', async () => {
    const adminToken = await registerAndPromoteAdmin();

    await request(app.getHttpServer())
      .post(`${BASE}/admin/vehicles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(VEHICLE_PAYLOAD)
      .expect(201);

    await request(app.getHttpServer())
      .post(`${BASE}/admin/vehicles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...VEHICLE_PAYLOAD,
        model: 'Q7',
        licensePlate: 'AB-1234',
      })
      .expect(409);
  });

  it('updates vehicle license plates with normalization and uniqueness checks', async () => {
    const adminToken = await registerAndPromoteAdmin();

    const firstVehicle = await request(app.getHttpServer())
      .post(`${BASE}/admin/vehicles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(VEHICLE_PAYLOAD)
      .expect(201);

    const secondVehicle = await request(app.getHttpServer())
      .post(`${BASE}/admin/vehicles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...VEHICLE_PAYLOAD,
        model: 'Q7',
        licensePlate: 'CD-9999',
      })
      .expect(201);

    const updateRes = await request(app.getHttpServer())
      .patch(`${BASE}/admin/vehicles/${firstVehicle.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ licensePlate: ' ef-7777 ' })
      .expect(200);

    expect(updateRes.body.data.licensePlate).toBe('EF-7777');

    await request(app.getHttpServer())
      .patch(`${BASE}/admin/vehicles/${secondVehicle.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ licensePlate: 'EF-7777' })
      .expect(409);
  });

  it('allows admin to update another user role while still blocking self-role changes', async () => {
    const adminToken = await registerAndPromoteAdmin();
    const regularUserId = await registerRegularUser();

    const res = await request(app.getHttpServer())
      .patch(`${BASE}/admin/users/${regularUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: UserRole.OPERATOR })
      .expect(200);

    expect(res.body.data.role).toBe(UserRole.OPERATOR);
  });
});
