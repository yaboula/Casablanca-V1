"use client";

import { motion } from "framer-motion";
import TrustCard from "@/components/vehicles/TrustCard";

const VEHICLES = [
  {
    model: "Audi A4",
    totalPrice: "800€",
    imageUrl: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Mercedes Clase C",
    totalPrice: "950€",
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Range Rover Evoque",
    totalPrice: "1.200€",
    imageUrl: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function Home() {
  return (
    <section className="w-full">
      {/* Hero heading */}
      <motion.div
        className="mb-2"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-bold text-brand-dark tracking-tight">
          Vehículos Premium en Casablanca
        </h1>
        <p className="text-brand-muted mt-2">
          Recoge tu coche directo en el aeropuerto Mohammed V. Sin colas, sin sorpresas.
        </p>
      </motion.div>

      {/* Vehicle grid — staggered entrance */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full mt-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {VEHICLES.map((v) => (
          <motion.div key={v.model} variants={itemVariants}>
            <TrustCard
              model={v.model}
              totalPrice={v.totalPrice}
              imageUrl={v.imageUrl}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
