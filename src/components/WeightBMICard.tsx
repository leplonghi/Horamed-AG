import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Scale, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import WeightRegistrationModal from "./WeightRegistrationModal";
import { Info } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WeightBMICardProps {
  userId: string;
  profileId?: string;
}

export default function WeightBMICard({ userId, profileId }: WeightBMICardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Get user height for BMI calculation
  const { data: profileData } = useQuery({
    queryKey: ["profile-height", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("height_cm")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Get latest weight
  const { data: latestWeight, refetch } = useQuery({
    queryKey: ["latest-weight", userId, profileId],
    queryFn: async () => {
      let query = supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", userId);
      
      if (profileId) {
        query = query.eq("profile_id", profileId);
      } else {
        query = query.is("profile_id", null);
      }
      
      const { data, error } = await query
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Get last 30 days of weight data for chart
  const { data: weightHistory } = useQuery({
    queryKey: ["weight-chart", userId, profileId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      let query = supabase
        .from("weight_logs")
        .select("weight_kg, recorded_at")
        .eq("user_id", userId);
      
      if (profileId) {
        query = query.eq("profile_id", profileId);
      } else {
        query = query.is("profile_id", null);
      }
      
      const { data, error } = await query
        .gte("recorded_at", thirtyDaysAgo.toISOString())
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return data?.map((log) => ({
        weight: typeof log.weight_kg === 'string' ? parseFloat(log.weight_kg) : log.weight_kg,
        date: format(new Date(log.recorded_at), "dd/MM"),
      }));
    },
  });

  const calculateBMI = () => {
    if (!latestWeight || !profileData?.height_cm) return null;
    const heightM = profileData.height_cm / 100;
    const weightNum = typeof latestWeight.weight_kg === 'string' 
      ? parseFloat(latestWeight.weight_kg) 
      : latestWeight.weight_kg;
    const bmi = weightNum / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const getBMIDescription = (bmiStr: string) => {
    const bmi = parseFloat(bmiStr);
    if (bmi < 18.5) return { 
      text: "abaixo do peso", 
      color: "text-blue-600",
      description: "Pode indicar desnutrição ou perda de massa muscular",
      recommendation: "Considere consultar um nutricionista para orientação adequada"
    };
    if (bmi < 25) return { 
      text: "peso normal", 
      color: "text-green-600",
      description: "Faixa considerada saudável pela OMS",
      recommendation: "Continue mantendo hábitos saudáveis de alimentação e exercícios"
    };
    if (bmi < 30) return { 
      text: "sobrepeso", 
      color: "text-yellow-600",
      description: "Acima do peso ideal, mas ainda não obesidade",
      recommendation: "Atenção à alimentação e atividade física pode ajudar"
    };
    return { 
      text: "obesidade", 
      color: "text-red-600",
      description: "Pode aumentar riscos de problemas de saúde",
      recommendation: "Importante acompanhamento médico e nutricional"
    };
  };

  const bmi = calculateBMI();
  const bmiDesc = bmi ? getBMIDescription(bmi) : null;

  const getTrend = () => {
    if (!weightHistory || weightHistory.length < 2) return null;
    const latest = weightHistory[weightHistory.length - 1].weight;
    const previous = weightHistory[weightHistory.length - 2].weight;
    const diff = latest - previous;
    return diff;
  };

  const trend = getTrend();

  return (
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-primary" />
                Peso & IMC
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Acompanhamento de peso e índice de massa corporal
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-background/60 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Peso Atual</p>
              {latestWeight ? (
                <>
                  <p className="text-4xl font-bold text-primary">
                    {latestWeight.weight_kg}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">kg</p>
                  {trend !== null && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {trend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                      ) : trend < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-600" />
                      ) : null}
                      <span
                        className={`text-sm font-medium ${
                          trend > 0
                            ? "text-orange-600"
                            : trend < 0
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)} kg
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">Não registrado</p>
              )}
            </div>

            <div className="text-center p-4 bg-background/60 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">IMC</p>
                <button
                  onClick={() => setInfoOpen(!infoOpen)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Informações sobre IMC"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              {bmi && bmiDesc ? (
                <>
                  <p className="text-4xl font-bold">{bmi}</p>
                  <p className={`text-sm font-medium mt-2 ${bmiDesc.color}`}>
                    {bmiDesc.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bmiDesc.description}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  {!profileData?.height_cm ? "Informe sua altura" : "Registre seu peso"}
                </p>
              )}
            </div>
          </div>

          {weightHistory && weightHistory.length > 1 && (
            <div className="h-32 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightHistory}>
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Últimos 30 dias
              </p>
            </div>
          )}

          <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
            <CollapsibleContent className="mt-4 space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">O que é IMC?</h4>
                  <p className="text-xs text-muted-foreground">
                    O Índice de Massa Corporal (IMC) é uma medida internacional usada para identificar se uma pessoa está no peso ideal. É calculado dividindo o peso (kg) pela altura ao quadrado (m²).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Faixas de referência (OMS):</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Abaixo de 18,5:</span> Abaixo do peso
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-medium">18,5 a 24,9:</span> Peso normal
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-600 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-medium">25,0 a 29,9:</span> Sobrepeso
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-600 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-medium">30,0 ou mais:</span> Obesidade
                      </div>
                    </div>
                  </div>
                </div>

                {bmi && bmiDesc && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Orientação:</span> {bmiDesc.recommendation}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground italic">
                    Fontes: Organização Mundial da Saúde (OMS) e Ministério da Saúde. O IMC é uma referência geral e não substitui avaliação médica individualizada.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <WeightRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        profileId={profileId}
        onSuccess={refetch}
      />
    </>
  );
}
