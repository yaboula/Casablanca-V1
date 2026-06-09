export function getSafeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (
    value.startsWith("/api/") ||
    value.startsWith("/login") ||
    value.startsWith("/register")
  ) {
    return "/dashboard";
  }

  return value;
}
