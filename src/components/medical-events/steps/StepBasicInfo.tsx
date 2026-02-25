import { MedicalEventFormData } from '@/types/medicalEvents';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface StepBasicProps {
    formData: Partial<MedicalEventFormData>;
    updateFormData: (data: Partial<MedicalEventFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const StepBasicInfo = ({ formData, updateFormData, onNext, onBack }: StepBasicProps) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    // Helper to handle date input (string -> Date)
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val) {
            // Create date at noon to avoid timezone issues for simple date selection
            const [year, month, day] = val.split('-').map(Number);
            const date = new Date(year, month - 1, day, 12, 0, 0);
            updateFormData({ date });
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const currentDateStr = formData.date ? format(formData.date, 'yyyy-MM-dd') : todayStr;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Quando e o quê?</h2>
                <p className="text-muted-foreground">Infos básicas do evento.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Título do Evento</Label>
                    <Input
                        id="title"
                        required
                        placeholder="Ex: Cardiologista, Exame de Sangue"
                        value={formData.title || ''}
                        onChange={(e) => updateFormData({ title: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <Input
                            id="date"
                            type="date"
                            required
                            value={currentDateStr}
                            onChange={handleDateChange}
                            className="block w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="time">Horário</Label>
                        <Input
                            id="time"
                            type="time"
                            required
                            value={formData.time || ''}
                            onChange={(e) => updateFormData({ time: e.target.value })}
                        />
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

export default StepBasicInfo;
