import type { UserRole } from "@/lib/auth/types";

export function getDefaultRouteForRole(role: UserRole | null | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "OPERATOR") return "/operator/dashboard";
  return "/dashboard";
}

export function getSafeRedirect(
  value: string | null | undefined,
  role?: UserRole | null,
) {
  const fallback = getDefaultRouteForRole(role);

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (
    value.startsWith("/api/") ||
    value.startsWith("/login") ||
    value.startsWith("/register")
  ) {
    return fallback;
  }

  return value;
}
