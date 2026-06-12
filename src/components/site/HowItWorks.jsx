import { motion } from "framer-motion";
import { HOW } from "@/constants/testIds";
import { Reveal } from "@/components/site/Reveal";

const steps = [
    {
        n: "01",
        id: HOW.step1,
        title: "Reserve",
        copy: "Choose your exact model — not a category — and confirm in under two minutes from any device, before you fly.",
    },
    {
        n: "02",
        id: HOW.step2,
        title: "Arrive",
        copy: "Your operator tracks your flight and is waiting in the arrivals hall with the keys before you reach baggage claim.",
    },
    {
        n: "03",
        id: HOW.step3,
        title: "Drive",
        copy: "A single digital handover — no paperwork queues. Walk out of the terminal and straight onto the road.",
    },
];

export const HowItWorks = () => {
    return (
        <section
            id="how"
            data-testid={HOW.section}
            className="relative bg-white border-t border-neutral-100"
        >
            <div className="nx-container nx-section">
                <div className="flex items-end justify-between flex-wrap gap-8 mb-12 md:mb-16">
                    <Reveal>
                        <div>
                            <div className="nx-eyebrow text-neutral-600 font-medium">
                                How it works
                            </div>
                            <h2 className="nx-h2 font-display mt-4 font-light text-neutral-900 max-w-3xl">
                                Three steps.
                                <br className="hidden md:block" />
                                <span className="italic text-neutral-500">
                                    Zero friction.
                                </span>
                            </h2>
                        </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                        <p className="nx-lead text-neutral-600 max-w-sm">
                            Designed for travelers who measure time in flights,
                            not forms.
                        </p>
                    </Reveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-neutral-200">
                    {steps.map((s, i) => (
                        <motion.div
                            key={s.n}
                            data-testid={s.id}
                            initial={{ opacity: 0, y: 32 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{
                                delay: i * 0.12,
                                duration: 0.9,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className={`group relative py-10 md:py-14 md:px-9 lg:px-11 px-6 border-neutral-200 hover:bg-neutral-50/70 transition-colors duration-500 ${
                                i !== steps.length - 1
                                    ? "border-b md:border-b-0 md:border-r"
                                    : ""
                            }`}
                        >
                            <div className="flex items-baseline gap-4">
                                <span
                                    className="font-display font-light text-neutral-300 group-hover:text-[#1E41FC] transition-colors duration-700"
                                    style={{ fontSize: "clamp(3.5rem, 5vw, 5.5rem)" }}
                                >
                                    {s.n}
                                </span>
                                <span className="h-px w-12 bg-neutral-300 group-hover:w-24 group-hover:bg-[#1E41FC] transition-all duration-700" />
                            </div>
                            <h3 className="nx-h3 font-display mt-6 font-medium text-neutral-900">
                                {s.title}
                            </h3>
                            <p className="nx-body mt-4 text-neutral-600 max-w-sm">
                                {s.copy}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
