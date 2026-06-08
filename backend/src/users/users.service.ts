import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Find user by email — includes passwordHash for auth validation.
   * The passwordHash column is hidden by default (select: false) so we
   * must add it explicitly via addSelect.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .addSelect('user.tokenVersion')
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id, isActive: true } });
  }

  async findByIdWithTokenVersion(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.tokenVersion')
      .where('user.id = :id', { id })
      .andWhere('user.isActive = true')
      .getOne();
  }

  async updateMe(
    id: string,
    data: { phone?: string | null },
  ): Promise<User> {
    await this.usersRepo.update(id, {
      ...(data.phone !== undefined && { phone: data.phone }),
    });
    return this.usersRepo.findOneOrFail({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    const existing = await this.usersRepo.findOne({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este email.');
    }

    const user = this.usersRepo.create({
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      fullName: input.fullName.trim(),
      phone: input.phone ?? null,
      role: input.role ?? UserRole.USER,
    });

    return this.usersRepo.save(user);
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await this.usersRepo.increment({ id }, 'tokenVersion', 1);
  }
}
