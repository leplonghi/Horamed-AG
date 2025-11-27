import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Check, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Medication {
  drug_name: string;
  commercial_name?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  duration_days?: number;
  instructions?: string;
  with_food?: boolean;
}

interface PrescriptionReviewScreenProps {
  documentId: string;
  extractedData: any;
  onComplete: () => void;
}

export default function PrescriptionReviewScreen({ documentId, extractedData, onComplete }: PrescriptionReviewScreenProps) {
  const [step, setStep] = useState(1);
  const [selectedMeds, setSelectedMeds] = useState<Set<number>>(new Set(extractedData.prescriptions?.map((_: any, i: number) => i) || []));
  const [schedules, setSchedules] = useState<Record<number, { frequency: string; times: string[] }>>(
    Object.fromEntries((extractedData.prescriptions || []).map((_: any, i: number) => [i, { frequency: "1x", times: ["08:00"] }]))
  );
  const [stock, setStock] = useState<Record<number, number>>(
    Object.fromEntries((extractedData.prescriptions || []).map((_: any, i: number) => [i, 30]))
  );
  const [processing, setProcessing] = useState(false);

  const { activeProfile } = useUserProfiles();
  const navigate = useNavigate();

  const medications: Medication[] = extractedData.prescriptions || [];

  const toggleMedication = (index: number) => {
    const newSet = new Set(selectedMeds);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedMeds(newSet);
  };

  const updateSchedule = (index: number, frequency: string) => {
    const timesMap: Record<string, string[]> = {
      "1x": ["08:00"],
      "2x": ["08:00", "20:00"],
      "3x": ["08:00", "14:00", "20:00"],
    };

    setSchedules(prev => ({
      ...prev,
      [index]: {
        frequency,
        times: timesMap[frequency] || ["08:00"]
      }
    }));
  };

  const handleFinish = async () => {
    if (selectedMeds.size === 0) {
      toast.info("Nenhum medicamento selecionado");
      navigate(`/carteira/${documentId}`);
      return;
    }

    setProcessing(true);
    toast.loading("Criando medicamentos e lembretes...", { id: "create-meds" });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      let createdCount = 0;
      let schedulesCount = 0;
      let stockCount = 0;

      for (const index of Array.from(selectedMeds)) {
        const med = medications[index];
        const schedule = schedules[index];
        const stockQty = stock[index];

        // Create medication item
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            user_id: user.id,
            profile_id: activeProfile?.id,
            name: med.commercial_name || med.drug_name,
            dose_text: med.dose,
            category: 'medicamento',
            notes: med.instructions,
            with_food: med.with_food || false,
            treatment_duration_days: med.duration_days,
            is_active: true,
          })
          .select()
          .single();

        if (itemError) throw itemError;
        createdCount++;

        // Create schedule
        const { error: schedError } = await supabase
          .from('schedules')
          .insert({
            item_id: newItem.id,
            freq_type: 'daily',
            times: schedule.times,
            is_active: true,
          });

        if (schedError) throw schedError;
        schedulesCount++;

        // Create stock
        if (stockQty > 0) {
          const { error: stockError } = await supabase
            .from('stock')
            .insert({
              item_id: newItem.id,
              units_total: stockQty,
              units_left: stockQty,
              unit_label: 'comprimidos',
              created_from_prescription_id: documentId,
            });

          if (!stockError) stockCount++;
        }
      }

      // Mark document as reviewed
      await supabase
        .from('documentos_saude')
        .update({ status_extraction: 'reviewed' })
        .eq('id', documentId);

      toast.dismiss("create-meds");
      toast.success(
        `✓ Pronto! Criamos ${createdCount} medicamento(s), ${schedulesCount} lembrete(s) diário(s) e ${stockCount} controle(s) de estoque a partir desta receita.`,
        { duration: 6000 }
      );

      navigate("/hoje");

    } catch (error: any) {
      console.error('Erro ao criar medicamentos:', error);
      toast.dismiss("create-meds");
      toast.error("Erro ao criar medicamentos. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto px-4 pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="heading-page">Revise sua receita</h1>
          <p className="text-description">
            Passo {step} de 3 · {selectedMeds.size} medicamento(s) selecionado(s)
          </p>
        </div>

        {/* Document Info */}
        <Card>
          <CardContent className="p-4 space-y-2">
            {extractedData.provider && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">🏥</span>
                <span className="text-sm">{extractedData.provider}</span>
              </div>
            )}
            {extractedData.doctor_name && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">👨‍⚕️</span>
                <span className="text-sm">Dr(a). {extractedData.doctor_name}</span>
              </div>
            )}
            {extractedData.issued_at && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">📅</span>
                <span className="text-sm">
                  {format(new Date(extractedData.issued_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 1: Select Medications */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selecione os medicamentos para adicionar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {medications.map((med, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedMeds.has(index)}
                          onCheckedChange={() => toggleMedication(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-semibold">{med.commercial_name || med.drug_name}</p>
                            {med.dose && (
                              <p className="text-sm text-muted-foreground">{med.dose}</p>
                            )}
                          </div>
                          {med.frequency && (
                            <Badge variant="outline">{med.frequency}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full h-12"
              disabled={selectedMeds.size === 0}
            >
              Continuar <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Step 2: Configure Schedules */}
        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Confirme os horários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from(selectedMeds).map((index) => {
                  const med = medications[index];
                  return (
                    <div key={index} className="space-y-3">
                      <p className="font-semibold">{med.commercial_name || med.drug_name}</p>
                      <div className="flex gap-2">
                        {["1x", "2x", "3x"].map((freq) => (
                          <Button
                            key={freq}
                            variant={schedules[index]?.frequency === freq ? "default" : "outline"}
                            onClick={() => updateSchedule(index, freq)}
                            className="flex-1"
                          >
                            {freq} ao dia
                          </Button>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Horários: {schedules[index]?.times.join(", ")}
                      </div>
                      <Separator />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continuar <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Configure Stock */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Configure o estoque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from(selectedMeds).map((index) => {
                  const med = medications[index];
                  return (
                    <div key={index} className="space-y-3">
                      <p className="font-semibold">{med.commercial_name || med.drug_name}</p>
                      <div className="space-y-2">
                        <Label>Quantos comprimidos vieram na caixa?</Label>
                        <div className="flex gap-2">
                          {[30, 60, 90].map((qty) => (
                            <Button
                              key={qty}
                              variant={stock[index] === qty ? "default" : "outline"}
                              onClick={() => setStock(prev => ({ ...prev, [index]: qty }))}
                              className="flex-1"
                            >
                              {qty}
                            </Button>
                          ))}
                        </div>
                        <Input
                          type="number"
                          value={stock[index]}
                          onChange={(e) => setStock(prev => ({ ...prev, [index]: parseInt(e.target.value) || 0 }))}
                          placeholder="Ou digite outro valor"
                        />
                      </div>
                      <Separator />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={handleFinish} 
                className="flex-1 h-12"
                disabled={processing}
              >
                <Check className="mr-2 h-5 w-5" />
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
