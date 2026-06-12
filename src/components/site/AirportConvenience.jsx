import { motion } from "framer-motion";
import { ArrowUpRight, Plane, Timer, FileCheck2 } from "lucide-react";
import { AIRPORT } from "@/constants/testIds";
import { Reveal } from "@/components/site/Reveal";

const points = [
    {
        icon: FileCheck2,
        title: "Upload documents early",
        copy: "Add your licence and ID before takeoff. Verification is done before you land — nothing to fill in on arrival.",
    },
    {
        icon: Plane,
        title: "Met at arrivals",
        copy: "Your operator tracks your flight in real time and is ready in the arrivals hall before you reach baggage claim.",
    },
    {
        icon: Timer,
        title: "Keys in under ten minutes",
        copy: "From arrival to ignition in under ten minutes — a single digital signature, then the road.",
    },
];

export const AirportConvenience = () => {
    return (
        <section
            id="airport"
            data-testid={AIRPORT.section}
            className="relative bg-white border-t border-neutral-100"
        >
            <div className="nx-container nx-section">
                <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 xl:gap-20 items-center">
                    {/* Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        <div className="relative overflow-hidden rounded-[26px] md:rounded-[32px] border border-neutral-200 bg-neutral-100">
                            <img
                                src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxhaXJwb3J0JTIwdGVybWluYWx8ZW58MHx8fHwxNzgwODQzODgxfDA&ixlib=rb-4.1.0&q=85"
                                alt="Traveler arriving at a modern airport terminal"
                                className="w-full h-[clamp(420px,42vw,600px)] object-cover"
                                loading="lazy"
                            />
                            <div
                                aria-hidden
                                className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
                            />

                            {/* Solid arrival/operator card (no glass) */}
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4, duration: 0.9 }}
                                className="absolute left-5 bottom-5 md:left-7 md:bottom-7 right-5 md:right-auto bg-white border border-neutral-200 rounded-2xl p-5 md:w-[340px] shadow-[0_22px_50px_-30px_rgba(0,0,0,0.4)]"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="nx-label text-neutral-500">Your arrival</span>
                                    <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-emerald-600 font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        On time
                                    </span>
                                </div>
                                <div className="mt-3 font-display text-[1.15rem] font-semibold text-neutral-900">
                                    AF 1496 · CDG → CMN
                                </div>
                                <div className="mt-1 nx-meta text-neutral-500">
                                    Terminal 1 · Gate A14 · 14:42
                                </div>
                                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                                    <div>
                                        <div className="nx-label text-neutral-500">Operator</div>
                                        <div className="text-[0.95rem] font-semibold text-neutral-900 mt-0.5">
                                            Yassine · 4.99
                                        </div>
                                    </div>
                                    <span className="font-mono text-[0.625rem] px-2.5 py-1 rounded-full bg-[#1E41FC] text-white tracking-wide">
                                        EN ROUTE
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Copy */}
                    <div>
                        <Reveal>
                            <div className="nx-eyebrow font-medium text-neutral-600">
                                Airport convenience
                            </div>
                        </Reveal>
                        <Reveal delay={0.08}>
                            <h2 className="nx-h2 font-display mt-4 font-light text-neutral-900">
                                Terminal to tarmac.
                                <br />
                                <span className="italic text-neutral-500">In minutes.</span>
                            </h2>
                        </Reveal>
                        <Reveal delay={0.18}>
                            <p className="nx-lead mt-6 text-neutral-600 max-w-[34rem]">
                                Everything is prepared before you land. We track your
                                flight, verify your documents in advance, and hand you
                                the keys to your exact vehicle — no rental counter, no
                                queue, no surprises.
                            </p>
                        </Reveal>

                        <ul className="mt-9 space-y-6">
                            {points.map((p, i) => (
                                <motion.li
                                    key={p.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{
                                        delay: 0.2 + i * 0.1,
                                        duration: 0.8,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="flex gap-4 md:gap-5 items-start group"
                                >
                                    <div className="shrink-0 w-11 h-11 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-900 group-hover:border-[#1E41FC] group-hover:text-[#1E41FC] transition-colors duration-500">
                                        <p.icon strokeWidth={1.6} className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="nx-h4 font-display font-semibold text-neutral-900">
                                            {p.title}
                                        </h3>
                                        <p className="nx-body text-neutral-600 mt-2 max-w-[32rem]">
                                            {p.copy}
                                        </p>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>

                        <Reveal delay={0.5}>
                            <a
                                href="#booking"
                                data-testid={AIRPORT.cta}
                                className="nx-btn-primary mt-10 inline-flex items-center gap-2 bg-[#0A0A0A] text-white hover:bg-[#1E41FC] rounded-full pl-7 pr-6 py-4 text-[1.0625rem] font-medium"
                            >
                                Plan my arrival
                                <ArrowUpRight className="w-5 h-5" />
                            </a>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AirportConvenience;
