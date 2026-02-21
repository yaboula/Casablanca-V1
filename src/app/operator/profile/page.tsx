"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";

export default function OperatorProfilePage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const user = useUser();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      // proceed regardless
    }
    toast.success("Sesión cerrada");
    setLoggingOut(false);
    router.push("/");
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      <h1 className="text-lg font-bold text-slate-900 mb-6">Mi Perfil</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
          <User className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">{user?.fullName ?? "Operador"}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500">{user?.role ?? "Operador"}</span>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-200 mb-5 shadow-sm">
        <ProfileRow icon={Mail} label="Email" value={user?.email ?? "—"} />
        <ProfileRow icon={Shield} label="Rol" value={user?.role ?? "Operador"} />
      </div>

      {/* Stats */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Estadísticas del mes
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xl font-black text-slate-900">47</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Entregas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-emerald-500">98%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">A tiempo</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-slate-900">4.9</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Valoración</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full min-h-[50px] bg-red-50 text-red-600 font-bold text-sm rounded-xl
                   flex items-center justify-center gap-2 hover:bg-red-100
                   disabled:opacity-50 transition-all"
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? "Cerrando..." : "Cerrar sesión"}
      </button>
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}
