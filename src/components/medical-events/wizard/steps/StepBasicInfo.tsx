
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MedicalEventFormData } from "@/types/medicalEvents";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface StepBasicInfoProps {
    formData: Partial<MedicalEventFormData>;
    updateFormData: (data: Partial<MedicalEventFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function StepBasicInfo({
    formData,
    updateFormData,
    onNext,
    onBack,
}: StepBasicInfoProps) {
    // Simple validation
    const isValid = formData.title && formData.date && formData.time;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Handle date string to Date object
        const dateStr = e.target.value;
        if (dateStr) {
            // Create date at noon to avoid timezone issues for simple date picking
            const date = new Date(dateStr + 'T12:00:00');
            updateFormData({ date: date });
        }
    };

    const formattedDate = formData.date
        ? formData.date.toISOString().split('T')[0]
        : '';

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Informações Básicas</h2>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Título do Evento *</Label>
                    <Input
                        id="title"
                        placeholder="Ex: Cardiologista, Exame de Sangue"
                        value={formData.title || ''}
                        onChange={(e) => updateFormData({ title: e.target.value })}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Data *</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formattedDate}
                            onChange={handleDateChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="time">Horário *</Label>
                        <Input
                            id="time"
                            type="time"
                            value={formData.time || ''}
                            onChange={(e) => updateFormData({ time: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-2 border-t mt-4">
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground">Profissional (Opcional)</h3>
                    <div className="space-y-2">
                        <Label htmlFor="doctorName">Nome do Médico/Profissional</Label>
                        <Input
                            id="doctorName"
                            placeholder="Dr. Silva"
                            value={formData.doctor?.name || ''}
                            onChange={(e) => updateFormData({
                                doctor: { ...formData.doctor!, name: e.target.value }
                            })}
                        />
                    </div>
                    <div className="space-y-2 mt-2">
                        <Label htmlFor="specialty">Especialidade</Label>
                        <Input
                            id="specialty"
                            placeholder="Cardiologia, Dermatologia..."
                            value={formData.doctor?.specialty || ''}
                            onChange={(e) => updateFormData({
                                doctor: { ...formData.doctor!, specialty: e.target.value }
                            })}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button onClick={onNext} disabled={!isValid}>
                    Próximo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
