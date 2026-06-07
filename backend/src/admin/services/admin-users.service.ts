import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../users/user.entity";
import { UpdateUserDto } from "../dto/admin.dto";

/**
 * Admin CRUD for user accounts.
 * Business rules enforced:
 *  - A user cannot change their own role via this endpoint.
 *  - Paginated list with optional full-text search.
 */
@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async listUsers(
    page = 1,
    limit = 20,
    q?: string,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const qb = this.usersRepo
      .createQueryBuilder("user")
      .orderBy("user.createdAt", "DESC")
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (q?.trim()) {
      qb.where("LOWER(user.email) LIKE :q OR LOWER(user.fullName) LIKE :q", {
        q: `%${q.trim().toLowerCase()}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    this.logger.log(`listUsers(page=${safePage}, q="${q}") → ${total} total`);
    return { data, total, page: safePage, limit: safeLimit };
  }

  async updateUser(
    targetId: string,
    dto: UpdateUserDto,
    requesterId: string,
  ): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: targetId } });
    if (!user)
      throw new NotFoundException(`Usuario ${targetId} no encontrado.`);

    // Guard: nobody can demote/promote themselves
    if (dto.role !== undefined && targetId === requesterId) {
      throw new BadRequestException(
        "No puedes cambiar tu propio rol. Pide a otro administrador.",
      );
    }

    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const saved = await this.usersRepo.save(user);
    this.logger.log(
      `updateUser: ${targetId} by ${requesterId} — role=${dto.role ?? "unchanged"} active=${dto.isActive ?? "unchanged"}`,
    );
    return saved;
  }
}
