import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IconSmile as Smile, IconMeh as Meh, IconFrown as Frown, IconActivity as Activity } from '@/components/icons/HoramedIcons';
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
            <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-md transform transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-emerald-500 p-2 rounded-full text-white">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">{t('symptom.checkinComplete')}</h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('symptom.checkinCompleteDesc')}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/50">
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
            <Card className="bg-white dark:bg-zinc-900 shadow-md border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-xl">
                        <Activity className="mr-2 h-5 w-5 text-emerald-500" />
                        {t('symptom.dailyCheckIn')}
                    </CardTitle>
                    <CardDescription>{t('symptom.howFeeling')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <Button
                            variant="outline"
                            className="flex flex-col h-24 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors group"
                            onClick={() => handleFeelingSelect('great')}
                            disabled={isSaving}
                        >
                            <Smile className="h-8 w-8 mb-2 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                            <span>{t('symptom.feelingGreat')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-24 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors group"
                            onClick={() => handleFeelingSelect('okay')}
                            disabled={isSaving}
                        >
                            <Meh className="h-8 w-8 mb-2 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                            <span>{t('symptom.feelingOkay')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-24 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-colors group"
                            onClick={() => handleFeelingSelect('poor')}
                            disabled={isSaving}
                        >
                            <Frown className="h-8 w-8 mb-2 text-zinc-400 group-hover:text-rose-500 transition-colors" />
                            <span>{t('symptom.feelingPoor')}</span>
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
