import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users/me
   * Returns the currently authenticated user's profile.
   */
  @Get('me')
  me(@CurrentUser() user: User) {
    return { data: user };
  }

  /**
   * PATCH /api/v1/users/me
   * Allows a user to update their own updatable fields (currently: phone).
   * Email and fullName changes require admin action or a dedicated flow.
   */
  @Patch('me')
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateMeDto,
  ) {
    const updated = await this.usersService.updateMe(user.id, {
      phone: dto.phone,
    });
    return { data: updated };
  }
}
