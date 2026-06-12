import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const BookingStepper = ({ steps = [], current = 0, className }) => (
    <div className={cn("w-full", className)} data-testid="booking-stepper">
        <div className="md:hidden">
            <div className="flex items-center justify-between">
                <span className="nx-label text-neutral-500">
                    Step {Math.min(current + 1, steps.length)} of {steps.length}
                </span>
                <span className="text-[0.95rem] font-semibold text-neutral-900">
                    {steps[current]}
                </span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-neutral-100 overflow-hidden">
                <div
                    className="h-full bg-[#1E41FC] transition-all duration-500"
                    style={{ width: `${((current + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>

        <ol className="hidden md:flex items-center">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <li key={label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex items-center gap-3">
                            <span
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-[0.85rem] font-semibold border transition-colors duration-300",
                                    done && "bg-[#1E41FC] border-[#1E41FC] text-white",
                                    active && "bg-neutral-900 border-neutral-900 text-white",
                                    !done && !active && "bg-white border-neutral-300 text-neutral-400"
                                )}
                            >
                                {done ? <Check className="w-4 h-4" /> : i + 1}
                            </span>
                            <span
                                className={cn(
                                    "text-[0.95rem] font-medium whitespace-nowrap transition-colors",
                                    active || done ? "text-neutral-900" : "text-neutral-400"
                                )}
                            >
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <span
                                className={cn(
                                    "flex-1 h-px mx-4 transition-colors duration-300",
                                    done ? "bg-[#1E41FC]" : "bg-neutral-200"
                                )}
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    </div>
);

export default BookingStepper;
