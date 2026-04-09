
import { useNavigate } from "react-router-dom";
import { Shield, MapPin, Plus } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useTranslation } from "@/contexts/LanguageContext";
import HealthServiceFinder from "@/components/health/HealthServiceFinder";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function HealthPlanSummary() {
    const { activeProfile } = useUserProfiles();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [showFinder, setShowFinder] = useState(false);
    const editProfilePath = activeProfile?.id ? `/perfil/editar/${activeProfile.id}` : '/perfis/gerenciar';

    const plans = activeProfile?.healthPlans || [];

    if (plans.length === 0) {
        return (
            <Card className="p-4 bg-muted/30 border-dashed">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium">{t('profile.healthPlans') || "Planos de Saúde"}</h3>
                        <p className="text-xs text-muted-foreground">{t('profile.noHealthPlans') || "Cadastre para encontrar redes credenciadas."}</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1 mt-1" onClick={() => navigate(editProfilePath)}>
                        <Plus className="h-3 w-3" /> {t('common.add')}
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-0 overflow-hidden border-blue-200/50 dark:border-blue-800/50 shadow-sm">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-background border-b border-border/50 flex justify-between items-center">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Shield className="h-4 w-4" />
                    {t('profile.healthPlans')}
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate(editProfilePath)}>
                    <span className="text-xs text-muted-foreground">Edit</span>
                </Button>
            </div>

            <div className="p-3 space-y-3">
                {plans.slice(0, 2).map(plan => (
                    <div key={plan.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="font-medium">{plan.operatorName}</span>
                        </div>
                        {plan.cardNumber && (
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 rounded">
                                {plan.cardNumber.slice(0, 4)}...
                            </span>
                        )}
                    </div>
                ))}
                {plans.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">+ {plans.length - 2} outros</p>
                )}

                <div className="pt-2 border-t border-border/50">
                    <Dialog open={showFinder} onOpenChange={setShowFinder}>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="w-full h-8 text-xs gap-2 bg-blue-600 hover:bg-blue-700">
                                <MapPin className="h-3.5 w-3.5" />
                                {t('common.findNearby') || "Encontrar Rede Credenciada"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card">
                            <div className="px-6 py-4 border-b">
                                <DialogTitle>{t('healthFinder.title')}</DialogTitle>
                            </div>
                            <HealthServiceFinder className="border-0 shadow-none bg-transparent" />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </Card>
    );
}
