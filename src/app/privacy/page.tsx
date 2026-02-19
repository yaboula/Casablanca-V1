import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — NEXUS.",
  description: "Política de privacidad y protección de datos de NEXUS. Aeropuerto Mohammed V Casablanca.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-8"
        >
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-black text-brand-dark mb-2">Política de Privacidad</h1>
        <p className="text-sm text-brand-muted mb-10">Última actualización: 19 de febrero de 2026</p>

        <div className="space-y-8 text-brand-dark">
          <Section title="1. Responsable del tratamiento">
            NEXUS. es responsable del tratamiento de los datos personales recogidos a través de esta
            plataforma. Puedes contactarnos en{" "}
            <a href="mailto:privacidad@nexus-cmn.com" className="text-brand-primary hover:underline">
              privacidad@nexus-cmn.com
            </a>
            .
          </Section>

          <Section title="2. Datos que recogemos">
            Recogemos los siguientes datos para gestionar tu reserva: nombre completo, dirección de
            correo electrónico, número de teléfono, información del documento de identidad y datos
            de pago (procesados de forma segura por un proveedor certificado PCI-DSS).
          </Section>

          <Section title="3. Finalidad del tratamiento">
            Tus datos son utilizados exclusivamente para: (a) gestionar tu reserva y contrato de
            alquiler, (b) comunicarte información relevante sobre tu reserva, y (c) cumplir con
            obligaciones legales aplicables.
          </Section>

          <Section title="4. Base jurídica">
            El tratamiento de tus datos se basa en la ejecución de un contrato al que eres parte
            (reserva de vehículo) y en el cumplimiento de obligaciones legales.
          </Section>

          <Section title="5. Conservación de datos">
            Conservamos tus datos durante el período de vigencia de tu reserva y hasta 5 años
            después para cumplir con obligaciones fiscales y legales.
          </Section>

          <Section title="6. Tus derechos">
            Tienes derecho a acceder, rectificar, suprimir y portar tus datos, así como a oponerte
            a su tratamiento. Ejerce estos derechos enviando un correo a{" "}
            <a href="mailto:privacidad@nexus-cmn.com" className="text-brand-primary hover:underline">
              privacidad@nexus-cmn.com
            </a>
            .
          </Section>

          <Section title="7. Política en construcción">
            Esta política está siendo revisada por nuestro equipo legal. Para cualquier consulta
            urgente, contáctanos directamente.
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[48px] px-8 bg-brand-primary
                       text-white font-bold text-sm rounded-full hover:bg-brand-primary/90 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-brand-dark mb-2">{title}</h2>
      <p className="text-sm text-brand-muted leading-relaxed">{children}</p>
    </div>
  );
}
