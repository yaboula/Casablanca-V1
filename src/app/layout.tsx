import type { Metadata } from "next";
import Link from "next/link";
import { SessionNav } from "@/features/auth/SessionNav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nexus Mobility — Airport Car Rental",
    template: "%s | Nexus Mobility",
  },
  description:
    "Reserve the exact vehicle before you land. Premium airport car rental at Casablanca Mohammed V Airport.",
  metadataBase: new URL("https://nexusmobility.ma"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="border-b border-[var(--nx-line)] bg-white">
          <nav
            aria-label="Main navigation"
            className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between px-6"
          >
            <Link
              aria-label="Nexus Mobility — home"
              className="text-sm font-black uppercase tracking-[0.16em]"
              href="/"
            >
              Nexus Mobility
            </Link>
            <Link
              aria-label="Browse the vehicle catalog"
              className="text-sm font-bold text-neutral-700 hover:text-neutral-950"
              href="/catalog"
            >
              Fleet
            </Link>
            <SessionNav />
          </nav>
        </header>
        <main id="main-content" className="min-h-[calc(100vh-8rem)]">
          {children}
        </main>
        <footer className="border-t border-[var(--nx-line)] bg-white">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-6 px-6 text-sm text-neutral-600">
            <span>© {new Date().getFullYear()} Nexus Mobility. Casablanca Mohammed V Airport.</span>
            <Link className="hover:text-neutral-950" href="/catalog">
              Browse fleet
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
