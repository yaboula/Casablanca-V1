import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Reservation } from "../../reservations/reservation.entity";

/**
 * Full-text search across reservations for the operator floor panel.
 * Supports: customerName, customerPhone, reservation UUID.
 *
 * SRP: search only — no delivery/document logic.
 */
@Injectable()
export class OperatorSearchService {
  private readonly logger = new Logger(OperatorSearchService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
  ) {}

  /**
   * Case-insensitive ILIKE search.
   * Min 2 chars to avoid full-table scans.
   * Paginated: default limit 20, max 100.
   */
  async search(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: Reservation[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException(
        "El término de búsqueda debe tener al menos 2 caracteres.",
      );
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const q = `%${query.trim()}%`;

    const [data, total] = await this.reservationsRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.vehicle", "v")
      .where("r.customerName ILIKE :q", { q })
      .orWhere("r.customerPhone ILIKE :q", { q })
      .orWhere("CAST(r.id AS TEXT) ILIKE :q", { q })
      .orderBy("r.createdAt", "DESC")
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    this.logger.log(
      `search("${query.trim()}") → ${total} results (page ${safePage})`,
    );

    return { data, total, page: safePage, limit: safeLimit };
  }
}
