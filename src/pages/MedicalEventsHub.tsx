import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    IconPlus as Plus,
    IconSearch as Search,
    IconCalendar as Calendar,
    IconChevronRight as ArrowRight,
    IconInfo as Info
} from "@/components/icons/HoramedIcons";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';
import HealthServiceFinder from '@/components/health/HealthServiceFinder';
import { useMedicalEvents } from '@/hooks/useMedicalEvents';
import { safeDateParse } from "@/lib/safeDateUtils";
import OceanBackground from '@/components/ui/OceanBackground';
import PageHeroHeader from '@/components/shared/PageHeroHeader';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

const MedicalEventsHub = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t, language } = useLanguage();
    const dateLocale = language === 'pt' ? ptBR : enUS;
    const [searchQuery, setSearchQuery] = useState('');
    const { stats, events, isLoading } = useMedicalEvents();
    
    const providerIdFilter = searchParams.get('providerId');
    const filteredEvents = events?.filter(event => {
        if (providerIdFilter && event.providerId !== providerIdFilter) return false;
        if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="relative min-h-screen">
            <Helmet>
                <title>{t('medicalEvents.title')} - HoraMed</title>
                <meta name="description" content={t('medicalEvents.description')} />
            </Helmet>

            <OceanBackground variant="page" />
            <Header />

            <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 page-container relative z-10">
                {/* Hero Header */}
                <PageHeroHeader
                    icon={<Calendar className="h-6 w-6 text-primary" />}
                    title={t('medicalEvents.title')}
                    subtitle={t('medicalEvents.subtitle')}
                    action={{
                        label: t('common.add'),
                        icon: <Plus className="h-5 w-5" strokeWidth={3} />,
                        onClick: () => navigate('/eventos-medicos/adicionar'),
                    }}
                />

                {/* Navigation/Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            onClick={() => navigate('/eventos-medicos/adicionar')}
                            className="w-full h-28 sm:h-32 flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-primary text-primary-foreground shadow-glow hover:brightness-110 transition-all border-0"
                        >
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">
                                {t('medicalEvents.addEvent')}
                            </span>
                        </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            onClick={() => navigate('/eventos-medicos/calendario')}
                            variant="outline"
                            className="w-full h-28 sm:h-32 flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-card/40 backdrop-blur-xl border-border/50 shadow-glass hover:bg-card/60 transition-all"
                        >
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                                {t('medicalEvents.viewCalendar')}
                            </span>
                        </Button>
                    </motion.div>
                </div>

                {/* Search Bar - Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={t('medicalEvents.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 shadow-glass focus:shadow-glass-hover transition-all text-foreground placeholder:text-muted-foreground/60"
                    />
                </motion.div>

                {/* Finder Widget */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <HealthServiceFinder type="lab" className="rounded-[2.5rem] overflow-hidden shadow-glass" />
                </motion.div>

                {/* Stats Grid - Premium Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="rounded-[2rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass overflow-hidden group">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="text-3xl font-black text-primary mb-1 group-hover:scale-110 transition-transform italic">
                                {stats?.scheduled || 0}
                            </div>
                            <div className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground/80 tracking-tight">
                                {t('medicalEvents.stats.upcoming')}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass overflow-hidden group">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="text-3xl font-black text-emerald-500 mb-1 group-hover:scale-110 transition-transform italic">
                                {stats?.completed || 0}
                            </div>
                            <div className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground/80 tracking-tight">
                                {t('medicalEvents.stats.completed')}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass overflow-hidden group">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="text-3xl font-black text-amber-500 mb-1 group-hover:scale-110 transition-transform italic">
                                {stats?.upcomingThisWeek || 0}
                            </div>
                            <div className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground/80 tracking-tight">
                                {t('medicalEvents.stats.thisWeek')}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Events List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-black text-xl italic uppercase tracking-tight text-foreground/90">
                            {t('medicalEvents.upcomingEvents') || 'Próximos Eventos'}
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/eventos-medicos/list')}
                            className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-xl"
                        >
                            {t('common.viewAll') || 'Ver todos'}
                        </Button>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 w-full bg-card/20 animate-pulse rounded-[1.5rem]" />
                                ))}
                            </div>
                        ) : filteredEvents && filteredEvents.length > 0 ? (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-3"
                            >
                                {filteredEvents.slice(0, providerIdFilter ? undefined : 3).map((event) => (
                                    <motion.div key={event.id} variants={itemVariants}>
                                        <div
                                            className="card-interactive overflow-hidden cursor-pointer"
                                            onClick={() => navigate(`/eventos-medicos/${event.id}`)}
                                        >
                                            <div className="p-4 flex items-center gap-4">
                                                <div className={cn(
                                                    "p-3.5 rounded-2xl shadow-sm",
                                                    event.type === 'consultation'
                                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                                                )}>
                                                    <Calendar className="w-6 h-6" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-base text-foreground/90 truncate uppercase tracking-tight italic">
                                                        {event.title}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground font-medium">
                                                        <span className="flex items-center gap-1">
                                                            {event.date?.seconds
                                                                ? format(safeDateParse(event.date), "dd MMM", { locale: dateLocale }).toUpperCase()
                                                                : '---'} • {event.time}
                                                        </span>
                                                        {event.doctor?.name && (
                                                            <span className="flex items-center gap-1 before:content-['•'] before:mr-2">
                                                                {event.doctor.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={cn(
                                                        "text-[10px] uppercase font-black px-2.5 py-1 rounded-full",
                                                        event.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            event.status === 'completed' ? 'bg-muted text-muted-foreground' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    )}>
                                                        {event.status === 'scheduled' ? 'Agendado' : event.status}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <Card className="rounded-[2.5rem] border-0 bg-card/40 backdrop-blur-xl shadow-glass overflow-hidden">
                                    <CardContent className="py-12 text-center">
                                        <div className="bg-primary/10 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                            <Calendar className="h-10 w-10 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">
                                            {t('medicalEvents.emptyState.title')}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                                            {t('medicalEvents.emptyState.description')}
                                        </p>
                                        <Button
                                            onClick={() => navigate('/eventos-medicos/adicionar')}
                                            className="gap-2 rounded-2xl h-12 shadow-glow font-bold uppercase tracking-wider"
                                        >
                                            <Plus className="w-5 h-5 stroke-[3]" />
                                            {t('medicalEvents.addFirstEvent')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Info Card - Proactive Style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="overflow-hidden border-0 bg-blue-500/10 backdrop-blur-xl rounded-[2rem] shadow-glass border-l-4 border-blue-500">
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <div className="p-3 bg-blue-500 rounded-2xl shrink-0 h-fit shadow-glow-blue">
                                    <Info className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-black italic uppercase tracking-tight text-blue-900 dark:text-blue-100 mb-1">
                                        {t('medicalEvents.info.title')}
                                    </h4>
                                    <p className="text-sm font-medium text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                        {t('medicalEvents.info.description')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>

            <Navigation />
        </div>
    );
};

export default MedicalEventsHub;
