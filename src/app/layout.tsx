import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Casablanca V1",
    template: "%s | Casablanca V1",
  },
  description:
    "Production frontend foundation for the Casablanca airport car rental platform.",
  metadataBase: new URL("https://casablanca-v1.local"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#main-content">
          Saltar al contenido principal
        </a>
        <header className="border-b border-[var(--nx-line)] bg-white">
          <nav
            aria-label="Navegacion principal"
            className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between px-6"
          >
            <Link className="text-sm font-black uppercase tracking-[0.16em]" href="/">
              Casablanca V1
            </Link>
            <span className="text-sm font-medium text-neutral-600">
              Next App Router foundation
            </span>
          </nav>
        </header>
        <main id="main-content" className="min-h-[calc(100vh-8rem)]">
          {children}
        </main>
        <footer className="border-t border-[var(--nx-line)] bg-white">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center px-6 text-sm text-neutral-600">
            Backend-connected flows are intentionally not mounted in Commit A.
          </div>
        </footer>
      </body>
    </html>
  );
}
