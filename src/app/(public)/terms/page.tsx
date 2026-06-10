import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms information for Nexus Mobility.",
};

export default function TermsPage() {
  return (
    <section className="nx-container py-12 md:py-16">
      <div className="max-w-3xl space-y-6">
        <h1 className="nx-h2 font-display font-light text-neutral-950">Terms</h1>
        <p className="nx-body font-light text-neutral-600">
          The public experience shown here is centered on exact vehicle reservation, document
          verification, and airport handoff. Final operational terms are confirmed during the
          live booking process.
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
          <p>Vehicle availability, pricing, and verification requirements depend on the live catalog and reservation data.</p>
          <p>The reservation flow may require valid identity documents and a refundable security deposit authorization before handoff.</p>
          <p>Operational release of the vehicle depends on successful verification and the state of the reservation.</p>
          <p>This page avoids inventing legal promises beyond what the product currently exposes.</p>
        </div>
      </div>
    </section>
  );
}
