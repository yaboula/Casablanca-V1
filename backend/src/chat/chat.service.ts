import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { Reservation } from '../reservations/reservation.entity';
import { User, UserRole } from '../users/user.entity';
import { SseService } from '../sse/sse.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    private readonly sseService: SseService,
  ) {}

  /**
   * Persists a chat message and emits SSE to operator panel.
   * Replaces the /api/chat Next.js API route.
   */
  async create(dto: CreateMessageDto, user: User): Promise<ChatMessage> {
    // Validate reservation if provided
    if (dto.reservationId) {
      const reservation = await this.reservationsRepo.findOne({
        where: { id: dto.reservationId },
      });

      if (!reservation) {
        throw new NotFoundException(`Reserva ${dto.reservationId} no encontrada.`);
      }

      // User can only send messages for their own reservations
      if (user.role === UserRole.USER && reservation.userId !== user.id) {
        throw new ForbiddenException('No tienes acceso a esta reserva.');
      }
    }

    const message = this.chatRepo.create({
      userId: user.id,
      reservationId: dto.reservationId ?? null,
      text: dto.text,
      sender: user.role === UserRole.USER ? 'user' : 'operator',
      status: 'sent',
    });

    const saved = await this.chatRepo.save(message);

    // Emit to operator SSE stream in real-time
    this.sseService.emitNewChatMessage({
      id: saved.id,
      text: saved.text,
      sender: saved.sender,
      userId: saved.userId,
      reservationId: saved.reservationId,
      timestamp: saved.timestamp.toISOString(),
    });

    return saved;
  }

  /**
   * Returns all messages for a reservation, ordered chronologically.
   * USER can only view their own reservation's chat.
   */
  async findByReservation(
    reservationId: string,
    user: User,
  ): Promise<ChatMessage[]> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${reservationId} no encontrada.`);
    }

    if (
      user.role === UserRole.USER &&
      reservation.userId !== user.id
    ) {
      throw new ForbiddenException('No tienes acceso a esta reserva.');
    }

    return this.chatRepo.find({
      where: { reservationId },
      order: { timestamp: 'ASC' },
    });
  }
}
