import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Support information for Nexus Mobility reservations.",
};

export default function SupportPage() {
  return (
    <section className="nx-container py-12 md:py-16">
      <div className="max-w-3xl space-y-6">
        <h1 className="nx-h2 font-display font-light text-neutral-950">Support</h1>
        <p className="nx-body font-light text-neutral-600">
          If you already have a reservation, the dashboard and confirmation flow remain the best
          place to review its status, payment step, and document progress.
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
          <p>Use your reservation dashboard to review bookings already tied to your account.</p>
          <p>If a payment or document step fails, follow the instructions shown in the live reservation flow.</p>
          <p>For a new booking, return to the catalog and select the exact vehicle you want to reserve.</p>
        </div>
        <div className="pt-2">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-5 py-3 text-sm font-medium text-white transition-colors duration-300 hover:bg-[#1E41FC]"
          >
            Browse the live fleet
          </Link>
        </div>
      </div>
    </section>
  );
}
