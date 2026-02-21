import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeContext(user: any, roles: UserRole[] | null | undefined): ExecutionContext {
  const mockReflector = {
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector;

  const guard = new RolesGuard(mockReflector);

  const mockRequest = { user };
  const ctx = {
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
  } as unknown as ExecutionContext;

  return { ctx, guard, mockReflector } as any;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  afterEach(() => jest.clearAllMocks());

  const makeCtx = (user: any): ExecutionContext =>
    ({
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext);

  it('permite acceso si no hay @Roles() — ruta pública/JWT-only', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeCtx({ id: 'u1', role: UserRole.USER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite acceso si @Roles() está vacío', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = makeCtx({ id: 'u1', role: UserRole.USER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite acceso si el rol del usuario coincide', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OPERATOR]);
    const ctx = makeCtx({ id: 'u1', role: UserRole.OPERATOR });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lanza ForbiddenException si el rol no coincide', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = makeCtx({ id: 'u1', role: UserRole.USER });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('lanza ForbiddenException si request.user es null (JWT Guard no ejecutado)', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = makeCtx(null);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('ADMIN tiene acceso a rutas que requieren OPERATOR (si ambos están en @Roles)', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OPERATOR, UserRole.ADMIN]);
    const ctx = makeCtx({ id: 'u1', role: UserRole.ADMIN });

    expect(guard.canActivate(ctx)).toBe(true);
  });
});
