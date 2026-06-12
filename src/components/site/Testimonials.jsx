import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TESTIMONIALS } from "@/constants/testIds";

const reviews = [
    {
        quote: "The closest thing to a private jet experience on the ground. I land in Casablanca, and ten minutes later I am driving.",
        name: "Léa Marchetti",
        role: "Partner · Maison Marchetti",
        loc: "Paris → Casablanca",
    },
    {
        quote: "The exact car I booked, immaculate, with the operator already at the gate. Nexus has redefined what rental should feel like.",
        name: "Daniel Okafor",
        role: "Managing Director",
        loc: "London → Casablanca",
    },
    {
        quote: "No counter, no paperwork, no excuses. They simply hand you the keys and disappear. That is the standard now.",
        name: "Anya Ferreira",
        role: "Creative Director",
        loc: "Lisbon → Casablanca",
    },
];

export const Testimonials = () => {
    const [i, setI] = useState(0);
    const r = reviews[i];
    const go = (dir) => setI((p) => (p + dir + reviews.length) % reviews.length);

    return (
        <section
            data-testid={TESTIMONIALS.section}
            className="relative bg-[#0A0A0A] text-white overflow-hidden"
        >
            <div
                aria-hidden
                className="absolute -top-40 left-1/2 -translate-x-1/2 w-[820px] h-[820px] rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{
                    background:
                        "radial-gradient(closest-side, rgba(30,65,252,0.35), transparent 70%)",
                }}
            />
            <div className="relative nx-container nx-section">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="nx-eyebrow text-neutral-400"
                >
                    Trusted by travelers
                </motion.div>

                <div className="grid lg:grid-cols-[1fr_auto] items-end gap-10 mt-7">
                    <AnimatePresence mode="wait">
                        <motion.blockquote
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                            className="font-display font-light leading-[1.18] tracking-[-0.02em] max-w-5xl"
                            style={{ fontSize: "clamp(1.9rem, 3vw + 0.5rem, 3.75rem)" }}
                        >
                            <span className="text-[#1E41FC]">“</span>
                            {r.quote}
                            <span className="text-[#1E41FC]">”</span>
                        </motion.blockquote>
                    </AnimatePresence>

                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={() => go(-1)}
                            data-testid={TESTIMONIALS.prev}
                            className="w-12 h-12 rounded-full border border-neutral-700 flex items-center justify-center hover:bg-white hover:text-neutral-900 hover:border-white transition-colors duration-400"
                            aria-label="Previous"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => go(1)}
                            data-testid={TESTIMONIALS.next}
                            className="w-12 h-12 rounded-full border border-neutral-700 flex items-center justify-center hover:bg-white hover:text-neutral-900 hover:border-white transition-colors duration-400"
                            aria-label="Next"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-between gap-8 border-t border-neutral-800 pt-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={r.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="font-display text-[1.15rem] font-medium">
                                {r.name}
                            </div>
                            <div className="nx-meta text-neutral-400 mt-1">
                                {r.role}
                                <span className="mx-2 text-neutral-600">·</span>
                                {r.loc}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex items-center gap-6">
                        <Metric value="4.97" label="Avg. rating" />
                        <Divider />
                        <Metric value="38k+" label="Reservations" />
                        <Divider />
                        <Metric value="98%" label="On-time pickup" />
                    </div>

                    <div className="flex items-center gap-2">
                        {reviews.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setI(idx)}
                                data-testid={`${TESTIMONIALS.dot}-${idx}`}
                                aria-label={`Show review ${idx + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    idx === i
                                        ? "w-8 bg-white"
                                        : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Metric = ({ value, label }) => (
    <div>
        <div className="font-display text-2xl font-light">{value}</div>
        <div className="text-[0.625rem] uppercase tracking-[0.18em] text-neutral-500">
            {label}
        </div>
    </div>
);

const Divider = () => (
    <span className="hidden sm:inline-block w-px h-8 bg-neutral-800" />
);

export default Testimonials;
