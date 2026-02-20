import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Marks a route as requiring one or more roles.
 * Must be used with RolesGuard (which must run AFTER JwtAuthGuard).
 *
 * @example
 *   @Roles(UserRole.OPERATOR, UserRole.ADMIN)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Get('all')
 *   findAll() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
