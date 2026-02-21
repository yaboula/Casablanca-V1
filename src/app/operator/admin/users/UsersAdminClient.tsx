"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, UserX, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminUser } from "./page";

const ROLE_OPTIONS = ["USER", "OPERATOR", "ADMIN"] as const;
const ROLE_COLORS: Record<string, string> = {
  USER:     "bg-slate-100 text-slate-600",
  OPERATOR: "bg-blue-100 text-blue-700",
  ADMIN:    "bg-violet-100 text-violet-700",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UsersAdminClient({
  users: initialUsers,
  total,
  page,
  limit,
  initialQ,
}: {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  initialQ: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialQ);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);

  function doSearch() {
    const qs = new URLSearchParams({ page: "1" });
    if (search.trim()) qs.set("q", search.trim());
    startTransition(() => router.push(`/operator/admin/users?${qs}`));
  }

  async function patchUser(id: string, body: Record<string, unknown>) {
    setMutatingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message ?? "Error al actualizar");
        return false;
      }
      return true;
    } catch {
      toast.error("Error de conexión");
      return false;
    } finally {
      setMutatingId(null);
    }
  }

  async function handleRoleChange(user: AdminUser, newRole: string) {
    const ok = await patchUser(user.id, { role: newRole });
    if (ok) {
      toast.success(`Rol actualizado a ${newRole}`);
      startTransition(() => router.refresh());
    }
  }

  async function handleToggleActive(user: AdminUser) {
    const ok = await patchUser(user.id, { isActive: !user.isActive });
    if (ok) {
      toast.success(user.isActive ? "Usuario desactivado" : "Usuario activado");
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">{total} registros</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full border border-violet-200">
          ADMIN
        </span>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Buscar por nombre o email..."
          className="flex-1 h-11 px-4 bg-white border border-slate-200 rounded-xl
                     text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none shadow-sm"
        />
        <button
          onClick={doSearch}
          disabled={isPending}
          className="h-11 px-4 bg-blue-600 text-white font-bold text-sm rounded-xl
                     hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : "Buscar"}
        </button>
      </div>

      {/* User list */}
      <div className="space-y-3">
        {initialUsers.map((user) => {
          const busy = mutatingId === user.id;
          return (
            <div
              key={user.id}
              className={`bg-white border rounded-2xl p-4 shadow-sm transition-opacity ${
                busy ? "opacity-60" : "opacity-100"
              } ${!user.isActive ? "border-red-200" : "border-slate-200"}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-blue-700">{initials(user.fullName)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
                    {!user.isActive && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        INACTIVO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  {user.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Registro: {new Date(user.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>

                {/* Role badge */}
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${ROLE_COLORS[user.role]}`}>
                  {user.role}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                {/* Role select */}
                <div className="relative flex-1">
                  <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    disabled={busy}
                    className="w-full h-9 pl-7 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(user)}
                  disabled={busy}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold transition-colors ${
                    user.isActive
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
                >
                  {user.isActive ? (
                    <><UserX className="w-3.5 h-3.5" />Desactivar</>
                  ) : (
                    <><UserCheck className="w-3.5 h-3.5" />Activar</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            disabled={page <= 1 || isPending}
            onClick={() => {
              const qs = new URLSearchParams({ page: String(page - 1) });
              if (search.trim()) qs.set("q", search.trim());
              startTransition(() => router.push(`/operator/admin/users?${qs}`));
            }}
            className="flex items-center gap-1 h-9 px-3 text-sm font-semibold text-slate-600
                       bg-white border border-slate-200 rounded-xl hover:bg-slate-50
                       disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages || isPending}
            onClick={() => {
              const qs = new URLSearchParams({ page: String(page + 1) });
              if (search.trim()) qs.set("q", search.trim());
              startTransition(() => router.push(`/operator/admin/users?${qs}`));
            }}
            className="flex items-center gap-1 h-9 px-3 text-sm font-semibold text-slate-600
                       bg-white border border-slate-200 rounded-xl hover:bg-slate-50
                       disabled:opacity-40 transition-colors"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
