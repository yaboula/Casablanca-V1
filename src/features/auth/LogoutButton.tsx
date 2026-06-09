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
      className="min-h-11 rounded-md border border-[var(--nx-line)] px-4 text-sm font-bold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={logout}
      type="button"
    >
      {isPending ? "Saliendo..." : "Cerrar sesion"}
    </button>
  );
}
