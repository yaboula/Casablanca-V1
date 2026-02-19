import type { Metadata } from "next";
import CatalogGrid from "@/components/vehicles/CatalogGrid";

export const metadata: Metadata = {
  title: "Catálogo de Coches | NEXUS. — Alquiler en CMN",
  description:
    "Explora nuestra flota premium disponible en el Aeropuerto Mohammed V (CMN). SUV, sedán, lujo y compactos. Reserva por solo 10€.",
};

export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-brand-bg">
      {/* Hero banner */}
      <section className="bg-white border-b border-slate-100 pt-8 pb-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted font-semibold mb-1">
            CMN · Mohammed V
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-brand-dark">
            Nuestra flota
          </h1>
          <p className="text-sm text-brand-muted mt-1 max-w-lg">
            Todos los coches incluyen seguro, entrega inmediata en terminal y soporte 24/7.
          </p>
        </div>
      </section>

      <CatalogGrid />
    </main>
  );
}
