import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import EventWizard from '@/components/medical-events/wizard/EventWizard';

const MedicalEventAdd = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useLanguage();
    
    const providerId = searchParams.get('providerId') || undefined;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 w-full">
                <div className="flex items-center gap-2 mb-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="text-white hover:bg-white/20"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold">{t('medicalEvents.addEvent')}</h1>
                </div>
            </div>

            <EventWizard initialProviderId={providerId} />
        </div>
    );
};

export default MedicalEventAdd;
