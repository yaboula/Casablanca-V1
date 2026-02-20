import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/user.entity';

/**
 * Extracts the authenticated user from the request object.
 * Only works behind JwtAuthGuard.
 *
 * @example
 *   @Get('me')
 *   @UseGuards(JwtAuthGuard)
 *   getMe(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: keyof User | undefined, ctx: ExecutionContext): User | User[keyof User] => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;
    return _data ? user?.[_data] : user;
  },
);
