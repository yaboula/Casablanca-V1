import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  Headers,
  DefaultValuePipe,
  ParseIntPipe,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QuoteReservationDto } from './dto/quote-reservation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * POST /api/v1/reservations
   * Creates a new reservation (Saga: DB lock + Stripe PI + PENDING_DEPOSIT).
   * Returns the reservation including stripeClientSecret for frontend payment confirmation.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: User,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const reservation = await this.reservationsService.create(
      dto,
      user,
      idempotencyKey,
    );
    return { data: reservation };
  }

  /**
   * POST /api/v1/reservations/quote
   * Returns authoritative backend pricing and availability without creating
   * a reservation or Stripe PaymentIntent.
   */
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  async quote(@Body() dto: QuoteReservationDto) {
    const quote = await this.reservationsService.quote(dto);
    return { data: quote };
  }

  /**
   * GET /api/v1/reservations/my
   * Returns the customer's own reservations.
   * Staff must use /operator endpoints; this route never lists all bookings.
   */
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async findMy(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reservationsService.findMy(user, { page, limit });
  }

  /**
   * GET /api/v1/reservations/:id/ticket
   * Issues a signed backend-owned ticket token for the owning customer.
   */
  @Get(':id/ticket')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async issueTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const ticket = await this.reservationsService.issueTicketToken(id, user);
    return { data: ticket };
  }

  /**
   * GET /api/v1/reservations/:id/payment-intent
   * Returns the minimum Stripe Elements recovery payload for the owning
   * customer while the reservation is still awaiting deposit authorization.
   */
  @Get(':id/payment-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async getPaymentIntent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const paymentIntent = await this.reservationsService.getPaymentIntentRecovery(
      id,
      user,
    );
    return { data: paymentIntent };
  }

  /**
   * GET /api/v1/reservations/:id
   * Returns a customer's own reservation.
   * Staff must use /operator endpoints.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const reservation = await this.reservationsService.findById(id, user);
    return { data: reservation };
  }

  /**
   * PATCH /api/v1/reservations/:id/cancel
   * Customer cancels an eligible own reservation.
   * Staff cancellation must go through audited staff workflows.
   */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const reservation = await this.reservationsService.cancel(id, user);
    return { data: reservation };
  }

  /**
   * PATCH /api/v1/reservations/:id/complete
   * Operator marks IN_PROGRESS → COMPLETED (vehicle returned).
   * OPERATOR and ADMIN only.
   */
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async complete(@Param('id', ParseUUIDPipe) id: string) {
    const reservation = await this.reservationsService.complete(id);
    return { data: reservation };
  }
}
