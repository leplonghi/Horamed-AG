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
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import Index from "@/pages/Index";
import Landing from "@/pages/Landing";

// Route domain modules
import { MedicamentosRoutes } from "./routes/MedicamentosRoutes";
import { SaudeRoutes } from "./routes/SaudeRoutes";
import { CarteiraRoutes } from "./routes/CarteiraRoutes";
import { PerfilRoutes } from "./routes/PerfilRoutes";
import { ConfigRoutes } from "./routes/ConfigRoutes";
import PoliticaDePrivacidade from "@/pages/legal/PoliticaDePrivacidade";
import TermosDeUso from "@/pages/legal/TermosDeUso";

// Lazy pages that don't fit a domain module
const Today = lazy(() => import("@/pages/Today"));
const Auth = lazy(() => import("@/pages/Auth"));
const OnboardingFlow = lazy(() => import("@/components/onboarding/OnboardingFlow"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CampaignGenerator = lazy(() => import("@/pages/internal/CampaignGenerator"));

// Global UI overlays (loaded lazily to keep initial bundle small)
const HealthAIButton = lazy(() => import("@/components/HealthAIButton"));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt"));
const AdminFloatingButton = lazy(() => import("@/components/AdminFloatingButton"));
const NotificationPermissionPrompt = lazy(
  () => import("@/components/NotificationPermissionPrompt"),
);

// Paths/prefixes where the bottom Navigation bar is hidden
// (these pages render their own Navigation or have no bottom nav)
const HIDE_NAVIGATION_PATHS = [
  "/auth", "/onboarding", "/onboarding-rapido", "/onboarding-completo", "/bem-vindo", "/",
];
const HIDE_NAVIGATION_PREFIXES = [
  "/estoque", "/historico-medicamentos", "/carteira-vacina", "/vacinas", "/consultas",
  "/eventos-medicos", "/saude/agenda", "/linha-do-tempo", "/perfis", "/recompensas",
  "/notificacoes-config", "/configurar-notificacoes", "/alarmes", "/alarme", "/ajuda",
  "/help-support", "/mais", "/sinais-vitais", "/exportar", "/assinatura", "/tutorial",
  "/privacidade", "/privacy", "/termos", "/terms", "/sobre", "/about", "/graficos",
  "/exames", "/relatorios", "/relatorios-medicos",
];

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
  </div>
);

export default function AppShell() {
  const { requestNotificationPermission } = usePushNotifications();
  const { shouldReduceEffects } = useDeviceCapability();

  useEffect(() => {
    document.documentElement.classList.toggle("performance-mode", shouldReduceEffects);
  }, [shouldReduceEffects]);

  useDoseGeneration();

  useEffect(() => {
    trackAppOpened();

    const handleAlarm = (event: Event) => {
      const { doseId } = (event as CustomEvent<{ doseId?: string }>).detail ?? {};
      toast("Lembrete", {
        description: "Hora de cuidar de você! Toque para registrar.",
        action: {
          label: "Ver",
          onClick: () =>
            window.dispatchEvent(
              new CustomEvent("horamed-action", { detail: { doseId, actionId: "open" } }),
            ),
        },
        duration: 10000,
      });
    };

    window.addEventListener("horamed-alarm", handleAlarm);
    return () => window.removeEventListener("horamed-alarm", handleAlarm);
  }, []);

  const location = useLocation();
  const showNavigation =
    !HIDE_NAVIGATION_PATHS.includes(location.pathname) &&
    !HIDE_NAVIGATION_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    <>
      <Toaster />
      <Sonner />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public / entry routes ── */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/landing-preview" element={<Landing />} />
          <Route path="/splash" element={<div className="min-h-screen bg-background" aria-hidden="true" />} />

          {/* ── Onboarding ── */}
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>} />
          <Route path="/bem-vindo" element={<Navigate to="/onboarding" replace />} />
          <Route path="/welcome" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding-completo" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding-rapido" element={<Navigate to="/onboarding" replace />} />

          {/* ── Core app ── */}
          <Route path="/hoje" element={<ProtectedRoute><Today /></ProtectedRoute>} />
          <Route path="/today" element={<Navigate to="/hoje" replace />} />
          <Route path="/calendario" element={<Navigate to="/hoje" replace />} />
          <Route path="/saude" element={<Navigate to="/dashboard-saude" replace />} />

          {/* ── Domain route modules ── */}
          {MedicamentosRoutes()}
          {SaudeRoutes()}
          {CarteiraRoutes()}
          {PerfilRoutes()}
          {ConfigRoutes()}

          {/* ── Internal / debug ── */}
          <Route
            path="/internal/campaign-generator"
            element={<ProtectedRoute><CampaignGenerator /></ProtectedRoute>}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {showNavigation && <Navigation />}
      <Suspense fallback={null}>
        {showNavigation && <HealthAIButton />}
      </Suspense>
      <Suspense fallback={null}><PWAInstallPrompt /></Suspense>
      <Suspense fallback={null}>
        <NotificationPermissionPrompt onRequestPermission={requestNotificationPermission} />
      </Suspense>
      <Suspense fallback={null}><AdminFloatingButton /></Suspense>
    </>
  );
}
