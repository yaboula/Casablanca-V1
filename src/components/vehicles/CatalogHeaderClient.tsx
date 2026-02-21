"use client";

import { useTranslations } from "@/lib/i18n";

export default function CatalogHeaderClient() {
  const tCatalog = useTranslations("catalog");

  return (
    <section className="bg-white border-b border-slate-100 pt-8 pb-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted font-semibold mb-1">
          CMN · Mohammed V
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-brand-dark">
          {tCatalog.title}
        </h1>
        <p className="text-sm text-brand-muted mt-1 max-w-lg">
          {tCatalog.subtitle}
        </p>
      </div>
    </section>
  );
}
