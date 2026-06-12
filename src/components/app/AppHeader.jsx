import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import PremiumButton from "@/components/app/PremiumButton";

const CUSTOMER_LINKS = [
    { label: "Vehicles", to: "/catalog" },
    { label: "My trips", to: "/dashboard" },
    { label: "Operator", to: "/operator" },
];

const OPERATOR_LINKS = [
    { label: "Console", to: "/operator" },
    { label: "Customer site", to: "/" },
];

export const AppHeader = ({ variant = "customer" }) => {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();
    const links = variant === "operator" ? OPERATOR_LINKS : CUSTOMER_LINKS;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const isActive = (to) =>
        to === "/" ? pathname === "/" : pathname.startsWith(to);

    return (
        <header
            className={cn(
                "sticky top-0 inset-x-0 z-50 bg-white transition-colors duration-300",
                scrolled ? "border-b border-neutral-200" : "border-b border-neutral-100"
            )}
        >
            <div className="nx-container h-16 md:h-[4.5rem] flex items-center justify-between">
                <div className="flex items-center gap-7">
                    <Link to="/" className="flex items-center gap-2.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E41FC]" />
                        <span className="font-display text-xl md:text-[1.35rem] font-medium tracking-tight text-neutral-900">
                            Nexus<span className="text-neutral-400">/Car</span>
                        </span>
                    </Link>
                    {variant === "operator" && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#1E41FC] bg-[#1E41FC]/10 border border-[#1E41FC]/20 rounded-full px-2.5 py-1">
                            Operator console
                        </span>
                    )}
                </div>

                <nav className="hidden md:flex items-center gap-8 lg:gap-10">
                    {links.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={cn(
                                "text-[0.95rem] font-medium transition-colors",
                                isActive(l.to)
                                    ? "text-neutral-900"
                                    : "text-neutral-500 hover:text-neutral-900"
                            )}
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    {variant === "customer" ? (
                        <PremiumButton
                            to="/catalog"
                            variant="dark"
                            size="sm"
                            iconRight={ArrowRight}
                            className="hidden md:inline-flex"
                        >
                            Reserve
                        </PremiumButton>
                    ) : (
                        <span className="hidden md:inline-flex items-center gap-2 text-[0.85rem] text-neutral-500">
                            <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-[0.7rem] font-semibold flex items-center justify-center">
                                OP
                            </span>
                            Operations
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        className="md:hidden p-2 -mr-2 text-neutral-900"
                        aria-label="Toggle menu"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="md:hidden border-t border-neutral-200 bg-white">
                    <div className="px-6 py-6 flex flex-col gap-5">
                        {links.map((l) => (
                            <Link
                                key={l.to}
                                to={l.to}
                                onClick={() => setOpen(false)}
                                className="text-lg font-medium text-neutral-900"
                            >
                                {l.label}
                            </Link>
                        ))}
                        {variant === "customer" && (
                            <PremiumButton to="/catalog" variant="dark" full>
                                Reserve a vehicle
                            </PremiumButton>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default AppHeader;
