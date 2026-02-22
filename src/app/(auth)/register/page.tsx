"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import { apiFetch, NexusApiError } from "@/lib/api";
import type { NexusUser } from "@/hooks/useUser";
import { useTranslations } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const tAuth = useTranslations("auth");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error(tAuth.passwordMin);
      return;
    }
    setLoading(true);
    setEmailError("");

    try {
      // Only send phone if user actually typed digits beyond the country code
      const phoneDigits = form.phone.replace(/\D/g, "");
      const phoneValue = phoneDigits.length >= 7 ? form.phone : undefined;

      const res = await apiFetch<{ accessToken: string; user: NexusUser }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            fullName: form.name,
            ...(phoneValue ? { phone: phoneValue } : {}),
          }),
        },
      );

      // Store JWT in HttpOnly cookie via Next.js API route
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(res),
      });

      // Notify all mounted components (Navbar, etc.) to re-read the cookie
      window.dispatchEvent(new Event("nexus-auth-change"));

      toast.success(tAuth.toastAccountCreated);
      router.push("/");
      router.refresh(); // re-render Server Components with the new session
    } catch (err) {
      if (err instanceof NexusApiError) {
        if (err.statusCode === 409) {
          setEmailError(tAuth.emailTaken);
        } else if (err.statusCode === 422) {
          toast.error(`${tAuth.toastValidationError}: ${err.message}`);
        } else {
          toast.error(tAuth.toastServerError);
        }
      } else {
        toast.error(tAuth.toastConnectionError);
      }
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
      label: tAuth.fullName,
      type: "text",
      placeholder: tAuth.fullNamePlaceholder,
      icon: (
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
      ),
    },
    {
      id: "email",
      label: tAuth.email,
      type: "email",
      placeholder: tAuth.emailPlaceholder,
      icon: (
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
      ),
    },

    {
      id: "password",
      label: tAuth.password,
      type: "password",
      placeholder: tAuth.passwordPlaceholder,
      icon: (
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-dark">
          {tAuth.registerTitle}
        </h1>
        <p className="text-brand-muted text-sm">
          {tAuth.registerSubtitle}{" "}
          <Link
            href="/login"
            className="text-brand-primary font-medium hover:underline"
          >
            {tAuth.loginLink}
          </Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name + Email */}
        {fields
          .filter((f) => f.id !== "password")
          .map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label
                htmlFor={field.id}
                className="text-sm font-medium text-brand-dark"
              >
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
                  onBlur={
                    field.id === "email"
                      ? () => {
                          const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                            form.email,
                          );
                          setEmailError(
                            form.email && !valid ? tAuth.emailInvalid : "",
                          );
                        }
                      : undefined
                  }
                  className={`w-full pl-10 pr-4 py-3 rounded-brand-card border bg-white
                           text-brand-dark placeholder:text-brand-muted/60
                           focus:outline-none focus:ring-2 transition-all text-sm
                           ${
                             field.id === "email" && emailError
                               ? "border-red-400 focus:ring-red-200 focus:border-red-400"
                               : "border-gray-200 focus:ring-brand-primary/30 focus:border-brand-primary"
                           }`}
                />
              </div>
              {field.id === "email" && emailError && (
                <p className="text-xs text-red-500 mt-0.5">{emailError}</p>
              )}
            </div>
          ))}

        {/* Phone with country code selector */}
        <PhoneInput
          value={form.phone}
          onChange={(v) => setForm((prev) => ({ ...prev, phone: v }))}
          label={tAuth.whatsappPhone}
          placeholder={tAuth.whatsappPlaceholder}
        />

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-brand-dark"
          >
            {tAuth.password}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              placeholder={tAuth.passwordPlaceholder}
              value={form.password}
              onChange={handleChange}
              className="w-full pl-10 pr-11 py-3 rounded-brand-card border border-gray-200 bg-white
                         text-brand-dark placeholder:text-brand-muted/60
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                         transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
              aria-label={showPw ? tAuth.hidePassword : tAuth.showPassword}
            >
              {showPw ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {/* Password strength bar */}
          {form.password.length > 0 &&
            (() => {
              const len = form.password.length;
              const strength = len >= 12 ? 3 : len >= 8 ? 2 : 1;
              const colors = [
                "",
                "bg-red-400",
                "bg-amber-400",
                "bg-emerald-500",
              ];
              const labels = [
                "",
                tAuth.passwordWeak,
                tAuth.passwordMedium,
                tAuth.passwordStrong,
              ];
              return (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          s <= strength ? colors[strength] : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-[11px] font-semibold ${
                      strength === 1
                        ? "text-red-500"
                        : strength === 2
                          ? "text-amber-500"
                          : "text-emerald-600"
                    }`}
                  >
                    {labels[strength]}
                  </p>
                </div>
              );
            })()}
        </div>

        {/* Terms note */}
        <p className="text-xs text-brand-muted leading-relaxed pt-1">
          {tAuth.termsNote}{" "}
          <span className="text-brand-primary cursor-pointer hover:underline">
            {tAuth.termsLink}
          </span>{" "}
          {tAuth.and}{" "}
          <span className="text-brand-primary cursor-pointer hover:underline">
            {tAuth.privacyLink}
          </span>
          . {tAuth.whatsappNote}
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
              {tAuth.registerButton}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Info badge */}
      <div className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-brand-card p-4">
        <div className="h-2 w-2 rounded-full bg-brand-success mt-1.5 shrink-0 animate-pulse" />
        <p className="text-xs text-brand-muted leading-relaxed">
          <span className="text-brand-dark font-medium">{tAuth.noCard}</span>{" "}
          {tAuth.depositNote}
        </p>
      </div>
    </div>
  );
}
