import { cn } from "@/lib/utils";
import AppHeader from "@/components/app/AppHeader";
import AppFooter from "@/components/app/AppFooter";

const MAX = {
    default: "max-w-[1500px]",
    wide: "max-w-[1760px]",
    narrow: "max-w-[1080px]",
};

export const AppShell = ({
    children,
    variant = "customer",
    max = "default",
    className,
    bare = false,
}) => (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <AppHeader variant={variant} />
        <main className="flex-1">
            {bare ? (
                children
            ) : (
                <div
                    className={cn(
                        "w-full mx-auto px-[clamp(1.25rem,4vw,4rem)] py-[clamp(2rem,4vh+1rem,3.5rem)]",
                        MAX[max],
                        className
                    )}
                >
                    {children}
                </div>
            )}
        </main>
        <AppFooter />
    </div>
);

export default AppShell;
