import { Inbox } from "lucide-react";
import PremiumButton from "@/components/app/PremiumButton";

export const EmptyState = ({
    icon: Icon = Inbox,
    title = "Nothing here yet",
    description,
    actionLabel,
    actionTo,
    onAction,
    className = "",
}) => (
    <div
        className={`flex flex-col items-center text-center py-16 md:py-24 px-6 ${className}`}
        data-testid="empty-state"
    >
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Icon strokeWidth={1.5} className="w-7 h-7" />
        </div>
        <h3 className="nx-h4 font-display font-semibold text-neutral-900 mt-6">
            {title}
        </h3>
        {description && (
            <p className="nx-body text-neutral-500 mt-2 max-w-md">{description}</p>
        )}
        {actionLabel && (
            <div className="mt-7">
                <PremiumButton to={actionTo} onClick={onAction} variant="dark">
                    {actionLabel}
                </PremiumButton>
            </div>
        )}
    </div>
);

export default EmptyState;
