"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/shared/WhatsAppFAB";

// Routes where FAB is NOT needed (operator or booking flow)
const NO_FAB_PATHS = ["/operator", "/api"];

/**
 * Conditionally renders Header + Footer only for customer-facing routes.
 * Operator routes (/operator/*) get their own shell via the operator layout.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOperator = pathname.startsWith("/operator");
  const showFAB = !NO_FAB_PATHS.some((p) => pathname.startsWith(p));

  if (isOperator) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
      {showFAB && <WhatsAppFAB />}
    </>
  );
}
