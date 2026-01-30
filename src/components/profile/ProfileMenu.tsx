import React from "react";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfileMenuItemProps {
    icon: LucideIcon;
    label: string;
    value?: string | React.ReactNode;
    onClick?: () => void;
    color?: string;
    bgColor?: string;
    isDestructive?: boolean;
    rightElement?: React.ReactNode;
}

export function ProfileMenuItem({
    icon: Icon,
    label,
    value,
    onClick,
    color = "text-foreground",
    bgColor = "bg-muted",
    isDestructive = false,
    rightElement
}: ProfileMenuItemProps) {
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                isDestructive && "hover:bg-destructive/5"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-xl", bgColor)}>
                    <Icon className={cn("h-5 w-5", isDestructive ? "text-destructive" : color)} />
                </div>
                <div className="flex flex-col">
                    <span className={cn("font-medium", isDestructive && "text-destructive")}>{label}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {value && <span className="text-sm text-muted-foreground">{value}</span>}
                {rightElement}
                {!rightElement && onClick && <ChevronRight className="h-5 w-5 text-muted-foreground/50" />}
            </div>
        </motion.div>
    );
}

interface ProfileMenuSectionProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function ProfileMenuSection({ title, children, className }: ProfileMenuSectionProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {title && (
                <h3 className="text-sm font-semibold text-muted-foreground px-4 uppercase tracking-wider">
                    {title}
                </h3>
            )}
            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
                {children}
            </div>
        </div>
    );
}
