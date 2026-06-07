import { Injectable } from "@nestjs/common";
import { User } from "../users/user.entity";
import { Vehicle } from "../vehicles/vehicle.entity";
import {
  UpdateUserDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from "./dto/admin.dto";
import { AdminStatsService, AdminStats } from "./services/admin-stats.service";
import { AdminUsersService } from "./services/admin-users.service";
import { AdminVehiclesService } from "./services/admin-vehicles.service";

export { AdminStats };

/**
 * Facade  delegates to AdminStatsService, AdminUsersService, AdminVehiclesService.
 * Kept for backwards compatibility with AdminController.
 * Architecture: see docs/REFACTORING_PLAN_ADMIN_OPERATOR.md  ADR-001.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly statsService: AdminStatsService,
    private readonly usersService: AdminUsersService,
    private readonly vehiclesService: AdminVehiclesService,
  ) {}

  //  Stats
  async getStats(): Promise<AdminStats> {
    return this.statsService.getStats();
  }

  //  Users
  async listUsers(page = 1, limit = 20, q?: string) {
    return this.usersService.listUsers(page, limit, q);
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    requesterId = "system",
  ): Promise<User> {
    return this.usersService.updateUser(id, dto, requesterId);
  }

  //  Vehicles
  async listAllVehicles(page = 1, limit = 20) {
    return this.vehiclesService.listAllVehicles(page, limit);
  }

  async createVehicle(dto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehiclesService.createVehicle(dto);
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    return this.vehiclesService.updateVehicle(id, dto);
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.vehiclesService.deleteVehicle(id);
  }

  async hardDeleteVehicle(id: string): Promise<void> {
    return this.vehiclesService.hardDeleteVehicle(id);
  }
}
