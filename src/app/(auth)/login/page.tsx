"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";


function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Replace with real auth API call
      // const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      await new Promise((r) => setTimeout(r, 1200)); // mock delay

      // Mock: set a fake session cookie for dev
      document.cookie = `nexus_session=${encodeURIComponent(
        JSON.stringify({ email, role: email.includes("admin") ? "OPERATOR" : "USER" })
      )}; path=/; max-age=86400`;

      toast.success("Bienvenido de vuelta");
      router.push(redirect);
    } catch {
      toast.error("Credenciales incorrectas. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-dark">Iniciar sesión</h1>
        <p className="text-brand-muted text-sm">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-brand-primary font-medium hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-brand-dark">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              id="email"
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-brand-card border border-gray-200 bg-white
                         text-brand-dark placeholder:text-brand-muted/60
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                         transition-all text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-brand-dark">
              Contraseña
            </label>
            <Link href="/forgot-password" className="text-xs text-brand-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              id="password"
              type={showPw ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-11 py-3 rounded-brand-card border border-gray-200 bg-white
                         text-brand-dark placeholder:text-brand-muted/60
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                         transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
              aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white
                     py-3 rounded-brand-card font-semibold text-sm
                     hover:bg-brand-primary-hover active:scale-[0.98]
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-200 mt-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Entrar
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-brand-muted bg-brand-bg px-3">
          acceso rápido en aeropuerto
        </div>
      </div>

      {/* WhatsApp CTA fallback */}
      <a
        href="https://wa.me/212600000000?text=Hola%2C+necesito+ayuda+con+mi+reserva"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white
                   text-brand-dark py-3 rounded-brand-card font-medium text-sm
                   hover:bg-gray-50 transition-all duration-200"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Ayuda por WhatsApp
      </a>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
