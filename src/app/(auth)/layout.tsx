import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXUS · Acceso",
  description: "Inicia sesión o crea tu cuenta en NEXUS.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — brand visual */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-dark p-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-[#0f1f3d] to-brand-dark" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 30% 70%, #2563EB 0%, transparent 60%)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <span className="text-2xl font-black tracking-tight text-white">
            NEXUS<span className="text-brand-primary">.</span>
          </span>
        </div>

        {/* Center quote */}
        <div className="relative z-10 space-y-4">
          <blockquote className="text-3xl font-bold text-white leading-snug">
            &quot;Tu coche te espera.<br />Tu vuelo acaba de aterrizar.&quot;
          </blockquote>
          <p className="text-brand-muted text-sm">
            Aeropuerto Mohammed V · CMN · Casablanca
          </p>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-success/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-brand-success animate-pulse" />
          </div>
          <span className="text-sm text-white/60">Entrega en 3 minutos · Sin esperas</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-brand-bg">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <span className="text-2xl font-black tracking-tight text-brand-dark">
              NEXUS<span className="text-brand-primary">.</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
