import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Users, Car } from "lucide-react";

export const metadata: Metadata = { title: "Administración · NEXUS" };

export default async function AdminLandingPage() {
  const cookieStore = await cookies();
  const rawUser = cookieStore.get("nexus_user")?.value;
  let role = "";
  try {
    role = rawUser ? JSON.parse(decodeURIComponent(rawUser)).role : "";
  } catch {}
  if (role !== "ADMIN") redirect("/operator/dashboard");

  const cards = [
    {
      href: "/operator/admin/stats",
      icon: BarChart3,
      title: "Estadísticas",
      description: "Ingresos, reservas, tendencias y top vehículos",
      color: "bg-violet-50 text-violet-700 border-violet-100",
      iconBg: "bg-violet-100",
    },
    {
      href: "/operator/admin/users",
      icon: Users,
      title: "Usuarios",
      description: "Gestión de cuentas, roles y estado de activación",
      color: "bg-blue-50 text-blue-700 border-blue-100",
      iconBg: "bg-blue-100",
    },
    {
      href: "/operator/admin/vehicles",
      icon: Car,
      title: "Flota",
      description: "Añadir, editar y desactivar vehículos del catálogo",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      iconBg: "bg-emerald-100",
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-8">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full border border-violet-200 mb-3">
          ADMIN
        </span>
        <h1 className="text-2xl font-black text-slate-900">Panel de Administración</h1>
        <p className="text-sm text-slate-500 mt-1">Control total de la plataforma NEXUS.</p>
      </div>

      <div className="space-y-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`flex items-center gap-4 p-5 rounded-2xl border ${card.color} transition-opacity hover:opacity-80`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-base">{card.title}</p>
                <p className="text-sm opacity-75 mt-0.5">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
