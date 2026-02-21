"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LogoutButtonProps {
  /** Extra Tailwind classes for custom styling */
  className?: string;
  /** Show spinner while the request is in flight */
  showLoader?: boolean;
}

export default function LogoutButton({
  className = "",
  showLoader = true,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      // even on network error, clear the UI session
    } finally {
      setLoading(false);
    }
    toast.success("Sesión cerrada");
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading && showLoader ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}
      Cerrar sesión
    </button>
  );
}
