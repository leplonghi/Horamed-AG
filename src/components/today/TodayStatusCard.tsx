import { memo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame, Confetti } from "@phosphor-icons/react";

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
            "p-3.5 border transition-all backdrop-blur-xl shadow-[var(--shadow-glass)] relative overflow-hidden",
            isComplete
                ? "bg-gradient-to-br from-blue-500/15 to-blue-600/5 border-blue-500/30"
                : "bg-gradient-to-br from-muted/50 to-muted/30 border-border/40"
        )}>
            {isComplete && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
            )}

            <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                    {streak > 0 && (
                        <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 border border-orange-500/20">
                            <Flame className="w-3 h-3" weight="fill" />
                            <span>{streak} {language === 'pt' ? 'DIAS' : 'DAYS'}</span>
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <span className={cn(
                        "text-2xl font-black tracking-tighter leading-none",
                        isComplete ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                    )}>
                        {taken}/{total}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                        {language === 'pt' ? 'itens hoje' : 'items today'}
                    </p>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden relative z-10 mb-2">
                <motion.div
                    className={cn(
                        "h-full rounded-full transition-colors relative",
                        isComplete ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-blue-600/60"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
                </motion.div>
            </div>

            {isComplete && (
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-[11px] text-blue-600 dark:text-blue-400 mt-3 font-bold flex items-center justify-center gap-1.5 uppercase tracking-wide relative z-10"
                >
                    <Confetti className="w-3.5 h-3.5" weight="bold" />
                    {language === 'pt' ? 'Tudo certo hoje!' : 'All done today!'}
                </motion.p>
            )}
        </Card>
    );
});
