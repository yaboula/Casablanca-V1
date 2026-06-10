import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description: "Cancellation policy for Nexus Mobility.",
};

export default function CancellationPolicyPage() {
  return (
    <section className="nx-container py-12 md:py-16">
      <div className="max-w-3xl space-y-6">
        <h1 className="nx-h2 font-display font-light text-neutral-950">Cancellation policy</h1>
        <p className="nx-body font-light text-neutral-600">
          The current product copy states free cancellation up to 24 hours before pickup.
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
          <p>Reservation-specific timing should always be checked in the live booking flow and confirmation screens.</p>
          <p>If a booking is cancelled, the reservation state and any related holds are handled through the real reservation and payment flow.</p>
          <p>If you need help with a current reservation, use the support page linked below.</p>
        </div>
      </div>
    </section>
  );
}
