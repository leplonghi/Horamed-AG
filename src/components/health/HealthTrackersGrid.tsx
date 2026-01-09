import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Droplets, 
  Heart, 
  Activity, 
  Wind, 
  Smile, 
  Moon,
  Scale,
  Thermometer
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HealthMeasurementCard from "./HealthMeasurementCard";
import { useNavigate } from "react-router-dom";

interface VitalSign {
  id: string;
  data_medicao: string;
  pressao_sistolica: number | null;
  pressao_diastolica: number | null;
  frequencia_cardiaca: number | null;
  glicemia: number | null;
  saturacao_oxigenio: number | null;
  temperatura: number | null;
  peso_kg: number | null;
}

interface HealthData {
  glucose: { value: number | null; lastUpdated: string | null; trend?: "up" | "down" | "stable" };
  bloodPressure: { systolic: number | null; diastolic: number | null; lastUpdated: string | null };
  heartRate: { value: number | null; lastUpdated: string | null; trend?: "up" | "down" | "stable" };
  spO2: { value: number | null; lastUpdated: string | null };
  mood: { value: number | null; lastUpdated: string | null };
  sleep: { value: number | null; lastUpdated: string | null };
  weight: { value: number | null; lastUpdated: string | null; trend?: "up" | "down" | "stable" };
  temperature: { value: number | null; lastUpdated: string | null };
}

export default function HealthTrackersGrid() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState<HealthData>({
    glucose: { value: null, lastUpdated: null },
    bloodPressure: { systolic: null, diastolic: null, lastUpdated: null },
    heartRate: { value: null, lastUpdated: null },
    spO2: { value: null, lastUpdated: null },
    mood: { value: null, lastUpdated: null },
    sleep: { value: null, lastUpdated: null },
    weight: { value: null, lastUpdated: null },
    temperature: { value: null, lastUpdated: null }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get latest vital signs
      const { data: vitals } = await supabase
        .from("sinais_vitais")
        .select("*")
        .eq("user_id", user.id)
        .order("data_medicao", { ascending: false })
        .limit(10);

      // Get latest weight from health_history
      const { data: weightHistory } = await supabase
        .from("health_history")
        .select("weight_kg, recorded_at")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(2);

      if (vitals && vitals.length > 0) {
        const latest = vitals[0];
        const previous = vitals[1];

        // Calculate trends
        const getTrend = (current: number | null, prev: number | null): "up" | "down" | "stable" | undefined => {
          if (!current || !prev) return undefined;
          if (current > prev) return "up";
          if (current < prev) return "down";
          return "stable";
        };

        setHealthData({
          glucose: {
            value: latest.glicemia,
            lastUpdated: latest.data_medicao,
            trend: getTrend(latest.glicemia, previous?.glicemia)
          },
          bloodPressure: {
            systolic: latest.pressao_sistolica,
            diastolic: latest.pressao_diastolica,
            lastUpdated: latest.data_medicao
          },
          heartRate: {
            value: latest.frequencia_cardiaca,
            lastUpdated: latest.data_medicao,
            trend: getTrend(latest.frequencia_cardiaca, previous?.frequencia_cardiaca)
          },
          spO2: {
            value: latest.saturacao_oxigenio,
            lastUpdated: latest.data_medicao
          },
          mood: { value: null, lastUpdated: null },
          sleep: { value: null, lastUpdated: null },
          weight: {
            value: weightHistory?.[0]?.weight_kg || latest.peso_kg,
            lastUpdated: weightHistory?.[0]?.recorded_at || latest.data_medicao,
            trend: getTrend(
              weightHistory?.[0]?.weight_kg || latest.peso_kg,
              weightHistory?.[1]?.weight_kg || previous?.peso_kg
            )
          },
          temperature: {
            value: latest.temperatura,
            lastUpdated: latest.data_medicao
          }
        });
      }
    } catch (error) {
      console.error("Error loading health data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMeasurement = async (
    type: string, 
    value: number, 
    secondaryValue?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      let updateData: Partial<VitalSign> = { data_medicao: now };

      switch (type) {
        case "glucose":
          updateData.glicemia = value;
          break;
        case "bloodPressure":
          updateData.pressao_sistolica = value;
          updateData.pressao_diastolica = secondaryValue || null;
          break;
        case "heartRate":
          updateData.frequencia_cardiaca = value;
          break;
        case "spO2":
          updateData.saturacao_oxigenio = value;
          break;
        case "temperature":
          updateData.temperatura = value;
          break;
        case "weight":
          updateData.peso_kg = value;
          // Also save to health_history
          await supabase.from("health_history").insert({
            user_id: user.id,
            weight_kg: value,
            recorded_at: now
          });
          break;
      }

      const { error } = await supabase
        .from("sinais_vitais")
        .insert({
          user_id: user.id,
          ...updateData
        });

      if (error) throw error;

      toast.success(language === 'pt' ? 'Medição registrada!' : 'Measurement recorded!');
      loadHealthData();
    } catch (error) {
      console.error("Error saving measurement:", error);
      toast.error(language === 'pt' ? 'Erro ao salvar' : 'Error saving');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const trackers = [
    {
      id: "glucose",
      title: language === 'pt' ? 'Glicemia' : 'Blood Glucose',
      icon: <Droplets className="h-5 w-5 text-white" />,
      unit: "mg/dL",
      value: healthData.glucose.value,
      lastUpdated: healthData.glucose.lastUpdated,
      trend: healthData.glucose.trend,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      normalRange: { min: 70, max: 100 },
      placeholder: "mg/dL"
    },
    {
      id: "bloodPressure",
      title: language === 'pt' ? 'Pressão Arterial' : 'Blood Pressure',
      icon: <Activity className="h-5 w-5 text-white" />,
      unit: "mmHg",
      value: healthData.bloodPressure.systolic,
      secondaryValue: healthData.bloodPressure.diastolic,
      secondaryUnit: "mmHg",
      lastUpdated: healthData.bloodPressure.lastUpdated,
      color: "bg-gradient-to-br from-red-500 to-red-600",
      normalRange: { min: 90, max: 120 },
      placeholder: language === 'pt' ? "Sistólica" : "Systolic",
      secondaryPlaceholder: language === 'pt' ? "Diastólica" : "Diastolic"
    },
    {
      id: "heartRate",
      title: language === 'pt' ? 'Frequência Cardíaca' : 'Heart Rate',
      icon: <Heart className="h-5 w-5 text-white" />,
      unit: "bpm",
      value: healthData.heartRate.value,
      lastUpdated: healthData.heartRate.lastUpdated,
      trend: healthData.heartRate.trend,
      color: "bg-gradient-to-br from-pink-500 to-pink-600",
      normalRange: { min: 60, max: 100 },
      placeholder: "bpm"
    },
    {
      id: "spO2",
      title: language === 'pt' ? 'Saturação O₂' : 'SpO₂',
      icon: <Wind className="h-5 w-5 text-white" />,
      unit: "%",
      value: healthData.spO2.value,
      lastUpdated: healthData.spO2.lastUpdated,
      color: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      normalRange: { min: 95, max: 100 },
      placeholder: "%"
    },
    {
      id: "weight",
      title: language === 'pt' ? 'Peso' : 'Weight',
      icon: <Scale className="h-5 w-5 text-white" />,
      unit: "kg",
      value: healthData.weight.value,
      lastUpdated: healthData.weight.lastUpdated,
      trend: healthData.weight.trend,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      placeholder: "kg"
    },
    {
      id: "temperature",
      title: language === 'pt' ? 'Temperatura' : 'Temperature',
      icon: <Thermometer className="h-5 w-5 text-white" />,
      unit: "°C",
      value: healthData.temperature.value,
      lastUpdated: healthData.temperature.lastUpdated,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      normalRange: { min: 36, max: 37.5 },
      placeholder: "°C"
    },
    {
      id: "mood",
      title: language === 'pt' ? 'Humor' : 'Mood',
      icon: <Smile className="h-5 w-5 text-white" />,
      unit: "/10",
      value: healthData.mood.value,
      lastUpdated: healthData.mood.lastUpdated,
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      placeholder: "1-10"
    },
    {
      id: "sleep",
      title: language === 'pt' ? 'Sono' : 'Sleep',
      icon: <Moon className="h-5 w-5 text-white" />,
      unit: "h",
      value: healthData.sleep.value,
      lastUpdated: healthData.sleep.lastUpdated,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      normalRange: { min: 7, max: 9 },
      placeholder: language === 'pt' ? "Horas" : "Hours"
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {trackers.map((tracker) => (
        <HealthMeasurementCard
          key={tracker.id}
          title={tracker.title}
          icon={tracker.icon}
          unit={tracker.unit}
          value={tracker.value}
          secondaryValue={tracker.secondaryValue}
          secondaryUnit={tracker.secondaryUnit}
          lastUpdated={tracker.lastUpdated || undefined}
          trend={tracker.trend}
          color={tracker.color}
          normalRange={tracker.normalRange}
          isLoading={isLoading}
          placeholder={tracker.placeholder}
          secondaryPlaceholder={tracker.secondaryPlaceholder}
          onAddMeasurement={(value, secondary) => saveMeasurement(tracker.id, value, secondary)}
          onViewHistory={() => navigate("/dashboard-saude")}
        />
      ))}
    </motion.div>
  );
}
