import { motion } from "framer-motion";
import { TRUST } from "@/constants/testIds";
import { Reveal } from "@/components/site/Reveal";

const items = [
    "Mercedes-Benz",
    "Porsche",
    "Range Rover",
    "BMW",
    "Audi",
    "Lexus",
    "Genesis",
    "Maserati",
];

export const TrustStrip = () => {
    return (
        <section
            id="trust"
            data-testid={TRUST.section}
            className="relative bg-white border-t border-neutral-100"
        >
            <div className="nx-container nx-section-sm">
                <div className="grid md:grid-cols-[1fr_2fr] gap-10 md:gap-16 lg:gap-20 items-center">
                    <Reveal>
                        <div>
                            <div className="nx-eyebrow text-neutral-600 font-medium">
                                Curated fleet
                            </div>
                            <h2 className="nx-h3 font-display mt-3 font-light text-neutral-900 max-w-sm">
                                The world’s finest marques.
                                <span className="text-neutral-400"> Hand-selected.</span>
                            </h2>
                        </div>
                    </Reveal>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                        data-testid={TRUST.marquee}
                        className="relative overflow-hidden"
                        style={{
                            WebkitMaskImage:
                                "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                            maskImage:
                                "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                        }}
                    >
                        <div className="flex gap-14 md:gap-20 whitespace-nowrap nx-marquee w-max">
                            {[...items, ...items].map((it, i) => (
                                <span
                                    key={i}
                                    className="font-display text-2xl md:text-[1.9rem] font-light text-neutral-400 hover:text-neutral-900 transition-colors duration-500"
                                >
                                    {it}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default TrustStrip;
