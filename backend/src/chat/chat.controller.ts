import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /api/v1/chat
   * Replaces the Next.js API route /api/chat.
   * Persists the message and notifies the operator via SSE.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    const message = await this.chatService.create(dto, user);
    return {
      success: true,
      messageId: dto.messageId,
      data: message,
      receivedAt: message.timestamp,
    };
  }

  /**
   * GET /api/v1/chat/:reservationId
   * Returns full chat history for a reservation (ASC order).
   */
  @Get(':reservationId')
  async findByReservation(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @CurrentUser() user: User,
  ) {
    const messages = await this.chatService.findByReservation(
      reservationId,
      user,
    );
    return { data: messages, total: messages.length };
  }
}
