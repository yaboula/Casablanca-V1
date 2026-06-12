import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Plane, Timer } from "lucide-react";
import BookingWidget from "@/components/site/BookingWidget";
import { HERO } from "@/constants/testIds";

const EASE = [0.16, 1, 0.3, 1];

export const Hero = () => {
    return (
        <section
            id="top"
            data-testid={HERO.section}
            className="relative w-full bg-white overflow-hidden"
        >
            <div className="nx-container pt-24 md:pt-28 pb-10 md:pb-12">
                {/* TOP — copy + cinematic vehicle */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-10 items-center lg:min-h-[clamp(360px,44vh,520px)]">
                    {/* LEFT — copy */}
                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex items-center gap-3"
                        >
                            <span className="inline-block w-10 h-px bg-neutral-900" />
                            <span className="nx-eyebrow font-medium text-neutral-700">
                                Casablanca · Mohammed V Intl. — CMN
                            </span>
                        </motion.div>

                        <h1
                            data-testid={HERO.headline}
                            className="nx-display font-display mt-6 md:mt-7 font-light text-neutral-900"
                        >
                            <Line delay={0.05}>Arrive</Line>
                            <Line delay={0.15}>
                                at a{" "}
                                <span className="italic text-[#1E41FC] font-light">
                                    higher
                                </span>
                            </Line>
                            <Line delay={0.24}>standard.</Line>
                        </h1>

                        <motion.p
                            data-testid={HERO.subhead}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45, duration: 0.9 }}
                            className="nx-lead max-w-[34rem] text-neutral-600 mt-7 md:mt-8"
                        >
                            Premium car rental at{" "}
                            <span className="text-neutral-900 font-medium">
                                Casablanca Mohammed V Airport
                            </span>
                            . Reserve before you land, skip the counter, and pick up
                            your exact vehicle in minutes.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.9 }}
                            className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-8"
                        >
                            <a
                                href="#booking"
                                data-testid={HERO.ctaPrimary}
                                className="nx-btn-primary group inline-flex items-center gap-2.5 bg-[#0A0A0A] text-white hover:bg-[#1E41FC] rounded-full pl-8 pr-7 py-[1.05rem] text-[1.0625rem] font-medium"
                            >
                                Reserve a vehicle
                                <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-0.5" />
                            </a>
                            <a
                                href="#fleet"
                                data-testid={HERO.ctaSecondary}
                                className="nx-link inline-flex items-center gap-2 text-[1.0625rem] font-medium text-neutral-900 hover:text-[#1E41FC] transition-colors duration-300"
                            >
                                Explore the fleet
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.9 }}
                            className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-7 nx-meta text-neutral-600"
                        >
                            <span className="inline-flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Available now
                            </span>
                            <span className="hidden sm:inline-block w-px h-4 bg-neutral-200" />
                            <span>
                                <strong className="font-semibold text-neutral-900">
                                    4.97
                                </strong>{" "}
                                · 38k+ reservations
                            </span>
                            <span className="hidden md:inline-block w-px h-4 bg-neutral-200" />
                            <span className="hidden md:inline">
                                Free cancellation up to 24h before pickup
                            </span>
                        </motion.div>
                    </div>

                    {/* RIGHT — cinematic transparent vehicle */}
                    <div className="relative flex justify-center lg:justify-end">
                        {/* soft ground shadow (not a card / not a button shadow) */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[62%] h-7 rounded-[50%] bg-black/10 blur-2xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 150, scale: 1.04 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 1.35, ease: EASE }}
                            className="relative w-full"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{
                                    duration: 6,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    delay: 1.4,
                                }}
                            >
                                <picture>
                                    <source srcSet="/hero-car.webp" type="image/webp" />
                                    <img
                                        src="/hero-car.png"
                                        alt="Premium electric vehicle available at Casablanca Mohammed V Airport"
                                        width={1155}
                                        height={481}
                                        fetchPriority="high"
                                        className="block w-full h-auto max-w-[clamp(420px,46vw,780px)] mx-auto lg:mr-[-4%] lg:ml-auto select-none"
                                        draggable={false}
                                    />
                                </picture>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* BOOKING WIDGET — premium centerpiece */}
                <div id="booking" className="relative z-20 mt-8 md:mt-10 scroll-mt-28">
                    <BookingWidget />
                </div>

                {/* Reassurance row */}
                <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    {[
                        {
                            icon: Plane,
                            t: "Reserve before you land",
                            s: "Lock your exact model in minutes",
                        },
                        {
                            icon: Timer,
                            t: "Pick up in under 10 min",
                            s: "No counter, no paperwork queue",
                        },
                        {
                            icon: ShieldCheck,
                            t: "All-inclusive cover",
                            s: "Insurance & 24/7 roadside included",
                        },
                    ].map((r) => (
                        <div
                            key={r.t}
                            className="flex items-start gap-3.5 rounded-2xl border border-neutral-200 bg-white px-5 py-4"
                        >
                            <span className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-[#1E41FC]">
                                <r.icon strokeWidth={1.7} className="w-4 h-4" />
                            </span>
                            <div>
                                <div className="text-[0.95rem] font-semibold text-neutral-900 leading-tight">
                                    {r.t}
                                </div>
                                <div className="nx-meta text-neutral-500 mt-1">
                                    {r.s}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Line = ({ children, delay = 0 }) => (
    <motion.span
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.9, ease: EASE }}
        className="block"
    >
        {children}
    </motion.span>
);

export default Hero;
