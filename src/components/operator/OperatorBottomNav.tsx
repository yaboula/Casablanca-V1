"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileText, Search, User } from "lucide-react";
import { MOCK_PENDING_DOCS } from "@/lib/mock-operator-data";

const tabs = [
  { href: "/operator/dashboard", icon: ClipboardList, label: "Entregas" },
  { href: "/operator/documents", icon: FileText, label: "Documentos", badge: MOCK_PENDING_DOCS.length },
  { href: "/operator/search", icon: Search, label: "Buscar" },
  { href: "/operator/profile", icon: User, label: "Perfil" },
];

export default function OperatorBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href === "/operator/dashboard" && pathname.startsWith("/operator/delivery"));
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
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
