import { useState } from "react";
import logoImageSrc from "@/assets/logo_HoraMed.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { auth, fetchCollection, where, orderBy } from "@/integrations/firebase";
import { useSubscription } from "@/hooks/useSubscription";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { FileText, Download, CalendarBlank as Calendar, Heartbeat as Activity, Pill, CaretLeft as ChevronLeft, Clock, FileText as FileCheck, ShareNetwork as Share2 } from "@phosphor-icons/react";
import { shareTextViaWhatsApp } from "@/lib/shareUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserProfile } from "@/hooks/useUserProfiles";

import { useTranslation } from "@/contexts/LanguageContext";
// Define simpler interfaces for internal data
interface Medication {
  id: string;
  name: string;
  doseText: string | null;
  category: string;
  withFood: boolean;
  notes: string | null;
  unitsLeft?: number;
  unitsTotal?: number;
  unitLabel?: string;
  isActive: boolean;
}

interface Schedule {
  id: string;
  itemId: string;
  times: string[];
  freqType: string;
  daysOfWeek?: number[];
}

interface Vital {
  date: string;
  weightKg?: number;
  heightCm?: number;
}

interface ExportData {
  userEmail: string;
  profile: any;
  bmi?: string;
  items: any[];
  healthHistory: any[];
  doseInstances: any[];
  period: number;
}


export default function MedicalReports() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const generateReport = async (type: 'complete' | 'medication' | 'adherence' | 'health') => {
    if (!isPremium) {
      toast.error(t("toast.medical.premiumOnly"), {
        action: {
          label: "Ver Planos",
          onClick: () => navigate('/planos'),
        },
      });
      return;
    }

    setIsGenerating(true);

    try {
      const loadingToast = toast.loading("Coletando dados...");

      const user = auth.currentUser;
      if (!user) {
        toast.error(t("toast.medical.notAuthenticated"));
        return;
      }

      // 1. Fetch Profile
      const { data: profiles } = await fetchCollection<UserProfile>(`users/${user.uid}/profiles`);
      const profile = profiles?.find(p => p.isPrimary) || profiles?.[0]; // Default to first if no primary

      // 2. Fetch Medications & Schedules (Active Only)
      const { data: medications } = await fetchCollection<Medication>(`users/${user.uid}/medications`, [
        where('isActive', '==', true),
        orderBy('name', 'asc')
      ]);
      const { data: schedules } = await fetchCollection<Schedule>(`users/${user.uid}/schedules`);

      // 3. Fetch Health History (Vitals)
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: vitals } = await fetchCollection<Vital>(`users/${user.uid}/vitals`, [
        where('date', '>=', startDate),
        orderBy('date', 'desc')
      ]);

      // 4. Fetch Dose Instances
      const { data: doses } = await fetchCollection<any>("dose_instances", [where("userId", "==", user.uid), 
        where('dueAt', '>=', startDate.toISOString()),
        orderBy('dueAt', 'desc')
      ]);

      toast.dismiss(loadingToast);
      toast.loading("Gerando PDF...");

      // Load logo
      const logoImage = await fetch(logoImageSrc)
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }))
        .catch(() => undefined);

      const pdfModule = await import('@/lib/pdfExport');

      // Transform Data to Snake Case for PDF Module
      const formattedItems = (medications || []).map(item => {
        const itemSchedules = (schedules || []).filter(s => s.itemId === item.id);

        return {
          name: item.name,
          dose_text: item.doseText,
          category: item.category,
          with_food: item.withFood,
          notes: item.notes,
          schedules: itemSchedules.map(s => ({
            times: s.times,
            freq_type: s.freqType,
            days_of_week: s.daysOfWeek,
          })),
          stock: item.unitsLeft !== undefined ? [{
            units_left: item.unitsLeft,
            units_total: item.unitsTotal || 0,
            unit_label: item.unitLabel || '',
            // projected_end_at: Calculate if needed or leave undefined
          }] : undefined,
        };
      });

      const profileForPdf = {
        full_name: profile?.name,
        birth_date: profile?.birthDate,
        height_cm: profile?.heightCm,
        weight_kg: profile?.weightKg,
      };

      const bmi = profile?.weightKg && profile?.heightCm
        ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)
        : undefined;

      const healthHistoryForPdf = (vitals || []).map(v => ({
        recorded_at: v.date,
        weight_kg: v.weightKg,
        height_cm: v.heightCm
      }));

      // Map doses and join with medication names
      const doseInstancesForPdf = (doses || []).map(d => {
        const med = medications?.find(m => m.id === d.itemId);
        return {
          id: d.id,
          status: d.status,
          due_at: d.dueAt,
          taken_at: d.takenAt,
          item_id: d.itemId,
          items: { name: med?.name || 'Medicamento' }
        };
      });

      const exportData: ExportData = {
        userEmail: user.email || '',
        profile: profileForPdf,
        bmi,
        items: formattedItems,
        healthHistory: healthHistoryForPdf,
        doseInstances: doseInstancesForPdf,
        period: parseInt(selectedPeriod),
      };

      switch (type) {
        case 'complete':
          await pdfModule.generateCompletePDF(exportData, logoImage);
          break;
        case 'medication':
          await pdfModule.generateMedicationReport(exportData, logoImage);
          break;
        case 'adherence':
          await pdfModule.generateProgressReport(exportData, logoImage);
          break;
        case 'health':
          await pdfModule.generateHealthReport(exportData, logoImage);
          break;
      }

      toast.dismiss();
      toast.success(t("toast.medical.pdfGenerated"));
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.dismiss();
      toast.error(t("toast.medical.pdfError"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-4xl mx-auto p-4 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/perfil')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">RelatÃ³rios MÃ©dicos</h1>
              <p className="text-sm text-muted-foreground">Gere relatÃ³rios profissionais em PDF</p>
            </div>
            {isPremium && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareTextViaWhatsApp('Acompanhe meu tratamento pelo HoraMed â€” relatÃ³rios profissionais de medicamentos e aderÃªncia.')}
                className="gap-1.5 shrink-0"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            )}
          </div>

          {/* Premium Notice */}
          {!isPremium && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Recurso Premium</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    A geraÃ§Ã£o de relatÃ³rios mÃ©dicos estÃ¡ disponÃ­vel apenas para usuÃ¡rios Premium.
                  </p>
                  <Button size="sm" onClick={() => navigate('/planos')}>
                    Ver Planos Premium
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Period Selection */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">PerÃ­odo do RelatÃ³rio</h3>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perÃ­odo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Ãšltimos 7 dias</SelectItem>
                <SelectItem value="15">Ãšltimos 15 dias</SelectItem>
                <SelectItem value="30">Ãšltimos 30 dias</SelectItem>
                <SelectItem value="60">Ãšltimos 60 dias</SelectItem>
                <SelectItem value="90">Ãšltimos 90 dias</SelectItem>
                <SelectItem value="180">Ãšltimos 6 meses</SelectItem>
                <SelectItem value="365">Ãšltimo ano</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* Report Types */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground px-2">Tipos de RelatÃ³rio</h2>

            {/* Complete Report */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">RelatÃ³rio Completo</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Documento completo com todos os dados: perfil de saÃºde, medicamentos, estoque, agendamentos, histÃ³rico de aderÃªncia e evoluÃ§Ã£o de saÃºde.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => generateReport('complete')}
                    disabled={!isPremium || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar RelatÃ³rio Completo
                  </Button>
                </div>
              </div>
            </Card>

            {/* Medication Report */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Pill className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">RelatÃ³rio de Medicamentos</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Documento focado em medicamentos: lista detalhada com dosagens, horÃ¡rios, frequÃªncias, observaÃ§Ãµes e controle de estoque.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => generateReport('medication')}
                    disabled={!isPremium || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar RelatÃ³rio de Medicamentos
                  </Button>
                </div>
              </div>
            </Card>

            {/* Adherence Report */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">RelatÃ³rio de AderÃªncia</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    AnÃ¡lise completa da aderÃªncia ao tratamento: estatÃ­sticas, grÃ¡ficos, doses tomadas, perdidas e padrÃµes de comportamento.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => generateReport('adherence')}
                    disabled={!isPremium || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar RelatÃ³rio de AderÃªncia
                  </Button>
                </div>
              </div>
            </Card>

            {/* Health Report */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">RelatÃ³rio de SaÃºde</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acompanhamento da evoluÃ§Ã£o de saÃºde: histÃ³rico de peso, altura, IMC e dados vitais ao longo do tempo.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => generateReport('health')}
                    disabled={!isPremium || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gerar RelatÃ³rio de SaÃºde
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Importante:</strong> Estes relatÃ³rios sÃ£o documentos informativos gerados com base nos dados cadastrados no aplicativo.
                </p>
                <p>
                  â€¢ Os relatÃ³rios podem ser compartilhados com seu mÃ©dico durante consultas
                </p>
                <p>
                  â€¢ Todos os dados sÃ£o processados localmente no seu dispositivo
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>
      <Navigation />
    </>
  );
}

