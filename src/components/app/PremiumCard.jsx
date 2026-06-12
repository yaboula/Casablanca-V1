import { cn } from "@/lib/utils";

export const PremiumCard = ({ children, className, as: Tag = "div", ...props }) => (
    <Tag
        className={cn(
            "bg-white border border-neutral-200 rounded-[1.25rem]",
            className
        )}
        {...props}
    >
        {children}
    </Tag>
);

export default PremiumCard;
