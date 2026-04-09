import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IconActivity as Activity,
  IconCalendar as Calendar,
  IconFile as FileText,
  IconHealth as Stethoscope,
  IconAI as Brain,
  IconChevronRight as ArrowRight,
  IconTrendingUp as TrendingUp,
  IconClock as Timeline
} from "@/components/icons/HoramedIcons";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { auth, fetchCollection, where, orderBy, limit } from "@/integrations/firebase";
import { motion } from "framer-motion";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import HealthQuickActions from "@/components/health/HealthQuickActions";
import SmartHealthInsights from "@/components/health/SmartHealthInsights";
import HealthStatsGrid from "@/components/health/HealthStatsGrid";
import DrugInteractionAlert from "@/components/health/DrugInteractionAlert";
import MedicalReportButton from "@/components/health/MedicalReportButton";
import OceanBackground from "@/components/ui/OceanBackground";

export default function Saude() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    appointments: 0,
    exams: 0,
    vaccines: 0,
    measurements: 0,
    nextAppointmentDate: undefined as string | undefined,
    lastCheckupDate: undefined as string | undefined
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const [appointmentsRes, examsRes, vaccinesRes, measurementsRes, nextAppointmentRes, lastCheckupRes] = await Promise.all([
        fetchCollection<any>(`users/${user.uid}/appointments`),
        fetchCollection<any>(`users/${user.uid}/exams`),
        fetchCollection<any>(`users/${user.uid}/healthDocuments`, [
          where('category', '==', 'vaccination')
        ]),
        fetchCollection<any>(`users/${user.uid}/vitals`),
        fetchCollection<any>(`users/${user.uid}/appointments`, [
          where('date', '>=', new Date().toISOString()),
          orderBy('date', 'asc'),
          limit(1)
        ]),
        fetchCollection<any>(`users/${user.uid}/appointments`, [
          where('date', '<', new Date().toISOString()),
          orderBy('date', 'desc'),
          limit(1)
        ])
      ]);

      setStats({
        appointments: appointmentsRes.data?.length || 0,
        exams: examsRes.data?.length || 0,
        vaccines: vaccinesRes.data?.length || 0,
        measurements: measurementsRes.data?.length || 0,
        nextAppointmentDate: nextAppointmentRes.data?.[0]?.date,
        lastCheckupDate: lastCheckupRes.data?.[0]?.date
      });
    } catch (error) {
      console.error("Error loading health stats:", error);
    }
  };

  const handleStatClick = (type: string) => {
    const routes: Record<string, string> = {
      appointments: '/consultas',
      exams: '/exames',
      vaccines: '/carteira-vacina',
      measurements: '/dashboard-saude'
    };
    if (routes[type]) {
      navigate(routes[type]);
    }
  };

  const healthSections = [
    {
      title: t('saude.healthAgenda'),
      description: t('saude.healthAgendaDesc'),
      icon: Calendar,
      path: "/saude/agenda",
      gradient: "from-blue-600/20 to-blue-400/10",
      iconColor: "text-blue-500",
    },
    {
      title: t('saude.medicalAppointments'),
      description: t('saude.medicalAppointmentsDesc'),
      icon: Stethoscope,
      path: "/consultas",
      gradient: "from-blue-500/20 to-indigo-400/10",
      iconColor: "text-indigo-500",
    },
    {
      title: t('saude.labExams'),
      description: t('saude.labExamsDesc'),
      icon: FileText,
      path: "/exames",
      gradient: "from-sky-600/20 to-blue-400/10",
      iconColor: "text-sky-500",
    },
    {
      title: t('saude.healthDashboard'),
      description: t('saude.healthDashboardDesc'),
      icon: TrendingUp,
      path: "/dashboard-saude",
      gradient: "from-emerald-600/20 to-blue-400/10",
      iconColor: "text-emerald-500",
    },
    {
      title: t('saude.timeline'),
      description: t('saude.timelineDesc'),
      icon: Timeline,
      path: "/linha-do-tempo",
      gradient: "from-blue-400/20 to-cyan-400/10",
      iconColor: "text-cyan-500",
    },
    {
      title: t('saude.aiAnalysis'),
      description: t('saude.aiAnalysisDesc'),
      icon: Brain,
      path: "/analise-saude",
      gradient: "from-blue-700/20 to-indigo-500/10",
      iconColor: "text-indigo-400",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <OceanBackground variant="page" />
      <Header />

      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-7 page-container relative z-10">
        {/* Hero Header */}
        <PageHeroHeader
          icon={<Activity className="h-6 w-6 text-primary" />}
          title={t('saude.title')}
          subtitle={t('saude.subtitle')}
          badge="Saúde"
        />

        {/* Quick Actions */}
        <div className="relative">
          <HealthQuickActions
            onScheduleAppointment={() => navigate('/consultas')}
            onAddExam={() => navigate('/exames')}
            onAddVaccine={() => navigate('/carteira-vacina')}
            onViewTimeline={() => navigate('/linha-do-tempo')}
          />
        </div>

        {/* Alerts & Focus Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DrugInteractionAlert className="w-full" />
          <MedicalReportButton variant="card" />
        </div>

        {/* Smart Insights */}
        <SmartHealthInsights
          data={{
            appointmentsCount: stats.appointments,
            examsCount: stats.exams,
            vaccinesCount: stats.vaccines,
            nextAppointmentDate: stats.nextAppointmentDate,
            lastCheckupDate: stats.lastCheckupDate
          }}
          onActionClick={(action) => navigate(action)}
        />

        {/* Stats Grid */}
        <HealthStatsGrid
          appointmentsCount={stats.appointments}
          examsCount={stats.exams}
          vaccinesCount={stats.vaccines}
          measurementsCount={stats.measurements}
          onStatClick={handleStatClick}
        />

        {/* Health Sections Grid - Enhanced Premium Style */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">{t('common.explore')}</h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
          >
            {healthSections.map((section) => (
              <motion.div key={section.path} variants={itemVariants}>
                <Link to={section.path}>
                  <div className={cn(
                    "card-interactive h-full group bg-gradient-to-br border-0",
                    section.gradient
                  )}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={cn(
                          "p-2.5 rounded-xl bg-white/10 backdrop-blur-md shadow-sm transition-all duration-500",
                          "group-hover:scale-110 group-hover:bg-white/20",
                          section.iconColor
                        )}>
                          <section.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                            {section.title}
                          </h4>
                          <p className="text-[11px] font-medium text-muted-foreground/70 line-clamp-1 mt-0.5 group-hover:text-muted-foreground transition-colors">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
