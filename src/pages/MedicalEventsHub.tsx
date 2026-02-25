import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';
import HealthServiceFinder from '@/components/health/HealthServiceFinder';
import { useMedicalEvents } from '@/hooks/useMedicalEvents';
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

/**
 * Medical Events Hub - Main page for managing consultations and exams
 * Phase 1: Basic structure and navigation
 */
const MedicalEventsHub = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const { stats, events, isLoading } = useMedicalEvents();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <>
            <Helmet>
                <title>{t('medicalEvents.title')} - HoraMed</title>
                <meta name="description" content={t('medicalEvents.description')} />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
                {/* Header */}
                <div className="bg-primary text-primary-foreground">
                    <div className="container max-w-4xl mx-auto px-4 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold mb-1">
                                    {t('medicalEvents.title')}
                                </h1>
                                <p className="text-sm opacity-90">
                                    {t('medicalEvents.subtitle')}
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 opacity-80" />
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={t('medicalEvents.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-background/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container max-w-4xl mx-auto px-4 py-6">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <Button
                            onClick={() => navigate('/eventos-medicos/adicionar')}
                            className="h-24 flex flex-col items-center justify-center gap-2"
                            size="lg"
                        >
                            <Plus className="w-6 h-6" />
                            <span className="text-sm font-medium">
                                {t('medicalEvents.addEvent')}
                            </span>
                        </Button>

                        <Button
                            onClick={() => navigate('/eventos-medicos/calendario')}
                            variant="outline"
                            className="h-24 flex flex-col items-center justify-center gap-2"
                            size="lg"
                        >
                            <Calendar className="w-6 h-6" />
                            <span className="text-sm font-medium">
                                {t('medicalEvents.viewCalendar')}
                            </span>
                        </Button>
                    </div>

                    {/* Finder */}
                    <div className="mb-6">
                        <HealthServiceFinder type="lab" />
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary mb-1">{stats?.scheduled || 0}</div>
                            <div className="text-xs text-muted-foreground">
                                {t('medicalEvents.stats.upcoming')}
                            </div>
                        </Card>

                        <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600 mb-1">{stats?.completed || 0}</div>
                            <div className="text-xs text-muted-foreground">
                                {t('medicalEvents.stats.completed')}
                            </div>
                        </Card>

                        <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600 mb-1">{stats?.upcomingThisWeek || 0}</div>
                            <div className="text-xs text-muted-foreground">
                                {t('medicalEvents.stats.thisWeek')}
                            </div>
                        </Card>
                    </div>

                    {/* Events List or Empty State */}
                    {events && events.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Próximos Eventos</h3>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/eventos-medicos/list')}>Ver todos</Button>
                            </div>
                            {events.slice(0, 3).map((event) => (
                                <Card key={event.id} className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/eventos-medicos/${event.id}`)}>
                                    <div className={`p-3 rounded-full ${event.type === 'consultation' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">{event.title}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {event.date?.seconds
                                                ? safeDateParse(event.date).toLocaleDateString()
                                                : 'Data inválida'} • {event.time}
                                        </p>
                                        {event.doctor?.name && <p className="text-xs text-muted-foreground">{event.doctor.name}</p>}
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${event.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                                                event.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {event.status === 'scheduled' ? 'Agendado' : event.status}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <div className="max-w-sm mx-auto">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {t('medicalEvents.emptyState.title')}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    {t('medicalEvents.emptyState.description')}
                                </p>
                                <Button
                                    onClick={() => navigate('/eventos-medicos/adicionar')}
                                    className="gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('medicalEvents.addFirstEvent')}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Info Card */}
                    <Card className="p-4 mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">i</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                    {t('medicalEvents.info.title')}
                                </h4>
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    {t('medicalEvents.info.description')}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default MedicalEventsHub;
