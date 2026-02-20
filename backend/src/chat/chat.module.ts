import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';
import { Reservation } from '../reservations/reservation.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, Reservation]),
    SseModule,
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
