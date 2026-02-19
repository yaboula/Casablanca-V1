import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1 space-y-4">
            <span className="text-xl font-black tracking-tight text-white">
              NEXUS<span className="text-brand-primary">.</span>
            </span>
            <p className="text-sm leading-relaxed text-white/50 max-w-xs">
              Alquiler de coches premium en el Aeropuerto Mohammed V · CMN.
              Tu coche listo cuando aterrizas.
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand-success animate-pulse" />
              <span className="text-xs text-white/40">Disponible · Beta abierta</span>
            </div>
          </div>

          {/* Flota */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Flota
            </h3>
            <ul className="space-y-2 text-sm">
              {["Compactos", "SUV", "Premium", "Eléctricos"].map((item) => (
                <li key={item}>
                  <Link href="/catalog" className="hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Empresa
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Cómo funciona", href: "/#why" },
                { label: "Preguntas frecuentes", href: "/faq" },
                { label: "Términos de uso", href: "/terms" },
                { label: "Privacidad", href: "/privacy" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://wa.me/212600000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#25D366] shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:hola@nexus.ma" className="hover:text-white transition-colors">
                  hola@nexus.ma
                </a>
              </li>
              <li className="text-white/40 text-xs">
                CMN · Terminal 1 & Terminal 2
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © 2026 NEXUS. · Aeropuerto Mohammed V · Casablanca, Marruecos
          </p>

          {/* Locale & currency placeholders */}
          <div className="flex items-center gap-3 text-xs text-white/30">
            <button className="hover:text-white/60 transition-colors" title="Idioma">
              ES · FR · AR
            </button>
            <span>·</span>
            <button className="hover:text-white/60 transition-colors" title="Divisa">
              € EUR · MAD DH
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
