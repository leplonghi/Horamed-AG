import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GeneralFeeling, SymptomSeverity, symptomService, SymptomLog } from '@/lib/symptomService';
import { analyzeSymptomCorrelation } from '@/lib/correlationEngine';
import { ShieldAlert, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { useLanguage } from '@/contexts/LanguageContext';

const COMMON_SYMPTOMS = [
    'headache', 'nausea', 'dizziness', 'fatigue',
    'musclePain', 'jointPain', 'palpitations', 'insomnia',
    'diarrhea', 'stomachAche', 'swelling', 'tremors'
];

interface SymptomLoggerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFeeling?: GeneralFeeling;
    onSuccess?: () => void;
}

export function SymptomLoggerModal({ isOpen, onClose, initialFeeling = 'okay', onSuccess }: SymptomLoggerModalProps) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [feeling, setFeeling] = useState<GeneralFeeling>(initialFeeling);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [severity, setSeverity] = useState<SymptomSeverity>('moderate');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [correlations, setCorrelations] = useState<string[]>([]);

    // In a real app, this would be fetched from the database / active medications state
    const mockActiveMedications = ['Lisinopril', 'Metformin'];

    useEffect(() => {
        if (isOpen) {
            setFeeling(initialFeeling);
            setSelectedSymptoms([]);
            setSeverity('moderate');
            setNotes('');
            setCorrelations([]);
        }
    }, [isOpen, initialFeeling]);

    useEffect(() => {
        if (selectedSymptoms.length > 0) {
            const observations = analyzeSymptomCorrelation(selectedSymptoms, mockActiveMedications);
            setCorrelations(observations);
        } else {
            setCorrelations([]);
        }
    }, [selectedSymptoms]);

    const toggleSymptom = (symptom: string) => {
        setSelectedSymptoms((prev) =>
            prev.includes(symptom)
                ? prev.filter(s => s !== symptom)
                : [...prev, symptom]
        );
    };

    const handleSubmit = async () => {
        if (!user) return;

        setIsSubmitting(true);
        try {
            const logData: Omit<SymptomLog, 'id' | 'createdAt'> = {
                userId: user.uid,
                date: new Date(),
                generalFeeling: feeling,
                symptoms: selectedSymptoms,
                ...(selectedSymptoms.length > 0 && { severity }),
                ...(notes.trim() && { notes: notes.trim() }),
                correlatedMedications: correlations.length > 0 ? mockActiveMedications : [],
            };

            await symptomService.logSymptom(logData);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to save symptoms:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto w-[95%]">
                <DialogHeader>
                    <DialogTitle>{t('symptom.logSymptoms')}</DialogTitle>
                    <DialogDescription>
                        <p className="flex items-center text-xs mt-1 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                            <ShieldAlert className="h-4 w-4 mr-2 flex-shrink-0" />
                            {t('symptom.disclaimer')}
                        </p>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label htmlFor="symptom-toggles">{t('symptom.whatExperiencing')}</Label>
                        <div className="flex flex-wrap gap-2" id="symptom-toggles">
                            {COMMON_SYMPTOMS.map((symptom) => (
                                <Toggle
                                    key={symptom}
                                    pressed={selectedSymptoms.includes(symptom)}
                                    onPressedChange={() => toggleSymptom(symptom)}
                                    className="data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-800 dark:data-[state=on]:bg-emerald-900/40 dark:data-[state=on]:text-emerald-200"
                                >
                                    {t(`symptom.list.${symptom}`)}
                                </Toggle>
                            ))}
                        </div>
                    </div>

                    {selectedSymptoms.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <Label htmlFor="severity-radio">{t('symptom.howSevere')}</Label>
                            <RadioGroup id="severity-radio" value={severity} onValueChange={(val) => setSeverity(val as SymptomSeverity)} className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="mild" id="r1" />
                                    <Label htmlFor="r1" className="cursor-pointer">{t('symptom.mild')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="moderate" id="r2" />
                                    <Label htmlFor="r2" className="cursor-pointer">{t('symptom.moderate')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="severe" id="r3" />
                                    <Label htmlFor="r3" className="cursor-pointer text-rose-600 dark:text-rose-400">{t('symptom.severe')}</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {correlations.length > 0 && (
                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-sky-50 dark:bg-sky-950/30 p-3 rounded-lg border border-sky-200 dark:border-sky-800">
                                <div className="flex items-start">
                                    <Info className="h-5 w-5 text-sky-500 mt-0.5 mr-2 flex-shrink-0" />
                                    <div className="text-sm text-sky-800 dark:text-sky-200 space-y-1">
                                        {correlations.map((note, idx) => (
                                            <p key={idx}>{note}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label htmlFor="additional-notes">{t('symptom.additionalNotes')}</Label>
                        <Textarea
                            id="additional-notes"
                            placeholder={t('symptom.notesPlaceholder')}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        {t('symptom.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (feeling !== 'great' && selectedSymptoms.length === 0 && !notes.trim())}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isSubmitting ? t('symptom.saving') : t('symptom.saveCheckin')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
