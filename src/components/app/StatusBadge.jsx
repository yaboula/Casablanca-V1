import { cn } from "@/lib/utils";

// Solid, tinted status pills — no glass, no glow.
const MAP = {
    // reservation lifecycle
    awaiting_documents: { label: "Awaiting documents", tone: "neutral" },
    under_review: { label: "Under review", tone: "amber" },
    approved: { label: "Approved", tone: "emerald" },
    action_required: { label: "Action required", tone: "red" },
    completed: { label: "Completed", tone: "ink" },
    ready: { label: "Ready for pickup", tone: "emerald" },
    // document states
    required: { label: "Required", tone: "neutral" },
    uploaded: { label: "Uploaded", tone: "amber" },
    rejected: { label: "Rejected", tone: "red" },
    // availability
    available: { label: "Available now", tone: "emerald" },
    unavailable: { label: "Unavailable", tone: "red" },
    // misc
    demo: { label: "Demo mode", tone: "blue" },
    authorized: { label: "Authorized", tone: "emerald" },
};

const TONES = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
    ink: "bg-neutral-900 text-white border-neutral-900",
    blue: "bg-[#1E41FC]/10 text-[#1E41FC] border-[#1E41FC]/20",
};

const DOT = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    neutral: "bg-neutral-400",
    ink: "bg-white",
    blue: "bg-[#1E41FC]",
};

export const StatusBadge = ({ status, label, dot = true, className, size = "md" }) => {
    const cfg = MAP[status] || { label: label || status, tone: "neutral" };
    const tone = cfg.tone;
    const sizeCls = size === "sm" ? "text-[0.7rem] px-2.5 py-1" : "text-[0.8rem] px-3 py-1.5";
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border font-medium tracking-tight",
                TONES[tone],
                sizeCls,
                className
            )}
        >
            {dot && <span className={cn("w-1.5 h-1.5 rounded-full", DOT[tone])} />}
            {label || cfg.label}
        </span>
    );
};

export default StatusBadge;
