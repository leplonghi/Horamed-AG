import { motion } from "framer-motion";
import { Crown, Sparkles, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PlanOverviewCard() {
    const { isPremium, daysLeft } = useSubscription();
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className={cn(
                "relative overflow-hidden rounded-2xl p-4 shadow-sm",
                isPremium
                    ? "bg-gradient-to-br from-amber-500/90 to-orange-600 text-white"
                    : "bg-card border border-border/50"
            )}
        >
            {/* Background decorations for Premium */}
            {isPremium && (
                <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    <Sparkles className="absolute top-2 right-2 h-4 w-4 text-yellow-200/50 animate-pulse" />
                </>
            )}

            <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-1.5 rounded-lg shrink-0",
                        isPremium ? "bg-white/20" : "bg-primary/10"
                    )}>
                        <Crown className={cn(
                            "h-5 w-5",
                            isPremium ? "text-white" : "text-primary"
                        )} />
                    </div>
                    <div>
                        <h3 className={cn(
                            "text-sm font-bold leading-none",
                            !isPremium && "text-foreground"
                        )}>
                            {isPremium ? "Premium" : t('common.free')}
                        </h3>
                        <p className={cn(
                            "text-xs font-medium mt-0.5",
                            isPremium ? "text-white/80" : "text-muted-foreground"
                        )}>
                            {isPremium
                                ? t('profile.unlimitedAccess')
                                : daysLeft !== null && daysLeft > 0
                                    ? `${daysLeft} dias restantes`
                                    : "Upgrade"}
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => navigate('/planos')}
                    size="sm"
                    variant={isPremium ? "secondary" : "default"}
                    className={cn(
                        "rounded-lg shadow-sm font-semibold h-8 px-3 text-xs",
                        isPremium
                            ? "bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm"
                            : "bg-primary hover:bg-primary/90"
                    )}
                >
                    {isPremium ? (
                        t('common.manage')
                    ) : (
                        <span className="flex items-center gap-1">
                            {t('common.upgrade')} <ChevronRight className="h-3 w-3" />
                        </span>
                    )}
                </Button>
            </div>

            {!isPremium && (
                <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Check className="h-2.5 w-2.5 text-primary" />
                        <span>{t('common.multiProfile')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Check className="h-2.5 w-2.5 text-primary" />
                        <span>{t('common.advancedAI')}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
