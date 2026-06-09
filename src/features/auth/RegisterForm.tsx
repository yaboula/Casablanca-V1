"use client";

import { FormEvent, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSafeRedirect } from "./auth-redirects";

type RegisterFormProps = {
  redirectTo?: string;
};

export function RegisterForm({ redirectTo = "/dashboard" }: RegisterFormProps) {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "register",
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        password: String(formData.get("password") ?? ""),
      }),
    }).catch(() => null);

    setIsSubmitting(false);

    if (!response) {
      setError("No se pudo contactar con el servidor. Intentalo de nuevo.");
      return;
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "No se pudo crear la cuenta.");
      setFieldErrors(Array.isArray(payload?.errors) ? payload.errors : []);
      return;
    }

    router.replace(getSafeRedirect(redirectTo));
    router.refresh();
  }

  return (
    <form
      aria-describedby={error ? errorId : undefined}
      className="mt-8 grid gap-5"
      onSubmit={onSubmit}
    >
      <div className="grid gap-2">
        <label className="text-sm font-bold text-neutral-950" htmlFor={nameId}>
          Nombre completo
        </label>
        <input
          autoComplete="name"
          className="min-h-12 rounded-md border border-[var(--nx-line)] bg-white px-4 text-base outline-none transition focus:border-neutral-950"
          id={nameId}
          name="fullName"
          required
          type="text"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-bold text-neutral-950" htmlFor={emailId}>
          Email
        </label>
        <input
          autoComplete="email"
          className="min-h-12 rounded-md border border-[var(--nx-line)] bg-white px-4 text-base outline-none transition focus:border-neutral-950"
          id={emailId}
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-bold text-neutral-950" htmlFor={phoneId}>
          Telefono
        </label>
        <input
          autoComplete="tel"
          className="min-h-12 rounded-md border border-[var(--nx-line)] bg-white px-4 text-base outline-none transition focus:border-neutral-950"
          id={phoneId}
          name="phone"
          type="tel"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-bold text-neutral-950" htmlFor={passwordId}>
          Password
        </label>
        <input
          autoComplete="new-password"
          className="min-h-12 rounded-md border border-[var(--nx-line)] bg-white px-4 text-base outline-none transition focus:border-neutral-950"
          id={passwordId}
          name="password"
          required
          type="password"
        />
      </div>

      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          id={errorId}
          role="alert"
        >
          <p className="font-bold">{error}</p>
          {fieldErrors.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {fieldErrors.map((fieldError) => (
                <li key={fieldError}>{fieldError}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        className="min-h-12 rounded-md bg-neutral-950 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-sm text-neutral-600">
        Ya tienes cuenta?{" "}
        <Link
          className="font-bold text-neutral-950 underline underline-offset-4"
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        >
          Iniciar sesion
        </Link>
      </p>
    </form>
  );
}
