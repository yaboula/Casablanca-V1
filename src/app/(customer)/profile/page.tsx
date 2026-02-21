"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  CreditCard,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { apiFetch } from "@/lib/api";
import { useTranslations } from "@/lib/i18n";

// ── Component ─────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const tProfile = useTranslations("profile");

  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: (user as { phone?: string } | null)?.phone ?? "",
  });

  // Sync formData when user cookie resolves (client hydration)
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        fullName: user.fullName ?? "",
        email: user.email ?? "",
        phone: (user as { phone?: string })?.phone ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ phone: formData.phone }),
        auth: true,
      });
      toast.success(tProfile.toastUpdated);
      setIsEditing(false);
    } catch {
      toast.error(tProfile.toastUpdateError);
    } finally {
      setSaving(false);
    }
  }, [formData.phone]);

  const handleCancel = useCallback(() => {
    setFormData({
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      phone: (user as { phone?: string } | null)?.phone ?? "",
    });
    setIsEditing(false);
  }, [user]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      toast.success(tProfile.toastLoggedOut);
      router.push("/login");
    } catch {
      toast.error(tProfile.toastLogoutError);
      setLoggingOut(false);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {tProfile.backToBookings}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-dark">{formData.fullName}</h1>
              <p className="text-sm text-brand-muted">{tProfile.verifiedCustomer}</p>
            </div>
          </div>
        </motion.div>

        {/* Contact info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand-dark">{tProfile.contactInfo}</h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
              >
                <Pencil className="w-3.5 h-3.5" />
                {tProfile.edit}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark"
                >
                  <X className="w-3.5 h-3.5" />
                  {tProfile.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary/90
                             px-3 py-1.5 rounded-full disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? tProfile.saving : tProfile.save}
                </button>
              </div>
            )}
          </div>
          {!isEditing ? (
            <div className="space-y-3">
              <InfoRow icon={User} label={tProfile.fullName} value={formData.fullName} />
              <InfoRow icon={Mail} label={tProfile.email} value={formData.email} />
              <InfoRow icon={Phone} label={tProfile.phone} value={formData.phone} />
            </div>
          ) : (
            <div className="space-y-3">
              <EditField
                icon={User}
                label={tProfile.fullName}
                value={formData.fullName}
                onChange={(v) => setFormData((f) => ({ ...f, fullName: v }))}
              />
              <EditField
                icon={Mail}
                label={tProfile.email}
                type="email"
                value={formData.email}
                onChange={(v) => setFormData((f) => ({ ...f, email: v }))}
              />
              <EditField
                icon={Phone}
                label={tProfile.phone}
                type="tel"
                value={formData.phone}
                onChange={(v) => setFormData((f) => ({ ...f, phone: v }))}
              />
            </div>
          )}
        </motion.div>

        {/* Documents */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 mb-5"
        >
          <h2 className="text-sm font-bold text-brand-dark mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-primary" />
            {tProfile.verifiedDocs}
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <FileText className="w-4 h-4 text-brand-muted shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-dark">{tProfile.passportDoc}</p>
                <p className="text-[11px] text-brand-muted">{tProfile.docRequired}</p>
              </div>
              <Link
                href="/dashboard"
                className="text-xs font-bold text-brand-primary hover:underline"
              >
                {tProfile.viewStatus}
              </Link>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <CreditCard className="w-4 h-4 text-brand-muted shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-dark">{tProfile.licenseDoc}</p>
                <p className="text-[11px] text-brand-muted">{tProfile.docRequired}</p>
              </div>
              <Link
                href="/dashboard"
                className="text-xs font-bold text-brand-primary hover:underline"
              >
                {tProfile.viewStatus}
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full min-h-[48px] bg-slate-100 text-brand-dark font-semibold text-sm rounded-full
                       flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors
                       disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? tProfile.loggingOut : tProfile.logout}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Info row helper ──────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-brand-muted shrink-0" />
      <div>
        <p className="text-[11px] text-brand-muted">{label}</p>
        <p className="text-sm font-semibold text-brand-dark">{value}</p>
      </div>
    </div>
  );
}

// ── Edit field helper ─────────────────────────────────────────

function EditField({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-brand-muted shrink-0" />
      <div className="flex-1">
        <p className="text-[11px] text-brand-muted mb-0.5">{label}</p>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm font-semibold text-brand-dark bg-slate-50 border border-slate-200
                     rounded-lg px-3 py-1.5 outline-none focus:border-brand-primary focus:ring-1
                     focus:ring-brand-primary/30 transition-colors"
        />
      </div>
    </div>
  );
}
