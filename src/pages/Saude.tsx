import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Calendar, FileText, Stethoscope, Brain, ArrowRight, TrendingUp } from "lucide-react";
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
        // These counts are approximate by fetching. 
        // For production scale, aggregation queries or counters are better.
        fetchCollection<any>(`users/${user.uid}/appointments`),
        fetchCollection<any>(`users/${user.uid}/exams`),
        fetchCollection<any>(`users/${user.uid}/healthDocuments`, [
          where('category', '==', 'vaccination')
        ]),
        fetchCollection<any>(`users/${user.uid}/vitals`),

        // Next appointment
        fetchCollection<any>(`users/${user.uid}/appointments`, [
          where('date', '>=', new Date().toISOString()),
          orderBy('date', 'asc'),
          limit(1)
        ]),

        // Last checkup
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
      color: "from-purple-500 to-purple-600",
    },
    {
      title: t('saude.medicalAppointments'),
      description: t('saude.medicalAppointmentsDesc'),
      icon: Stethoscope,
      path: "/consultas",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: t('saude.labExams'),
      description: t('saude.labExamsDesc'),
      icon: FileText,
      path: "/exames",
      color: "from-green-500 to-green-600",
    },
    {
      title: t('saude.healthDashboard'),
      description: t('saude.healthDashboardDesc'),
      icon: TrendingUp,
      path: "/dashboard-saude",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: t('saude.timeline'),
      description: t('saude.timelineDesc'),
      icon: Calendar,
      path: "/linha-do-tempo",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: t('saude.aiAnalysis'),
      description: t('saude.aiAnalysisDesc'),
      icon: Brain,
      path: "/analise-saude",
      color: "from-pink-500 to-pink-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <OceanBackground variant="page" />
      <Header />

      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 page-container relative z-10">
        {/* Hero Header */}
        <PageHeroHeader
          icon={<Activity className="h-6 w-6 text-primary" />}
          title={t('saude.title')}
          subtitle={t('saude.subtitle')}
        />

        {/* Quick Actions */}
        <HealthQuickActions
          onScheduleAppointment={() => navigate('/consultas')}
          onAddExam={() => navigate('/exames')}
          onAddVaccine={() => navigate('/carteira-vacina')}
          onViewTimeline={() => navigate('/linha-do-tempo')}
        />

        {/* Drug Interactions Alert */}
        <DrugInteractionAlert className="w-full" />

        {/* Medical Report Card */}
        <MedicalReportButton variant="card" />

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

        {/* Health Sections Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {healthSections.map((section) => (
            <motion.div key={section.path} variants={itemVariants}>
              <Link to={section.path}>
                <Card className={cn(
                  "group cursor-pointer transition-all duration-300",
                  "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
                  "border border-border/30 shadow-[var(--shadow-glass)]",
                  "hover:shadow-[var(--shadow-glass-hover)] hover:border-border/50 hover:scale-[1.02]"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2.5 rounded-xl bg-gradient-to-br group-hover:scale-110 transition-transform",
                          section.color
                        )}>
                          <section.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{section.title}</CardTitle>
                          <CardDescription className="text-xs mt-0.5 line-clamp-1">
                            {section.description}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <Navigation />
    </div>
  );
}
