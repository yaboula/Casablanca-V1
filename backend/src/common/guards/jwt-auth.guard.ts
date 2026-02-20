import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard that validates the JWT Bearer token in the Authorization header.
 * Attaches the authenticated User to request.user on success.
 * Throws 401 Unauthorized if the token is missing, expired, or invalid.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}
