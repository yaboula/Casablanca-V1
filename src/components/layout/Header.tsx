import { MapPin, User } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass layer */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/70" />

      <div className="relative max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 w-full">

        {/* ── Logo ── */}
        <a href="/" className="flex items-center gap-2.5 group" aria-label="NEXUS inicio">
          {/* Icon badge */}
          <span className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-sm flex-shrink-0 group-hover:bg-brand-primary-hover transition-colors">
            <MapPin size={14} className="text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[1.15rem] font-black text-brand-dark tracking-tight leading-none">
            NEXUS<span className="text-brand-primary">.</span>
          </span>
        </a>

        {/* ── Nav links (desktop) ── */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
          {[
            { label: "Flota",          href: "/#fleet"  },
            { label: "Cómo funciona",  href: "/#why"    },
            { label: "CMN 24/7",       href: "/#why"    },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-dark hover:bg-slate-100 transition-all"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2.5">
          {/* Profile */}
          <button
            type="button"
            aria-label="Perfil de usuario"
            className="w-9 h-9 rounded-full bg-slate-100 text-brand-dark hover:bg-slate-200 transition-all flex items-center justify-center flex-shrink-0"
          >
            <User size={16} />
          </button>

          {/* Primary CTA */}
          <a
            href="/#fleet"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors shadow-sm min-h-[40px]"
          >
            Reservar
            <span className="text-blue-200 font-medium text-xs">10€</span>
          </a>
        </div>
      </div>
    </header>
  );
}
