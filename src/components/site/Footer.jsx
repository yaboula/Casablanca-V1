import { ArrowRight } from "lucide-react";
import { FOOTER } from "@/constants/testIds";

const cols = [
    {
        title: "Product",
        items: ["Fleet", "How it works", "Airport pickup", "Pricing"],
    },
    {
        title: "Company",
        items: ["About", "Careers", "Press", "Contact"],
    },
    {
        title: "Support",
        items: ["Help center", "Concierge", "Insurance", "Status"],
    },
    {
        title: "Cities",
        items: ["Casablanca", "Rabat", "Marrakech", "Tangier"],
    },
];

export const Footer = () => {
    return (
        <footer
            data-testid={FOOTER.section}
            className="bg-white border-t border-neutral-200"
        >
            <div className="nx-container py-16 md:py-24">
                <div className="grid lg:grid-cols-[1.4fr_2fr] gap-12 lg:gap-24">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E41FC]" />
                            <span className="font-display text-2xl font-medium tracking-tight">
                                Nexus<span className="text-neutral-400">/Car</span>
                            </span>
                        </div>
                        <p className="nx-body mt-6 max-w-md text-neutral-600">
                            Premium airport mobility. Built for travelers who
                            measure time in flights, not forms.
                        </p>

                        <a
                            href="#booking"
                            className="nx-btn-primary mt-8 inline-flex items-center gap-2 bg-[#0A0A0A] text-white hover:bg-[#1E41FC] rounded-full pl-6 pr-5 py-3.5 text-[1rem] font-medium"
                        >
                            Reserve
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {cols.map((c) => (
                            <div key={c.title}>
                                <div className="text-[0.625rem] uppercase tracking-[0.22em] text-neutral-500 mb-5">
                                    {c.title}
                                </div>
                                <ul className="space-y-3">
                                    {c.items.map((it) => (
                                        <li key={it}>
                                            <a
                                                href="#"
                                                className="text-[0.95rem] text-neutral-600 hover:text-[#1E41FC] transition-colors"
                                            >
                                                {it}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    data-testid={FOOTER.legal}
                    className="mt-14 md:mt-20 pt-8 border-t border-neutral-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                    <div className="nx-meta text-neutral-500">
                        © {new Date().getFullYear()} Nexus Car. All rights
                        reserved. Concept design — not a real product.
                    </div>
                    <div className="flex items-center gap-6 nx-meta text-neutral-500">
                        <a href="#" className="hover:text-neutral-900">Privacy</a>
                        <a href="#" className="hover:text-neutral-900">Terms</a>
                        <a href="#" className="hover:text-neutral-900">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
