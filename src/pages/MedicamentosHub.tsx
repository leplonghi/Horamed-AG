import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IconPill as Pill, IconPlus as Plus, IconHistory as History, IconArchive as Package } from "@/components/icons/HoramedIcons";
import Header from "@/components/Header";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";
import { useTranslation } from "@/contexts/LanguageContext";
import OceanBackground from "@/components/ui/OceanBackground";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RoutineTab } from "@/components/medications/RoutineTab";
import { StockTab } from "@/components/medications/StockTab";
import { HistoryTab } from "@/components/medications/HistoryTab";
import { useMedicamentosHub } from "@/hooks/useMedicamentosHub";

export default function MedicamentosHub() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    items, loading,
    historyDoses, historyLoading,
    stockProjections, stockLoading,
    activeSection, setActiveSection,
    wizardOpen, setWizardOpen,
    showUpgradeModal, setShowUpgradeModal,
    deleteConfirmOpen, setDeleteConfirmOpen,
    itemToDelete, openDeleteConfirm, confirmDeleteItem,
    updateStock, fetchHistory,
  } = useMedicamentosHub();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <OceanBackground variant="page" />
        <Header />
        <div className="pt-20 p-6 pb-24 relative z-10">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 w-48 skeleton rounded-lg" />
            <ListSkeleton count={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <OceanBackground variant="page" />
      <Header />
      <div className="page-container relative z-10 px-3 sm:px-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between py-2 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-primary/10 backdrop-blur-md rounded-2xl border border-primary/20 shadow-glass">
                <Pill className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t("meds.title")}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t("meds.manageDesc")}</p>
              </div>
            </div>
            <Button size="lg" className="rounded-2xl gap-2 shadow-glow bg-primary text-primary-foreground hover:brightness-110 font-bold transition-all active:scale-95 px-4 sm:px-6" onClick={() => setWizardOpen(true)}>
              <Plus className="h-5 w-5 stroke-[3]" />
              <span className="hidden sm:inline">{t("common.add")}</span>
            </Button>
          </div>

          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-14 p-1 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-glass gap-1 sm:gap-2">
              <TabsTrigger value="rotina" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow flex items-center justify-center gap-1 sm:gap-2 transition-all font-semibold px-1 sm:px-3 overflow-hidden">
                <Pill className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-[11px] sm:text-sm truncate max-w-full">{t("meds.myMeds")}</span>
              </TabsTrigger>
              <TabsTrigger value="estoque" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow flex items-center justify-center gap-1 sm:gap-2 transition-all font-semibold px-1 sm:px-3 overflow-hidden">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-[11px] sm:text-sm truncate max-w-full">{t("meds.stock")}</span>
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow flex items-center justify-center gap-1 sm:gap-2 transition-all font-semibold px-1 sm:px-3 overflow-hidden">
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-[11px] sm:text-sm truncate max-w-full">{t("meds.history")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rotina" className="mt-6">
              <RoutineTab items={items} searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeTab={activeTab} setActiveTab={setActiveTab} onEdit={(id) => navigate(`/adicionar?edit=${id}`)} onDelete={openDeleteConfirm} onAdd={() => setWizardOpen(true)} />
            </TabsContent>
            <TabsContent value="estoque" className="mt-6">
              <StockTab stockProjections={stockProjections} isLoading={stockLoading} onUpdateStock={updateStock} onNavigateToRoutine={() => setActiveSection("rotina")} />
            </TabsContent>
            <TabsContent value="historico" className="mt-6">
              <HistoryTab doses={historyDoses} isLoading={historyLoading} onRefresh={fetchHistory} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MedicationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>{t("meds.deleteConfirm", { name: itemToDelete?.name || "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}