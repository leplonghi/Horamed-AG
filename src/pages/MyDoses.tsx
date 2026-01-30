import { useState, useEffect } from "react";
import { auth, fetchCollection, updateDocument, where, orderBy } from "@/integrations/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import DoseTimeline from "@/components/DoseTimeline";
import DoseActionModal from "@/components/DoseActionModal";
import NextDoseWidget from "@/components/NextDoseWidget";
import MedicationSummaryCard from "@/components/MedicationSummaryCard";
import StreakBadge from "@/components/StreakBadge";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, TrendingUp, History, Pill } from "lucide-react";

interface DoseInstance {
  id: string;
  itemId: string;
  dueAt: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  takenAt: string | null;
  items: {
    name: string;
    doseText: string | null;
    userId: string;
  };
  stock?: {
    currentQty: number; // Adapted to match DoseTimeline expectation
  }[];
}

export default function MyDoses() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'history'>('today');
  const [doses, setDoses] = useState<DoseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDose, setSelectedDose] = useState<DoseInstance | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  const { showFeedback } = useFeedbackToast();

  useEffect(() => {
    loadDoses();
    loadStreak();
  }, [activeTab]);

  const loadDoses = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      let startDate: Date;
      let endDate: Date;

      switch (activeTab) {
        case 'today':
          startDate = startOfDay(new Date());
          endDate = endOfDay(new Date());
          break;
        case 'week':
          startDate = startOfWeek(new Date(), { locale: ptBR });
          endDate = endOfWeek(new Date(), { locale: ptBR });
          break;
        case 'history':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
      }

      // 1. Fetch Doses
      const { data: dosesData } = await fetchCollection<any>(
        `users/${user.uid}/doses`,
        [
          where("dueAt", ">=", startDate.toISOString()),
          where("dueAt", "<=", endDate.toISOString()),
          orderBy("dueAt", "asc")
        ]
      );

      if (!dosesData || dosesData.length === 0) {
        setDoses([]);
        return;
      }

      // 2. Fetch all medications for the user (to join)
      // Optimization: Fetch only distinct itemIds if list is small, but fetch all is often simpler/cheaper if < 100 docs
      const { data: medsData } = await fetchCollection<any>(`users/${user.uid}/medications`);
      const medsMap = new Map((medsData || []).map(m => [m.id, m]));

      // 3. Join Doses with Meds
      const joinedDoses: DoseInstance[] = dosesData.map(dose => {
        const med = medsMap.get(dose.itemId);
        return {
          id: dose.id,
          itemId: dose.itemId,
          dueAt: dose.dueAt,
          status: dose.status,
          takenAt: dose.takenAt || null,
          items: {
            name: med?.name || 'Desconhecido',
            doseText: med?.doseText || null,
            userId: user.uid
          },
          // Map unitsLeft from medication doc to stock array structure expected by UseTimeline
          stock: med?.unitsLeft !== undefined ? [{ currentQty: med.unitsLeft }] : []
        };
      });

      setDoses(joinedDoses);
    } catch (error) {
      console.error('Erro ao carregar doses:', error);
      showFeedback('dose-missed', { customMessage: 'Erro ao carregar doses' });
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    // Current placeholder for streak loading until backend aggregation is implemented
    // Ideally: fetch `users/${user.uid}/stats/streak`
    setStreak(0);
  };

  const handleQuickTake = async (dose: DoseInstance) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const takenTime = new Date();

      // Update Dose Status
      await updateDocument(`users/${user.uid}/doses`, dose.id, {
        status: 'taken',
        takenAt: takenTime.toISOString()
      });

      // Update Stock (Decrement)
      if (dose.stock && dose.stock.length > 0 && dose.stock[0].currentQty > 0) {
        const newQty = Math.max(0, dose.stock[0].currentQty - 1);
        await updateDocument(`users/${user.uid}/medications`, dose.itemId, {
          unitsLeft: newQty
        });
      }

      // Check if period is complete (Period Feedback)
      const periodDoses = doses.filter(d => {
        const hour = new Date(d.dueAt).getHours();
        const doseHour = new Date(dose.dueAt).getHours();
        return Math.floor(hour / 6) === Math.floor(doseHour / 6);
      });
      const allTaken = periodDoses.every(d =>
        d.id === dose.id || d.status === 'taken'
      );

      if (allTaken) {
        const hour = new Date(dose.dueAt).getHours();
        const periodName = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';
        showFeedback('period-complete', { periodName });
      } else {
        showFeedback('dose-taken', {
          medicationName: dose.items.name,
          takenTime: format(takenTime, "HH:mm"),
        });
      }

      loadDoses();
      loadStreak();
    } catch (error) {
      console.error('Erro ao marcar dose:', error);
      showFeedback('dose-missed', { customMessage: 'Erro ao marcar dose como tomada' });
    }
  };

  const handleStatusUpdate = async (action: 'taken' | 'missed' | 'skipped' | 'custom-time') => {
    if (!selectedDose) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (action === 'custom-time') {
        const customTakenAt = new Date().toISOString();
        await updateDocument(`users/${user.uid}/doses`, selectedDose.id, {
          status: 'taken',
          takenAt: customTakenAt
        });

        showFeedback('dose-taken', { medicationName: selectedDose.items.name });
        loadDoses();
        loadStreak();
        return;
      }

      const updateData: any = {
        status: action,
        ...(action === 'taken' && { takenAt: new Date().toISOString() }),
      };

      await updateDocument(`users/${user.uid}/doses`, selectedDose.id, updateData);

      // Decrement stock if taken
      if (action === 'taken' && selectedDose.stock && selectedDose.stock.length > 0) {
        const newQty = Math.max(0, selectedDose.stock[0].currentQty - 1);
        await updateDocument(`users/${user.uid}/medications`, selectedDose.itemId, {
          unitsLeft: newQty
        });
      }

      // Show appropriate feedback
      if (action === 'taken') {
        showFeedback('dose-taken', { medicationName: selectedDose.items.name });
      } else if (action === 'missed') {
        showFeedback('dose-missed');
      } else if (action === 'skipped') {
        showFeedback('dose-skipped');
      }

      loadDoses();
      loadStreak();
    } catch (error) {
      console.error('Erro ao atualizar dose:', error);
      showFeedback('dose-missed', { customMessage: 'Erro ao atualizar status da dose' });
    }
  };

  const handleMoreOptions = (dose: DoseInstance) => {
    setSelectedDose(dose);
    setModalOpen(true);
  };

  const calculateProgress = () => {
    if (doses.length === 0) return 0;
    const takenCount = doses.filter(d => d.status === 'taken').length;
    return Math.round((takenCount / doses.length) * 100);
  };

  const progress = calculateProgress();
  const nextDose = doses.find(d => d.status === 'scheduled' && new Date(d.dueAt) > new Date());

  // Group medications for summary cards
  const medicationGroups = doses.reduce((acc, dose) => {
    if (!acc[dose.itemId]) {
      acc[dose.itemId] = {
        id: dose.itemId,
        name: dose.items.name,
        doses: [],
      };
    }
    acc[dose.itemId].doses.push(dose);
    return acc;
  }, {} as Record<string, { id: string; name: string; doses: typeof doses }>);

  const medications = Object.values(medicationGroups);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8">
        {/* Header com Streak */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Minhas Doses</h1>
              <p className="text-muted-foreground">
                Acompanhe seu compromisso com a saúde
              </p>
            </div>
            {streak > 0 && <StreakBadge streak={streak} type="current" />}
          </div>

          {/* Card de Adesão */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Compromisso {activeTab === 'today' ? 'de Hoje' : activeTab === 'week' ? 'da Semana' : 'Mensal'}</span>
                  <span className="text-2xl font-bold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {progress >= 90 && "🎉 Você está indo muito bem!"}
                  {progress >= 70 && progress < 90 && "💪 Bom trabalho! Continue assim!"}
                  {progress >= 50 && progress < 70 && "⚡ Você pode melhorar!"}
                  {progress < 50 && "Vamos retomar o compromisso!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Próxima Dose Widget */}
          {nextDose && activeTab === 'today' && (
            <NextDoseWidget
              dose={nextDose}
              onTake={() => handleQuickTake(nextDose)}
            />
          )}

          {/* Medication Summary Cards */}
          {activeTab === 'today' && medications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Seus Medicamentos</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {medications.map(med => (
                  <MedicationSummaryCard key={med.id} medication={med} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Hoje
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {loading ? (
              <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>
            ) : doses.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma dose programada para hoje</CardContent></Card>
            ) : (
              <DoseTimeline
                doses={doses}
                period="today"
                onTake={handleQuickTake}
                onMore={handleMoreOptions}
                groupByTime={true}
              />
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {loading ? (
              <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>
            ) : doses.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma dose nesta semana</CardContent></Card>
            ) : (
              <DoseTimeline
                doses={doses}
                period="week"
                onTake={handleQuickTake}
                onMore={handleMoreOptions}
                groupByTime={false}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>
            ) : doses.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Sem histórico nos últimos 30 dias</CardContent></Card>
            ) : (
              <DoseTimeline
                doses={doses}
                period="month"
                onTake={handleQuickTake}
                onMore={handleMoreOptions}
                groupByTime={false}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <DoseActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dose={selectedDose}
        onAction={handleStatusUpdate}
      />
    </div>
  );
}
