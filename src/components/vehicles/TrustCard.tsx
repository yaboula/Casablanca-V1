import { Briefcase, Car, Check, Lock, Settings2 } from "lucide-react";

interface TrustCardProps {
  model: string;
  transmission?: string;
  luggage?: string;
  totalPrice: string;
}

export default function TrustCard({
  model,
  transmission = "Automático",
  luggage = "2 Maletas",
  totalPrice,
}: TrustCardProps) {
  return (
    <article className="flex flex-col bg-brand-surface rounded-brand-card shadow-card overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow duration-300">
      {/* Image area */}
      <div className="relative w-full h-48 bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full h-full bg-slate-200 rounded-lg flex flex-col items-center justify-center text-brand-muted">
          <Car className="w-12 h-12 mb-2" />
          <span className="text-xs font-medium">{model}</span>
        </div>
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
          {["SIM 5GB Incluida", "Tag Jawaz (Peajes)", "Seguro Todo Riesgo"].map(
            (feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-success flex-shrink-0" />
                <span className="text-sm text-brand-muted">{feature}</span>
              </li>
            )
          )}
        </ul>

        {/* CTA footer */}
        <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-brand-dark whitespace-nowrap">
            {totalPrice} / total
          </span>
          <button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover text-white px-5 py-2.5 rounded-brand-pill font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 min-h-[48px] whitespace-nowrap"
          >
            Reservar con 10€
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
