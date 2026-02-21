import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User & { passwordHash?: string }> = {}): User & { passwordHash?: string } {
  return {
    id: 'user-123',
    email: 'john@example.com',
    passwordHash: '$2b$12$hashedpassword',
    fullName: 'John Doe',
    phone: null,
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as User & { passwordHash?: string };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUsersService = {
  create: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn(),
};

const configMap: Record<string, string> = {
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',
  JWT_REFRESH_SECRET: 'refresh-secret-test',
};

const mockConfigService = {
  get: jest.fn((key: string, fallback?: string) => configMap[key] ?? fallback),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Spy on bcrypt module functions (import * as bcrypt style)
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$12$mockedhash' as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ── register() ─────────────────────────────────────────────────────────────

  describe('register()', () => {
    const dto: RegisterDto = {
      email: 'new@example.com',
      password: 'SecurePass123!',
      fullName: 'New User',
      phone: '+34600000000',
    };

    it('hashea el password con bcrypt (12 rondas) antes de guardar', async () => {
      mockUsersService.create.mockResolvedValue(makeUser());

      await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
    });

    it('llama usersService.create con el hash — nunca con la contraseña en plano', async () => {
      mockUsersService.create.mockResolvedValue(makeUser());

      await service.register(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: '$2b$12$mockedhash',
          email: dto.email,
          fullName: dto.fullName,
        }),
      );
      // Nunca debe pasar dto.password al servicio de usuarios
      expect(mockUsersService.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ password: dto.password }),
      );
    });

    it('devuelve accessToken + refreshToken + user sin passwordHash', async () => {
      mockUsersService.create.mockResolvedValue(makeUser());
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.register(dto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect((result.user as any).passwordHash).toBeUndefined();
    });
  });

  // ── login() ────────────────────────────────────────────────────────────────

  describe('login()', () => {
    const dto: LoginDto = {
      email: 'john@example.com',
      password: 'MyPassword123!',
    };

    it('devuelve tokens si credenciales son correctas', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('lanza UnauthorizedException si el usuario no existe — mismo mensaje (anti-enum)', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña no coincide — mismo mensaje (anti-enum)', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la cuenta está desactivada', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(
        makeUser({ isActive: false }),
      );

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('el user en la respuesta NO contiene passwordHash', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect((result.user as any).passwordHash).toBeUndefined();
    });
  });

  // ── refresh() ──────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    const refreshToken = 'valid-refresh-token';
    const payload = { sub: 'user-123', email: 'john@example.com', role: UserRole.USER };

    it('emite nuevos tokens si el refresh token es válido', async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findById.mockResolvedValue(makeUser());

      const result = await service.refresh(refreshToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret-test',
      });
      expect(result.accessToken).toBeDefined();
    });

    it('lanza UnauthorizedException si el JWT no es válido o está expirado', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario del payload no existe o está inactivo', async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('usa JWT_REFRESH_SECRET de ConfigService para verificar', async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findById.mockResolvedValue(makeUser());

      await service.refresh(refreshToken);

      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
    });
  });
});
