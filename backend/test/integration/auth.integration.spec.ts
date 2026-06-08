import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { truncateAllTables } from '../setup/db-helpers';
import { createTestApp } from '../setup/test-app';

const BASE = '/api/v1';
const VALID_USER = {
  email: 'john@nexus-test.com',
  password: 'SecurePass123!',
  fullName: 'John Test',
  phone: '+34600000000',
};

describe('Auth - Integration', () => {
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

  describe('POST /auth/register', () => {
    it('returns accessToken + refreshToken + user without passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.expiresIn).toBeDefined();
      expect(res.body.user.email).toBe('john@nexus-test.com');
      expect(res.body.user.role).toBe('USER');
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.tokenVersion).toBeUndefined();
    });

    it('normalizes email to lowercase', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send({ ...VALID_USER, email: 'JOHN@NEXUS-TEST.COM' })
        .expect(201);

      expect(res.body.user.email).toBe('john@nexus-test.com');
    });

    it('returns 409 for a duplicate email', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(409);
    });

    it('returns 400 for an invalid body', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send({ password: 'SecurePass123!', fullName: 'Test' })
        .expect(400);
    });

    it('returns 400 for a short password', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send({ ...VALID_USER, password: 'short' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(201);
    });

    it('returns tokens for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: VALID_USER.email, password: VALID_USER.password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.tokenVersion).toBeUndefined();
    });

    it('uses the same message for wrong password and unknown user', async () => {
      const resWrongPass = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: VALID_USER.email, password: 'WrongPass999!' })
        .expect(401);

      const resNoUser = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: 'nobody@nexus-test.com', password: 'AnyPass123!' })
        .expect(401);

      expect(resWrongPass.body.message).toBe(resNoUser.body.message);
    });

    it('returns 401 for an unknown user', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: 'nonexistent@nexus.com', password: 'AnyPass123!' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates refresh tokens and rejects refresh-token reuse', async () => {
      const registerRes = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(201);

      const initialRefreshToken = registerRes.body.refreshToken;

      const refreshRes = await request(app.getHttpServer())
        .post(`${BASE}/auth/refresh`)
        .send({ refreshToken: initialRefreshToken })
        .expect(200);

      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.refreshToken).toBeDefined();
      expect(refreshRes.body.refreshToken).not.toBe(initialRefreshToken);

      await request(app.getHttpServer())
        .post(`${BASE}/auth/refresh`)
        .send({ refreshToken: initialRefreshToken })
        .expect(401);
    });

    it('returns 401 for an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/refresh`)
        .send({ refreshToken: 'this.is.not.a.valid.jwt' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('invalidates the current refresh-token family', async () => {
      const registerRes = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE}/auth/logout`)
        .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .post(`${BASE}/auth/refresh`)
        .send({ refreshToken: registerRes.body.refreshToken })
        .expect(401);
    });

    it('returns 401 without a bearer token', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/logout`)
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('returns the current user for a valid bearer token', async () => {
      const registerRes = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
        .expect(200);

      expect(res.body.user.email).toBe('john@nexus-test.com');
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.tokenVersion).toBeUndefined();
    });

    it('returns 401 without Authorization', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .expect(401);
    });

    it('returns 401 for a tampered bearer token', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.fake.payload')
        .expect(401);
    });
  });
});
