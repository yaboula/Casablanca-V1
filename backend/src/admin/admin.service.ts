import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Vehicle, VehicleStatus } from '../vehicles/vehicle.entity';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { UpdateUserDto, CreateVehicleDto, UpdateVehicleDto } from './dto/admin.dto';

export interface AdminStats {
  kpi: {
    totalRevenueEurCents: number;
    totalBookings: number;
    activeUsers: number;
    activeVehicles: number;
  };
  bookingsByStatus: Array<{ status: string; count: number }>;
  weeklyTrend: Array<{ week: string; bookings: number; revenueEurCents: number }>;
  topVehicles: Array<{
    id: string;
    brand: string;
    model: string;
    category: string;
    bookings: number;
  }>;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Stats ───────────────────────────────────────────────────────────────

  async getStats(): Promise<AdminStats> {
    const db = this.dataSource;

    // Total revenue — CONFIRMED + IN_PROGRESS + COMPLETED
    const revenueResult: Array<{ total: string | null }> = await db.query(`
      SELECT COALESCE(SUM(total_price_eur_cents), 0)::text AS total
      FROM reservations
      WHERE status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
    `);
    const totalRevenueEurCents = parseInt(revenueResult[0]?.total ?? '0', 10);

    // Total bookings
    const totalBookings = await this.reservationsRepo.count();

    // Active users
    const activeUsers = await this.usersRepo.count({ where: { isActive: true } });

    // Active vehicles
    const activeVehicles = await this.vehiclesRepo.count({
      where: { status: VehicleStatus.AVAILABLE },
    });

    // Bookings by status
    const statusRows: Array<{ status: string; count: string }> = await db.query(`
      SELECT status, COUNT(*)::text AS count
      FROM reservations
      GROUP BY status
      ORDER BY count DESC
    `);
    const bookingsByStatus = statusRows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));

    // Weekly trend — last 4 weeks
    const weeklyRows: Array<{
      week: string;
      bookings: string;
      revenue: string;
    }> = await db.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') AS week,
        COUNT(*)::text AS bookings,
        COALESCE(SUM(total_price_eur_cents), 0)::text AS revenue
      FROM reservations
      WHERE created_at >= NOW() - INTERVAL '4 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week ASC
    `);
    const weeklyTrend = weeklyRows.map((r) => ({
      week: r.week,
      bookings: parseInt(r.bookings, 10),
      revenueEurCents: parseInt(r.revenue, 10),
    }));

    // Top 5 vehicles by bookings
    const topRows: Array<{
      id: string;
      brand: string;
      model: string;
      category: string;
      bookings: string;
    }> = await db.query(`
      SELECT
        v.id,
        v.brand,
        v.model,
        v.category,
        COUNT(r.id)::text AS bookings
      FROM vehicles v
      LEFT JOIN reservations r ON r.vehicle_id = v.id
      GROUP BY v.id, v.brand, v.model, v.category
      ORDER BY bookings DESC
      LIMIT 5
    `);
    const topVehicles = topRows.map((r) => ({
      id: r.id,
      brand: r.brand,
      model: r.model,
      category: r.category,
      bookings: parseInt(r.bookings, 10),
    }));

    return {
      kpi: { totalRevenueEurCents, totalBookings, activeUsers, activeVehicles },
      bookingsByStatus,
      weeklyTrend,
      topVehicles,
    };
  }

  // ── Users ───────────────────────────────────────────────────────────────

  async listUsers(
    page = 1,
    limit = 20,
    q?: string,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const qb = this.usersRepo
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.where(
        'LOWER(user.email) LIKE :q OR LOWER(user.fullName) LIKE :q',
        { q: `%${q.toLowerCase()}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado.`);

    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    return this.usersRepo.save(user);
  }

  // ── Vehicles ─────────────────────────────────────────────────────────

  async listAllVehicles(): Promise<Vehicle[]> {
    return this.vehiclesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createVehicle(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehiclesRepo.create({
      brand: dto.brand,
      model: dto.model,
      category: dto.category,
      pricePerDayEurCents: dto.pricePerDayEurCents,
      imageUrl: dto.imageUrl,
      transmission: dto.transmission,
      seats: dto.seats,
      luggageCount: dto.luggageCount,
      features: dto.features ?? [],
      status: dto.status ?? VehicleStatus.AVAILABLE,
    });
    return this.vehiclesRepo.save(vehicle);
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado.`);

    Object.assign(vehicle, dto);
    return this.vehiclesRepo.save(vehicle);
  }

  async deleteVehicle(id: string): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado.`);

    const activeReservations = await this.reservationsRepo.count({
      where: [
        { vehicleId: id, status: ReservationStatus.CONFIRMED },
        { vehicleId: id, status: ReservationStatus.IN_PROGRESS },
        { vehicleId: id, status: ReservationStatus.PENDING_DEPOSIT },
        { vehicleId: id, status: ReservationStatus.AWAITING_CAPTURE },
      ],
    });

    if (activeReservations > 0) {
      throw new BadRequestException(
        'No se puede eliminar un vehículo con reservas activas.',
      );
    }

    vehicle.status = VehicleStatus.INACTIVE;
    await this.vehiclesRepo.save(vehicle);
  }

  /**
   * Permanent hard-delete — removes the row from DB.
   * Blocked if vehicle has any reservation (any status).
   */
  async hardDeleteVehicle(id: string): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado.`);

    const anyReservation = await this.reservationsRepo.count({
      where: { vehicleId: id },
    });

    if (anyReservation > 0) {
      throw new BadRequestException(
        'No se puede eliminar permanentemente un vehículo con historial de reservas.',
      );
    }

    await this.vehiclesRepo.remove(vehicle);
  }
}
