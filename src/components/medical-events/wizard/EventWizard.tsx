import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MedicalEventFormData, defaultEventFormData, EventType } from '@/types/medicalEvents';
import { createMedicalEvent } from '@/lib/medicalEvents';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from "@phosphor-icons/react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Assuming AuthContext exists

// Steps
import StepTypeSelection from './steps/StepTypeSelection';
import StepBasicInfo from './steps/StepBasicInfo';
import StepDetails from './steps/StepDetails';
import StepReview from './steps/StepReview';
import OCRCapture from './OCRCapture';

const EventWizard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    // const { user } = useAuth(); // Implement if AuthContext is available
    const user = { uid: 'current_user_id' }; // Placeholder

    const [step, setStep] = useState(0); // 0 = Mode Selection, 1 = Type, 2 = Basic, 3 = Details, 4 = Review
    const [captureMode, setCaptureMode] = useState<'manual' | 'ocr' | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initial State
    const [formData, setFormData] = useState<Partial<MedicalEventFormData>>({
        enableNotifications: true,
        type: 'consultation',
        // Initialize other fields safely
        preparation: { fasting: false, instructions: [] },
        doctor: { name: '', crm: '', specialty: '' },
        location: { name: '', address: '' }
    });

    const updateFormData = (data: Partial<MedicalEventFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleOCRData = (data: any) => {
        // Map OCR data to form data
        const extracted = data.extractedData || {};
        const classification = data.classification || {};

        const newFormData: Partial<MedicalEventFormData> = {
            ...formData,
            title: extracted.doctorName ? `Consulta com ${extracted.doctorName}` : (classification.type === 'exam_result' ? 'Exame' : 'Novo Evento'),
            date: extracted.date || new Date(),
            time: extracted.time || '08:00',
            doctor: {
                name: extracted.doctorName || '',
                crm: extracted.crm || '',
                specialty: ''
            },
            type: mapClassificationToType(classification.type),
            ocrData: {
                text: data.text,
                processedDate: new Date(),
                status: 'reviewed',
                confidence: classification.confidence
            }
        };

        setFormData(newFormData);
        setStep(1); // Go to Type Selection (or Basic Info if confident) to confirm
    };

    const mapClassificationToType = (ocrType: string): EventType => {
        switch (ocrType) {
            case 'medical_exam_request': return 'exam';
            case 'prescription': return 'consultation'; // Usually follows a consultation
            default: return 'consultation';
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            // Validate required fields
            if (!formData.title || !formData.date || !formData.time) {
                toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
                setIsSaving(false);
                return;
            }

            // Cast partial to full type (safe because we validated basics)
            /* eslint-disable-next-line */
            await createMedicalEvent(user.uid, formData as MedicalEventFormData);

            toast({ title: "Sucesso!", description: "Evento criado com sucesso." });
            navigate('/eventos-medicos');
        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Falha ao salvar evento.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // Render Steps
    const renderStep = () => {
        // Step 0: Mode Selection (Intro)
        if (step === 0) {
            if (captureMode === 'ocr') {
                return (
                    <div className="space-y-4">
                        <Button variant="ghost" onClick={() => setCaptureMode(null)} className="mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                        </Button>
                        <OCRCapture onDataExtracted={handleOCRData} />
                    </div>
                );
            }
            return (
                <div className="space-y-6 pt-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">Novo Evento Médico</h2>
                        <p className="text-muted-foreground">Como deseja adicionar?</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <Button
                            size="lg"
                            className="h-24 text-lg flex flex-col gap-1"
                            onClick={() => setCaptureMode('ocr')}
                        >
                            <span>📸 Foto / Arquivo</span>
                            <span className="text-xs font-normal opacity-80">Ler texto automaticamente</span>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-24 text-lg flex flex-col gap-1"
                            onClick={() => { setCaptureMode('manual'); setStep(1); }}
                        >
                            <span>📝 Manualmente</span>
                            <span className="text-xs font-normal opacity-80">Digitar todas as informações</span>
                        </Button>
                    </div>
                </div>
            );
        }

        switch (step) {
            case 1: return <StepTypeSelection formData={formData} updateFormData={updateFormData} onNext={handleNext} />;
            case 2: return <StepBasicInfo formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
            case 3: return <StepDetails formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
            case 4: return <StepReview formData={formData} updateFormData={updateFormData} onBack={handleBack} onSave={handleSave} isSaving={isSaving} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-lg mx-auto pb-20">
            {/* Progress Bar (Optional) */}
            {step > 0 && (
                <div className="mb-6 px-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-in-out"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="p-4">
                {renderStep()}
            </div>
        </div>
    );
};

export default EventWizard;
