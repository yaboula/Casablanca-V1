import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import { hasRole } from "./guards";
import type { CurrentUser, UserRole } from "./types";

export async function requireAuthenticatedUser(
  redirectTo: string,
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  return user;
}

export async function requireRouteRole(
  roles: UserRole[],
  redirectTo: string,
): Promise<{ user: CurrentUser; forbidden: false } | { user: CurrentUser; forbidden: true }> {
  const user = await requireAuthenticatedUser(redirectTo);

  if (!hasRole(user, roles)) {
    return { user, forbidden: true };
  }

  return { user, forbidden: false };
}
