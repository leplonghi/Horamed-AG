import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { trackAppOpened } from "@/hooks/useAppMetrics";
import { useDoseGeneration } from "@/hooks/useDoseGeneration";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Index from "@/pages/Index";
import Landing from "@/pages/Landing";

const TodayRedesign = lazy(() => import("@/pages/TodayRedesign"));
const MedicamentosHub = lazy(() => import("@/pages/MedicamentosHub"));
const Progress = lazy(() => import("@/pages/Progress"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const Gamification = lazy(() => import("@/pages/Gamification"));
const Cofre = lazy(() => import("@/pages/Cofre"));
const Profile = lazy(() => import("@/pages/Profile"));
const About = lazy(() => import("@/pages/About"));
const Auth = lazy(() => import("@/pages/Auth"));
const AddItemRedirect = lazy(() => import("@/pages/AddItemRedirect"));
const EditItemRedirect = lazy(() => import("@/pages/EditItemRedirect"));
const StockDetails = lazy(() => import("@/pages/StockDetails"));
const MedicationHistory = lazy(() => import("@/pages/MedicationHistory"));
const AnalyticsDetails = lazy(() => import("@/pages/AnalyticsDetails"));
const Agenda = lazy(() => import("@/pages/Agenda"));
const MedicalAppointments = lazy(() => import("@/pages/MedicalAppointments"));
const TravelMode = lazy(() => import("@/pages/TravelMode"));
const SideEffectsDiary = lazy(() => import("@/pages/SideEffectsDiary"));
const CarteiraVacina = lazy(() => import("@/pages/CarteiraVacina"));
const MedicalReports = lazy(() => import("@/pages/MedicalReports"));
const Charts = lazy(() => import("@/pages/Charts"));
const HealthDashboard = lazy(() => import("@/pages/HealthDashboard"));
const HealthTimeline = lazy(() => import("@/pages/HealthTimeline"));
const HealthAnalysis = lazy(() => import("@/pages/HealthAnalysis"));
const ProfileCreate = lazy(() => import("@/pages/ProfileCreate"));
const ProfileEdit = lazy(() => import("@/pages/ProfileEdit"));
const ProfileManage = lazy(() => import("@/pages/ProfileManage"));
const IndiqueGanhe = lazy(() => import("@/pages/IndiqueGanhe"));
const Recompensas = lazy(() => import("@/pages/Recompensas"));
const WeightHistory = lazy(() => import("@/pages/WeightHistory"));
const SinaisVitais = lazy(() => import("@/pages/SinaisVitais"));
const SubscriptionManagement = lazy(() => import("@/pages/SubscriptionManagement"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));
const SubscriptionCanceled = lazy(() => import("@/pages/SubscriptionCanceled"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const NotificationSetup = lazy(() => import("@/pages/NotificationSetup"));
const DataExport = lazy(() => import("@/pages/DataExport"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Tutorial = lazy(() => import("@/pages/Tutorial"));
const OnboardingFlow = lazy(() => import("@/components/onboarding/OnboardingFlow"));
const QuickOnboarding = lazy(() => import("@/components/onboarding/QuickOnboarding"));
const SimpleOnboarding = lazy(() => import("@/components/onboarding/SimpleOnboarding"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const HelpSupport = lazy(() => import("@/pages/HelpSupport"));
const AlarmSettings = lazy(() => import("@/pages/AlarmSettings"));
const AlarmDiagnostics = lazy(() => import("@/pages/AlarmDiagnostics"));
const Emergency = lazy(() => import("@/pages/Emergency"));
const Plans = lazy(() => import("@/pages/Plans"));
const CofreUpload = lazy(() => import("@/pages/CofreUpload"));
const CofreManualCreate = lazy(() => import("@/pages/CofreManualCreate"));
const CofreDocumentReview = lazy(() => import("@/pages/CofreDocumentReview"));
const CofreDocumentoEdit = lazy(() => import("@/pages/CofreDocumentoEdit"));
const CofreDocumento = lazy(() => import("@/pages/CofreDocumento"));
const CompartilharDocumento = lazy(() => import("@/pages/CompartilharDocumento"));
const DocumentScan = lazy(() => import("@/pages/DocumentScan"));
const More = lazy(() => import("@/pages/More"));
const CaregiverAccept = lazy(() => import("@/pages/CaregiverAccept"));
const ConsultationCardView = lazy(() => import("@/pages/ConsultationCardView"));
const DrugInteractions = lazy(() => import("@/pages/DrugInteractions"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CampaignGenerator = lazy(() => import("@/pages/internal/CampaignGenerator"));
const HealthAIButton = lazy(() => import("@/components/HealthAIButton"));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt"));
const NotificationPermissionPrompt = lazy(
  () => import("@/components/NotificationPermissionPrompt"),
);

const HIDE_NAVIGATION_PATHS = [
  "/auth",
  "/onboarding",
  "/onboarding-rapido",
  "/onboarding-completo",
  "/bem-vindo",
  "/",
];

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
  </div>
);

export default function AppShell() {
  const { requestNotificationPermission } = usePushNotifications();

  useDoseGeneration();

  useEffect(() => {
    trackAppOpened();

    const handleAlarm = (event: Event) => {
      const alarmEvent = event as CustomEvent<{ doseId?: string }>;
      const doseId = alarmEvent.detail?.doseId;

      toast("Hora do Medicamento", {
        description: "Toque para confirmar que tomou",
        action: {
          label: "Ver",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("horamed-action", {
                detail: { doseId, actionId: "open" },
              }),
            );
          },
        },
        duration: 10000,
      });
    };

    window.addEventListener("horamed-alarm", handleAlarm);

    return () => {
      window.removeEventListener("horamed-alarm", handleAlarm);
    };
  }, []);

  const location = useLocation();
  const showNavigation = !HIDE_NAVIGATION_PATHS.includes(location.pathname);

  return (
    <>
      <Toaster />
      <Sonner />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/landing-preview" element={<Landing />} />
          <Route
            path="/splash"
            element={<div className="min-h-screen bg-background" aria-hidden="true" />}
          />

          <Route
            path="/hoje"
            element={
              <ProtectedRoute>
                <TodayRedesign />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rotina"
            element={
              <ProtectedRoute>
                <MedicamentosHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progresso"
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conquistas"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jornada"
            element={
              <ProtectedRoute>
                <Gamification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carteira"
            element={
              <ProtectedRoute>
                <Cofre />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicamentos"
            element={
              <ProtectedRoute>
                <MedicamentosHub />
              </ProtectedRoute>
            }
          />
          <Route path="/saude" element={<Navigate to="/medicamentos" replace />} />

          <Route
            path="/adicionar"
            element={
              <ProtectedRoute>
                <AddItemRedirect />
              </ProtectedRoute>
            }
          />
          <Route path="/adicionar-medicamento" element={<Navigate to="/adicionar" replace />} />
          <Route path="/add" element={<Navigate to="/adicionar" replace />} />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <EditItemRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <ProtectedRoute>
                <MedicamentosHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque/:itemId"
            element={
              <ProtectedRoute>
                <StockDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historico-medicamentos"
            element={
              <ProtectedRoute>
                <MedicationHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicamentos/:id/historico"
            element={
              <ProtectedRoute>
                <MedicationHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progresso/detalhes"
            element={
              <ProtectedRoute>
                <AnalyticsDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/analise-detalhada" element={<Navigate to="/progresso/detalhes" replace />} />

          <Route
            path="/saude/agenda"
            element={
              <ProtectedRoute>
                <Agenda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultas"
            element={
              <ProtectedRoute>
                <MedicalAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viagem"
            element={
              <ProtectedRoute>
                <TravelMode />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diario-efeitos"
            element={
              <ProtectedRoute>
                <SideEffectsDiary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carteira-vacina"
            element={
              <ProtectedRoute>
                <CarteiraVacina />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vacinas"
            element={
              <ProtectedRoute>
                <CarteiraVacina />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exames"
            element={
              <ProtectedRoute>
                <MedicalReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <MedicalReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios-medicos"
            element={
              <ProtectedRoute>
                <MedicalReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/graficos"
            element={
              <ProtectedRoute>
                <Charts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-saude"
            element={
              <ProtectedRoute>
                <HealthDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/linha-do-tempo"
            element={
              <ProtectedRoute>
                <HealthTimeline />
              </ProtectedRoute>
            }
          />
          <Route path="/timeline" element={<Navigate to="/linha-do-tempo" replace />} />
          <Route
            path="/analise-saude"
            element={
              <ProtectedRoute>
                <HealthAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saude/interacoes"
            element={
              <ProtectedRoute>
                <DrugInteractions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interacoes"
            element={
              <ProtectedRoute>
                <DrugInteractions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/perfil/criar"
            element={
              <ProtectedRoute>
                <ProfileCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfis/novo"
            element={
              <ProtectedRoute>
                <ProfileCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfis/gerenciar"
            element={
              <ProtectedRoute>
                <ProfileManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil/editar/:id"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil/indique-e-ganhe"
            element={
              <ProtectedRoute>
                <IndiqueGanhe />
              </ProtectedRoute>
            }
          />
          <Route path="/indique-ganhe" element={<Navigate to="/perfil/indique-e-ganhe" replace />} />
          <Route
            path="/recompensas"
            element={
              <ProtectedRoute>
                <Recompensas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/peso"
            element={
              <ProtectedRoute>
                <WeightHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/peso/historico"
            element={
              <ProtectedRoute>
                <WeightHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sinais-vitais"
            element={
              <ProtectedRoute>
                <SinaisVitais />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assinatura"
            element={
              <ProtectedRoute>
                <SubscriptionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assinatura/sucesso"
            element={
              <ProtectedRoute>
                <SubscriptionSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assinatura/cancelado"
            element={
              <ProtectedRoute>
                <SubscriptionCanceled />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificacoes-config"
            element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            }
          />
          <Route path="/notificacoes" element={<Navigate to="/notificacoes-config" replace />} />
          <Route path="/notificacoes/config" element={<Navigate to="/notificacoes-config" replace />} />
          <Route path="/notificacoes/configurar" element={<Navigate to="/notificacoes-config" replace />} />
          <Route
            path="/configurar-notificacoes"
            element={
              <ProtectedRoute>
                <NotificationSetup />
              </ProtectedRoute>
            }
          />
          <Route path="/configuracoes/notificacoes" element={<Navigate to="/notificacoes-config" replace />} />
          <Route
            path="/exportar"
            element={
              <ProtectedRoute>
                <DataExport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exportar-dados"
            element={
              <ProtectedRoute>
                <DataExport />
              </ProtectedRoute>
            }
          />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/tutorial"
            element={
              <ProtectedRoute>
                <Tutorial />
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<SimpleOnboarding />} />
          <Route path="/onboarding-completo" element={<OnboardingFlow />} />
          <Route path="/onboarding-rapido" element={<QuickOnboarding />} />
          <Route path="/bem-vindo" element={<Welcome />} />
          <Route
            path="/ajuda"
            element={
              <ProtectedRoute>
                <HelpSupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help-support"
            element={
              <ProtectedRoute>
                <HelpSupport />
              </ProtectedRoute>
            }
          />
          <Route path="/sobre" element={<About />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/alarmes"
            element={
              <ProtectedRoute>
                <AlarmSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alarme"
            element={
              <ProtectedRoute>
                <AlarmSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alarmes/diagnostico"
            element={
              <ProtectedRoute>
                <AlarmDiagnostics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergencia"
            element={
              <ProtectedRoute>
                <Emergency />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planos"
            element={
              <ProtectedRoute>
                <Plans />
              </ProtectedRoute>
            }
          />

          <Route
            path="/carteira/upload"
            element={
              <ProtectedRoute>
                <CofreUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carteira/criar-manual"
            element={
              <ProtectedRoute>
                <CofreManualCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carteira/:id/review"
            element={
              <ProtectedRoute>
                <CofreDocumentReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carteira/:id/editar"
            element={
              <ProtectedRoute>
                <CofreDocumentoEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carteira/:id"
            element={
              <ProtectedRoute>
                <CofreDocumento />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carteira/documento/:id"
            element={
              <ProtectedRoute>
                <CofreDocumento />
              </ProtectedRoute>
            }
          />
          <Route path="/compartilhar/:token" element={<CompartilharDocumento />} />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <DocumentScan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/digitalizar"
            element={
              <ProtectedRoute>
                <DocumentScan />
              </ProtectedRoute>
            }
          />

          <Route path="/historico" element={<Navigate to="/historico-medicamentos" replace />} />
          <Route path="/evolucao" element={<Navigate to="/dashboard-saude" replace />} />
          <Route path="/calendario" element={<Navigate to="/hoje" replace />} />
          <Route
            path="/mais"
            element={
              <ProtectedRoute>
                <More />
              </ProtectedRoute>
            }
          />

          <Route
            path="/historico-compartilhado/:token"
            element={<div>Historico Compartilhado</div>}
          />
          <Route path="/cuidador/aceitar/:token" element={<CaregiverAccept />} />
          <Route path="/consulta/:token" element={<ConsultationCardView />} />

          <Route
            path="/internal/campaign-generator"
            element={
              <ProtectedRoute>
                <CampaignGenerator />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showNavigation && <Navigation />}
      <Suspense fallback={null}>
        {showNavigation && <HealthAIButton />}
      </Suspense>
      <Suspense fallback={null}>
        <PWAInstallPrompt />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationPermissionPrompt onRequestPermission={requestNotificationPermission} />
      </Suspense>
    </>
  );
}
