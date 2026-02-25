import { MedicalEventFormData } from '@/types/medicalEvents';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Stethoscope } from 'lucide-react';

interface StepDetailsProps {
    formData: Partial<MedicalEventFormData>;
    updateFormData: (data: Partial<MedicalEventFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const StepDetails = ({ formData, updateFormData, onNext, onBack }: StepDetailsProps) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    const updateLocation = (field: string, value: string) => {
        updateFormData({
            location: {
                name: formData.location?.name || '',
                address: formData.location?.address || '',
                [field]: value
            }
        });
    };

    const updateDoctor = (field: string, value: string) => {
        updateFormData({
            doctor: {
                name: formData.doctor?.name || '',
                crm: formData.doctor?.crm || '',
                specialty: formData.doctor?.specialty || '',
                [field]: value
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Onde e com quem?</h2>
                <p className="text-muted-foreground">Localização e profissional.</p>
            </div>

            <div className="space-y-6">
                {/* Local */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <MapPin className="w-4 h-4" />
                        <h3>Local</h3>
                    </div>
                    <div className="space-y-3 pl-2 border-l-2 border-muted ml-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Nome do Local (Clínica/Hospital)</Label>
                            <Input
                                placeholder="Ex: Hospital Central"
                                value={formData.location?.name || ''}
                                onChange={(e) => updateLocation('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Endereço (Opcional)</Label>
                            <Input
                                placeholder="Rua, Número..."
                                value={formData.location?.address || ''}
                                onChange={(e) => updateLocation('address', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Médico */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Stethoscope className="w-4 h-4" />
                        <h3> Profissional </h3>
                    </div>
                    <div className="space-y-3 pl-2 border-l-2 border-muted ml-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Nome do Médico</Label>
                            <Input
                                placeholder="Ex: Dr. Silva"
                                value={formData.doctor?.name || ''}
                                onChange={(e) => updateDoctor('name', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Especialidade</Label>
                                <Input
                                    placeholder="Ex: Cardiologista"
                                    value={formData.doctor?.specialty || ''}
                                    onChange={(e) => updateDoctor('specialty', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">CRM (Opcional)</Label>
                                <Input
                                    placeholder="Ex: 123456"
                                    value={formData.doctor?.crm || ''}
                                    onChange={(e) => updateDoctor('crm', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack} className="w-1/3">
                    Voltar
                </Button>
                <Button type="submit" className="w-2/3">
                    Continuar
                </Button>
            </div>
        </form>
    );
};

export default StepDetails;
