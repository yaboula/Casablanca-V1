import { AlertTriangle } from "lucide-react";
import PremiumButton from "@/components/app/PremiumButton";

export const ErrorState = ({
    title = "Something went wrong",
    description = "We could not load this content. Please try again.",
    actionLabel = "Try again",
    onAction,
    actionTo,
    className = "",
}) => (
    <div
        className={`flex flex-col items-center text-center py-16 md:py-24 px-6 ${className}`}
        data-testid="error-state"
    >
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
            <AlertTriangle strokeWidth={1.5} className="w-7 h-7" />
        </div>
        <h3 className="nx-h4 font-display font-semibold text-neutral-900 mt-6">
            {title}
        </h3>
        <p className="nx-body text-neutral-500 mt-2 max-w-md">{description}</p>
        {(onAction || actionTo) && (
            <div className="mt-7">
                <PremiumButton onClick={onAction} to={actionTo} variant="outline">
                    {actionLabel}
                </PremiumButton>
            </div>
        )}
    </div>
);

export default ErrorState;
