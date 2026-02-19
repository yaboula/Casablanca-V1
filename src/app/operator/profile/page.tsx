"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function OperatorProfilePage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  function handleLogout() {
    setLoggingOut(true);
    document.cookie = "nexus_session=; path=/; max-age=0";
    setTimeout(() => {
      toast.success("Sesión cerrada");
      router.push("/");
    }, 500);
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      <h1 className="text-lg font-bold text-white mb-6">Mi Perfil</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
        <div className="w-14 h-14 rounded-full bg-brand-primary/20 flex items-center justify-center">
          <User className="w-7 h-7 text-brand-primary" />
        </div>
        <div>
          <p className="text-base font-bold text-white">Karim Tazi</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Operador CMN</span>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 mb-5">
        <ProfileRow icon={Mail} label="Email" value="karim@nexus.ma" />
        <ProfileRow icon={Phone} label="Teléfono" value="+212 6 00 00 00 00" />
        <ProfileRow icon={Shield} label="Rol" value="Operador" />
      </div>

      {/* Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Estadísticas del mes
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xl font-black text-white">47</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Entregas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-emerald-400">98%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">A tiempo</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-white">4.9</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Valoración</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full min-h-[50px] bg-red-500/15 text-red-400 font-bold text-sm rounded-xl
                   flex items-center justify-center gap-2 hover:bg-red-500/25
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
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value}</p>
      </div>
    </div>
  );
}
