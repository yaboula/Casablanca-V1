import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones — NEXUS.",
  description: "Términos y condiciones del servicio de alquiler de vehículos NEXUS. en el Aeropuerto Mohammed V de Casablanca.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-8"
        >
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-black text-brand-dark mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-brand-muted mb-10">Última actualización: 19 de febrero de 2026</p>

        <div className="space-y-8 text-brand-dark">
          <Section title="1. Aceptación de los términos">
            Al realizar una reserva a través de NEXUS., el usuario acepta los presentes términos y
            condiciones en su totalidad. Si no estás de acuerdo con alguno de los términos, te
            rogamos que no utilices nuestro servicio.
          </Section>

          <Section title="2. Depósito y reserva">
            Para confirmar una reserva se requiere un depósito de <strong>10€</strong> no
            reembolsable. Este importe se descontará del precio total en el momento de la recogida
            del vehículo. El saldo restante se abona en efectivo o tarjeta al recoger el coche en
            el Aeropuerto Mohammed V (CMN).
          </Section>

          <Section title="3. Documentación requerida">
            El conductor principal debe presentar en el momento de la recogida: pasaporte o DNI en
            vigor, carnet de conducir válido en el país de origen y tarjeta de crédito/débito a
            nombre del titular de la reserva.
          </Section>

          <Section title="4. Cancelaciones y modificaciones">
            Las reservas pueden modificarse hasta 24 horas antes de la recogida sin coste adicional.
            Las cancelaciones realizadas con menos de 24 horas de antelación no tendrán derecho a
            reembolso del depósito.
          </Section>

          <Section title="5. Responsabilidad">
            NEXUS. actúa como intermediario entre el cliente y el operador de la flota. No nos
            hacemos responsables de daños, accidentes o robos ocurridos durante el periodo de
            alquiler. El cliente es responsable del vehículo durante toda la duración del contrato.
          </Section>

          <Section title="6. Política en construcción">
            Esta política está actualmente en período de revisión legal. Para cualquier duda,
            contacta con nosotros en{" "}
            <a href="mailto:hola@nexus-cmn.com" className="text-brand-primary hover:underline">
              hola@nexus-cmn.com
            </a>
            .
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
