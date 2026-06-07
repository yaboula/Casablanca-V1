import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminStatsService } from "./services/admin-stats.service";
import { AdminUsersService } from "./services/admin-users.service";
import { AdminVehiclesService } from "./services/admin-vehicles.service";
import { User } from "../users/user.entity";
import { Vehicle } from "../vehicles/vehicle.entity";
import { Reservation } from "../reservations/reservation.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Vehicle, Reservation])],
  controllers: [AdminController],
  providers: [
    // Sub-services (SRP)
    AdminStatsService,
    AdminUsersService,
    AdminVehiclesService,
    // Facade (backwards-compatible public API)
    AdminService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
