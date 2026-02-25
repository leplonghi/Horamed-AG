import { MedicalEventFormData, EventType } from '@/types/medicalEvents';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stethoscope, FileText, Syringe, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepTypeProps {
    formData: Partial<MedicalEventFormData>;
    updateFormData: (data: Partial<MedicalEventFormData>) => void;
    onNext: () => void;
}

const EVENT_TYPES: { type: EventType; label: string; icon: any; description: string }[] = [
    {
        type: 'consultation',
        label: 'Consulta Médica',
        icon: Stethoscope,
        description: 'Agendamento com médico geral ou especialista'
    },
    {
        type: 'exam',
        label: 'Exame',
        icon: Activity,
        description: 'Exames laboratoriais ou de imagem'
    },
    {
        type: 'procedure',
        label: 'Procedimento',
        icon: Syringe,
        description: 'Cirurgias, terapias ou outros procedimentos'
    },
    {
        type: 'other',
        label: 'Outro',
        icon: FileText,
        description: 'Retornos, buscas de resultado, etc.'
    }
];

const StepTypeSelection = ({ formData, updateFormData, onNext }: StepTypeProps) => {
    const handleSelect = (type: EventType) => {
        updateFormData({ type });
        // Small delay for visual feedback
        setTimeout(onNext, 150);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Qual o tipo de evento?</h2>
                <p className="text-muted-foreground">Selecione a categoria que melhor se encaixa.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {EVENT_TYPES.map((item) => (
                    <Card
                        key={item.type}
                        className={cn(
                            "p-4 cursor-pointer hover:border-primary transition-all flex items-center gap-4",
                            formData.type === item.type ? "border-primary bg-primary/5" : ""
                        )}
                        onClick={() => handleSelect(item.type)}
                    >
                        <div className={cn(
                            "p-3 rounded-full bg-muted",
                            formData.type === item.type ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        )}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">{item.label}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default StepTypeSelection;
