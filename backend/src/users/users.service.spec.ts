import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { UsersService, CreateUserInput } from './users.service';
import { User, UserRole } from './user.entity';

// ─── Factory ──────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    fullName: 'Test User',
    phone: null,
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as User;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

const mockQbChain = {
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};

const mockUsersRepo = {
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQbChain),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUsersRepo.createQueryBuilder.mockReturnValue(mockQbChain);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  // ── create() ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    const input: CreateUserInput = {
      email: '  JOHN@Example.COM  ',
      passwordHash: '$2b$12$abc',
      fullName: '  John Doe  ',
      phone: '+34600000000',
    };

    it('normaliza email a lowercase/trim y fullName a trim antes de guardar', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      const saved = makeUser({ email: 'john@example.com', fullName: 'John Doe' });
      mockUsersRepo.create.mockReturnValue(saved);
      mockUsersRepo.save.mockResolvedValue(saved);

      const result = await service.create(input);

      expect(mockUsersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
          fullName: 'John Doe',
        }),
      );
      expect(result.email).toBe('john@example.com');
    });

    it('asigna rol USER por defecto si no se especifica role', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      const saved = makeUser({ role: UserRole.USER });
      mockUsersRepo.create.mockReturnValue(saved);
      mockUsersRepo.save.mockResolvedValue(saved);

      const result = await service.create({ ...input, role: undefined });

      expect(mockUsersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.USER }),
      );
      expect(result.role).toBe(UserRole.USER);
    });

    it('lanza ConflictException si el email ya existe', async () => {
      mockUsersRepo.findOne.mockResolvedValue(makeUser());

      await expect(service.create(input)).rejects.toThrow(ConflictException);
      expect(mockUsersRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── findByEmailWithPassword() ──────────────────────────────────────────────

  describe('findByEmailWithPassword()', () => {
    it('usa createQueryBuilder con addSelect para incluir passwordHash (select:false)', async () => {
      const user = makeUser({ passwordHash: '$2b$12$secret' });
      mockQbChain.getOne.mockResolvedValue(user);

      const result = await service.findByEmailWithPassword('test@example.com');

      expect(mockUsersRepo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQbChain.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(mockQbChain.where).toHaveBeenCalledWith(
        'user.email = :email',
        expect.objectContaining({ email: 'test@example.com' }),
      );
      expect(result?.passwordHash).toBe('$2b$12$secret');
    });

    it('normaliza email a lowercase/trim antes de buscar', async () => {
      mockQbChain.getOne.mockResolvedValue(null);

      await service.findByEmailWithPassword('  USER@Example.COM  ');

      expect(mockQbChain.where).toHaveBeenCalledWith(
        'user.email = :email',
        expect.objectContaining({ email: 'user@example.com' }),
      );
    });

    it('devuelve null si el usuario no existe', async () => {
      mockQbChain.getOne.mockResolvedValue(null);

      const result = await service.findByEmailWithPassword('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  // ── findById() ─────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('busca por id con isActive:true', async () => {
      const user = makeUser();
      mockUsersRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('user-123');

      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123', isActive: true },
      });
      expect(result?.id).toBe('user-123');
    });

    it('devuelve null para usuario desactivado', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      const result = await service.findById('inactive-user');
      expect(result).toBeNull();
    });
  });

  // ── updateMe() ─────────────────────────────────────────────────────────────

  describe('updateMe()', () => {
    it('actualiza phone cuando el valor está definido', async () => {
      const updated = makeUser({ phone: '+34611111111' });
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });
      mockUsersRepo.findOneOrFail.mockResolvedValue(updated);

      const result = await service.updateMe('user-123', { phone: '+34611111111' });

      expect(mockUsersRepo.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ phone: '+34611111111' }),
      );
      expect(result.phone).toBe('+34611111111');
    });

    it('no incluye phone en el update si es undefined (campo no tocado)', async () => {
      const user = makeUser();
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });
      mockUsersRepo.findOneOrFail.mockResolvedValue(user);

      await service.updateMe('user-123', {});

      expect(mockUsersRepo.update).toHaveBeenCalledWith('user-123', {});
    });
  });
});
