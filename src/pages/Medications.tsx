import { useState, useEffect } from "react";
import { auth, fetchCollection, where, updateDocument } from "@/integrations/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, Plus, Pill, Leaf, Heart, Clock, BookOpen, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { cn } from "@/lib/utils";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { motion, AnimatePresence } from "framer-motion";
import SupplementCategoryTag, { detectSupplementCategory } from "@/components/SupplementCategoryTag";
import { useLanguage } from "@/contexts/LanguageContext";
import MedicationInfoSheet from "@/components/MedicationInfoSheet";
import { useMedicationInfo } from "@/hooks/useMedicationInfo";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import MedicationQuickActions from "@/components/medications/MedicationQuickActions";
import SmartMedicationInsights from "@/components/medications/SmartMedicationInsights";
import MedicationStatsGrid from "@/components/medications/MedicationStatsGrid";
import OceanBackground from "@/components/ui/OceanBackground";
import type { LucideIcon } from "lucide-react";

// Hash determinístico: mesmo nome = mesma cor sempre
function nameHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Paletas FORTES — o gradiente é o fundo do card, texto em branco
// [from, to] = gradiente, accent = cor da barra/ícone, darkFrom/darkTo = dark mode
const CATEGORY_PALETTES: Record<string, Array<{
  from: string; to: string;          // gradiente claro (light mode)
  darkFrom: string; darkTo: string;  // gradiente dark mode
  accent: string;                    // cor sólida do acento (ícone bg, barra)
  iconBg: string;                    // fundo do ícone
}>> = {
  medicamento: [
    { from: "#2563eb", to: "#1d4ed8", darkFrom: "#1e40af", darkTo: "#1e3a8a", accent: "#3b82f6", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#4f46e5", to: "#4338ca", darkFrom: "#3730a3", darkTo: "#312e81", accent: "#818cf8", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#4338ca", to: "#3730a3", darkFrom: "#312e81", darkTo: "#1e1b4b", accent: "#818cf8", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#0284c7", to: "#0369a1", darkFrom: "#075985", darkTo: "#0c4a6e", accent: "#38bdf8", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#0891b2", to: "#0e7490", darkFrom: "#164e63", darkTo: "#083344", accent: "#22d3ee", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#1d4ed8", to: "#0ea5e9", darkFrom: "#1e3a8a", darkTo: "#075985", accent: "#60a5fa", iconBg: "rgba(255,255,255,0.22)" },
  ],
  vitamina: [
    { from: "#16a34a", to: "#15803d", darkFrom: "#14532d", darkTo: "#052e16", accent: "#4ade80", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#059669", to: "#047857", darkFrom: "#065f46", darkTo: "#064e3b", accent: "#34d399", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#0d9488", to: "#0f766e", darkFrom: "#134e4a", darkTo: "#042f2e", accent: "#2dd4bf", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#ca8a04", to: "#b45309", darkFrom: "#78350f", darkTo: "#451a03", accent: "#fbbf24", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#22c55e", to: "#16a34a", darkFrom: "#166534", darkTo: "#14532d", accent: "#86efac", iconBg: "rgba(255,255,255,0.22)" },
  ],
  suplemento: [
    { from: "#0d9488", to: "#0f766e", darkFrom: "#134e4a", darkTo: "#042f2e", accent: "#5eead4", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#db2777", to: "#be185d", darkFrom: "#831843", darkTo: "#500724", accent: "#f9a8d4", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#d97706", to: "#b45309", darkFrom: "#78350f", darkTo: "#451a03", accent: "#fcd34d", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#dc2626", to: "#b91c1c", darkFrom: "#7f1d1d", darkTo: "#450a0a", accent: "#fca5a5", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#0f766e", to: "#0d9488", darkFrom: "#115e59", darkTo: "#134e4a", accent: "#5eead4", iconBg: "rgba(255,255,255,0.22)" },
    { from: "#0891b2", to: "#0e7490", darkFrom: "#164e63", darkTo: "#083344", accent: "#67e8f9", iconBg: "rgba(255,255,255,0.22)" },
  ],
  outro: [
    { from: "#52525b", to: "#3f3f46", darkFrom: "#3f3f46", darkTo: "#27272a", accent: "#a1a1aa", iconBg: "rgba(255,255,255,0.18)" },
  ],
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  medicamento: Pill,
  vitamina: Leaf,
  suplemento: Heart,
  outro: Pill,
};

function getItemPalette(category: string, name: string) {
  const palettes = CATEGORY_PALETTES[category] ?? CATEGORY_PALETTES.outro;
  const idx = nameHash(name) % palettes.length;
  return { ...palettes[idx], icon: CATEGORY_ICONS[category] ?? Pill };
}



interface MedDoc {
  id: string;
  name: string;
  doseText: string | null;
  category: string;
  isActive: boolean;
  profileId?: string;
}

interface ScheduleDoc {
  id: string;
  times: string[];
  freqType: string;
  itemId: string;
}

interface StockDoc {
  id: string;
  currentQty: number;
  unitLabel: string;
  itemId: string;
}

interface Item {
  id: string;
  name: string;
  doseText: string | null;
  category: string;
  isActive: boolean;
  schedules: Array<{
    id: string;
    times: string[];
    freqType: string;
  }>;
  stock?: Array<{
    currentQty: number;
    unitLabel: string;
  }>;
}

export default function Medications() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { canAddMedication } = useSubscription();
  const { activeProfile } = useUserProfiles();

  // Medication info (bula) state
  const [selectedMedForInfo, setSelectedMedForInfo] = useState<string | null>(null);
  const { info, isLoading: infoLoading, error: infoError, fetchInfo, clearInfo } = useMedicationInfo();

  const handleOpenBula = (medName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMedForInfo(medName);
    fetchInfo(medName);
  };

  const handleCloseBula = (open: boolean) => {
    if (!open) {
      setSelectedMedForInfo(null);
      clearInfo();
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (activeProfile) {
      setLoading(true);
      fetchItems();
    }
  }, [activeProfile?.id]);

  const fetchItems = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const userId = user.uid;
      const medsPath = `users/${userId}/medications`;

      const constraints = [where("isActive", "==", true)];
      if (activeProfile) {
        constraints.push(where("profileId", "==", activeProfile.id));
      }

      const { data: medsData, error: medsError } = await fetchCollection<MedDoc>(medsPath, constraints);

      if (medsError) throw medsError;

      // Group and format data. In Firebase, we might need to fetch schedules/stock separately
      // or assume they are stored within the medication document or sub-level
      const formattedData = await Promise.all((medsData || []).map(async (med) => {
        // Fetch schedules for this medication
        const { data: schedules } = await fetchCollection<ScheduleDoc>(`users/${userId}/schedules`, [
          where("itemId", "==", med.id)
        ]);

        // Fetch stock for this medication
        const { data: stock } = await fetchCollection<StockDoc>(`users/${userId}/stock`, [
          where("itemId", "==", med.id)
        ]);

        return {
          ...med,
          name: med.name,
          dose_text: med.doseText,
          category: med.category,
          is_active: med.isActive,
          profile_id: med.profileId,
          schedules: schedules || [],
          stock: stock || []
        };
      }));

      // Sort by name
      formattedData.sort((a, b) => a.name.localeCompare(b.name));
      setItems(formattedData);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error(t('medications.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter ||
      (categoryFilter === 'medicamento' && item.category === 'medicamento') ||
      (categoryFilter === 'suplemento' && (item.category === 'suplemento' || item.category === 'vitamina')) ||
      (categoryFilter === 'low-stock' && item.stock?.[0] && item.stock[0].currentQty <= 5);
    return matchesSearch && matchesCategory;
  });

  // Separar por categoria
  const medicamentos = filteredItems.filter(item => item.category === 'medicamento');
  const vitaminas = filteredItems.filter(item => item.category === 'vitamina');
  const suplementos = filteredItems.filter(item => item.category === 'suplemento');

  const deleteItem = async (id: string) => {
    if (!confirm(t('medications.confirmDelete'))) return;
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;

      // Update isActive to false instead of deleting (soft delete)
      const { error } = await updateDocument(`users/${userId}/medications`, id, {
        isActive: false
      });

      if (error) throw error;
      toast.success(t('medications.deleteSuccess'));
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(t('common.error'));
    }
  };

  const getScheduleSummary = (schedules: Array<{ times: string[]; freqType: string }>) => {
    if (!schedules || schedules.length === 0) return null;
    const totalTimes = schedules.reduce((acc, schedule) => {
      const times = Array.isArray(schedule.times) ? schedule.times.length : 0;
      return acc + times;
    }, 0);
    return `${totalTimes}${t('medications.timesPerDay')}`;
  };

  const handleAddClick = () => {
    if (!canAddMedication) {
      setShowUpgradeModal(true);
      return;
    }
    navigate("/adicionar");
  };

  const handleInsightAction = (action: string) => {
    if (action.startsWith('/')) {
      navigate(action);
    }
  };

  const handleStatClick = (filter: string) => {
    if (filter === 'all') {
      setCategoryFilter(null);
    } else if (filter === 'low-stock') {
      navigate('/estoque');
    } else {
      setCategoryFilter(filter);
    }
  };

  // Card com gradiente saturado como fundo real
  const ItemCard = ({ item, index }: { item: Item; index: number }) => {
    const scheduleSummary = getScheduleSummary(item.schedules);
    const isSupplement = item.category === 'suplemento' || item.category === 'vitamina';
    const supplementCategory = isSupplement ? detectSupplementCategory(item.name) : null;
    const stockInfo = item.stock?.[0];
    const lowStock = stockInfo && stockInfo.currentQty <= 5;

    const palette = getItemPalette(item.category, item.name);
    const CategoryIcon = palette.icon;
    const isDark = document.documentElement.classList.contains('dark');
    const bg = isDark
      ? `linear-gradient(135deg, ${palette.darkFrom} 0%, ${palette.darkTo} 100%)`
      : `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
        whileTap={{ scale: 0.98 }}
        className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl cursor-default"
        style={{ transition: "box-shadow 0.2s, transform 0.2s" }}
      >
        {/* Camada de gradiente absoluta — impossível de sobrescrever */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            backgroundImage: bg,
          }}
        />

        {/* Conteúdo acima da cor */}
        <div className="relative z-10">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.22)" }}
              >
                <CategoryIcon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="font-bold text-base text-white truncate">{item.name}</h3>
                  {supplementCategory && (
                    <SupplementCategoryTag category={supplementCategory} size="sm" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {scheduleSummary && (
                    <div className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,0.82)" }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{scheduleSummary}</span>
                    </div>
                  )}
                  {stockInfo && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={lowStock
                        ? { background: "rgba(239,68,68,0.35)", color: "#fecaca" }
                        : { background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }
                      }
                    >
                      {stockInfo.currentQty} {stockInfo.unitLabel || (language === 'pt' ? 'un.' : 'units')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de ações */}
          <div
            className="flex items-center gap-1 px-3 py-2"
            style={{ background: "rgba(0,0,0,0.22)", borderTop: "1px solid rgba(255,255,255,0.15)" }}
          >
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-8 rounded-xl font-semibold text-xs text-white hover:bg-white/20"
              onClick={() => navigate(`/adicionar?edit=${item.id}`)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {language === 'pt' ? 'Editar' : 'Edit'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-white/20"
              style={{ color: "rgba(255,255,255,0.7)" }}
              title={language === 'pt' ? 'Ver bula' : 'View package insert'}
              onClick={(e) => handleOpenBula(item.name, e)}
            >
              <BookOpen className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-white/20"
              style={{ color: "rgba(254,202,202,0.9)" }}
              onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };






  // Seção de categoria - Clean
  const CategorySection = ({
    title,
    icon: Icon,
    items,
    emptyMessage,
    accentColor
  }: {
    title: string;
    icon: LucideIcon;
    items: Item[];
    emptyMessage: string;
    accentColor: string;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-2 rounded-xl", accentColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="font-medium">{title}</h2>
        </div>
        <span className="text-sm text-muted-foreground">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground rounded-2xl bg-muted/30 backdrop-blur-sm">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 p-4 pb-24">
          <div className="max-w-2xl mx-auto space-y-4">
            <ListSkeleton count={4} />
          </div>
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background relative pt-20 pb-28">
        <OceanBackground variant="page" />
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          {/* Hero Header */}
          <PageHeroHeader
            icon={<Pill className="h-6 w-6 text-primary" />}
            title={t('medications.title')}
            subtitle={items.length === 0
              ? t('medications.addItem')
              : `${items.length} ${items.length === 1 ? t('medications.itemCount') : t('medications.itemsCount')}`
            }
            action={{
              label: t('medications.addButton'),
              icon: <Plus className="h-5 w-5" />,
              onClick: handleAddClick
            }}
          />

          {/* Quick Actions */}
          {items.length > 0 && (
            <MedicationQuickActions
              onAddMedication={handleAddClick}
              onScanPrescription={() => navigate('/carteira')}
              onViewStock={() => navigate('/estoque')}
              onViewSchedule={() => navigate('/hoje')}
            />
          )}

          {/* Smart Insights */}
          {items.length > 0 && (
            <SmartMedicationInsights
              items={items}
              onActionClick={handleInsightAction}
            />
          )}

          {/* Stats Grid */}
          {items.length > 0 && (
            <MedicationStatsGrid
              items={items}
              onStatClick={handleStatClick}
            />
          )}

          {/* Busca */}
          {items.length > 0 && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('medications.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-11 pr-10 h-12 rounded-2xl bg-card/80 backdrop-blur-sm border-2 focus:border-primary transition-all"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Category filter badge */}
          {categoryFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {language === 'pt' ? 'Filtrando por:' : 'Filtering by:'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 rounded-full"
                onClick={() => setCategoryFilter(null)}
              >
                {categoryFilter === 'medicamento'
                  ? (language === 'pt' ? 'Medicamentos' : 'Medications')
                  : (language === 'pt' ? 'Suplementos' : 'Supplements')
                }
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Empty State */}
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center rounded-3xl bg-gradient-to-br from-card/80 to-muted/30 backdrop-blur-sm border border-border/30"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
              >
                <Pill className="w-10 h-10 text-primary" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{t('medications.getStarted')}</h3>
              <p className="text-muted-foreground text-sm mb-8 max-w-[280px] mx-auto">
                {t('medications.emptyDesc')}
              </p>
              <Button onClick={handleAddClick} size="lg" className="rounded-2xl gap-2">
                <Plus className="h-5 w-5" />
                {t('medications.addFirstItem')}
              </Button>
            </motion.div>
          )}

          {/* Seções */}
          <AnimatePresence mode="wait">
            {filteredItems.length > 0 && (
              <motion.div
                key="sections"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                {(!categoryFilter || categoryFilter === 'medicamento') && medicamentos.length > 0 && (
                  <CategorySection
                    title={language === 'pt' ? 'Medicamentos' : 'Medications'}
                    icon={Pill}
                    items={medicamentos}
                    emptyMessage={t('medications.noMedications')}
                    accentColor="bg-primary/10 text-primary"
                  />
                )}

                {(!categoryFilter || categoryFilter === 'vitamina') && vitaminas.length > 0 && (
                  <CategorySection
                    title={language === 'pt' ? 'Vitaminas' : 'Vitamins'}
                    icon={Leaf}
                    items={vitaminas}
                    emptyMessage={language === 'pt' ? 'Nenhuma vitamina cadastrada' : 'No vitamins registered'}
                    accentColor="bg-emerald-500/10 text-emerald-600"
                  />
                )}

                {(!categoryFilter || categoryFilter === 'suplemento') && suplementos.length > 0 && (
                  <CategorySection
                    title={language === 'pt' ? 'Suplementos' : 'Supplements'}
                    icon={Heart}
                    items={suplementos}
                    emptyMessage={t('medications.noSupplements')}
                    accentColor="bg-teal-500/10 text-teal-600"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results */}
          {items.length > 0 && filteredItems.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {language === 'pt' ? 'Nenhum item encontrado' : 'No items found'}
              </p>
            </div>
          )}
        </div>
      </div>

      <Navigation />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} feature="medication" />

      <MedicationInfoSheet
        open={!!selectedMedForInfo}
        onOpenChange={handleCloseBula}
        medicationName={selectedMedForInfo || ''}
        info={info}
        isLoading={infoLoading}
        error={infoError}
      />
    </>
  );
}
