"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { useBookingStore } from "@/stores/useBookingStore";
import { OPERATOR_PHONE } from "@/lib/constants";

export default function WhatsAppFAB() {
  const { reservationId } = useBookingStore();

  const url = useMemo(() => {
    const msg = reservationId
      ? `Hola, necesito ayuda con mi reserva #${reservationId} en NEXUS.`
      : "Hola, necesito ayuda con mi reserva en NEXUS.";
    return `https://wa.me/${OPERATOR_PHONE}?text=${encodeURIComponent(msg)}`;
  }, [reservationId]);

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.5 }}
      className="fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] shadow-lg
                 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
      <MessageCircle className="w-6 h-6 text-white fill-white relative z-10" />
    </motion.a>
  );
}
