"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const FAQS = [
  {
    q: "¿Cómo funciona el depósito de 10€?",
    a: "El depósito de 10€ es el importe mínimo para asegurar tu reserva. Se procesa de forma segura online y se descuenta del precio total cuando recoges el coche. Si no te presentas, el depósito no es reembolsable.",
  },
  {
    q: "¿Dónde recojo el coche en el Aeropuerto Mohammed V (CMN)?",
    a: "Nuestro punto de recogida está en la zona de salidas del aeropuerto CMN. Una vez confirmada tu reserva, recibirás el Smart Ticket con el código QR que deberás mostrar al operario en el punto de encuentro indicado.",
  },
  {
    q: "¿Qué documentos necesito para recoger el coche?",
    a: "Necesitarás: (1) Pasaporte o DNI en vigor, (2) Carnet de conducir válido, (3) El Smart Ticket con QR que recibirás tras la verificación. El operario verificará tus documentos en menos de 2 minutos.",
  },
  {
    q: "¿Puedo cancelar mi reserva?",
    a: "Puedes modificar tu reserva hasta 24 horas antes de la recogida sin coste. Las cancelaciones con menos de 24h de antelación no tienen derecho a reembolso del depósito de 10€.",
  },
  {
    q: "¿Qué pasa si mi vuelo llega tarde?",
    a: "No te preocupes. Tu reserva tiene una ventana de tolerancia de 2 horas. Si el retraso es mayor, contáctanos por WhatsApp y ajustamos tu reserva sin problema.",
  },
  {
    q: "¿Puedo añadir un conductor adicional?",
    a: "Sí. Puedes solicitar un conductor adicional al llegar al punto de recogida. El conductor adicional deberá presentar su carnet de conducir y un documento de identidad.",
  },
  {
    q: "¿El precio incluye el seguro?",
    a: "Todos nuestros vehículos incluyen seguro básico a terceros. Puedes ampliar la cobertura con nuestro seguro Premium (sin franquicia) al recoger el coche.",
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-8"
        >
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-black text-brand-dark mb-2">Preguntas frecuentes</h1>
        <p className="text-sm text-brand-muted mb-10">
          Todo lo que necesitas saber sobre el alquiler de coches en CMN con NEXUS.
        </p>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left min-h-[56px]"
              >
                <span className="text-sm font-bold text-brand-dark pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-brand-muted" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-brand-muted leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-brand-dark mb-1">¿No encuentras tu respuesta?</p>
          <p className="text-sm text-brand-muted mb-4">Escríbenos por WhatsApp y te ayudamos al momento.</p>
          <a
            href="https://wa.me/212600000000?text=Hola%2C%20tengo%20una%20pregunta%20sobre%20NEXUS."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-[48px] px-8 bg-[#25D366]
                       text-white font-bold text-sm rounded-full hover:bg-[#1DA851] transition-colors"
          >
            Contactar por WhatsApp
          </a>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-brand-muted hover:text-brand-dark transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
