"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User, LogOut, LayoutDashboard, Menu, X,
  Car, Sparkles, BookOpen, Globe, ChevronDown,
  Moon, Sun,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrencyStore } from "@/stores/useBookingStore";
import { useLocaleStore, useTranslations, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { useUser } from "@/hooks/useUser";
import { useDarkModeStore } from "@/hooks/useDarkMode";

// ── Nav Config (hrefs & icons only — labels come from translations) ──────────

const NAV_HREFS = [
  { href: "/#fleet",   icon: Car,      key: "fleet"      as const },
  { href: "/#why",    icon: Sparkles,  key: "howItWorks" as const },
  { href: "/catalog", icon: BookOpen,  key: "bookNow"    as const },
] as const;

// ── Header ───────────────────────────────────────────────────

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const user = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");
  const NAV_ITEMS = NAV_HREFS.map((item) => ({ ...item, label: tNav[item.key] }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      // proceed regardless
    }
    setMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh(); // clear Next.js cache so useUser re-reads empty cookie
  }

  const isActive = (href: string) =>
    href === "/catalog" ? pathname === "/catalog" : false;

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-slate-200/50"
            : "bg-white/0 border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* ── Logo ────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-1.5 group shrink-0">
            <span className="text-[22px] font-black tracking-tighter text-brand-dark transition-colors">
              NEXUS
            </span>
            <span className="w-2 h-2 rounded-full bg-brand-primary group-hover:scale-125 transition-transform" />
          </Link>

          {/* ── Desktop Nav ─────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  isActive(href)
                    ? "text-brand-primary bg-blue-50"
                    : "text-slate-500 hover:text-brand-dark hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Right Side ──────────────────────────────────── */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Toggles — hidden on mobile, visible in mobile menu instead */}
            <div className="hidden sm:flex items-center gap-1.5">
              <LocaleToggle />
              <CurrencyToggle />
              <DarkModeToggle />
            </div>

            {/* Auth */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-500 hover:text-brand-dark transition-colors px-3 py-2 rounded-full hover:bg-slate-50"
                >
                  {tHeader.login}
                </Link>
                <Link
                  href="/register"
                  className="bg-brand-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full
                             hover:bg-brand-primary-hover hover:shadow-lg hover:shadow-blue-500/20
                             active:scale-[0.98] transition-all duration-200"
                >
                  {tHeader.register}
                </Link>
              </div>
            ) : (
              <div className="hidden sm:block relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={tHeader.userMenuLabel}
                  className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border transition-all min-h-[44px] ${
                    menuOpen
                      ? "border-brand-primary bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <span className="text-xs font-medium text-brand-dark truncate max-w-[100px]">
                    {user.fullName?.split(" ")[0] ?? user.email.split("@")[0]}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-xl shadow-black/5 border border-slate-100 py-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-brand-dark truncate">{user.fullName ?? user.email}</p>
                        <p className="text-xs text-brand-muted mt-0.5">
                          {user.role === "OPERATOR" || user.role === "ADMIN" ? tHeader.operatorRole : tHeader.customerRole}
                        </p>
                      </div>

                      {(user.role === "OPERATOR" || user.role === "ADMIN") && (
                        <Link
                          href="/operator/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-dark hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard size={16} className="text-brand-muted" />
                          {tHeader.operatorPanel}
                        </Link>
                      )}

                      {user.role === "USER" && (
                        <>
                          <Link
                            href="/dashboard"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-dark hover:bg-slate-50 transition-colors"
                          >
                            <LayoutDashboard size={16} className="text-brand-muted" />
                            {tHeader.myBookings}
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-dark hover:bg-slate-50 transition-colors"
                          >
                            <User size={16} className="text-brand-muted" />
                            {tHeader.myProfile}
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          {tHeader.logout}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Hamburger (mobile) ──────────────────────── */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? tHeader.closeMenu : tHeader.openMenu}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full
                         hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X size={20} className="text-brand-dark" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu size={20} className="text-brand-dark" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Full-Screen Menu ───────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white flex flex-col"
          >
            {/* Spacer for header */}
            <div className="h-16 shrink-0" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="flex-1 flex flex-col px-6 pt-4 pb-8 overflow-y-auto"
            >
              {/* Nav links */}
              <nav className="space-y-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-medium transition-colors ${
                        isActive(href)
                          ? "text-brand-primary bg-blue-50"
                          : "text-brand-dark hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={20} className="text-brand-muted" />
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Divider */}
              <div className="border-t border-slate-100 my-5" />

              {/* Toggles */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider px-4">
                  Preferencias
                </p>
                <div className="flex items-center gap-3 px-4">
                  <LocaleToggle />
                  <CurrencyToggle />
                  <DarkModeToggle />
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Auth CTA (mobile) */}
              {!user ? (
                <div className="space-y-3 mt-8">
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center bg-brand-primary text-white font-semibold
                               py-3.5 rounded-2xl hover:bg-brand-primary-hover active:scale-[0.98] transition-all"
                  >
                    {tNav.bookNow}
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center text-sm font-medium text-brand-muted
                               py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    {tHeader.login}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 mt-8">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-dark truncate">{user.fullName ?? user.email}</p>
                      <p className="text-xs text-brand-muted">{user.role === "OPERATOR" || user.role === "ADMIN" ? tHeader.operatorRole : tHeader.customerRole}</p>
                    </div>
                  </div>

                  {(user.role === "OPERATOR" || user.role === "ADMIN") && (
                    <Link
                      href="/operator/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-medium text-brand-dark hover:bg-slate-50"
                    >
                      <LayoutDashboard size={20} className="text-brand-muted" />
                      {tHeader.operatorPanel}
                    </Link>
                  )}

                  {user.role === "USER" && (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-medium text-brand-dark hover:bg-slate-50"
                      >
                        <LayoutDashboard size={20} className="text-brand-muted" />
                        {tHeader.myBookings}
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-medium text-brand-dark hover:bg-slate-50"
                      >
                        <User size={20} className="text-brand-muted" />
                        {tHeader.myProfile}
                      </Link>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-base font-medium text-red-500 hover:bg-red-50"
                  >
                    <LogOut size={20} />
                    {tHeader.logout}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Locale Toggle ────────────────────────────────────────────

const LOCALES: Locale[] = ["es", "fr", "en"];

function LocaleToggle() {
  const { locale, setLocale } = useLocaleStore();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-all ${
          open
            ? "border-brand-primary bg-blue-50 text-brand-primary"
            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-brand-dark"
        }`}
        aria-label="Cambiar idioma"
      >
        <Globe size={14} />
        <span className="uppercase">{locale}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 w-28 bg-white rounded-xl shadow-lg shadow-black/5 border border-slate-100 py-1 z-50"
          >
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => { setLocale(l); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                  locale === l
                    ? "text-brand-primary bg-blue-50"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="uppercase font-bold">{l}</span>
                <span className="text-slate-400">{LOCALE_LABELS[l]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      className="flex items-center text-xs font-semibold rounded-full border border-slate-200 overflow-hidden
                 hover:border-slate-300 transition-all"
      aria-label="Cambiar divisa"
    >
      <span
        className={`px-2.5 py-2 transition-all duration-200 ${
          currency === "EUR"
            ? "bg-brand-primary text-white"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        € EUR
      </span>
      <span
        className={`px-2.5 py-2 transition-all duration-200 ${
          currency === "MAD"
            ? "bg-brand-primary text-white"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        DH
      </span>
    </button>
  );
}

// ── Dark Mode Toggle ──────────────────────────────────────────

function DarkModeToggle() {
  const { isDark, toggle } = useDarkModeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-200
                 hover:border-slate-300 text-brand-muted hover:text-brand-dark
                 transition-all duration-200"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}