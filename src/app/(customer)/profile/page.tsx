"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  LogOut,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ── Mock user data ────────────────────────────────────────────

const MOCK_USER = {
  fullName: "Ahmed Benjelloun",
  email: "ahmed@example.com",
  phone: "+212 612 34 56 78",
};

const MOCK_DOCS = [
  { type: "Pasaporte", status: "APPROVED" as const, date: "19 Feb 2026" },
  { type: "Carnet de Conducir", status: "APPROVED" as const, date: "19 Feb 2026" },
];

// ── Component ─────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    // Mock logout
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Sesión cerrada correctamente");
    router.push("/");
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
          Mis reservas
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
              <h1 className="text-xl font-bold text-brand-dark">{MOCK_USER.fullName}</h1>
              <p className="text-sm text-brand-muted">Cliente verificado</p>
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
          <h2 className="text-sm font-bold text-brand-dark mb-4">Información de contacto</h2>
          <div className="space-y-3">
            <InfoRow icon={User} label="Nombre" value={MOCK_USER.fullName} />
            <InfoRow icon={Mail} label="Email" value={MOCK_USER.email} />
            <InfoRow icon={Phone} label="Teléfono" value={MOCK_USER.phone} />
          </div>
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
            Documentos verificados
          </h2>
          <div className="space-y-2">
            {MOCK_DOCS.map((doc) => (
              <div
                key={doc.type}
                className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  {doc.type === "Pasaporte" ? (
                    <FileText className="w-4 h-4 text-brand-muted" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-brand-muted" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{doc.type}</p>
                    <p className="text-[11px] text-brand-muted">{doc.date}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-brand-success">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verificado
                </span>
              </div>
            ))}
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
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
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
