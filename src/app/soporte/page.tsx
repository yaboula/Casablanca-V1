"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Clock,
  FileText,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  Shield,
  CreditCard,
  Car,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { OPERATOR_PHONE, OPERATOR_WHATSAPP } from "@/lib/constants";

// ══════════════════════════════════════════════════════════════
// SOPORTE PAGE — FAQ + Contact channels + Info
// ══════════════════════════════════════════════════════════════

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ElementType;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "¿Cómo funciona la reserva y cuánto cuesta?",
    answer:
      "Puedes reservar cualquier vehículo de nuestra flota desde solo 10€ de señal. El pago restante se realiza al recoger el vehículo en el aeropuerto. Sin costes ocultos ni comisiones adicionales.",
    icon: CreditCard,
    category: "Reservas",
  },
  {
    question: "¿Cómo es la recogida en el aeropuerto?",
    answer:
      "Estamos en las Terminales 1 y 2 del Aeropuerto Mohammed V (CMN). Al aterrizar, avísanos por WhatsApp y nuestro operador te espera en la puerta. El tiempo de recogida típico es de 3 minutos. Nos adaptamos a tu horario de vuelo, incluidas llegadas nocturnas.",
    icon: Plane,
    category: "Aeropuerto",
  },
  {
    question: "¿Qué documentos necesito?",
    answer:
      "Necesitas tu pasaporte y carnet de conducir vigente. Puedes subirlos antes de tu viaje en la sección de Check-in digital desde tu dashboard, así ahorras tiempo al llegar al aeropuerto.",
    icon: FileText,
    category: "Documentos",
  },
  {
    question: "¿Qué incluye el alquiler?",
    answer:
      "Todos nuestros vehículos incluyen: seguro a todo riesgo, tag Jawaz para autopistas marroquíes y una SIM con 5GB de datos móviles. Todo está incluido en el precio, sin sorpresas.",
    icon: Shield,
    category: "Servicios",
  },
  {
    question: "¿Puedo cancelar o modificar mi reserva?",
    answer:
      "Sí, puedes cancelar o modificar tu reserva sin coste hasta 24 horas antes de la hora de recogida. Para cambios urgentes dentro de las 24h, contáctanos directamente por WhatsApp o teléfono y haremos lo posible por ayudarte.",
    icon: Car,
    category: "Cambios",
  },
  {
    question: "¿Cuál es el horario de atención?",
    answer:
      "Estamos disponibles 24/7 en el Aeropuerto Mohammed V. Nuestro equipo se adapta a tu horario de vuelo, incluidas llegadas nocturnas y madrugadas. También puedes contactarnos por WhatsApp a cualquier hora.",
    icon: Clock,
    category: "Horarios",
  },
  {
    question: "¿Qué pasa si mi vuelo se retrasa?",
    answer:
      "No te preocupes. Monitorizamos los vuelos y ajustamos la hora de recogida automáticamente. Si hay un retraso significativo, avísanos por WhatsApp y reprogramamos sin coste adicional.",
    icon: Plane,
    category: "Vuelos",
  },
  {
    question: "¿Cómo funciona el Smart Ticket y el QR?",
    answer:
      "Al completar tu reserva y subir tus documentos, recibirás un Smart Ticket con un código QR. Al llegar al aeropuerto, simplemente muestra el QR al operador para una recogida instantánea sin papeleo.",
    icon: HelpCircle,
    category: "Tecnología",
  },
];

const CONTACT_CHANNELS = [
  {
    name: "WhatsApp",
    description: "Respuesta rápida · Equipo real 24/7",
    detail: "Escríbenos directamente y un agente real te responderá en minutos.",
    badge: "Recomendado",
    badgeColor: "bg-emerald-100 text-emerald-700",
    iconBg: "bg-[#25D366]",
    hoverBorder: "hover:border-emerald-300",
    hoverBg: "hover:bg-emerald-50",
    href: `https://wa.me/${OPERATOR_WHATSAPP}?text=${encodeURIComponent("Hola, necesito ayuda con mi reserva en NEXUS.")}`,
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    name: "Teléfono",
    description: "Llama directamente a un agente",
    detail: "Línea directa disponible 24/7 para asistencia inmediata.",
    badge: "Directo",
    badgeColor: "bg-violet-100 text-violet-700",
    iconBg: "bg-violet-500",
    hoverBorder: "hover:border-violet-300",
    hoverBg: "hover:bg-violet-50",
    href: `tel:+${OPERATOR_PHONE}`,
    external: true,
    icon: <Phone className="w-5 h-5 text-white" />,
  },
  {
    name: "Email",
    description: "soporte@nexus.ma",
    detail: "Para consultas detalladas o documentación. Respuesta en menos de 2 horas.",
    badge: "~2h",
    badgeColor: "bg-amber-100 text-amber-700",
    iconBg: "bg-amber-500",
    hoverBorder: "hover:border-amber-300",
    hoverBg: "hover:bg-amber-50",
    href: "mailto:soporte@nexus.ma?subject=Consulta desde NEXUS App",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

export default function SoportePage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero Header ─────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 -left-10 w-40 h-40 bg-white/5 rounded-full" />

        <div className="max-w-4xl mx-auto px-4 pt-6 pb-10 relative z-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white
                       transition-colors mb-6 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Centro de soporte
              </h1>
              <p className="text-sm text-blue-200">NEXUS · Aeropuerto Mohammed V</p>
            </div>
          </div>

          <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-2xl">
            Encuentra respuestas a las preguntas más frecuentes o contacta directamente
            con nuestro equipo. Estamos aquí para ayudarte 24/7.
          </p>

          {/* Status */}
          <div className="mt-5 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-white/90 font-medium">
              Equipo disponible ahora
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-12">
        {/* ── In-app Chat CTA ───────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <Link
            href="/soporte/chat"
            className="block bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-sm
                       hover:border-blue-400 hover:shadow-md active:scale-[0.99] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0
                              group-hover:scale-105 transition-transform">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-slate-900">Chat interno</h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  ¿No tienes WhatsApp? Escríbenos directamente desde la app. Un agente real te responde.
                </p>
              </div>
            </div>
          </Link>
        </motion.section>

        {/* ── Contact Channels ──────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CONTACT_CHANNELS.map((ch) => (
              <a
                key={ch.name}
                href={ch.href}
                target={ch.external ? "_blank" : undefined}
                rel={ch.external ? "noopener noreferrer" : undefined}
                className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm
                           ${ch.hoverBorder} ${ch.hoverBg} active:scale-[0.98]
                           transition-all group block`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl ${ch.iconBg} flex items-center justify-center shrink-0`}>
                    {ch.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-slate-900">{ch.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ch.badgeColor}`}>
                        {ch.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{ch.description}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{ch.detail}</p>
              </a>
            ))}
          </div>
        </motion.section>

        {/* ── FAQ Section ───────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Preguntas frecuentes
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            Las respuestas que buscas, sin esperas.
          </p>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFAQ === index;
              const Icon = item.icon;

              return (
                <motion.div
                  key={index}
                  initial={false}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                    isOpen ? "border-blue-200" : "border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => setOpenFAQ(isOpen ? null : index)}
                    className="w-full flex items-center gap-3 p-4 md:p-5 text-left min-h-[56px]
                               hover:bg-slate-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? "bg-blue-100" : "bg-slate-100"
                    }`}>
                      <Icon className={`w-4 h-4 transition-colors ${
                        isOpen ? "text-blue-600" : "text-slate-500"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {item.question}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown className={`w-5 h-5 transition-colors ${
                        isOpen ? "text-blue-600" : "text-slate-400"
                      }`} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 ml-12">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── Location & Info ───────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Ubicación y horarios
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Plane className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Aeropuerto Mohammed V (CMN)
                </h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Terminal 1</p>
                    <p className="text-xs text-slate-400">Zona de llegadas, puerta principal</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Terminal 2</p>
                    <p className="text-xs text-slate-400">Zona de llegadas, puerta principal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Horarios de atención</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Recogida en aeropuerto</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    24/7
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">WhatsApp</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    24/7
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Teléfono</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    24/7
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Email</span>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    ~2h respuesta
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Bottom CTA ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
          <p className="text-sm text-slate-600 mb-4">
            ¿No encuentras lo que buscas? Nuestro equipo está listo para ayudarte.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://wa.me/${OPERATOR_WHATSAPP}?text=${encodeURIComponent("Hola, tengo una pregunta sobre NEXUS.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-h-[48px] px-6 bg-[#25D366] text-white font-bold text-sm rounded-full
                         flex items-center justify-center gap-2 hover:brightness-110
                         active:scale-[0.98] transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escribir por WhatsApp
            </a>
            <a
              href={`tel:+${OPERATOR_PHONE}`}
              className="w-full sm:w-auto min-h-[48px] px-6 bg-slate-100 text-slate-900 font-bold text-sm rounded-full
                         flex items-center justify-center gap-2 hover:bg-slate-200
                         active:scale-[0.98] transition-all"
            >
              <Phone className="w-4 h-4" />
              Llamar ahora
            </a>
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            Soporte en español, français y العربية
          </p>
        </motion.div>
      </div>
    </div>
  );
}
