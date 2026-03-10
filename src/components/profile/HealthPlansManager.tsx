
import { useState } from "react";
import { Plus, X, CreditCard, Shield } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useUserProfiles, HealthPlan } from "@/hooks/useUserProfiles";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";

export default function HealthPlansManager() {
    const { activeProfile, updateProfile } = useUserProfiles();
    const { t } = useTranslation();
    const [isAdding, setIsAdding] = useState(false);
    const [newPlan, setNewPlan] = useState<Partial<HealthPlan>>({
        operatorName: "",
        planType: "",
        cardNumber: "",
        isTitular: true
    });

    const handleAddPlan = async () => {
        if (!activeProfile) return;
        if (!newPlan.operatorName) {
            toast.error(t('common.requiredField'));
            return;
        }

        const plan: HealthPlan = {
            id: Math.random().toString(36).substring(2, 9),
            operatorName: newPlan.operatorName,
            planType: newPlan.planType || "",
            cardNumber: newPlan.cardNumber || "",
            isTitular: newPlan.isTitular !== false // default true
        };

        const updatedPlans = [...(activeProfile.healthPlans || []), plan];

        try {
            await updateProfile(activeProfile.id, { healthPlans: updatedPlans });
            setNewPlan({ operatorName: "", planType: "", cardNumber: "", isTitular: true });
            setIsAdding(false);
            toast.success(t('profile.saveSuccess'));
        } catch (error) {
            toast.error(t('profile.saveError'));
        }
    };

    const handleRemovePlan = async (planId: string) => {
        if (!activeProfile) return;
        const updatedPlans = (activeProfile.healthPlans || []).filter(p => p.id !== planId);

        try {
            await updateProfile(activeProfile.id, { healthPlans: updatedPlans });
            toast.success(t('common.deleted'));
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    return (
        <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    {t('profile.healthPlans') || "Planos de Saúde"}
                </h3>
                {!isAdding && (
                    <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
                        <Plus className="h-4 w-4 mr-1" /> {t('common.add')}
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="space-y-2">
                {activeProfile?.healthPlans?.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                        <div>
                            <p className="font-medium text-sm text-foreground">{plan.operatorName}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                {plan.planType && <span>{plan.planType}</span>}
                                {plan.cardNumber && <span>• {plan.cardNumber}</span>}
                                <span className="bg-background px-1.5 py-0.5 rounded border text-[10px]">
                                    {plan.isTitular ? (t('profile.titular') || "Titular") : (t('profile.dependent') || "Dependente")}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemovePlan(plan.id)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {(!activeProfile?.healthPlans || activeProfile.healthPlans.length === 0) && !isAdding && (
                    <p className="text-sm text-muted-foreground/80 text-center py-4 italic">
                        {t('profile.noHealthPlans') || "Nenhum plano cadastrado."}
                    </p>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="space-y-3 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <Label className="text-xs">{t('profile.operatorName') || "Operadora (Ex: Unimed)"}</Label>
                        <Input
                            className="h-8 mt-1"
                            value={newPlan.operatorName}
                            onChange={(e) => setNewPlan({ ...newPlan, operatorName: e.target.value })}
                            placeholder="Digite o nome..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">{t('profile.planType') || "Produo/Plano"}</Label>
                            <Input
                                className="h-8 mt-1"
                                value={newPlan.planType}
                                onChange={(e) => setNewPlan({ ...newPlan, planType: e.target.value })}
                                placeholder="Ex: Flex"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">{t('profile.cardNumber') || "Nº Carteirinha"}</Label>
                            <Input
                                className="h-8 mt-1"
                                value={newPlan.cardNumber}
                                onChange={(e) => setNewPlan({ ...newPlan, cardNumber: e.target.value })}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-1">
                        <Label className="text-sm font-normal">{t('profile.isTitular') || "Sou o Titular do plano"}</Label>
                        <Switch
                            checked={newPlan.isTitular}
                            onCheckedChange={(checked) => setNewPlan({ ...newPlan, isTitular: checked })}
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>{t('common.cancel')}</Button>
                        <Button size="sm" onClick={handleAddPlan}>{t('common.save')}</Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
