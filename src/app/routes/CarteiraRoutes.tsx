import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

const Cofre = lazy(() => import("@/pages/Cofre"));
const CofreUpload = lazy(() => import("@/pages/CofreUpload"));
const CofreManualCreate = lazy(() => import("@/pages/CofreManualCreate"));
const CofreDocumentReview = lazy(() => import("@/pages/CofreDocumentReview"));
const CofreDocumentoEdit = lazy(() => import("@/pages/CofreDocumentoEdit"));
const CofreDocumento = lazy(() => import("@/pages/CofreDocumento"));
const CompartilharDocumento = lazy(() => import("@/pages/CompartilharDocumento"));
const DocumentScan = lazy(() => import("@/pages/DocumentScan"));
const HistoricoCompartilhado = lazy(() => import("@/pages/HistoricoCompartilhado"));
const ConsultationCardView = lazy(() => import("@/pages/ConsultationCardView"));

/** Rotas do domínio Carteira de Saúde / Documentos */
export function CarteiraRoutes() {
  return (
    <>
      <Route path="/carteira" element={<ProtectedRoute><Cofre /></ProtectedRoute>} />
      <Route path="/wallet" element={<Navigate to="/carteira" replace />} />
      <Route path="/cofre" element={<Navigate to="/carteira" replace />} />
      <Route path="/carteira/upload" element={<ProtectedRoute><CofreUpload /></ProtectedRoute>} />
      <Route path="/carteira/criar-manual" element={<ProtectedRoute><CofreManualCreate /></ProtectedRoute>} />
      <Route path="/carteira/criar" element={<Navigate to="/carteira/criar-manual" replace />} />
      <Route path="/carteira/:id/review" element={<ProtectedRoute><CofreDocumentReview /></ProtectedRoute>} />
      <Route path="/carteira/:id/editar" element={<ProtectedRoute><CofreDocumentoEdit /></ProtectedRoute>} />
      <Route path="/carteira/documento/:id" element={<ProtectedRoute><CofreDocumento /></ProtectedRoute>} />
      <Route path="/carteira/:id" element={<ProtectedRoute><CofreDocumento /></ProtectedRoute>} />
      <Route path="/compartilhar/:token" element={<CompartilharDocumento />} />
      <Route path="/scan" element={<ProtectedRoute><DocumentScan /></ProtectedRoute>} />
      <Route path="/digitalizar" element={<ProtectedRoute><DocumentScan /></ProtectedRoute>} />
      <Route path="/historico-compartilhado/:token" element={<HistoricoCompartilhado />} />
      <Route path="/consulta/:token" element={<ConsultationCardView />} />
    </>
  );
}
