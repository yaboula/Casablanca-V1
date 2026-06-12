import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { NAV } from "@/constants/testIds";

const links = [
    { id: NAV.linkFleet, label: "Fleet", href: "#fleet" },
    { id: NAV.linkHow, label: "How it works", href: "#how" },
    { id: NAV.linkAirport, label: "Airport", href: "#airport" },
    { id: NAV.linkFaq, label: "FAQ", href: "#faq" },
];

export const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            data-testid={NAV.container}
            className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
                scrolled
                    ? "bg-white border-b border-neutral-200"
                    : "bg-transparent border-b border-transparent"
            }`}
        >
            <div className="nx-container h-16 md:h-[4.5rem] flex items-center justify-between">
                {/* Logo */}
                <a
                    href="#top"
                    data-testid={NAV.logo}
                    className="flex items-center gap-2.5 group"
                >
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E41FC]" />
                    <span className="font-display text-xl md:text-[1.35rem] font-medium tracking-tight text-neutral-900">
                        Nexus
                        <span className="text-neutral-400">/Car</span>
                    </span>
                </a>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-9 lg:gap-11">
                    {links.map((l) => (
                        <a
                            key={l.id}
                            href={l.href}
                            data-testid={l.id}
                            className="nx-link text-[0.95rem] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                {/* CTA */}
                <div className="flex items-center gap-3">
                    <a
                        href="#booking"
                        data-testid={NAV.ctaReserve}
                        className="hidden md:inline-flex nx-btn-primary items-center gap-2 bg-[#0A0A0A] text-white hover:bg-[#1E41FC] rounded-full pl-5 pr-4 py-2.5 text-[0.95rem] font-medium"
                    >
                        Reserve
                        <ArrowRight className="w-4 h-4" />
                    </a>

                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        data-testid={NAV.mobileToggle}
                        className="md:hidden p-2 -mr-2 text-neutral-900"
                        aria-label="Toggle menu"
                    >
                        {open ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile panel */}
            {open && (
                <div
                    data-testid={NAV.mobilePanel}
                    className="md:hidden border-t border-neutral-200 bg-white"
                >
                    <div className="px-6 py-6 flex flex-col gap-5">
                        {links.map((l) => (
                            <a
                                key={l.id}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                data-testid={`${l.id}-mobile`}
                                className="text-lg font-medium text-neutral-900"
                            >
                                {l.label}
                            </a>
                        ))}
                        <a
                            href="#booking"
                            onClick={() => setOpen(false)}
                            data-testid={`${NAV.ctaReserve}-mobile`}
                            className="mt-2 inline-flex justify-center bg-[#0A0A0A] text-white rounded-full px-5 py-3 text-sm font-medium"
                        >
                            Reserve
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
