import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSideEffectsLog, COMMON_SIDE_EFFECTS } from '@/hooks/useSideEffectsLog';
import { useMedications } from '@/hooks/useMedications';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { AlertCircle, Thermometer, Zap, Activity } from 'lucide-react';

interface SideEffectLoggerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    itemId?: string;
}

export function SideEffectLoggerModal({ isOpen, onClose, onSuccess, itemId }: SideEffectLoggerModalProps) {
    const { t, language } = useLanguage();
    const { data: medications } = useMedications();
    const { createLog } = useSideEffectsLog();

    const [selectedMedication, setSelectedMedication] = useState<string>(itemId || '');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [overallFeeling, setOverallFeeling] = useState<number>(3);
    const [energyLevel, setEnergyLevel] = useState<number>(3);
    const [painLevel, setPainLevel] = useState<number>(1);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedMedication(itemId || '');
            setSelectedTags([]);
            setOverallFeeling(3);
            setEnergyLevel(3);
            setPainLevel(1);
            setNotes('');
        }
    }, [isOpen, itemId]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (!selectedMedication) {
            toast.error(language === 'pt' ? 'Selecione um medicamento' : 'Select a medication');
            return;
        }

        setIsSubmitting(true);
        try {
            await createLog({
                itemId: selectedMedication,
                overallFeeling,
                energyLevel,
                painLevel,
                sideEffectTags: selectedTags,
                notes: notes.trim() || undefined,
            });

            toast.success(language === 'pt' ? 'Registro salvo com sucesso!' : 'Log saved successfully!');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to save side effect:', error);
            toast.error(language === 'pt' ? 'Erro ao salvar registro' : 'Error saving log');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        {language === 'pt' ? 'Relatar Evento / Efeito' : 'Report Event / Side Effect'}
                    </DialogTitle>
                    <DialogDescription>
                        {language === 'pt'
                            ? 'Registre como você está se sentindo em relação aos seus medicamentos.'
                            : 'Record how you are feeling in relation to your medications.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>{language === 'pt' ? 'Medicamento Relacionado' : 'Related Medication'}</Label>
                        <Select value={selectedMedication} onValueChange={setSelectedMedication}>
                            <SelectTrigger>
                                <SelectValue placeholder={language === 'pt' ? 'Selecione o medicamento' : 'Select medication'} />
                            </SelectTrigger>
                            <SelectContent>
                                {medications?.map((med) => (
                                    <SelectItem key={med.id} value={med.id}>
                                        {med.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                {language === 'pt' ? 'Bem-estar Geral' : 'Overall Well-being'}
                            </Label>
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{overallFeeling}/5</span>
                        </div>
                        <Slider
                            value={[overallFeeling]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={([val]) => setOverallFeeling(val)}
                            className="py-1"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                {language === 'pt' ? 'Nível de Energia' : 'Energy Level'}
                            </Label>
                            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{energyLevel}/5</span>
                        </div>
                        <Slider
                            value={[energyLevel]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={([val]) => setEnergyLevel(val)}
                            className="py-1"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-rose-500" />
                                {language === 'pt' ? 'Nível de Desconforto/Dor' : 'Discomfort/Pain Level'}
                            </Label>
                            <span className="text-sm font-medium text-rose-600 dark:text-rose-400">{painLevel}/5</span>
                        </div>
                        <Slider
                            value={[painLevel]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={([val]) => setPainLevel(val)}
                            className="py-1"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>{language === 'pt' ? 'Sintomas Específicos' : 'Specific Symptoms'}</Label>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_SIDE_EFFECTS.map((tag) => (
                                <Toggle
                                    key={tag}
                                    pressed={selectedTags.includes(tag)}
                                    onPressedChange={() => toggleTag(tag)}
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full data-[state=on]:bg-amber-100 data-[state=on]:text-amber-800 dark:data-[state=on]:bg-amber-900/40 dark:data-[state=on]:text-amber-200"
                                >
                                    {tag}
                                </Toggle>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="side-effect-notes">{language === 'pt' ? 'Observações Adicionais' : 'Additional Notes'}</Label>
                        <Textarea
                            id="side-effect-notes"
                            placeholder={language === 'pt' ? 'Descreva como se sente...' : 'Describe how you feel...'}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        {language === 'pt' ? 'Cancelar' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedMedication}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                    >
                        {isSubmitting
                            ? (language === 'pt' ? 'Salvando...' : 'Saving...')
                            : (language === 'pt' ? 'Salvar Registro' : 'Save Log')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
