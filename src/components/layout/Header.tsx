"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import { useCurrencyStore } from "@/stores/useBookingStore";

type SessionRole = "USER" | "OPERATOR" | null;

function getSessionFromCookie(): { email: string; role: SessionRole } | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/nexus_session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<{ email: string; role: SessionRole } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSession(getSessionFromCookie());

    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    document.cookie = "nexus_session=; path=/; max-age=0";
    setSession(null);
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/60"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 w-full">
        {/* Logo */}
        <Link href="/" className="text-xl font-black tracking-tight text-brand-dark">
          NEXUS<span className="text-brand-primary">.</span>
        </Link>

        {/* Nav links — desktop only */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-brand-muted">
          <a href="/#fleet" className="hover:text-brand-dark transition-colors">
            Ver flota
          </a>
          <a href="/#why" className="hover:text-brand-dark transition-colors">
            Cómo funciona
          </a>
          <Link href="/catalog" className="hover:text-brand-dark transition-colors">
            Reservar
          </Link>
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-2 relative">
          <CurrencyToggle />
          {!session ? (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors px-3 py-2"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 bg-brand-primary text-white text-sm font-semibold
                           px-4 py-2 rounded-brand-pill hover:bg-brand-primary-hover transition-all"
              >
                Reservar ahora
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menú de usuario"
                className="flex items-center gap-2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-all min-h-[44px] min-w-[44px] justify-center"
              >
                <User size={18} className="text-brand-dark" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-52 bg-white rounded-brand-card shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-brand-dark truncate">{session.email}</p>
                    <p className="text-xs text-brand-muted capitalize">{session.role === "OPERATOR" ? "Operador" : "Cliente"}</p>
                  </div>

                  {session.role === "OPERATOR" && (
                    <Link
                      href="/operator/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-brand-dark hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard size={15} />
                      Panel operador
                    </Link>
                  )}

                  {session.role === "USER" && (
                    <Link
                      href="/customer/reservations"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-brand-dark hover:bg-slate-50 transition-colors"
                    >
                      <User size={15} />
                      Mis reservas
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Currency Toggle ──────────────────────────────────────────

function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleCurrency}
      className="hidden sm:flex items-center gap-0.5 text-xs font-bold rounded-full border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
      aria-label="Cambiar divisa"
    >
      <span
        className={`px-2.5 py-1.5 transition-colors ${
          currency === "EUR" ? "bg-brand-primary text-white" : "text-brand-muted"
        }`}
      >
        € EUR
      </span>
      <span
        className={`px-2.5 py-1.5 transition-colors ${
          currency === "MAD" ? "bg-brand-primary text-white" : "text-brand-muted"
        }`}
      >
        DH MAD
      </span>
    </button>
  );
}