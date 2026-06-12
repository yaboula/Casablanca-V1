import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { FAQ } from "@/constants/testIds";
import { Reveal } from "@/components/site/Reveal";

const items = [
    {
        q: "Where exactly do I meet my vehicle at Casablanca airport?",
        a: "Your operator will be waiting in the arrivals hall of Terminal 1 or 2, holding a Nexus card. We track your flight in real time, so if your arrival shifts, we shift with you.",
    },
    {
        q: "What happens if my flight is delayed?",
        a: "Nothing changes for you. We monitor your inbound flight and adjust automatically. There is no late fee for flight delays.",
    },
    {
        q: "Is insurance included in the price?",
        a: "Yes. Every Nexus reservation includes premium insurance, theft protection, and 24/7 roadside assistance. There are no surprise add-ons at pickup.",
    },
    {
        q: "Can I get the exact model I see on the website?",
        a: "Always. We never substitute. The car you reserve is the car you receive — make, model, year, and trim.",
    },
    {
        q: "What is your cancellation policy?",
        a: "Free cancellation up to 24 hours before pickup. Within 24 hours, we charge a flat one-day rate. No questions, no friction.",
    },
    {
        q: "Do you offer one-way rentals across Morocco?",
        a: "Yes. You can return your vehicle in Rabat, Marrakech, or Tangier. A one-way fee applies and is shown transparently at booking.",
    },
];

export const FAQSection = () => {
    return (
        <section
            id="faq"
            data-testid={FAQ.section}
            className="relative bg-white border-t border-neutral-100"
        >
            <div className="nx-container-narrow nx-section">
                <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-20">
                    <div>
                        <Reveal>
                            <div className="nx-eyebrow text-neutral-600 font-medium">
                                FAQ
                            </div>
                        </Reveal>
                        <Reveal delay={0.08}>
                            <h2 className="nx-h2 font-display mt-4 font-light text-neutral-900">
                                Questions,
                                <br />
                                <span className="italic text-neutral-500">
                                    answered.
                                </span>
                            </h2>
                        </Reveal>
                        <Reveal delay={0.16}>
                            <p className="nx-body mt-6 text-neutral-600 max-w-sm">
                                Still curious? Our concierge is reachable around
                                the clock — with an answer in under a minute.
                            </p>
                        </Reveal>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        {items.map((it, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{
                                    delay: idx * 0.06,
                                    duration: 0.7,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                <AccordionItem
                                    value={`faq-${idx}`}
                                    data-testid={`${FAQ.item}-${idx}`}
                                    className="border-b border-neutral-200"
                                >
                                    <AccordionTrigger className="text-left font-display text-[1.15rem] md:text-[1.3rem] font-medium text-neutral-900 py-7 hover:no-underline hover:text-[#1E41FC] transition-colors">
                                        {it.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="nx-body text-neutral-600 pb-7">
                                        {it.a}
                                    </AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
