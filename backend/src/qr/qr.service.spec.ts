import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QrService } from './qr.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECRET = 'test-qr-secret-32-chars-minimum!!';

const makeConfig = (secret = SECRET) => ({
  provide: ConfigService,
  useValue: {
    get: jest.fn().mockReturnValue(secret),
  },
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('QrService', () => {
  let service: QrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrService, makeConfig()],
    }).compile();

    service = module.get(QrService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── generateHash() ─────────────────────────────────────────────────────────

  describe('generateHash()', () => {
    it('genera un hash de 64 caracteres hexadecimales (SHA-256)', () => {
      const hash = service.generateHash(
        'res-001',
        'user-001',
        new Date('2025-06-01T10:00:00.000Z'),
      );

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('mismos inputs → mismo hash (idempotente)', () => {
      const pickupDate = new Date('2025-06-01T10:00:00.000Z');
      const hash1 = service.generateHash('res-001', 'user-001', pickupDate);
      const hash2 = service.generateHash('res-001', 'user-001', pickupDate);

      expect(hash1).toBe(hash2);
    });

    it('input diferente → hash diferente', () => {
      const pickupDate = new Date('2025-06-01T10:00:00.000Z');
      const hash1 = service.generateHash('res-001', 'user-001', pickupDate);
      const hash2 = service.generateHash('res-002', 'user-001', pickupDate);

      expect(hash1).not.toBe(hash2);
    });
  });

  // ── verifyHash() ───────────────────────────────────────────────────────────

  describe('verifyHash()', () => {
    it('devuelve true si el hash es correcto', () => {
      const pickupDate = new Date('2025-06-01T10:00:00.000Z');
      const hash = service.generateHash('res-001', 'user-001', pickupDate);

      expect(service.verifyHash(hash, 'res-001', 'user-001', pickupDate)).toBe(true);
    });

    it('devuelve false si el hash ha sido manipulado', () => {
      const pickupDate = new Date('2025-06-01T10:00:00.000Z');
      const tampered = 'a'.repeat(64); // hash no válido

      expect(service.verifyHash(tampered, 'res-001', 'user-001', pickupDate)).toBe(false);
    });

    it('devuelve false si el hash tiene longitud incorrecta (evita crash)', () => {
      const pickupDate = new Date('2025-06-01T10:00:00.000Z');

      // Un hash corto provocaría excepción en timingSafeEqual si no se maneja
      expect(service.verifyHash('abc', 'res-001', 'user-001', pickupDate)).toBe(false);
    });
  });

  describe('ticket tokens', () => {
    it('issues and verifies a signed ticket token', () => {
      const issued = service.issueTicketToken({
        reservationId: 'res-001',
        userId: 'user-001',
        ticketVersion: 2,
        expiresAt: new Date(Date.now() + 60_000),
      });

      const result = service.verifyTicketToken(issued.ticketToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toMatchObject({
        typ: 'reservation-ticket',
        reservationId: 'res-001',
        userId: 'user-001',
        ticketVersion: 2,
      });
    });

    it('rejects tampered ticket tokens', () => {
      const issued = service.issueTicketToken({
        reservationId: 'res-001',
        userId: 'user-001',
        ticketVersion: 0,
        expiresAt: new Date(Date.now() + 60_000),
      });
      const [payload] = issued.ticketToken.split('.');
      const tampered = `${payload}.tampered-signature`;

      expect(service.verifyTicketToken(tampered).valid).toBe(false);
    });

    it('rejects expired ticket tokens', () => {
      const issued = service.issueTicketToken({
        reservationId: 'res-001',
        userId: 'user-001',
        ticketVersion: 0,
        expiresAt: new Date(Date.now() - 60_000),
      });

      const result = service.verifyTicketToken(issued.ticketToken);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EXPIRED');
    });
  });
});
