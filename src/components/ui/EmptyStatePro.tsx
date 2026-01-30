import { motion } from "framer-motion";
import { Plus, Pill, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ElementType;
}

export function EmptyStatePro({
    title,
    description,
    actionLabel,
    onAction,
    icon: MainIcon = Pill
}: EmptyStateProProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/50 bg-muted/20 p-8 sm:p-12 text-center group">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col items-center justify-center">
                {/* Animated Icon Scene */}
                <div className="relative mb-6 h-20 w-20">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 h-20 w-20 rounded-2xl bg-gradient-to-br from-card to-muted shadow-2xl flex items-center justify-center border border-white/20"
                    >
                        <MainIcon className="h-10 w-10 text-primary" />
                    </motion.div>

                    {/* Floating Elements */}
                    <motion.div
                        animate={{ y: [-5, 5, -5], rotate: [0, 5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-5 -right-5 h-9 w-9 rounded-xl bg-lime-400 shadow-lg flex items-center justify-center z-20"
                    >
                        <Plus className="h-5 w-5 text-lime-950" />
                    </motion.div>

                    <motion.div
                        animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-3 -left-6 h-11 w-11 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md shadow-lg flex items-center justify-center border border-white/20 z-0"
                    >
                        <Sparkles className="h-5 w-5 text-amber-400" />
                    </motion.div>
                </div>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
                        {title}
                    </h3>
                    <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed mb-6">
                        {description}
                    </p>
                </motion.div>

                {/* Primary Action */}
                {actionLabel && onAction && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Button
                            onClick={onAction}
                            className="h-11 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all text-base group/btn"
                        >
                            <Plus className="mr-2 h-4 w-4 stroke-[3] group-hover/btn:rotate-90 transition-transform" />
                            {actionLabel}
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
