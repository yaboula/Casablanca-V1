import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import {
  UpdateUserDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from "./dto/admin.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../users/user.entity";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/stats
   * KPIs, booking trend, top vehicles.
   */
  @Get("stats")
  async getStats() {
    return this.adminService.getStats();
  }

  // ── Users ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/users?page=1&limit=20&q=ahmed
   */
  @Get("users")
  async listUsers(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("q") q?: string,
  ) {
    return this.adminService.listUsers(page, Math.min(limit, 100), q);
  }

  /**
   * PATCH /api/v1/admin/users/:id
   * Change role or active status.
   */
  @Patch("users/:id")
  async updateUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.adminService.updateUser(id, dto);
    return { data: user };
  }

  // ── Vehicles ─────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/vehicles
   * All vehicles regardless of status.
   */
  @Get("vehicles")
  async listAllVehicles(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listAllVehicles(page, Math.min(limit, 100));
  }

  /**
   * POST /api/v1/admin/vehicles
   * Create a new vehicle.
   */
  @Post("vehicles")
  async createVehicle(@Body() dto: CreateVehicleDto) {
    const vehicle = await this.adminService.createVehicle(dto);
    return { data: vehicle };
  }

  /**
   * PATCH /api/v1/admin/vehicles/:id
   * Update vehicle fields.
   */
  @Patch("vehicles/:id")
  async updateVehicle(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    const vehicle = await this.adminService.updateVehicle(id, dto);
    return { data: vehicle };
  }

  /**
   * DELETE /api/v1/admin/vehicles/:id
   * Soft-delete: sets status to INACTIVE.
   * Blocked if vehicle has active reservations.
   */
  @Delete("vehicles/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVehicle(@Param("id", ParseUUIDPipe) id: string) {
    await this.adminService.deleteVehicle(id);
  }

  /**
   * DELETE /api/v1/admin/vehicles/:id/permanent
   * Hard-delete: removes the row from DB.
   * Blocked if vehicle has ANY reservation history.
   */
  @Delete("vehicles/:id/permanent")
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDeleteVehicle(@Param("id", ParseUUIDPipe) id: string) {
    await this.adminService.hardDeleteVehicle(id);
  }
}
