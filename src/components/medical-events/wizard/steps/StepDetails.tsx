
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MedicalEventFormData } from "@/types/medicalEvents";
import { ArrowLeft, ArrowRight, MapPin, Bell } from "@phosphor-icons/react";

interface StepDetailsProps {
    formData: Partial<MedicalEventFormData>;
    updateFormData: (data: Partial<MedicalEventFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function StepDetails({
    formData,
    updateFormData,
    onNext,
    onBack,
}: StepDetailsProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold">Detalhes Adicionais</h2>

            <div className="space-y-6">
                {/* Location Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <MapPin className="h-5 w-5" />
                        <h3 className="font-semibold">Localização</h3>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="locationName">Nome do Local</Label>
                        <Input
                            id="locationName"
                            placeholder="Ex: Clínica Saúde, Hospital Central"
                            value={formData.location?.name || ''}
                            onChange={(e) => updateFormData({
                                location: { ...formData.location!, name: e.target.value }
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Endereço (Opcional)</Label>
                        <Input
                            id="address"
                            placeholder="Rua, Número, Bairro"
                            value={formData.location?.address || ''}
                            onChange={(e) => updateFormData({
                                location: { ...formData.location!, address: e.target.value }
                            })}
                        />
                    </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Bell className="h-5 w-5" />
                        <h3 className="font-semibold">Lembretes</h3>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                        <div className="space-y-0.5">
                            <Label className="text-base">Ativar Notificações</Label>
                            <p className="text-xs text-muted-foreground">Receba avisos antes do evento</p>
                        </div>
                        <Switch
                            checked={formData.enableNotifications}
                            onCheckedChange={(checked) => updateFormData({ enableNotifications: checked })}
                        />
                    </div>

                    {formData.type === 'exam' && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="space-y-0.5">
                                <Label className="text-base">Jejum Necessário?</Label>
                                <p className="text-xs text-muted-foreground">Adicionará um lembrete específico</p>
                            </div>
                            <Switch
                                checked={formData.preparation?.fasting || false}
                                onCheckedChange={(checked) => updateFormData({
                                    preparation: { ...formData.preparation!, fasting: checked }
                                })}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button onClick={onNext}>
                    Próximo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
