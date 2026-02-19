"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactHub from "@/components/shared/ContactHub";

// Routes where ContactHub is NOT needed (operator or API)
const NO_CONTACT_HUB_PATHS = ["/operator", "/api"];

/**
 * Conditionally renders Header + Footer only for customer-facing routes.
 * Operator routes (/operator/*) get their own shell via the operator layout.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOperator = pathname.startsWith("/operator");
  const showContactHub = !NO_CONTACT_HUB_PATHS.some((p) => pathname.startsWith(p));

  if (isOperator) {
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
