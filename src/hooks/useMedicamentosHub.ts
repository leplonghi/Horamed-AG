import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { auth, fetchCollection, updateDocument, where, orderBy, limit, serverTimestamp } from "@/integrations/firebase";
import { toast } from "sonner";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useStockProjection } from "@/hooks/useStockProjection";
import { useTranslation } from "@/contexts/LanguageContext";
import type { MedicationItem } from "@/components/medications/MedicationItemCard";

interface HubDoseDoc { id: string; itemId: string; dueAt: string; status: string; itemName?: string; doseText?: string; }
interface HubMedDoc { id: string; name: string; category: string; isActive: boolean; doseText?: string; profileId?: string; instructions?: string; notes?: string; treatmentStartDate?: string; treatmentEndDate?: string; }
interface HubScheduleDoc { id: string; itemId: string; times: string[]; freqType: string; }
interface HubStockDoc { id: string; itemId: string; currentQty: number; unitLabel?: string; }
export type HistoryDose = HubDoseDoc & { items: { name: string; doseText: string } };

export function useMedicamentosHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { activeProfile } = useUserProfiles();
  const { data: stockProjections, isLoading: stockLoading, refetch: refetchStock } = useStockProjection(activeProfile?.id);
  const [items, setItems] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyDoses, setHistoryDoses] = useState<HistoryDose[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes("/estoque")) return "estoque";
    if (path.includes("/rotina")) return "rotina";
    return searchParams.get("tab") || "rotina";
  };
  const activeSection = getActiveSection();

  const setActiveSection = (section: string) => {
    if (section === "estoque") navigate("/estoque");
    else if (section === "rotina") navigate("/rotina");
    else setSearchParams({ tab: section });
  };

  const fetchItems = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const [medicationsResult, schedulesResult, stockResult] = await Promise.all([
        fetchCollection<HubMedDoc>(`users/${user.uid}/medications`, [where("isActive", "==", true)]),
        fetchCollection<HubScheduleDoc>(`users/${user.uid}/schedules`, []),
        fetchCollection<HubStockDoc>(`users/${user.uid}/stock`, []),
      ]);
      if (medicationsResult.error) throw medicationsResult.error;
      const medications = (medicationsResult.data || []).sort((a, b) => {
        const c = (a.category || "").localeCompare(b.category || "");
        return c !== 0 ? c : (a.name || "").localeCompare(b.name || "");
      });
      const schedulesMap = new Map<string, HubScheduleDoc[]>();
      const stockMap = new Map<string, HubStockDoc[]>();
      (schedulesResult.data || []).forEach((s) => schedulesMap.set(s.itemId, [...(schedulesMap.get(s.itemId) || []), s]));
      (stockResult.data || []).forEach((s) => stockMap.set(s.itemId, [...(stockMap.get(s.itemId) || []), s]));
      setItems(medications.map((item) => ({ ...item, schedules: schedulesMap.get(item.id) || [], stock: stockMap.get(item.id) || [] })) as MedicationItem[]);
    } catch (error) {
      console.error("useMedicamentosHub fetchItems:", error);
      toast.error(t("common.error") + (import.meta.env.DEV ? `: ${(error as Error).message}` : ""));
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await fetchCollection<HubDoseDoc>("dose_instances", [orderBy("dueAt", "desc"), limit(30)]);
      setHistoryDoses((data || []).map((dose) => ({ ...dose, items: { name: dose.itemName || "", doseText: dose.doseText || "" } })));
    } catch (error) {
      console.error("useMedicamentosHub fetchHistory:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateStock = async (stockId: string, newUnitsLeft: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await updateDocument(`users/${user.uid}/stock`, stockId, { currentQty: newUnitsLeft, lastRefillAt: serverTimestamp() });
      const stock = stockProjections?.find((s) => s.id === stockId);
      if (stock && newUnitsLeft > stock.currentQty) {
        const history = [...(stock.consumptionHistory || []), { date: new Date().toISOString(), amount: newUnitsLeft - stock.currentQty, reason: "refill" as const }];
        await updateDocument(`users/${user.uid}/stock`, stockId, { consumptionHistory: history });
      }
      toast.success(t("meds.stockUpdated"));
      refetchStock();
    } catch (error) {
      console.error("useMedicamentosHub updateStock:", error);
      toast.error(t("generic.stockUpdateError"));
    }
  };

  const openDeleteConfirm = (id: string, name: string) => { setItemToDelete({ id, name }); setDeleteConfirmOpen(true); };
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const { error } = await updateDocument(`users/${user.uid}/medications`, itemToDelete.id, { isActive: false });
      if (error) throw error;
      toast.success(t("meds.deleteSuccess"));
      fetchItems();
    } catch (error) {
      console.error("useMedicamentosHub confirmDeleteItem:", error);
      toast.error(t("common.error"));
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (activeSection === "historico" && historyDoses.length === 0) fetchHistory(); }, [activeSection]);

  return { items, loading, historyDoses, historyLoading, stockProjections, stockLoading, activeSection, setActiveSection, wizardOpen, setWizardOpen, showUpgradeModal, setShowUpgradeModal, deleteConfirmOpen, setDeleteConfirmOpen, itemToDelete, openDeleteConfirm, confirmDeleteItem, updateStock, fetchHistory };
}