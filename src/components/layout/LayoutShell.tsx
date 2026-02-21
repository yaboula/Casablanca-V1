"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactHub from "@/components/shared/ContactHub";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useDarkMode } from "@/hooks/useDarkMode";

// Routes where ContactHub is NOT needed (operator or API)
const NO_CONTACT_HUB_PATHS = ["/operator", "/api", "/soporte/chat"];

/**
 * Conditionally renders Header + Footer only for customer-facing routes.
 * Operator routes (/operator/*) get their own shell via the operator layout.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Fetch live EUR→MAD rate once on mount, stored in useCurrencyStore
  useExchangeRate();
  // Apply dark/light class to <html> based on stored preference
  useDarkMode();
  const isOperator = pathname.startsWith("/operator");
  const isFullScreen = pathname.startsWith("/soporte/chat");
  const showContactHub = !NO_CONTACT_HUB_PATHS.some((p) => pathname.startsWith(p));

  if (isOperator || isFullScreen) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
      {showContactHub && <ContactHub />}
    </>
  );
}
