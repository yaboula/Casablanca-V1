import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { FLEET } from "@/constants/testIds";
import { Reveal } from "@/components/site/Reveal";

const fleet = [
    {
        id: "signature",
        klass: "Signature",
        sub: "Sport · Coupé",
        name: "Porsche 911 Carrera",
        price: 389,
        spec: {
            Power: "385 hp",
            "0–100": "4.2 s",
            "Top speed": "293 km/h",
            Drive: "RWD",
            Seats: "2 + 2",
            Transmission: "8-spd PDK",
        },
        deposit: "$2,500",
        pickup: "Under 10 min",
        image:
            "https://images.pexels.com/photos/28837090/pexels-photo-28837090.jpeg",
    },
    {
        id: "executive",
        klass: "Executive",
        sub: "Sedan · Comfort",
        name: "Mercedes-Benz S-Class",
        price: 269,
        spec: {
            Power: "496 hp",
            "0–100": "4.9 s",
            "Top speed": "250 km/h",
            Drive: "AWD",
            Seats: "4",
            Transmission: "9G-TRONIC",
        },
        deposit: "$2,000",
        pickup: "Under 10 min",
        image:
            "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1800&q=85",
    },
    {
        id: "estate",
        klass: "Estate",
        sub: "SUV · All-terrain",
        name: "Range Rover Autobiography",
        price: 329,
        spec: {
            Power: "523 hp",
            "0–100": "5.4 s",
            "Top speed": "250 km/h",
            Drive: "AWD",
            Seats: "5",
            Transmission: "8-spd Auto",
        },
        deposit: "$2,200",
        pickup: "Under 10 min",
        image:
            "https://images.unsplash.com/photo-1735620731955-b047a7122892?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxibGFjayUyMGx1eHVyeSUyMHN1diUyMHJvYWR8ZW58MHx8fHwxNzgwODM5MTE5fDA&ixlib=rb-4.1.0&q=85",
    },
    {
        id: "voltage",
        klass: "Voltage",
        sub: "Electric · Flagship",
        name: "BMW i7 xDrive60",
        price: 349,
        spec: {
            Power: "536 hp",
            "0–100": "4.5 s",
            Range: "388 mi",
            Drive: "AWD",
            Seats: "5",
            Charging: "195 kW DC",
        },
        deposit: "$2,200",
        pickup: "Under 10 min",
        image:
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1800&q=85",
    },
];

export const FeaturedFleet = () => {
    const [i, setI] = useState(0);
    const car = fleet[i];
    const total = fleet.length;
    const go = (dir) => setI((p) => (p + dir + total) % total);

    return (
        <section
            id="fleet"
            data-testid={FLEET.section}
            className="relative bg-[#FAFAFA] border-t border-neutral-100 overflow-hidden"
        >
            {/* subtle ghost number */}
            <div className="pointer-events-none absolute top-0 right-6 md:right-12 select-none">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={"n-" + i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className="block font-display leading-none font-light text-neutral-200/70"
                        style={{ fontSize: "clamp(120px, 18vw, 260px)" }}
                    >
                        {String(i + 1).padStart(2, "0")}
                    </motion.span>
                </AnimatePresence>
            </div>

            <div className="relative nx-container nx-section">
                {/* Header */}
                <div className="mb-10 md:mb-14">
                    <Reveal>
                        <div>
                            <div className="nx-eyebrow text-neutral-600 font-medium">
                                The fleet ·{" "}
                                <span className="font-mono">
                                    {String(i + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
                                </span>
                            </div>
                            <h2 className="nx-h2 font-display mt-4 font-light text-neutral-900 max-w-4xl">
                                The exact car.
                                <br />
                                <span className="italic text-neutral-500">
                                    Never a category.
                                </span>
                            </h2>
                            <p className="nx-lead mt-5 text-neutral-600 max-w-[36rem]">
                                Every reservation is locked to a specific make,
                                model and trim — never a substitute. Browse the
                                signatures of our curated fleet.
                            </p>
                        </div>
                    </Reveal>
                </div>

                {/* Tab strip */}
                <div className="flex items-center gap-2.5 md:gap-3 flex-wrap mb-9 md:mb-12">
                    {fleet.map((c, idx) => (
                        <button
                            key={c.id}
                            onClick={() => setI(idx)}
                            data-testid={`${FLEET.cardPrefix}-tab-${c.id}`}
                            className={`relative px-5 md:px-6 py-3 rounded-full text-[0.95rem] font-medium transition-colors duration-400 border ${
                                idx === i
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "bg-white text-neutral-700 hover:text-neutral-900 border-neutral-200 hover:border-neutral-400"
                            }`}
                        >
                            <span className="font-mono text-xs mr-2.5 opacity-60">
                                {String(idx + 1).padStart(2, "0")}
                            </span>
                            {c.klass}
                        </button>
                    ))}
                </div>

                {/* Studio */}
                <div className="relative grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-14 xl:gap-16 items-center">
                    {/* Image stage */}
                    <div className="relative">
                        <div className="relative rounded-[26px] md:rounded-[32px] overflow-hidden border border-neutral-200 bg-neutral-100 aspect-[16/11] md:aspect-[16/10]">
                            <AnimatePresence mode="popLayout">
                                <motion.img
                                    key={car.id}
                                    src={car.image}
                                    alt={car.name}
                                    initial={{ opacity: 0, scale: 1.06 }}
                                    animate={{ opacity: 1, scale: 1.02 }}
                                    exit={{ opacity: 0, scale: 1.04 }}
                                    transition={{
                                        duration: 1.1,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </AnimatePresence>

                            <div
                                aria-hidden
                                className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 pointer-events-none"
                            />

                            {/* class chip — solid */}
                            <div className="absolute z-[2] top-5 left-5 md:top-6 md:left-6 inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-neutral-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1E41FC]" />
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={car.klass}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="text-[0.6875rem] uppercase tracking-[0.2em] text-neutral-900 font-semibold"
                                    >
                                        {car.klass} · {car.sub}
                                    </motion.span>
                                </AnimatePresence>
                            </div>

                            {/* model name overlay */}
                            <div className="absolute z-[2] bottom-5 left-5 md:bottom-7 md:left-7 pointer-events-none">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={car.id + "-name"}
                                        initial={{ y: 18, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        transition={{ duration: 0.7 }}
                                        className="nx-h3 font-display text-white font-light"
                                    >
                                        {car.name}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* nav arrows — solid */}
                            <div className="absolute z-[2] bottom-5 right-5 md:bottom-7 md:right-7 flex items-center gap-2">
                                <button
                                    onClick={() => go(-1)}
                                    data-testid={FLEET.prev}
                                    aria-label="Previous vehicle"
                                    className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors duration-400"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => go(1)}
                                    data-testid={FLEET.next}
                                    aria-label="Next vehicle"
                                    className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors duration-400"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Detail panel */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={car.id + "-meta"}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{
                                    duration: 0.7,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                data-testid={`${FLEET.cardPrefix}-${car.id}`}
                            >
                                <div className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-neutral-500">
                                    {car.klass} class
                                </div>
                                <h3 className="nx-h3 font-display mt-2 font-light text-neutral-900">
                                    {car.name}
                                </h3>

                                {/* Price block */}
                                <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-3">
                                    <div className="flex items-baseline">
                                        <span className="font-display text-2xl text-neutral-500 mr-1">
                                            $
                                        </span>
                                        <span
                                            className="font-display font-light tracking-[-0.04em] text-neutral-900 leading-none"
                                            style={{ fontSize: "clamp(3rem, 4vw, 4.5rem)" }}
                                        >
                                            {car.price}
                                        </span>
                                        <span className="font-display text-lg text-neutral-500 ml-2">
                                            /day
                                        </span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 nx-meta text-neutral-700 bg-white border border-neutral-200 rounded-full px-3.5 py-2">
                                        <ShieldCheck className="w-4 h-4 text-[#1E41FC]" />
                                        All-inclusive · insurance &amp; roadside
                                    </div>
                                </div>

                                {/* Specs grid */}
                                <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-6 border-t border-neutral-200 pt-7">
                                    {Object.entries(car.spec).map(([k, v]) => (
                                        <div key={k}>
                                            <dt className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-neutral-500">
                                                {k}
                                            </dt>
                                            <dd className="font-display text-[1.4rem] md:text-[1.55rem] font-light text-neutral-900 mt-1.5 leading-none">
                                                {v}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>

                                {/* Aux row: deposit & pickup */}
                                <div className="mt-7 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-6">
                                    <div>
                                        <div className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-neutral-500">
                                            Deposit
                                        </div>
                                        <div className="font-display text-[1.15rem] font-semibold text-neutral-900 mt-1.5">
                                            {car.deposit}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-neutral-500 flex items-center gap-1.5">
                                            <KeyRound className="w-3.5 h-3.5" />
                                            Pickup
                                        </div>
                                        <div className="font-display text-[1.15rem] font-semibold text-neutral-900 mt-1.5">
                                            {car.pickup}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                                    <a
                                        href="#booking"
                                        className="nx-btn-primary inline-flex items-center justify-center gap-2.5 bg-[#0A0A0A] text-white hover:bg-[#1E41FC] rounded-full px-8 py-[1.05rem] text-[1.0625rem] font-medium"
                                    >
                                        Reserve {car.klass}
                                        <ArrowRight className="w-5 h-5" />
                                    </a>
                                    <a
                                        href="#fleet"
                                        className="inline-flex items-center justify-center gap-2 border border-neutral-300 hover:border-neutral-900 rounded-full px-8 py-[1.05rem] text-[1.0625rem] font-medium text-neutral-900 hover:bg-white transition-colors"
                                    >
                                        Full specifications
                                    </a>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedFleet;
