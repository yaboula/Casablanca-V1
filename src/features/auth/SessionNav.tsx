import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultRouteForRole } from "./auth-redirects";
import { LogoutButton } from "./LogoutButton";

export async function SessionNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors" href="/login">
          Login
        </Link>
        <Link
          className="inline-flex h-9 items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-[#1e41fc]"
          href="/register"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-4">
      <span className="text-xs font-medium text-neutral-400">
        {user.fullName || user.email}
      </span>
      <Link
        className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
        href={getDefaultRouteForRole(user.role)}
      >
        Dashboard
      </Link>
      {user.role === "OPERATOR" || user.role === "ADMIN" ? (
        <Link className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors" href="/operator/dashboard">
          Operator
        </Link>
      ) : null}
      {user.role === "ADMIN" ? (
        <Link className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors" href="/admin">
          Admin
        </Link>
      ) : null}
      <LogoutButton />
    </div>
  );
}
