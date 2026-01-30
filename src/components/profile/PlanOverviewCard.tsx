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
                "relative overflow-hidden rounded-3xl p-6 shadow-lg",
                isPremium
                    ? "bg-gradient-to-br from-amber-500/90 to-orange-600 text-white"
                    : "bg-card border border-border/50"
            )}
        >
            {/* Background decorations for Premium */}
            {isPremium && (
                <>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    <Sparkles className="absolute top-4 right-4 h-6 w-6 text-yellow-200/50 animate-pulse" />
                </>
            )}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-2 rounded-xl",
                            isPremium ? "bg-white/20" : "bg-primary/10"
                        )}>
                            <Crown className={cn(
                                "h-6 w-6",
                                isPremium ? "text-white" : "text-primary"
                            )} />
                        </div>
                        <div>
                            <h3 className={cn(
                                "text-lg font-bold leading-tight",
                                !isPremium && "text-foreground"
                            )}>
                                {isPremium ? "HoraMed Premium" : t('common.free')}
                            </h3>
                            <p className={cn(
                                "text-sm font-medium",
                                isPremium ? "text-white/80" : "text-muted-foreground"
                            )}>
                                {isPremium
                                    ? t('profile.unlimitedAccess') || "Acesso Ilimitado"
                                    : daysLeft !== null && daysLeft > 0
                                        ? `${daysLeft} ${t('profile.daysLeft')}`
                                        : t('profile.upgradeToUnlock')
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => navigate('/planos')}
                    size="lg"
                    variant={isPremium ? "secondary" : "default"}
                    className={cn(
                        "rounded-xl shadow-md font-semibold h-12 px-6",
                        isPremium
                            ? "bg-white text-orange-600 hover:bg-white/90 border-0"
                            : "bg-primary hover:bg-primary/90"
                    )}
                >
                    {isPremium ? (
                        <span className="flex items-center gap-2">
                            {t('profile.manageSubscription')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            {t('common.upgrade')} <ChevronRight className="h-4 w-4" />
                        </span>
                    )}
                </Button>
            </div>

            {!isPremium && (
                <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary" />
                        <span>{t('common.multiProfile')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary" />
                        <span>{t('common.advancedAI')}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
