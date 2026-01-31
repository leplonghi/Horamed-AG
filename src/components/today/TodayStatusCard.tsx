import { memo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TodayStatusCardProps {
    streak: number;
    taken: number;
    total: number;
    language: string;
}

export const TodayStatusCard = memo(function TodayStatusCard({
    streak,
    taken,
    total,
    language
}: TodayStatusCardProps) {
    if (total === 0) return null;

    const progressPercent = Math.round((taken / total) * 100);
    const isComplete = taken === total;

    return (
        <Card className={cn(
            "p-4 border transition-all backdrop-blur-xl shadow-[var(--shadow-glass)]",
            isComplete
                ? "bg-gradient-to-br from-green-500/15 to-emerald-500/5 border-green-500/30"
                : "bg-gradient-to-br from-muted/50 to-muted/30 border-border/40"
        )}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {streak > 0 && (
                        <span className="px-2.5 py-1 bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded-full text-sm font-bold flex items-center gap-1">
                            <span>🔥</span>
                            <span>{streak} {language === 'pt' ? 'dias' : 'days'}</span>
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <span className={cn(
                        "text-2xl font-bold font-mono tracking-tight",
                        isComplete ? "text-green-600 dark:text-green-400" : "text-foreground"
                    )}>
                        {taken}/{total}
                    </span>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {language === 'pt' ? 'doses hoje' : 'doses today'}
                    </p>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="h-3 bg-muted/50 rounded-full overflow-hidden relative">
                {/* Background Pattern/Stripes (Optional Polish) */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%,rgba(0,0,0,0.1)_100%)] bg-[length:1rem_1rem]" />

                <motion.div
                    className={cn(
                        "h-full rounded-full transition-colors relative",
                        isComplete ? "bg-green-500" : "bg-primary"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", type: "spring", bounce: 0 }}
                >
                    {/* Shimmer Effect on the bar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
                </motion.div>
            </div>

            {isComplete && (
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm text-green-600 dark:text-green-400 mt-3 font-semibold flex items-center justify-center gap-2"
                >
                    <span>🎉</span>
                    {language === 'pt' ? 'Tudo certo por hoje!' : 'All done for today!'}
                </motion.p>
            )}
        </Card>
    );
});
