"use client";

import { useTranslations } from "@/lib/i18n";

export default function CatalogHeaderClient() {
  const tCatalog = useTranslations("catalog");

  return (
    <section className="bg-white border-b border-slate-100 pt-10 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        <span className="nx-eyebrow text-neutral-500 font-medium">
          CMN · Mohammed V
        </span>
        <h1 className="nx-h2 font-display font-light text-neutral-900">
          {tCatalog.title}
        </h1>
        <p className="nx-lead text-neutral-600 max-w-2xl mt-1">
          {tCatalog.subtitle}
        </p>
      </div>
    </section>
  );
}
