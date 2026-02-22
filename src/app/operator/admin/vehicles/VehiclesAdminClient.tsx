"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, ChevronDown, AlertTriangle, Car, Images } from "lucide-react";
import type { AdminVehicle } from "./page";

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  AVAILABLE:   { label: "Disponible",    color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  RENTED:      { label: "Alquilado",     color: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" },
  MAINTENANCE: { label: "Mantenimiento", color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" },
  INACTIVE:    { label: "Inactivo",      color: "bg-slate-100 text-slate-500",     dot: "bg-slate-400" },
};

const CATEGORY_LABELS: Record<string, string> = {
  SEDAN: "Sedán", SUV: "SUV", LUXURY: "Luxury", COMPACT: "Compact",
};

type DeleteMode = "soft" | "hard";

type VehicleForm = {
  brand: string;
  model: string;
  category: string;
  /** Price in EUR (user-friendly). Converted to cents on submit. */
  priceEur: string;
  imageUrl: string;
  /** Extra gallery images (beyond the main imageUrl). Up to 4. */
  galleryUrls: string[];
  transmission: string;
  seats: string;
  luggageCount: string;
  features: string;
  status: string;
};

const MAX_GALLERY = 4;

const EMPTY_FORM: VehicleForm = {
  brand: "",
  model: "",
  category: "COMPACT",
  priceEur: "",
  imageUrl: "",
  galleryUrls: [""],
  transmission: "MANUAL",
  seats: "5",
  luggageCount: "1",
  features: "",
  status: "AVAILABLE",
};

function vehicleToForm(v: AdminVehicle): VehicleForm {
  // Gallery: all imageUrls except the main one (dedup)
  const extra = (v.imageUrls ?? [])
    .filter((u) => u && u.trim() !== "" && u !== v.imageUrl)
    .slice(0, MAX_GALLERY);
  return {
    brand: v.brand,
    model: v.model,
    category: v.category,
    priceEur: (v.pricePerDayEurCents / 100).toString(),
    imageUrl: v.imageUrl,
    galleryUrls: extra.length > 0 ? extra : [""],
    transmission: v.transmission,
    seats: String(v.seats),
    luggageCount: String(v.luggageCount),
    features: v.features.join(", "),
    status: v.status,
  };
}

type StatusFilter = "ALL" | "AVAILABLE" | "RENTED" | "MAINTENANCE" | "INACTIVE";

const FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "ALL",         label: "Todos" },
  { key: "AVAILABLE",   label: "Disponibles" },
  { key: "RENTED",      label: "Alquilados" },
  { key: "MAINTENANCE", label: "Mantenimiento" },
  { key: "INACTIVE",    label: "Inactivos" },
];

export default function VehiclesAdminClient({
  vehicles: initialVehicles,
}: {
  vehicles: AdminVehicle[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [panel, setPanel] = useState<"closed" | "create" | "edit">("closed");
  const [editTarget, setEditTarget] = useState<AdminVehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ vehicle: AdminVehicle; mode: DeleteMode } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [imgError, setImgError] = useState(false);
  const [galleryErrors, setGalleryErrors] = useState<boolean[]>([]);

  // Filtered list
  const visible = statusFilter === "ALL"
    ? initialVehicles
    : initialVehicles.filter((v) => v.status === statusFilter);

  // Stats by status
  const counts = initialVehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setImgError(false);
    setGalleryErrors([]);
    setPanel("create");
  }

  function openEdit(v: AdminVehicle) {
    setForm(vehicleToForm(v));
    setEditTarget(v);
    setImgError(false);
    setGalleryErrors([]);
    setPanel("edit");
  }

  function closePanel() {
    setPanel("closed");
    setEditTarget(null);
  }

  function setField(key: Exclude<keyof VehicleForm, "galleryUrls">, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "imageUrl") setImgError(false);
  }

  function setGalleryUrl(idx: number, value: string) {
    setForm((prev) => {
      const galleryUrls = [...prev.galleryUrls];
      galleryUrls[idx] = value;
      return { ...prev, galleryUrls };
    });
    setGalleryErrors((prev) => { const next = [...prev]; next[idx] = false; return next; });
  }

  function addGalleryUrl() {
    if (form.galleryUrls.length < MAX_GALLERY) {
      setForm((prev) => ({ ...prev, galleryUrls: [...prev.galleryUrls, ""] }));
    }
  }

  function removeGalleryUrl(idx: number) {
    setForm((prev) => {
      const galleryUrls = prev.galleryUrls.filter((_, i) => i !== idx);
      return { ...prev, galleryUrls: galleryUrls.length > 0 ? galleryUrls : [""] };
    });
    setGalleryErrors((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const priceEurNum = parseFloat(form.priceEur);
    if (isNaN(priceEurNum) || priceEurNum <= 0) {
      toast.error("El precio debe ser un número positivo en euros (ej: 65).");
      setSaving(false);
      return;
    }

    const mainUrl = form.imageUrl.trim();
    if (!mainUrl) {
      toast.error("La imagen principal es obligatoria.");
      setSaving(false);
      return;
    }

    // imageUrls = [main, ...gallery] — deduplicated, no empty strings
    const allImageUrls = [mainUrl, ...form.galleryUrls.map((u) => u.trim())]
      .filter(Boolean)
      .filter((u, i, arr) => arr.indexOf(u) === i);

    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      category: form.category,
      pricePerDayEurCents: Math.round(priceEurNum * 100),
      imageUrl: mainUrl,
      imageUrls: allImageUrls,
      transmission: form.transmission,
      seats: parseInt(form.seats, 10),
      luggageCount: parseInt(form.luggageCount, 10),
      features: form.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      status: form.status,
    };

    try {
      const url =
        panel === "edit" && editTarget
          ? `/api/admin/vehicles/${editTarget.id}`
          : "/api/admin/vehicles";
      const method = panel === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(
          Array.isArray(err.message)
            ? err.message.join(", ")
            : (err.message ?? "Error al guardar")
        );
        return;
      }

      toast.success(panel === "edit" ? "Vehículo actualizado ✓" : "Vehículo creado ✓");
      closePanel();
      startTransition(() => router.refresh());
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vehicle: AdminVehicle, mode: DeleteMode) {
    setConfirmDelete(null);
    setDeletingId(vehicle.id);
    try {
      const url = mode === "hard"
        ? `/api/admin/vehicles/${vehicle.id}/permanent`
        : `/api/admin/vehicles/${vehicle.id}`;

      const res = await fetch(url, { method: "DELETE" });
      if (res.status === 204 || res.ok) {
        toast.success(mode === "hard" ? "Vehículo eliminado permanentemente" : "Vehículo desactivado");
        startTransition(() => router.refresh());
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? "No se pudo eliminar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  }

  // EUR price preview
  const priceHint = (() => {
    const n = parseFloat(form.priceEur);
    if (isNaN(n) || n <= 0) return null;
    return n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  })();

  return (
    <>
      <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Flota</h1>
            <p className="text-sm text-slate-500">{initialVehicles.length} vehículos en total</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 h-10 px-4 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>

        {/* ── Stats summary ───────────────────────────────────── */}
        {initialVehicles.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {(["AVAILABLE","RENTED","MAINTENANCE","INACTIVE"] as const).map((s) => {
              const info = STATUS_LABELS[s];
              return (
                <div key={s} className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${info.dot} mx-auto mb-1`} />
                  <p className="text-lg font-black text-slate-900">{counts[s] ?? 0}</p>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                    {info.label.substring(0, 7)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Filter pills ────────────────────────────────────── */}
        {initialVehicles.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
            {FILTER_OPTIONS.map((f) => {
              const count = f.key === "ALL" ? initialVehicles.length : (counts[f.key] ?? 0);
              const active = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                  <span className={`text-[10px] font-black ${active ? "text-white/70" : "text-slate-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Vehicle list ─────────────────────────────────────── */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Car className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-700 font-semibold">
              {initialVehicles.length === 0 ? "No hay vehículos todavía" : "Sin resultados"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {initialVehicles.length === 0
                ? "Pulsa «Añadir» para crear el primer coche de la flota."
                : "Cambia el filtro para ver otros estados."}
            </p>
            {initialVehicles.length === 0 && (
              <button
                onClick={openCreate}
                className="mt-5 flex items-center gap-1.5 h-10 px-5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Añadir primer vehículo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((v) => {
              const s = STATUS_LABELS[v.status];
              const busy = deletingId === v.id;
              return (
                <div
                  key={v.id}
                  className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-opacity ${
                    busy ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <div className="flex gap-3 p-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                      <Image
                        src={v.imageUrl}
                        alt={`${v.brand} ${v.model}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                        onError={() => {}}
                        unoptimized
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {v.brand} {v.model}
                          </p>
                          <p className="text-xs text-slate-500">
                            {CATEGORY_LABELS[v.category]} · {(v.pricePerDayEurCents / 100).toLocaleString("es-ES")} €/día
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${s.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {v.transmission === "AUTOMATIC" ? "Automático" : "Manual"} · {v.seats} plazas · {v.luggageCount} maletas
                      </p>
                      {v.features.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {v.features.slice(0, 3).map((f) => (
                            <span key={f} className="text-[9px] font-medium bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">
                              {f}
                            </span>
                          ))}
                          {v.features.length > 3 && (
                            <span className="text-[9px] font-medium bg-slate-50 text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded-full">
                              +{v.features.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="border-t border-slate-100 flex">
                    <button
                      onClick={() => openEdit(v)}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                      onClick={() => setConfirmDelete({ vehicle: v, mode: "soft" })}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Desactivar
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                      onClick={() => setConfirmDelete({ vehicle: v, mode: "hard" })}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Borrar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete confirm overlay ───────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              confirmDelete.mode === "hard" ? "bg-red-100" : "bg-amber-100"
            }`}>
              {confirmDelete.mode === "hard"
                ? <AlertTriangle className="w-6 h-6 text-red-600" />
                : <Trash2 className="w-6 h-6 text-amber-600" />
              }
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {confirmDelete.mode === "hard" ? "¿Eliminar permanentemente?" : "¿Desactivar vehículo?"}
            </h3>
            <p className="text-sm text-slate-600 mb-1 font-medium">
              {confirmDelete.vehicle.brand} {confirmDelete.vehicle.model}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              {confirmDelete.mode === "hard"
                ? "Esta acción es IRREVERSIBLE. El vehículo se eliminará definitivamente de la base de datos. Solo posible si no tiene historial de reservas."
                : "El vehículo quedará como INACTIVO y no aparecerá en el catálogo. Puedes reactivarlo editándolo."
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.vehicle, confirmDelete.mode)}
                className={`flex-1 h-11 rounded-2xl text-white text-sm font-bold ${
                  confirmDelete.mode === "hard"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {confirmDelete.mode === "hard" ? "Eliminar para siempre" : "Desactivar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit panel ──────────────────────────────── */}
      {panel !== "closed" && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={closePanel}
        >
          <div
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl max-h-[94dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h2 className="text-lg font-bold text-slate-900">
                {panel === "create" ? "Nuevo vehículo" : "Editar vehículo"}
              </h2>
              <button
                onClick={closePanel}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Image preview */}
            {form.imageUrl && !imgError && (
              <div className="mx-5 mb-2 rounded-2xl overflow-hidden h-36 bg-slate-100 relative">
                <Image
                  src={form.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <span className="absolute bottom-2 left-3 text-white text-xs font-semibold bg-black/30 px-2 py-0.5 rounded-full">
                  Principal
                </span>
                {form.galleryUrls.filter(Boolean).length > 0 && (
                  <span className="absolute bottom-2 right-3 text-white text-xs font-semibold bg-black/30 px-2 py-0.5 rounded-full">
                    +{form.galleryUrls.filter(Boolean).length} en galería
                  </span>
                )}
              </div>
            )}
            {/* Gallery thumbnail strip */}
            {form.galleryUrls.some(Boolean) && (
              <div className="flex gap-2 px-5 mb-4 overflow-x-auto">
                {form.galleryUrls.filter(Boolean).map((url, idx) => (
                  <div key={idx} className="w-14 h-10 rounded-xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
                    <Image
                      src={url}
                      alt={`Galería ${idx + 2}`}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={() =>
                        setGalleryErrors((prev) => { const n = [...prev]; n[idx] = true; return n; })
                      }
                    />
                    {galleryErrors[idx] && (
                      <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
                        <X className="w-3 h-3 text-red-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Marca" required>
                  <input
                    required
                    value={form.brand}
                    onChange={(e) => setField("brand", e.target.value)}
                    placeholder="Renault"
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Modelo" required>
                  <input
                    required
                    value={form.model}
                    onChange={(e) => setField("model", e.target.value)}
                    placeholder="Clio"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Categoría" required>
                  <SelectField
                    value={form.category}
                    onChange={(v) => setField("category", v)}
                    options={[
                      { value: "COMPACT",  label: "Compact" },
                      { value: "SEDAN",    label: "Sedán" },
                      { value: "SUV",      label: "SUV" },
                      { value: "LUXURY",   label: "Luxury" },
                    ]}
                  />
                </FormField>
                <FormField label="Transmisión" required>
                  <SelectField
                    value={form.transmission}
                    onChange={(v) => setField("transmission", v)}
                    options={[
                      { value: "MANUAL",    label: "Manual" },
                      { value: "AUTOMATIC", label: "Automático" },
                    ]}
                  />
                </FormField>
              </div>

              <FormField
                label="Precio por día (€)"
                required
                hint={priceHint ? `= ${priceHint} €/día` : "Introduce el precio en euros (ej: 65 o 65.50)"}
                hintOk={!!priceHint}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">€</span>
                  <input
                    required
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={form.priceEur}
                    onChange={(e) => setField("priceEur", e.target.value)}
                    placeholder="65.00"
                    className="w-full h-11 pl-7 pr-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </FormField>

              <FormField
                label="URL imagen principal"
                required
                hint={imgError ? "URL no válida o imagen no accesible" : "Pega una URL de Unsplash u otro host permitido"}
                hintOk={!imgError && !!form.imageUrl}
              >
                <input
                  required
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setField("imageUrl", e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className={inputCls}
                />
              </FormField>

              {/* ── Gallery images ───────────────────────────────── */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Images className="w-3.5 h-3.5 text-slate-400" />
                  <label className="text-xs font-semibold text-slate-600">
                    Imágenes adicionales (galería)
                  </label>
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {form.galleryUrls.filter(Boolean).length}/{MAX_GALLERY}
                  </span>
                </div>
                <div className="space-y-2">
                  {form.galleryUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setGalleryUrl(idx, e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className={inputCls}
                        />
                        {galleryErrors[idx] && (
                          <p className="text-[11px] mt-0.5 text-red-500">URL no válida o inaccesible</p>
                        )}
                      </div>
                      {/* Thumbnail preview */}
                      {url.trim() && !galleryErrors[idx] && (
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
                          <Image
                            src={url.trim()}
                            alt={`Galería ${idx + 2}`}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={() =>
                              setGalleryErrors((prev) => {
                                const next = [...prev];
                                next[idx] = true;
                                return next;
                              })
                            }
                          />
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeGalleryUrl(idx)}
                        className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors shrink-0"
                        title="Eliminar imagen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {form.galleryUrls.length < MAX_GALLERY && (
                  <button
                    type="button"
                    onClick={addGalleryUrl}
                    className="mt-2 flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Añadir imagen
                  </button>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Estas imágenes aparecerán en la galería del detalle del vehículo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Plazas" required>
                  <input
                    required
                    type="number"
                    min={1}
                    max={9}
                    value={form.seats}
                    onChange={(e) => setField("seats", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Maletas" required>
                  <input
                    required
                    type="number"
                    min={0}
                    max={9}
                    value={form.luggageCount}
                    onChange={(e) => setField("luggageCount", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
              </div>

              <FormField label="Extras (separados por coma)" hint="Ej: Tag Jawaz, SIM 5GB, GPS integrado">
                <input
                  value={form.features}
                  onChange={(e) => setField("features", e.target.value)}
                  placeholder="Tag Jawaz, SIM 5GB, GPS integrado"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Estado">
                <SelectField
                  value={form.status}
                  onChange={(v) => setField("status", v)}
                  options={[
                    { value: "AVAILABLE",   label: "Disponible" },
                    { value: "MAINTENANCE", label: "Mantenimiento" },
                    { value: "INACTIVE",    label: "Inactivo" },
                  ]}
                />
              </FormField>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-12 bg-blue-600 text-white font-bold text-sm rounded-2xl
                           hover:bg-blue-700 disabled:opacity-60 transition-colors mt-2 shadow-sm"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : panel === "create" ? "Crear vehículo" : "Guardar cambios"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  "w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none";

function FormField({
  label,
  required,
  hint,
  hintOk,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  hintOk?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className={`text-[11px] mt-1 ${hintOk ? "text-emerald-600" : "text-slate-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 appearance-none focus:border-blue-600 focus:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    </div>
  );
}

