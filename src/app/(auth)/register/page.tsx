"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Mail, Phone, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);

    try {
      // TODO: Replace with real auth API call
      // const res = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      await new Promise((r) => setTimeout(r, 1400)); // mock delay

      // Mock session after registration
      document.cookie = `nexus_session=${encodeURIComponent(
        JSON.stringify({ email: form.email, role: "USER" })
      )}; path=/; max-age=86400`;

      toast.success("¡Cuenta creada! Bienvenido a NEXUS.");
      router.push("/");
    } catch {
      toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const fields: {
    id: keyof typeof form;
    label: string;
    type: string;
    placeholder: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "name",
      label: "Nombre completo",
      type: "text",
      placeholder: "Ahmed El Fassi",
      icon: <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />,
    },
    {
      id: "email",
      label: "Correo electrónico",
      type: "email",
      placeholder: "tu@email.com",
      icon: <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />,
    },
    {
      id: "phone",
      label: "WhatsApp (con código de país)",
      type: "tel",
      placeholder: "+212 6XX XXX XXX",
      icon: <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />,
    },
    {
      id: "password",
      label: "Contraseña",
      type: "password",
      placeholder: "Mínimo 8 caracteres",
      icon: <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-dark">Crear cuenta</h1>
        <p className="text-brand-muted text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand-primary font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label htmlFor={field.id} className="text-sm font-medium text-brand-dark">
              {field.label}
            </label>
            <div className="relative">
              {field.icon}
              <input
                id={field.id}
                name={field.id}
                type={field.type}
                required
                placeholder={field.placeholder}
                value={form[field.id]}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-brand-card border border-gray-200 bg-white
                           text-brand-dark placeholder:text-brand-muted/60
                           focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                           transition-all text-sm"
              />
            </div>
          </div>
        ))}

        {/* Terms note */}
        <p className="text-xs text-brand-muted leading-relaxed pt-1">
          Al registrarte aceptas nuestros{" "}
          <span className="text-brand-primary cursor-pointer hover:underline">Términos de uso</span>{" "}
          y{" "}
          <span className="text-brand-primary cursor-pointer hover:underline">Política de privacidad</span>.
          Tu número de WhatsApp se usará para la entrega del vehículo.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white
                     py-3 rounded-brand-card font-semibold text-sm
                     hover:bg-brand-primary-hover active:scale-[0.98]
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-200"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Crear mi cuenta
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Info badge */}
      <div className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-brand-card p-4">
        <div className="h-2 w-2 rounded-full bg-brand-success mt-1.5 shrink-0 animate-pulse" />
        <p className="text-xs text-brand-muted leading-relaxed">
          <span className="text-brand-dark font-medium">Sin tarjeta de crédito.</span>{" "}
          Solo necesitas {" "}
          <span className="text-brand-dark font-medium">10 € de depósito</span>{" "}
          al recoger el vehículo. Se devuelve al momento de la entrega.
        </p>
      </div>
    </div>
  );
}
