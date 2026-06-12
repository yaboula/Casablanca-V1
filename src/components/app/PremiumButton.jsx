import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
    primary: "bg-[#1E41FC] text-white hover:bg-[#0D2DE0]",
    dark: "bg-[#0A0A0A] text-white hover:bg-[#1E41FC]",
    light: "bg-white text-[#0A0A0A] border border-neutral-200 hover:border-neutral-900",
    outline: "bg-white text-neutral-900 border border-neutral-300 hover:border-neutral-900",
    ghost: "bg-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100",
    onDark: "bg-white text-[#0A0A0A] hover:bg-[#1E41FC] hover:text-white",
};

const SIZES = {
    sm: "text-[0.9rem] px-4 py-2.5 gap-1.5",
    md: "text-[1rem] px-6 py-3 gap-2",
    lg: "text-[1.0625rem] px-8 py-[1.05rem] gap-2.5",
};

export const PremiumButton = ({
    children,
    variant = "primary",
    size = "md",
    to,
    href,
    icon: Icon,
    iconRight: IconRight,
    full = false,
    loading = false,
    disabled = false,
    className,
    type = "button",
    ...props
}) => {
    const classes = cn(
        "nx-btn-primary inline-flex items-center justify-center rounded-full font-medium select-none",
        "transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E41FC]/40",
        VARIANTS[variant],
        SIZES[size],
        full && "w-full",
        (disabled || loading) && "opacity-50 pointer-events-none",
        className
    );

    const content = (
        <>
            {loading ? (
                <Loader2 className="w-[1.1em] h-[1.1em] animate-spin" />
            ) : (
                Icon && <Icon className="w-[1.15em] h-[1.15em]" />
            )}
            {children}
            {IconRight && !loading && <IconRight className="w-[1.15em] h-[1.15em]" />}
        </>
    );

    if (to) {
        return (
            <Link to={to} className={classes} {...props}>
                {content}
            </Link>
        );
    }
    if (href) {
        return (
            <a href={href} className={classes} {...props}>
                {content}
            </a>
        );
    }
    return (
        <button type={type} className={classes} disabled={disabled || loading} {...props}>
            {content}
        </button>
    );
};

export default PremiumButton;
