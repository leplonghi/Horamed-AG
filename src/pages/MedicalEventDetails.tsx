
import { useParams, useNavigate } from 'react-router-dom';
import { useMedicalEvent, useMedicalEvents } from '@/hooks/useMedicalEvents';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, FileText, MapPin, User, Clock, Check, Trash2, Bell, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

/**
 * Page for viewing details of a specific medical event
 */
const MedicalEventDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const { event, isLoading } = useMedicalEvent(id);
    const { deleteEvent, updateEvent } = useMedicalEvents();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-xl font-bold mb-4">{t('search.noResults')}</p>
                <Button onClick={() => navigate('/eventos-medicos')}>{t('common.back')}</Button>
            </div>
        );
    }

    const handleDelete = async () => {
        if (confirm(t('common.areYouSure'))) {
            await deleteEvent(id!);
            toast.success(t('common.deleted'));
            navigate('/eventos-medicos');
        }
    };

    const handleComplete = async () => {
        // Simple completion for now
        if (confirm(t('common.areYouSure'))) {
            // We would need an update function exposed specifically for status or modify the type
            // leveraging updateEvent that uses updateMedicalEvent under the hood
            await updateEvent({ id: id!, data: {} }); // Need to fix this in lib to accept status update via updateEvent or expose updateStatus
            // For now just toast
            toast.info("Funcionalidade de conclusão em desenvolvimento");
        }
    };

    const formattedDate = event.date?.seconds
        ? format(safeDateParse(event.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
        : 'Data inválida';

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 w-full shadow-md">
                <div className="flex items-center gap-2 mb-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="text-white hover:bg-white/20"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold truncate pr-4">{event.title}</h1>
                </div>
            </div>

            <div className="container max-w-lg mx-auto p-4 space-y-6">

                {/* Status Badge */}
                <div className="flex justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${event.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                        event.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {event.status === 'scheduled' ? 'Agendado' :
                            event.status === 'completed' ? 'Realizado' :
                                event.status === 'missed' ? 'Não Compareceu' : 'Cancelado'}
                    </span>
                </div>

                {/* Main Info Card */}
                <Card className="p-6 space-y-4 shadow-sm border-l-4 border-l-primary">
                    <div className="flex items-start gap-4">
                        <Calendar className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <p className="text-sm text-muted-foreground">Data</p>
                            <p className="font-semibold text-lg capitalize">{formattedDate}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <Clock className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <p className="text-sm text-muted-foreground">Horário</p>
                            <p className="font-semibold text-lg">{event.time}</p>
                        </div>
                    </div>

                    {event.location && (event.location.name || event.location.address) && (
                        <div className="flex items-start gap-4">
                            <MapPin className="w-6 h-6 text-primary mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Local</p>
                                <p className="font-semibold">{event.location.name}</p>
                                <p className="text-sm text-muted-foreground">{event.location.address}</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Professional Info */}
                {event.doctor && (event.doctor.name || event.doctor.specialty) && (
                    <Card className="p-6 space-y-4 shadow-sm">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> Profissional
                        </h3>
                        <div>
                            <p className="text-lg font-medium">{event.doctor.name}</p>
                            <p className="text-muted-foreground">{event.doctor.specialty}</p>
                            {event.doctor.crm && <p className="text-xs text-muted-foreground mt-1">CRM: {event.doctor.crm}</p>}
                        </div>
                    </Card>
                )}

                {/* Preparation / Instructions */}
                {event.type === 'exam' && event.preparation && (
                    <Card className="p-6 space-y-4 shadow-sm bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
                            <AlertTriangle className="w-5 h-5" /> Preparo
                        </h3>
                        <div className="space-y-2">
                            {event.preparation.fasting && (
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                                    Jejum necessário
                                </div>
                            )}
                            {event.preparation.instructions?.map((inst, i) => (
                                <p key={i} className="text-sm text-muted-foreground">• {inst}</p>
                            ))}
                            {!event.preparation.fasting && (!event.preparation.instructions || event.preparation.instructions.length === 0) && (
                                <p className="text-sm text-muted-foreground italic">Nenhuma instrução específica.</p>
                            )}
                        </div>
                    </Card>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </Button>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleComplete}>
                        <Check className="w-4 h-4 mr-2" /> Concluir
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default MedicalEventDetails;
