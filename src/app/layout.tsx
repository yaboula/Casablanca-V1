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
        <footer className="border-t border-neutral-200 bg-white mt-auto">
          <div className="nx-container py-10 md:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E41FC]" />
              <span className="font-display text-lg font-medium tracking-tight">
                Nexus<span className="text-neutral-400">/Mobility</span>
              </span>
              <span className="ml-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#1E41FC] bg-[#1E41FC]/8 border border-[#1E41FC]/20 rounded-full px-2.5 py-1">
                Demo concept
              </span>
            </div>
            <div className="flex items-center gap-6 text-[0.85rem] text-neutral-500">
              <Link className="hover:text-neutral-900 transition-colors" href="/catalog">
                Vehicles
              </Link>
              <Link className="hover:text-neutral-900 transition-colors" href="/dashboard">
                My trips
              </Link>
              <Link className="hover:text-neutral-900 transition-colors" href="/operator/dashboard">
                Operator console
              </Link>
            </div>
            <div className="text-[0.85rem] text-neutral-400 font-medium">
              © {new Date().getFullYear()} Nexus Mobility. Casablanca Mohammed V Airport.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

