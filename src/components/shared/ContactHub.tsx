"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Phone, X, HelpCircle, Headphones } from "lucide-react";
import Link from "next/link";
import { useBookingStore } from "@/stores/useBookingStore";
import { OPERATOR_PHONE, OPERATOR_WHATSAPP } from "@/lib/constants";

// ══════════════════════════════════════════════════════════════
// CONTACT HUB — Multi-channel FAB (real channels only)
// ══════════════════════════════════════════════════════════════

export default function ContactHub() {
  const { reservationId } = useBookingStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const fab = document.getElementById("contact-hub-fab");
        if (fab && fab.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [open]);

  const whatsappUrl = `https://wa.me/${OPERATOR_WHATSAPP}?text=${encodeURIComponent(
    reservationId
      ? `Hola, necesito ayuda con mi reserva #${reservationId} en NEXUS.`
      : "Hola, necesito ayuda con mi reserva en NEXUS."
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* ── Expanded Panel ──────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-[72px] right-0 w-[320px] sm:w-[360px] bg-white rounded-2xl
                       shadow-2xl shadow-black/12 border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">¿Necesitas ayuda?</h3>
                    <p className="text-[11px] text-blue-100">NEXUS · Aeropuerto CMN</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center
                             hover:bg-white/20 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Nuestro equipo real te atiende 24/7. Elige cómo prefieres contactarnos.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-white/80 font-medium">
                  Equipo disponible ahora
                </span>
              </div>
            </div>

            {/* Channel options */}
            <div className="p-4 space-y-2">
              {/* WhatsApp — primary */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50
                           hover:bg-emerald-100 active:scale-[0.98] transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">WhatsApp</p>
                  <p className="text-[11px] text-slate-500">Respuesta rápida · Equipo real</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  Recomendado
                </span>
              </a>

              {/* Phone */}
              <a
                href={`tel:+${OPERATOR_PHONE}`}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
                           hover:bg-violet-50 hover:border-violet-200 active:scale-[0.98]
                           transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0
                                group-hover:bg-violet-100 transition-colors">
                  <Phone className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">Llamar</p>
                  <p className="text-[11px] text-slate-500">Habla con un agente ahora</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  Directo
                </span>
              </a>

              {/* Email */}
              <a
                href="mailto:soporte@nexus.ma?subject=Consulta desde NEXUS App"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
                           hover:bg-amber-50 hover:border-amber-200 active:scale-[0.98]
                           transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0
                                group-hover:bg-amber-100 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">Email</p>
                  <p className="text-[11px] text-slate-500">soporte@nexus.ma</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  ~2h
                </span>
              </a>

              {/* Support center page */}
              <Link
                href="/soporte"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
                           hover:bg-blue-50 hover:border-blue-200 active:scale-[0.98]
                           transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0
                                group-hover:bg-blue-100 transition-colors">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">Centro de soporte</p>
                  <p className="text-[11px] text-slate-500">FAQ, guías y más información</p>
                </div>
              </Link>
            </div>

            {/* Bottom */}
            <div className="px-4 pb-4">
              <p className="text-[10px] text-center text-slate-400">
                Soporte en español, français y العربية
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Button ──────────────────────────────────── */}
      <motion.button
        id="contact-hub-fab"
        onClick={() => setOpen((v) => !v)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.2 }}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                    hover:scale-110 active:scale-95 transition-all duration-200 ${
                      open
                        ? "bg-slate-800"
                        : "bg-gradient-to-br from-blue-600 to-blue-700"
                    }`}
        aria-label={open ? "Cerrar centro de contacto" : "Abrir centro de contacto"}
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
