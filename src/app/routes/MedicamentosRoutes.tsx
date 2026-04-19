import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

const MedicamentosHub = lazy(() => import("@/pages/MedicamentosHub"));
const StockDetails = lazy(() => import("@/pages/StockDetails"));
const MedicationHistory = lazy(() => import("@/pages/MedicationHistory"));
const AddItemRedirect = lazy(() => import("@/pages/AddItemRedirect"));
const EditItemRedirect = lazy(() => import("@/pages/EditItemRedirect"));
const DrugInteractions = lazy(() => import("@/pages/DrugInteractions"));

/** Rotas do domínio Medicamentos/Estoque/Histórico */
export function MedicamentosRoutes() {
  return (
    <>
      <Route path="/rotina" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
      <Route path="/medicamentos" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
      <Route path="/medications" element={<Navigate to="/medicamentos" replace />} />
      <Route path="/estoque" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
      <Route path="/estoque/:itemId" element={<ProtectedRoute><StockDetails /></ProtectedRoute>} />
      <Route path="/historico-medicamentos" element={<ProtectedRoute><MedicationHistory /></ProtectedRoute>} />
      <Route path="/medicamentos/:id/historico" element={<ProtectedRoute><MedicationHistory /></ProtectedRoute>} />
      <Route path="/adicionar" element={<ProtectedRoute><AddItemRedirect /></ProtectedRoute>} />
      <Route path="/adicionar-medicamento" element={<Navigate to="/adicionar" replace />} />
      <Route path="/add" element={<Navigate to="/adicionar" replace />} />
      <Route path="/edit/:id" element={<ProtectedRoute><EditItemRedirect /></ProtectedRoute>} />
      <Route path="/saude/interacoes" element={<ProtectedRoute><DrugInteractions /></ProtectedRoute>} />
      <Route path="/interacoes" element={<ProtectedRoute><DrugInteractions /></ProtectedRoute>} />
    </>
  );
}
