"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, Check, Loader2, Lock, Settings2 } from "lucide-react";

interface TrustCardProps {
  model: string;
  transmission?: string;
  luggage?: string;
  totalPrice: string;
  imageUrl?: string;
}

export default function TrustCard({
  model,
  transmission = "Automático",
  luggage = "2 Maletas",
  totalPrice,
  imageUrl = "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
}: TrustCardProps) {
  const [isBooking, setIsBooking] = useState(false);
  const router = useRouter();

  function handleBook() {
    setIsBooking(true);
    setTimeout(() => router.push("/check-in"), 1500);
  }

  return (
    <motion.article
      className="flex flex-col bg-brand-surface rounded-brand-card shadow-card overflow-hidden border border-slate-100"
      whileHover={{ y: -10, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      {/* Image area */}
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={model}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Info section */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Title */}
        <h3 className="text-xl font-bold text-brand-dark">{model}</h3>

        {/* Specs badges */}
        <div className="flex gap-2 flex-wrap">
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <Settings2 className="w-3.5 h-3.5" />
            {transmission}
          </span>
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            {luggage}
          </span>
        </div>

        {/* Superpowers / Trust builders */}
        <ul className="flex flex-col gap-2">
          {["SIM 5GB Incluida", "Tag Jawaz (Peajes)", "Seguro Todo Riesgo"].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-success flex-shrink-0" />
              <span className="text-sm text-brand-muted">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA footer */}
        <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-brand-dark whitespace-nowrap">
            {totalPrice} / total
          </span>

          <motion.button
            layout
            type="button"
            onClick={handleBook}
            disabled={isBooking}
            className={`text-white px-5 py-2.5 rounded-brand-pill font-semibold text-sm shadow-sm flex items-center gap-2 min-h-[48px] whitespace-nowrap transition-colors ${
              isBooking
                ? "bg-brand-success cursor-not-allowed"
                : "bg-brand-primary hover:bg-brand-primary-hover"
            }`}
          >
            {isBooking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Asegurando...
              </>
            ) : (
              <>
                Reservar con 10€
                <Lock className="w-3.5 h-3.5" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
