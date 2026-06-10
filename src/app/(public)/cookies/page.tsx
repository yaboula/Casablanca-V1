import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie information for Nexus Mobility.",
};

export default function CookiesPage() {
  return (
    <section className="nx-container py-12 md:py-16">
      <div className="max-w-3xl space-y-6">
        <h1 className="nx-h2 font-display font-light text-neutral-950">Cookie policy</h1>
        <p className="nx-body font-light text-neutral-600">
          Nexus Mobility uses session-based web functionality to support authentication and secure
          reservation flows.
        </p>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
          <p>Authentication and reservation state may rely on cookies that keep your session connected to backend services.</p>
          <p>These cookies help protect account access, payment-related flows, and reservation updates.</p>
          <p>This demo page is intentionally brief and does not claim a broader analytics or advertising setup than what the current product shows.</p>
        </div>
      </div>
    </section>
  );
}
