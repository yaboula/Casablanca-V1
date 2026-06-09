"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    setIsPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      className="nx-btn-primary inline-flex h-9 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-900 transition-colors duration-300 hover:border-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={logout}
      type="button"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}

