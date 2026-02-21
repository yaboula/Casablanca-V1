"use client";

import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone, Plane } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function Footer() {
  const tF = useTranslations("footer");

  return (
    <footer>
      {/* ── Pre-footer CTA banner ──────────────────────── */}
      <div className="bg-brand-primary px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full mb-6">
            <Plane className="w-3.5 h-3.5 text-white" />
            <span className="text-white/90 text-xs font-semibold tracking-wide uppercase">
              {tF.airportLabel}
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            {tF.ctaTitle}
          </h3>
          <p className="text-white/70 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            {tF.ctaDesc}
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-white text-brand-primary font-bold text-sm px-8 py-3.5 rounded-full hover:shadow-lg hover:shadow-white/20 transition-all duration-200 min-h-[48px]"
          >
            {tF.ctaButton} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Main footer ────────────────────────────────── */}
      <div className="bg-slate-900 text-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">
            {/* Brand column — wider */}
            <div className="col-span-2 space-y-5">
              <span className="text-2xl font-black tracking-tight text-white">
                NEXUS<span className="text-brand-primary">.</span>
              </span>
              <p className="text-sm leading-relaxed text-white/40 max-w-xs">
                {tF.brandTagline}
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/40">{tF.brandAvailable}</span>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://wa.me/212600000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#25D366]/20 hover:border-[#25D366]/40 transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/60">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/nexus.cmn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-pink-500/20 hover:border-pink-400/40 transition-colors"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/60">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Fleet */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
                {tF.colFleet}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {[tF.fleet0, tF.fleet1, tF.fleet2, tF.fleet3].map((item) => (
                  <li key={item}>
                    <Link href="/catalog" className="hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
                {tF.colCompany}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: tF.company0, href: "/#fleet" },
                  { label: tF.company1, href: "/faq" },
                  { label: tF.company2, href: "/terms" },
                  { label: tF.company3, href: "/privacy" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
                {tF.colContact}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="https://wa.me/212600000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    WhatsApp 24/7
                  </a>
                </li>
                <li>
                  <a href="mailto:hola@nexus.ma" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    hola@nexus.ma
                  </a>
                </li>
                <li className="flex items-start gap-2 text-white/40 text-xs pt-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{tF.contactAddress.split("\n").map((line, i) => (
                    <span key={i}>{line}{i === 0 && <br />}</span>
                  ))}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Bottom bar ─────────────────────────────── */}
          <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-white/25">
              {tF.copyright}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-white/25">
              <button className="hover:text-white/50 transition-colors" title="Idioma">
                ES · FR · AR
              </button>
              <span className="text-white/10">|</span>
              <button className="hover:text-white/50 transition-colors" title="Divisa">
                € EUR · MAD
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
