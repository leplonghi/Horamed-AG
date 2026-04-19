import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

const Profile = lazy(() => import("@/pages/Profile"));
const ProfileCreate = lazy(() => import("@/pages/ProfileCreate"));
const ProfileEdit = lazy(() => import("@/pages/ProfileEdit"));
const ProfileManage = lazy(() => import("@/pages/ProfileManage"));
const IndiqueGanhe = lazy(() => import("@/pages/IndiqueGanhe"));
const MyProviders = lazy(() => import("@/pages/MyProviders"));
const SubscriptionManagement = lazy(() => import("@/pages/SubscriptionManagement"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));
const SubscriptionCanceled = lazy(() => import("@/pages/SubscriptionCanceled"));
const Plans = lazy(() => import("@/pages/Plans"));
const CaregiverAccept = lazy(() => import("@/pages/CaregiverAccept"));
const MeuProgresso = lazy(() => import("@/pages/MeuProgresso"));
const AnalyticsDetails = lazy(() => import("@/pages/AnalyticsDetails"));

/** Rotas do domínio Perfil / Assinatura / Progresso */
export function PerfilRoutes() {
  return (
    <>
      <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile" element={<Navigate to="/perfil" replace />} />
      <Route path="/perfil/criar" element={<ProtectedRoute><ProfileCreate /></ProtectedRoute>} />
      <Route path="/perfis/novo" element={<ProtectedRoute><ProfileCreate /></ProtectedRoute>} />
      <Route path="/perfis/gerenciar" element={<ProtectedRoute><ProfileManage /></ProtectedRoute>} />
      <Route path="/perfil/editar/:id" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
      <Route path="/perfil/editar" element={<Navigate to="/perfis/gerenciar" replace />} />
      <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
      <Route path="/perfil/indique-e-ganhe" element={<ProtectedRoute><IndiqueGanhe /></ProtectedRoute>} />
      <Route path="/indique-ganhe" element={<Navigate to="/perfil/indique-e-ganhe" replace />} />
      <Route path="/provedores" element={<ProtectedRoute><MyProviders /></ProtectedRoute>} />
      <Route path="/assinatura" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
      <Route path="/assinatura/sucesso" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
      <Route path="/assinatura/cancelado" element={<ProtectedRoute><SubscriptionCanceled /></ProtectedRoute>} />
      <Route path="/planos" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
      <Route path="/cuidador/aceitar/:token" element={<CaregiverAccept />} />
      <Route path="/meu-progresso" element={<ProtectedRoute><MeuProgresso /></ProtectedRoute>} />
      <Route path="/progresso" element={<Navigate to="/meu-progresso" replace />} />
      <Route path="/conquistas" element={<Navigate to="/meu-progresso?tab=achievements" replace />} />
      <Route path="/jornada" element={<Navigate to="/meu-progresso?tab=jornada" replace />} />
      <Route path="/recompensas" element={<Navigate to="/meu-progresso?tab=achievements" replace />} />
      <Route path="/historico" element={<Navigate to="/meu-progresso?tab=historico" replace />} />
      <Route path="/evolucao" element={<Navigate to="/meu-progresso" replace />} />
      <Route path="/progresso/detalhes" element={<ProtectedRoute><AnalyticsDetails /></ProtectedRoute>} />
      <Route path="/analise-detalhada" element={<Navigate to="/progresso/detalhes" replace />} />
      <Route path="/dashboard-saude" element={<Navigate to="/meu-progresso" replace />} />
      <Route path="/health" element={<Navigate to="/meu-progresso" replace />} />
    </>
  );
}
