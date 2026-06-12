import { cn } from "@/lib/utils";

export const VehicleSpecs = ({ specs = [], columns = 3, className }) => (
    <dl
        className={cn(
            "grid gap-y-6 gap-x-6",
            columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
            className
        )}
    >
        {specs.map((s) => (
            <div key={s.label}>
                <dt className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-neutral-400">
                    {s.label}
                </dt>
                <dd className="font-display text-[1.35rem] md:text-[1.5rem] font-light text-neutral-900 mt-1.5 leading-none">
                    {s.value}
                </dd>
            </div>
        ))}
    </dl>
);

export default VehicleSpecs;
