
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stethoscope, FileText, Heartbeat as Activity, CalendarBlank as Calendar } from "@phosphor-icons/react";
import { MedicalEventFormData, EventType } from "@/types/medicalEvents";
import { cn } from "@/lib/utils";

interface StepTypeSelectionProps {
    formData: Partial<MedicalEventFormData>;
    updateFormData: (data: Partial<MedicalEventFormData>) => void;
    onNext: () => void;
}

export default function StepTypeSelection({
    formData,
    updateFormData,
    onNext,
}: StepTypeSelectionProps) {
    const options: { id: EventType; label: string; icon: any; description: string }[] = [
        {
            id: "consultation",
            label: "Consulta",
            icon: Stethoscope,
            description: "Agendar com médico ou especialista",
        },
        {
            id: "exam",
            label: "Exame",
            icon: FileText,
            description: "Exames laboratoriais ou de imagem",
        },
        {
            id: "procedure",
            label: "Procedimento",
            icon: Activity,
            description: "Cirurgias, terapias ou curativos",
        },
        {
            id: "other",
            label: "Outro",
            icon: Calendar,
            description: "Retornos, vacinas ou outros eventos",
        },
    ];

    const handleSelect = (type: EventType) => {
        updateFormData({ type });
        // Auto-advance? Maybe better to let them click next or just auto-advance for better UX
        setTimeout(onNext, 200);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center">
                <h2 className="text-xl font-bold">Qual o tipo do evento?</h2>
                <p className="text-muted-foreground text-sm">Selecione a categoria mais adequada</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {options.map((option) => (
                    <Card
                        key={option.id}
                        className={cn(
                            "p-4 cursor-pointer hover:border-primary transition-all flex items-center gap-4",
                            formData.type === option.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                        )}
                        onClick={() => handleSelect(option.id)}
                    >
                        <div className={cn(
                            "p-3 rounded-full",
                            formData.type === option.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                            <option.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">{option.label}</h3>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
