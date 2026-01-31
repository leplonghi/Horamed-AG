import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { auth, fetchCollection, updateDocument, deleteDocument, where, orderBy, limit, serverTimestamp } from "@/integrations/firebase";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pill, Package, History } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";
import { getRecommendations } from "@/lib/affiliateEngine";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useStockProjection } from "@/hooks/useStockProjection";
import { useTranslation } from "@/contexts/LanguageContext";
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
  const { hasFeature } = useSubscription();
  const [affiliateProduct, setAffiliateProduct] = useState<any>(null);
  const [showAffiliateCard, setShowAffiliateCard] = useState(false);

  // Stock state
  const { isEnabled } = useFeatureFlags();
  const { activeProfile } = useUserProfiles();
  const { data: stockProjections, isLoading: stockLoading, refetch: refetchStock } = useStockProjection(activeProfile?.id);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  // History state
  const [historyDoses, setHistoryDoses] = useState<any[]>([]);
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
    const hasSupplements = items.some(item =>
      item.category === 'vitamina' || item.category === 'suplemento'
    );

    if (hasSupplements) {
      const product = getRecommendations({
        type: "MEDICATION_LIST",
        hasSupplements: true
      });
      if (product) {
        setAffiliateProduct(product);
        setShowAffiliateCard(true);
      }
    }
  }, [items]);

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

      const { data: dosesData } = await fetchCollection<any>(
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
        fetchCollection<any>(
          `users/${user.uid}/medications`,
          [where('isActive', '==', true)]
        ),
        fetchCollection<any>(`users/${user.uid}/schedules`, []),
        fetchCollection<any>(`users/${user.uid}/stock`, [])
      ]);

      if (medicationsResult.error) throw medicationsResult.error;

      // Client-side sort to avoid composite index requirement
      const medications = (medicationsResult.data || []).sort((a: any, b: any) => {
        const catCompare = (a.category || '').localeCompare(b.category || '');
        if (catCompare !== 0) return catCompare;
        return (a.name || '').localeCompare(b.name || '');
      });
      const allSchedules = schedulesResult.data || [];
      const allStock = stockResult.data || [];

      // Create lookup maps for O(1) access
      const schedulesMap = new Map<string, any[]>();
      const stockMap = new Map<string, any[]>();

      allSchedules.forEach((schedule: any) => {
        if (!schedulesMap.has(schedule.itemId)) {
          schedulesMap.set(schedule.itemId, []);
        }
        schedulesMap.get(schedule.itemId)!.push(schedule);
      });

      allStock.forEach((stockItem: any) => {
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

  const handleRestock = async (itemId: string, itemName: string) => {
    try {
      const affiliateClick = httpsCallable(functions, 'affiliateClick'); // changed to camelCase name
      const result = await affiliateClick({
        medicationId: itemId,
        medicationName: itemName
      });

      const data = result.data as any;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success(t('generic.openedNewTab'));
      }
    } catch (error) {
      console.error('Error handling restock:', error);
      toast.error(t('generic.openLinkError'));
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-subtle pt-20 p-6 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 w-48 skeleton rounded-lg" />
            <ListSkeleton count={5} />
          </div>
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-subtle page-container px-3 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6">
          {/* Header - Compact for mobile */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground/90">
                  {t('meds.title')}
                </h2>
                <p className="text-xs text-muted-foreground hidden sm:block font-medium">
                  {t('meds.manageDesc')}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-xl hover-lift gap-1.5 shadow-lg h-10 px-4 bg-gradient-to-br from-primary to-blue-600 text-white hover:brightness-110 font-bold tracking-wide transition-all border border-white/10 shadow-primary/25"
              onClick={() => setWizardOpen(true)}
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">{t('common.add')}</span>
            </Button>
          </div>

          {/* Section Tabs - Compact horizontal for mobile */}
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-10 sm:h-auto p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-muted/60 backdrop-blur-sm gap-0.5 sm:gap-1">
              <TabsTrigger
                value="rotina"
                className="rounded-lg sm:rounded-xl py-1.5 sm:py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center sm:flex-col justify-center gap-1.5 sm:gap-1 transition-all"
              >
                <Pill className="h-4 w-4 text-primary" />
                <span className="text-[11px] sm:text-xs font-medium">{t('meds.myMeds')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="estoque"
                className="rounded-lg sm:rounded-xl py-1.5 sm:py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center sm:flex-col justify-center gap-1.5 sm:gap-1 transition-all"
              >
                <Package className="h-4 w-4 text-amber-600" />
                <span className="text-[11px] sm:text-xs font-medium">{t('meds.stock')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="historico"
                className="rounded-lg sm:rounded-xl py-1.5 sm:py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center sm:flex-col justify-center gap-1.5 sm:gap-1 transition-all"
              >
                <History className="h-4 w-4 text-purple-600" />
                <span className="text-[11px] sm:text-xs font-medium">{t('meds.history')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rotina">
              <RoutineTab
                items={items}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onEdit={(id) => navigate(`/adicionar?edit=${id}`)}
                onDelete={openDeleteConfirm}
                showAffiliateCard={showAffiliateCard}
                setShowAffiliateCard={setShowAffiliateCard}
                affiliateProduct={affiliateProduct}
                onAdd={() => setWizardOpen(true)}
              />
            </TabsContent>

            <TabsContent value="estoque">
              <StockTab
                stockProjections={stockProjections}
                isLoading={stockLoading}
                onRestock={handleRestock}
                onUpdateStock={updateStock}
                onNavigateToRoutine={() => setActiveSection("rotina")}
                affiliateEnabled={!!isEnabled('affiliate')}
              />
            </TabsContent>

            <TabsContent value="historico">
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
    </>
  );
}
