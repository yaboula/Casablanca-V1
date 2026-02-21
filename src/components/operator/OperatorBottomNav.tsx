"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileText, Search, User, ShieldCheck } from "lucide-react";
import { useUser } from "@/hooks/useUser";

const OPERATOR_TABS = [
  { href: "/operator/dashboard", icon: ClipboardList, label: "Entregas" },
  { href: "/operator/documents", icon: FileText,      label: "Documentos" },
  { href: "/operator/search",    icon: Search,        label: "Buscar" },
  { href: "/operator/profile",   icon: User,          label: "Perfil" },
];

const ADMIN_TABS = [
  { href: "/operator/dashboard", icon: ClipboardList, label: "Entregas" },
  { href: "/operator/documents", icon: FileText,      label: "Documentos" },
  { href: "/operator/admin",     icon: ShieldCheck,   label: "Admin" },
  { href: "/operator/profile",   icon: User,          label: "Perfil" },
];

export default function OperatorBottomNav() {
  const pathname = usePathname();
  const user = useUser();
  const tabs = user?.role === "ADMIN" ? ADMIN_TABS : OPERATOR_TABS;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href === "/operator/dashboard" && pathname.startsWith("/operator/delivery")) ||
            (tab.href === "/operator/admin" && pathname.startsWith("/operator/admin"));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[48px] rounded-xl transition-colors relative
                ${isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-700"}`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
