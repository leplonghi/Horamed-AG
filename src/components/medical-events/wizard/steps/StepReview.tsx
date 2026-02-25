
import { Button } from "@/components/ui/button";
import { MedicalEventFormData } from "@/types/medicalEvents";
import { ArrowLeft, Check, Calendar, Clock, MapPin, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StepReviewProps {
    formData: Partial<MedicalEventFormData>;
    updateFormData: (data: Partial<MedicalEventFormData>) => void;
    onBack: () => void;
    onSave: () => void;
    isSaving: boolean;
}

export default function StepReview({
    formData,
    onBack,
    onSave,
    isSaving
}: StepReviewProps) {

    const formatDate = (date?: Date) => {
        if (!date) return 'Data não definida';
        return format(date, "d 'de' MMMM, yyyy", { locale: ptBR });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center">
                <h2 className="text-xl font-bold">Revisar Evento</h2>
                <p className="text-muted-foreground">Confira os dados antes de salvar</p>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{formData.title}</h3>
                        <span className="text-sm px-2 py-0.5 bg-muted rounded-full uppercase text-[10px] font-bold tracking-wide">
                            {formData.type === 'consultation' ? 'Consulta' :
                                formData.type === 'exam' ? 'Exame' :
                                    formData.type === 'procedure' ? 'Procedimento' : 'Outro'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Data</p>
                            <p className="font-medium">{formatDate(formData.date)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Horário</p>
                            <p className="font-medium">{formData.time}</p>
                        </div>
                    </div>

                    {(formData.doctor?.name) && (
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Profissional</p>
                                <p className="font-medium">{formData.doctor.name}</p>
                                {formData.doctor.specialty && <p className="text-sm text-muted-foreground">{formData.doctor.specialty}</p>}
                            </div>
                        </div>
                    )}

                    {(formData.location?.name || formData.location?.address) && (
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Local</p>
                                {formData.location.name && <p className="font-medium">{formData.location.name}</p>}
                                {formData.location.address && <p className="text-sm text-muted-foreground">{formData.location.address}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onBack} disabled={isSaving}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button onClick={onSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]">
                    {isSaving ? "Salvando..." : (
                        <>
                            <Check className="w-4 h-4 mr-2" /> Confirmar
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
