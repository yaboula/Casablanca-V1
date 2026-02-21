/**
 * Auth Integration Tests — Level 2
 * =====================================================================
 * Tests the full HTTP request lifecycle:
 *   Client → Controller → Service → Repository → Real PostgreSQL
 *
 * External mocks: Stripe (not used here), BullMQ (not used here)
 * Isolation: truncateAllTables() before each test
 * =====================================================================
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../setup/test-app';
import { truncateAllTables } from '../setup/db-helpers';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE = '/api/v1';
const VALID_USER = {
  email: 'john@nexus-test.com',
  password: 'SecurePass123!',
  fullName: 'John Test',
  phone: '+34600000000',
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Auth — Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(app);
  });

  // ── POST /auth/register ─────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('201 — devuelve accessToken + refreshToken + user sin passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.expiresIn).toBeDefined();
      expect(res.body.user.email).toBe('john@nexus-test.com');
      expect(res.body.user.role).toBe('USER');
      // passwordHash NUNCA debe estar en la respuesta
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('201 — email normalizado a lowercase en la BD (case-insensitive)', async () => {
      // Send uppercase email — service normalizes to lowercase before saving
      const res = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send({ ...VALID_USER, email: 'JOHN@NEXUS-TEST.COM' })
        .expect(201);

      // Stored as lowercase
      expect(res.body.user.email).toBe('john@nexus-test.com');
    });

    it('409 — email duplicado devuelve Conflict', async () => {
      // Primera vez: ok
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(201);

      // Segunda vez: conflict
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER)
        .expect(409);
    });

    it('400 — cuerpo inválido (sin email) devuelve Bad Request', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send({ password: 'SecurePass123!', fullName: 'Test' })
        .expect(400);
    });

    it('400 — password corto (<8 chars) devuelve Bad Request', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send({ ...VALID_USER, password: 'short' })
        .expect(400);
    });
  });

  // ── POST /auth/login ────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Seed a user for login tests
      await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER);
    });

    it('200 — credenciales correctas devuelven tokens', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: VALID_USER.email, password: VALID_USER.password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('401 — contraseña incorrecta (mismo mensaje que usuario inexistente — anti-enum)', async () => {
      const resWrongPass = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: VALID_USER.email, password: 'WrongPass999!' })
        .expect(401);

      const resNoUser = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: 'nobody@nexus-test.com', password: 'AnyPass123!' })
        .expect(401);

      // El mensaje debe ser idéntico — prevención de user enumeration
      expect(resWrongPass.body.message).toBe(resNoUser.body.message);
    });

    it('401 — usuario no existe devuelve Unauthorized', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: 'nonexistent@nexus.com', password: 'AnyPass123!' })
        .expect(401);
    });
  });

  // ── POST /auth/refresh ──────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('200 — refresh token válido emite nuevos tokens', async () => {
      // Register + get refresh token
      const registerRes = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER);

      const { refreshToken } = registerRes.body;

      const res = await request(app.getHttpServer())
        .post(`${BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('401 — refresh token inválido/manipulado devuelve Unauthorized', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/refresh`)
        .send({ refreshToken: 'this.is.not.a.valid.jwt' })
        .expect(401);
    });
  });

  // ── GET /auth/me ────────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('200 — con Bearer válido devuelve el usuario actual', async () => {
      const registerRes = await request(app.getHttpServer())
        .post(`${BASE}/auth/register`)
        .send(VALID_USER);

      const { accessToken } = registerRes.body;

      const res = await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.user.email).toBe('john@nexus-test.com');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('401 — sin Authorization header devuelve Unauthorized', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .expect(401);
    });

    it('401 — Bearer manipulado devuelve Unauthorized', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.fake.payload')
        .expect(401);
    });
  });
});
