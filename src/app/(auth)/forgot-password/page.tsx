import Link from "next/link";
import { MessageCircle, ArrowLeft, Mail } from "lucide-react";
import { OPERATOR_PHONE } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const waLink = `https://wa.me/${OPERATOR_PHONE}?text=${encodeURIComponent(
    "Hola, necesito recuperar el acceso a mi cuenta NEXUS."
  )}`;

  return (
    <div className="flex flex-col justify-center px-6 py-12 lg:px-12 min-h-full">
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-8 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al login
      </Link>

      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <Mail className="w-7 h-7 text-brand-primary" />
      </div>

      <h1 className="text-2xl font-black text-brand-dark mb-2">
        ¿Olvidaste tu contraseña?
      </h1>
      <p className="text-brand-muted text-sm mb-8 max-w-sm">
        El sistema de recuperación automática estará disponible próximamente.
        Por ahora, contáctanos directamente y te ayudamos en menos de 5 minutos.
      </p>

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2.5 w-full max-w-sm min-h-[52px]
                   bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm rounded-full
                   shadow-[0_4px_20px_rgba(37,211,102,0.3)] active:scale-[0.98]
                   transition-all duration-200"
      >
        <MessageCircle className="w-5 h-5" />
        Contactar por WhatsApp
      </a>

      <p className="text-xs text-brand-muted mt-4 max-w-sm">
        Disponible todos los días · Aeropuerto Mohammed V CMN
      </p>
    </div>
  );
}
