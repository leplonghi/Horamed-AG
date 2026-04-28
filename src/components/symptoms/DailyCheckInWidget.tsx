import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smiley as Smile, SmileyMeh as Meh, SmileySad as Frown, Heartbeat as Activity } from '@phosphor-icons/react';
import { GeneralFeeling, symptomService } from '@/lib/symptomService';
import { SymptomLoggerModal } from './SymptomLoggerModal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface DailyCheckInWidgetProps {
    onLogComplete: () => void;
    hasLoggedToday: boolean;
}
import { useLanguage } from '@/contexts/LanguageContext';

export function DailyCheckInWidget({ onLogComplete, hasLoggedToday }: DailyCheckInWidgetProps) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFeeling, setSelectedFeeling] = useState<GeneralFeeling | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 'great' and 'okay' save directly — no symptom modal needed
    const handleFeelingSelect = async (feeling: GeneralFeeling) => {
        if (feeling === 'poor') {
            setSelectedFeeling('poor');
            setIsModalOpen(true);
            return;
        }

        if (!user) return;
        setIsSaving(true);
        try {
            await symptomService.logSymptom({
                userId: user.uid,
                date: new Date(),
                generalFeeling: feeling,
                symptoms: [],
                correlatedMedications: [],
            });
            onLogComplete();
            toast.success(t('symptom.successSave'));
        } catch {
            toast.error(t('symptom.errorSave') || 'Erro ao salvar. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedFeeling(null);
    };

    const handleSuccess = () => {
        handleModalClose();
        onLogComplete();
        toast.success(t('symptom.successSave'));
    };

    if (hasLoggedToday) {
        return (
            <Card className="bg-primary/10 border-primary/20 shadow-md relative overflow-hidden">
                <CardContent className="p-3.5 flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary p-2 rounded-full text-primary-foreground">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-primary uppercase tracking-tight">{t('symptom.checkinComplete')}</h3>
                            <p className="text-[11px] font-bold text-muted-foreground">{t('symptom.checkinCompleteDesc')}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="h-8 text-[11px] font-black border-primary/30 text-primary hover:bg-primary/10 transition-colors uppercase">
                        {t('symptom.logAgain')}
                    </Button>
                </CardContent>

                <SymptomLoggerModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    initialFeeling="okay"
                    onSuccess={handleSuccess}
                />
            </Card>
        );
    }

    return (
        <>
            <Card className="bg-card/80 backdrop-blur-sm shadow-sm border-border/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/70" />
                <CardHeader className="p-3.5 pb-2">
                    <CardTitle className="flex items-center text-sm font-black uppercase tracking-wider text-foreground">
                        <Activity className="mr-2 h-4 w-4 text-primary" />
                        {t('symptom.dailyCheckIn')}
                    </CardTitle>
                    <CardDescription className="text-[11px] font-medium leading-tight">{t('symptom.howFeeling')}</CardDescription>
                </CardHeader>
                <CardContent className="px-3.5 pb-3.5 pt-0">
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            className="flex flex-col h-16 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all group rounded-xl border-dashed border-emerald-200 dark:hover:bg-emerald-950/30 dark:border-emerald-800"
                            onClick={() => handleFeelingSelect('great')}
                            disabled={isSaving}
                            aria-label={t('symptom.feelingGreat')}
                        >
                            <Smile className="h-5 w-5 mb-1 text-emerald-500 transition-colors" weight="duotone" />
                            <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">{t('symptom.feelingGreat')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-16 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all group rounded-xl border-dashed border-amber-200 dark:hover:bg-amber-950/30 dark:border-amber-800"
                            onClick={() => handleFeelingSelect('okay')}
                            disabled={isSaving}
                            aria-label={t('symptom.feelingOkay')}
                        >
                            <Meh className="h-5 w-5 mb-1 text-amber-500 transition-colors" weight="duotone" />
                            <span className="text-[10px] font-black uppercase text-center leading-none px-1 text-amber-700 dark:text-amber-400">{t('symptom.feelingOkay')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-16 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-all group rounded-xl border-dashed border-rose-200 dark:hover:bg-rose-950/30 dark:border-rose-800"
                            onClick={() => handleFeelingSelect('poor')}
                            disabled={isSaving}
                            aria-label={t('symptom.feelingPoor')}
                        >
                            <Frown className="h-5 w-5 mb-1 text-rose-500 transition-colors" weight="duotone" />
                            <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400">{t('symptom.feelingPoor')}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <SymptomLoggerModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                initialFeeling={selectedFeeling || 'okay'}
                onSuccess={handleSuccess}
            />
        </>
    );
}
