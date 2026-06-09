import type { CurrentUser, UserRole } from "./types";

export const ROLE_ORDER: Record<UserRole, number> = {
  USER: 1,
  OPERATOR: 2,
  ADMIN: 3,
};

export function hasRole(user: CurrentUser | null | undefined, roles: UserRole[]) {
  return Boolean(user && roles.includes(user.role));
}

export function hasMinimumRole(
  user: CurrentUser | null | undefined,
  minimumRole: UserRole,
) {
  if (!user) return false;
  return ROLE_ORDER[user.role] >= ROLE_ORDER[minimumRole];
}

export function canAccessCustomer(user: CurrentUser | null | undefined) {
  return hasMinimumRole(user, "USER");
}

export function canAccessOperator(user: CurrentUser | null | undefined) {
  return hasMinimumRole(user, "OPERATOR");
}

export function canAccessAdmin(user: CurrentUser | null | undefined) {
  return hasRole(user, ["ADMIN"]);
}
