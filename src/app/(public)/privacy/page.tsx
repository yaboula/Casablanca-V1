import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for Nexus Mobility.",
};

export default function PrivacyPage() {
  return (
    <section className="nx-container py-12 md:py-16">
      <div className="max-w-3xl space-y-6">
        <h1 className="nx-h2 font-display font-light text-neutral-950">Privacy</h1>
        <p className="nx-body font-light text-neutral-600">
          Nexus Mobility handles identity documents, reservation details, and payment-related
          information as part of the booking and check-in flow. This page is a concise public
          summary for the current demo product.
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
          <p>We collect the information required to create reservations, verify documents, and support airport handoff operations.</p>
          <p>Payment authorization is handled through Stripe. Sensitive card details are not stored directly in this frontend.</p>
          <p>Identity documents uploaded for verification are used only for reservation validation and operational handoff checks.</p>
          <p>If you need a reservation-specific privacy response, use the support channel linked in the footer.</p>
        </div>
      </div>
    </section>
  );
}
