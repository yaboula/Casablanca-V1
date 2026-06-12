import { motion } from "framer-motion";
import {
    ShieldCheck,
    Sparkles,
    Wallet,
    Headphones,
    KeyRound,
    Clock4,
} from "lucide-react";
import { WHY } from "@/constants/testIds";
import { Reveal } from "@/components/site/Reveal";

const benefits = [
    {
        icon: KeyRound,
        title: "Guaranteed model",
        copy: "The exact car you booked. Never a ‘similar’ substitute, ever.",
    },
    {
        icon: Wallet,
        title: "Transparent pricing",
        copy: "All-inclusive rates shown upfront. No hidden fees at the counter.",
    },
    {
        icon: ShieldCheck,
        title: "Full coverage included",
        copy: "Premium insurance and 24/7 roadside assistance as standard.",
    },
    {
        icon: Sparkles,
        title: "Detailed before each trip",
        copy: "Every vehicle is studio-clean, sanitised and inspected.",
    },
    {
        icon: Headphones,
        title: "Human concierge",
        copy: "Real people, multilingual, reachable in under a minute.",
    },
    {
        icon: Clock4,
        title: "Flexible cancellation",
        copy: "Cancel free up to 24 hours before pickup. No questions.",
    },
];

export const WhyChooseUs = () => {
    return (
        <section
            data-testid={WHY.section}
            className="relative bg-white border-t border-neutral-100"
        >
            <div className="nx-container nx-section">
                <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-20 mb-12 md:mb-16">
                    <Reveal>
                        <div>
                            <div className="nx-eyebrow text-neutral-600 font-medium">
                                Why Nexus
                            </div>
                            <h2 className="nx-h2 font-display mt-4 font-light text-neutral-900">
                                The details
                                <br />
                                <span className="italic text-neutral-500">
                                    you’ll feel.
                                </span>
                            </h2>
                        </div>
                    </Reveal>
                    <Reveal delay={0.12}>
                        <p className="nx-lead text-neutral-600 max-w-xl lg:self-end">
                            We obsess over the moments most rental companies
                            forget — the first key handover, the cleanliness of
                            the cabin, the response time when something matters.
                        </p>
                    </Reveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-neutral-200">
                    {benefits.map((b, i) => (
                        <motion.div
                            key={b.title}
                            data-testid={`${WHY.card}-${b.title.toLowerCase().replace(/\s/g, "-")}`}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{
                                delay: (i % 3) * 0.08 + Math.floor(i / 3) * 0.12,
                                duration: 0.85,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="group p-8 md:p-10 border-b border-r border-neutral-200 hover:bg-neutral-50/70 transition-colors duration-500"
                        >
                            <div className="w-12 h-12 rounded-xl border border-neutral-300 flex items-center justify-center text-neutral-900 group-hover:border-[#1E41FC] group-hover:text-[#1E41FC] transition-colors duration-500">
                                <b.icon strokeWidth={1.5} className="w-5 h-5" />
                            </div>
                            <h3 className="nx-h4 font-display mt-6 font-semibold text-neutral-900">
                                {b.title}
                            </h3>
                            <p className="nx-body mt-3 text-neutral-600">
                                {b.copy}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
