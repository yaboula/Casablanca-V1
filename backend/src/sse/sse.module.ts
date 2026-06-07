import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SseService } from "./sse.service";
import { SseController } from "./sse.controller";
import { Reservation } from "../reservations/reservation.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  providers: [SseService],
  controllers: [SseController],
  exports: [SseService],
})
export class SseModule {}
