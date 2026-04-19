import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const NotificationSetup = lazy(() => import("@/pages/NotificationSetup"));
const AlarmSettings = lazy(() => import("@/pages/AlarmSettings"));
const AlarmDiagnostics = lazy(() => import("@/pages/AlarmDiagnostics"));
const PerformanceSettings = lazy(() => import("@/pages/PerformanceSettings"));
const DataExport = lazy(() => import("@/pages/DataExport"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Tutorial = lazy(() => import("@/pages/Tutorial"));
const HelpSupport = lazy(() => import("@/pages/HelpSupport"));
const About = lazy(() => import("@/pages/About"));
const More = lazy(() => import("@/pages/More"));
const Pharmacy = lazy(() => import("@/pages/Pharmacy"));

/** Rotas do domínio Configurações / Ajuda / Legal */
export function ConfigRoutes() {
  return (
    <>
      <Route path="/notificacoes-config" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/notifications" element={<Navigate to="/notificacoes-config" replace />} />
      <Route path="/notificacoes" element={<Navigate to="/notificacoes-config" replace />} />
      <Route path="/notificacoes/config" element={<Navigate to="/notificacoes-config" replace />} />
      <Route path="/notificacoes/configurar" element={<Navigate to="/notificacoes-config" replace />} />
      <Route path="/configuracoes/notificacoes" element={<Navigate to="/notificacoes-config" replace />} />
      <Route path="/configurar-notificacoes" element={<ProtectedRoute><NotificationSetup /></ProtectedRoute>} />
      <Route path="/alarmes" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
      <Route path="/alarme" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
      <Route path="/alarmes/diagnostico" element={<ProtectedRoute><AlarmDiagnostics /></ProtectedRoute>} />
      <Route path="/desempenho" element={<ProtectedRoute><PerformanceSettings /></ProtectedRoute>} />
      <Route path="/exportar" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
      <Route path="/exportar-dados" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
      <Route path="/ajuda" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
      <Route path="/support" element={<Navigate to="/ajuda" replace />} />
      <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
      <Route path="/sobre" element={<About />} />
      <Route path="/about" element={<About />} />
      <Route path="/mais" element={<ProtectedRoute><More /></ProtectedRoute>} />
      <Route path="/farmacia" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
      <Route path="/pharmacy" element={<Navigate to="/farmacia" replace />} />
    </>
  );
}
