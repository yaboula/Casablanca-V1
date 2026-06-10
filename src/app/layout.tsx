import type { Metadata } from "next";
import Link from "next/link";
import { SessionNav } from "@/features/auth/SessionNav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nexus Mobility - Airport Car Rental",
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
      <body className="flex min-h-screen flex-col bg-white text-neutral-900">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="sticky top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200/50">
          <nav
            aria-label="Main navigation"
            className="nx-container h-16 md:h-20 flex items-center justify-between"
          >
            <div className="flex items-center gap-8 md:gap-12">
              <Link href="/" className="flex items-center gap-2.5 group">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E41FC] transition-transform group-hover:scale-110" />
                <span className="font-display text-xl md:text-[1.3rem] font-semibold tracking-tight text-neutral-900">
                  Nexus<span className="text-neutral-400">/Mobility</span>
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-8">
                <Link
                  className="nx-link text-[0.9rem] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  href="/catalog"
                >
                  Fleet
                </Link>
                <Link
                  className="nx-link text-[0.9rem] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  href="/#how-it-works"
                >
                  How it works
                </Link>
              </div>
            </div>
            <SessionNav />
          </nav>
        </header>
        <main id="main-content" className="flex-grow">
          {children}
        </main>
        <footer className="mt-auto border-t border-neutral-200 bg-white">
          <div className="nx-container py-10 md:py-12">
            <div className="flex flex-col gap-6 border-b border-neutral-100 pb-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1E41FC]" />
                  <span className="font-display text-lg font-medium tracking-tight">
                    Nexus<span className="text-neutral-400">/Mobility</span>
                  </span>
                </div>
                <p className="max-w-md text-[0.9rem] text-neutral-500">
                  Premium airport-first rentals at Casablanca Mohammed V Airport,
                  with exact vehicle selection, document verification, and a calmer pickup flow.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-[0.85rem] text-neutral-500 md:items-end">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Link className="hover:text-neutral-900 transition-colors" href="/catalog">
                    Vehicles
                  </Link>
                  <Link className="hover:text-neutral-900 transition-colors" href="/dashboard">
                    My trips
                  </Link>
                  <Link className="hover:text-neutral-900 transition-colors" href="/support">
                    Support
                  </Link>
                </div>
                <Link
                  className="text-[0.8rem] font-medium text-neutral-400 transition-colors hover:text-neutral-700"
                  href="/operator/dashboard"
                >
                  Staff access
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem] text-neutral-500">
                <Link className="hover:text-neutral-900 transition-colors" href="/privacy">
                  Privacy
                </Link>
                <Link className="hover:text-neutral-900 transition-colors" href="/terms">
                  Terms
                </Link>
                <Link className="hover:text-neutral-900 transition-colors" href="/cookies">
                  Cookie policy
                </Link>
                <Link className="hover:text-neutral-900 transition-colors" href="/cancellation-policy">
                  Cancellation policy
                </Link>
                <Link className="hover:text-neutral-900 transition-colors" href="/support">
                  Contact
                </Link>
              </div>
              <div className="text-[0.85rem] font-medium text-neutral-400">
                (c) {new Date().getFullYear()} Nexus Mobility. Casablanca Mohammed V Airport.
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
