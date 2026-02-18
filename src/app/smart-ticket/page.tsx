"use client";

import { CheckCircle2, MessageCircle, QrCode } from "lucide-react";
import Link from "next/link";

export default function SmartTicketPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4 sm:px-6">
      {/* Main ticket card */}
      <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden relative">

        {/* Header — success */}
        <div className="bg-brand-success p-6 relative">
          <h1 className="text-2xl font-bold text-white mb-1">Pase Listo</h1>
          <p className="text-emerald-100 text-sm">
            Tu vehículo te espera en la Terminal 2
          </p>
          <CheckCircle2 className="w-8 h-8 text-white absolute top-6 right-6" />
        </div>

        {/* QR section */}
        <div className="bg-white p-8 flex flex-col items-center border-b border-dashed border-slate-200">
          <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center relative">
            <QrCode className="w-24 h-24 text-slate-800" />
          </div>
          <p className="text-sm text-brand-muted mt-4 font-medium">
            Muéstrale este código a Karim
          </p>
        </div>

        {/* Balance + Actions */}
        <div className="p-6 bg-slate-50">
          {/* Financial summary */}
          <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-xl border border-slate-100">
            <span className="text-sm font-semibold text-brand-dark">
              Pago pendiente al recoger
            </span>
            <span className="text-lg font-bold text-brand-primary">790 €</span>
          </div>

          {/* WhatsApp CTA */}
          <button
            onClick={() => window.open("https://wa.me/", "_blank")}
            className="w-full min-h-[48px] bg-[#25D366] hover:bg-[#1DA851] text-white py-3.5 rounded-brand-pill font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <MessageCircle className="w-5 h-5" />
            Avisar por WhatsApp
          </button>
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="text-sm text-brand-muted hover:text-brand-dark mt-6 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
