"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { DEPOSIT_AMOUNT_EUR } from "@/lib/constants";

interface Props {
  reservationId: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function PaymentStep({ reservationId: _reservationId, onSuccess, onBack }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardReady, setCardReady] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);

    const { error } = await stripe.confirmCardPayment(undefined as unknown as string, {
      payment_method: { card },
    });

    if (error) {
      toast.error(error.message ?? "Error al procesar el pago. Inténtalo de nuevo.");
      setProcessing(false);
    } else {
      onSuccess();
    }
  }

  return (
    <div className="space-y-5">
      {/* Deposit badge */}
      <div className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-3.5">
        <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-brand-dark">
            Solo pagas ahora: {DEPOSIT_AMOUNT_EUR}€
          </p>
          <p className="text-xs text-brand-muted mt-0.5">
            Cancelación gratuita hasta 48h antes de la recogida.
          </p>
        </div>
      </div>

      {/* Stripe CardElement */}
      <div>
        <label className="block text-xs font-semibold text-brand-dark mb-2">
          Datos de tarjeta
        </label>
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-primary/30 focus-within:border-brand-primary transition-all">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "15px",
                  color: "#0f172a",
                  fontFamily: "inherit",
                  "::placeholder": { color: "#94a3b8" },
                },
                invalid: { color: "#ef4444" },
              },
              hidePostalCode: true,
            }}
            onChange={(e) => setCardReady(e.complete && !e.error)}
          />
        </div>
      </div>

      {/* SSL note */}
      <div className="flex items-center gap-2 text-xs text-brand-muted">
        <Lock className="w-3.5 h-3.5" />
        Protegido por Stripe · Cifrado SSL 256-bit
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="min-h-[50px] px-5 bg-slate-100 text-brand-dark font-semibold text-sm rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={!cardReady || processing || !stripe}
          className="flex-1 min-h-[50px] bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                     text-white font-bold text-sm rounded-full
                     flex items-center justify-center gap-2
                     hover:bg-brand-primary-hover active:scale-[0.98]
                     shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
        >
          {processing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
              />
              Procesando…
            </>
          ) : (
            <>
              Pagar {DEPOSIT_AMOUNT_EUR}€
              <Lock className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
