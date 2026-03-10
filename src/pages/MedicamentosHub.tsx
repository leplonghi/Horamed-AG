import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { auth, fetchCollection, updateDocument, deleteDocument, where, orderBy, limit, serverTimestamp } from "@/integrations/firebase";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  IconPill as Pill,
  IconPlus as Plus,
  IconHistory as History,
  IconArchive as Package
} from "@/components/icons/HoramedIcons";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useStockProjection } from "@/hooks/useStockProjection";
import { useTranslation } from "@/contexts/LanguageContext";
import OceanBackground from "@/components/ui/OceanBackground";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Sub-components
import { RoutineTab } from "@/components/medications/RoutineTab";
import { StockTab } from "@/components/medications/StockTab";
import { HistoryTab } from "@/components/medications/HistoryTab";
import { MedicationItem } from "@/components/medications/MedicationItemCard";

interface HubDoseDoc {
  id: string;
  itemId: string;
  dueAt: string;
  status: string;
  itemName?: string;
  doseText?: string;
}

interface HubMedDoc {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  doseText?: string;
  profileId?: string;
  instructions?: string;
  notes?: string;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
}

interface HubScheduleDoc {
  id: string;
  itemId: string;
  times: string[];
  freqType: string;
}

interface HubStockDoc {
  id: string;
  itemId: string;
  currentQty: number;
  unitLabel?: string;
}

export default function MedicamentosHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  // Rotina state
  const [items, setItems] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  // Stock state
  const { isEnabled } = useFeatureFlags();
  const { activeProfile } = useUserProfiles();
  const { data: stockProjections, isLoading: stockLoading, refetch: refetchStock } = useStockProjection(activeProfile?.id);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  // History state
  const [historyDoses, setHistoryDoses] = useState<Array<HubDoseDoc & { items: { name: string; doseText: string } }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Logic to determine active tab based on URL path priority
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/estoque")) return "estoque";
    if (path.includes("/rotina")) return "rotina";
    return searchParams.get("tab") || "rotina";
  };

  const activeSection = getActiveTab();

  const setActiveSection = (section: string) => {
    if (section === "estoque") {
      navigate("/estoque");
    } else if (section === "rotina") {
      navigate("/rotina");
    } else {
      setSearchParams({ tab: section });
    }
  };


  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (activeSection === 'historico' && historyDoses.length === 0) {
      fetchHistory();
    }
  }, [activeSection]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;
      const profileId = activeProfile?.id;

      const dosesPath = profileId
        ? `users/${userId}/profiles/${profileId}/doses`
        : `users/${userId}/doses`;

      const { data: dosesData } = await fetchCollection<HubDoseDoc>(
        dosesPath,
        [orderBy('dueAt', 'desc'), limit(30)]
      );

      // Join with items info for the timeline (to match DoseTimeline expected format)
      // Usually Firebase doses have itemName and doseText, but let's ensure the items sub-object exists
      const formattedHistory = (dosesData || []).map(dose => ({
        ...dose,
        items: {
          name: dose.itemName || '',
          doseText: dose.doseText || ''
        }
      }));

      setHistoryDoses(formattedHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Batch query optimization: fetch all data in parallel
      const [medicationsResult, schedulesResult, stockResult] = await Promise.all([
        fetchCollection<HubMedDoc>(
          `users/${user.uid}/medications`,
          [where('isActive', '==', true)]
        ),
        fetchCollection<HubScheduleDoc>(`users/${user.uid}/schedules`, []),
        fetchCollection<HubStockDoc>(`users/${user.uid}/stock`, [])
      ]);

      if (medicationsResult.error) throw medicationsResult.error;

      // Client-side sort to avoid composite index requirement
      const medications = (medicationsResult.data || []).sort((a, b) => {
        const catCompare = (a.category || '').localeCompare(b.category || '');
        if (catCompare !== 0) return catCompare;
        return (a.name || '').localeCompare(b.name || '');
      });
      const allSchedules = schedulesResult.data || [];
      const allStock = stockResult.data || [];

      // Create lookup maps for O(1) access
      const schedulesMap = new Map<string, HubScheduleDoc[]>();
      const stockMap = new Map<string, HubStockDoc[]>();

      allSchedules.forEach((schedule) => {
        if (!schedulesMap.has(schedule.itemId)) {
          schedulesMap.set(schedule.itemId, []);
        }
        schedulesMap.get(schedule.itemId)!.push(schedule);
      });

      allStock.forEach((stockItem) => {
        if (!stockMap.has(stockItem.itemId)) {
          stockMap.set(stockItem.itemId, []);
        }
        stockMap.get(stockItem.itemId)!.push(stockItem);
      });

      // Join data efficiently
      const fullData = medications.map((item) => ({
        ...item,
        schedules: schedulesMap.get(item.id) || [],
        stock: stockMap.get(item.id) || []
      }));

      setItems(fullData as MedicationItem[]);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error(t('common.error') + (import.meta.env.DEV ? `: ${(error as Error).message}` : ''));
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Soft delete in Firebase as per Medications.tsx pattern
      const { error } = await updateDocument(
        `users/${user.uid}/medications`,
        itemToDelete.id,
        { isActive: false }
      );

      if (error) throw error;
      toast.success(t('meds.deleteSuccess'));
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(t('common.error'));
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // Stock functions
  const updateStock = async (stockId: string, newUnitsLeft: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { error } = await updateDocument(
        `users/${user.uid}/stock`,
        stockId,
        {
          currentQty: newUnitsLeft,
          lastRefillAt: serverTimestamp(),
        }
      );

      if (error) throw error;

      const stock = stockProjections?.find(s => s.id === stockId);
      if (stock && newUnitsLeft > stock.currentQty) {
        const history = [...(stock.consumptionHistory || []), {
          date: new Date().toISOString(),
          amount: newUnitsLeft - stock.currentQty,
          reason: 'refill' as const,
        }] as any;

        await updateDocument(
          `users/${user.uid}/stock`,
          stockId,
          { consumptionHistory: history }
        );
      }

      toast.success(t('meds.stockUpdated'));
      refetchStock();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error(t('generic.stockUpdateError'));
    }
  };



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
        <Navigation />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <OceanBackground variant="page" />
      <Header />

      <div className="page-container relative z-10 px-3 sm:px-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          {/* Main Info Header */}
          <div className="flex items-center justify-between py-2 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-primary/10 backdrop-blur-md rounded-2xl border border-primary/20 shadow-glass">
                <Pill className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {t('meds.title')}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {t('meds.manageDesc')}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="rounded-2xl gap-2 shadow-glow bg-primary text-primary-foreground hover:brightness-110 font-bold transition-all active:scale-95 px-4 sm:px-6"
              onClick={() => setWizardOpen(true)}
            >
              <Plus className="h-5 w-5 stroke-[3]" />
              <span className="hidden sm:inline">{t('common.add')}</span>
            </Button>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-14 p-1.5 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-glass gap-2">
              <TabsTrigger
                value="rotina"
                className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow flex items-center justify-center gap-2 transition-all font-semibold"
              >
                <Pill className="h-4 w-4" />
                <span className="text-[13px] sm:text-sm">{t('meds.myMeds')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="estoque"
                className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow flex items-center justify-center gap-2 transition-all font-semibold"
              >
                <Package className="h-4 w-4" />
                <span className="text-[13px] sm:text-sm">{t('meds.stock')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="historico"
                className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow flex items-center justify-center gap-2 transition-all font-semibold"
              >
                <History className="h-4 w-4" />
                <span className="text-[13px] sm:text-sm">{t('meds.history')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rotina" className="mt-6">
              <RoutineTab
                items={items}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onEdit={(id) => navigate(`/adicionar?edit=${id}`)}
                onDelete={openDeleteConfirm}
                onAdd={() => setWizardOpen(true)}
              />
            </TabsContent>

            <TabsContent value="estoque" className="mt-6">
              <StockTab
                stockProjections={stockProjections}
                isLoading={stockLoading}
                onUpdateStock={updateStock}
                onNavigateToRoutine={() => setActiveSection("rotina")}
              />
            </TabsContent>

            <TabsContent value="historico" className="mt-6">
              <HistoryTab doses={historyDoses} isLoading={historyLoading} onRefresh={fetchHistory} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Navigation />

      <MedicationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('meds.deleteConfirm', { name: itemToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
