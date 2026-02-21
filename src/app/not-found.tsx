"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function NotFound() {
  const t = useTranslations("notFound");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <MapPin className="w-8 h-8 text-brand-primary" />
        </div>

        <h1 className="text-6xl font-black text-brand-dark mb-2">404</h1>
        <h2 className="text-xl font-bold text-brand-dark mb-3">{t.title}</h2>
        <p className="text-sm text-brand-muted mb-8">
          {t.description}
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[50px] px-8 bg-brand-primary text-white
                     font-bold text-sm rounded-full hover:bg-brand-primary-hover
                     shadow-[0_4px_20px_rgba(37,99,235,0.28)] active:scale-[0.98] transition-all"
        >
          {tCommon.backHome}
        </Link>
      </div>
    </div>
  );
}
