import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    title?: string;
    prefix?: string;
    suffix?: string;
    valueFormatter?: (value: number) => string;
}

export function PremiumTooltip({
    active,
    payload,
    label,
    title,
    prefix = "",
    suffix = "",
    valueFormatter
}: TooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 overflow-hidden rounded-2xl border border-white/40 bg-white/70 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/80"
            >
                {/* Decorative Gradient Background */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-500/10 via-transparent to-indigo-500/10" />

                <div className="flex flex-col gap-2">
                    {label && (
                        <div className="flex items-center justify-between gap-4 border-b border-zinc-200/50 pb-2 dark:border-zinc-700/50">
                            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                {label}
                            </span>
                            {title && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                    {title}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        {payload.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div
                                    className="h-3 w-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: item.color || item.fill }}
                                />
                                <div className="flex flex-1 items-center justify-between gap-4">
                                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                        {item.name}
                                    </span>
                                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                                        {prefix}
                                        {valueFormatter ? valueFormatter(item.value) : item.value}
                                        {suffix}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subtle bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-600 opacity-50" />
            </motion.div>
        </AnimatePresence>
    );
}
