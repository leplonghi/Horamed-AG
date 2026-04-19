import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

const Agenda = lazy(() => import("@/pages/Agenda"));
const MedicalAppointments = lazy(() => import("@/pages/MedicalAppointments"));
const MedicalEventsHub = lazy(() => import("@/pages/MedicalEventsHub"));
const MedicalEventAdd = lazy(() => import("@/pages/MedicalEventAdd"));
const MedicalEventsCalendar = lazy(() => import("@/pages/MedicalEventsCalendar"));
const MedicalEventDetails = lazy(() => import("@/pages/MedicalEventDetails"));
const TravelMode = lazy(() => import("@/pages/TravelMode"));
const SideEffectsDiary = lazy(() => import("@/pages/SideEffectsDiary"));
const CarteiraVacina = lazy(() => import("@/pages/CarteiraVacina"));
const MedicalReports = lazy(() => import("@/pages/MedicalReports"));
const Charts = lazy(() => import("@/pages/Charts"));
const HealthTimeline = lazy(() => import("@/pages/HealthTimeline"));
const HealthAnalysis = lazy(() => import("@/pages/HealthAnalysis"));
const WeightHistory = lazy(() => import("@/pages/WeightHistory"));
const SinaisVitais = lazy(() => import("@/pages/SinaisVitais"));
const Emergency = lazy(() => import("@/pages/Emergency"));

/** Rotas do domínio Saúde (eventos, vacinas, sinais vitais, análises) */
export function SaudeRoutes() {
  return (
    <>
      <Route path="/saude/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
      <Route path="/agenda" element={<Navigate to="/saude/agenda" replace />} />
      <Route path="/consultas" element={<ProtectedRoute><MedicalAppointments /></ProtectedRoute>} />
      <Route path="/eventos-medicos" element={<ProtectedRoute><MedicalEventsHub /></ProtectedRoute>} />
      <Route path="/events" element={<Navigate to="/eventos-medicos" replace />} />
      <Route path="/eventos-medicos/adicionar" element={<ProtectedRoute><MedicalEventAdd /></ProtectedRoute>} />
      <Route path="/eventos-medicos/calendario" element={<ProtectedRoute><MedicalEventsCalendar /></ProtectedRoute>} />
      <Route path="/eventos-medicos/list" element={<Navigate to="/eventos-medicos" replace />} />
      <Route path="/eventos-medicos/:id" element={<ProtectedRoute><MedicalEventDetails /></ProtectedRoute>} />
      <Route path="/viagem" element={<ProtectedRoute><TravelMode /></ProtectedRoute>} />
      <Route path="/diario-efeitos" element={<ProtectedRoute><SideEffectsDiary /></ProtectedRoute>} />
      <Route path="/carteira-vacina" element={<ProtectedRoute><CarteiraVacina /></ProtectedRoute>} />
      <Route path="/vacinas" element={<ProtectedRoute><CarteiraVacina /></ProtectedRoute>} />
      <Route path="/exames" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
      <Route path="/reports" element={<Navigate to="/relatorios" replace />} />
      <Route path="/relatorios-medicos" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
      <Route path="/graficos" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
      <Route path="/linha-do-tempo" element={<ProtectedRoute><HealthTimeline /></ProtectedRoute>} />
      <Route path="/timeline" element={<Navigate to="/linha-do-tempo" replace />} />
      <Route path="/analise-saude" element={<ProtectedRoute><HealthAnalysis /></ProtectedRoute>} />
      <Route path="/peso" element={<ProtectedRoute><WeightHistory /></ProtectedRoute>} />
      <Route path="/peso/historico" element={<ProtectedRoute><WeightHistory /></ProtectedRoute>} />
      <Route path="/sinais-vitais" element={<ProtectedRoute><SinaisVitais /></ProtectedRoute>} />
      <Route path="/emergencia" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
    </>
  );
}
