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
import { auth, addDocument, fetchCollection, orderBy, limit } from "@/integrations/firebase";
import { toast } from "sonner";
import HealthMeasurementCard from "./HealthMeasurementCard";
import { useNavigate } from "react-router-dom";

interface VitalSign {
  id?: string;
  measuredAt: string;
  systolic?: number | null;
  diastolic?: number | null;
  heartRate?: number | null;
  bloodSugar?: number | null;
  oxygenSaturation?: number | null;
  temperature?: number | null;
  weightKg?: number | null;
  mood?: number | null;
  sleepHours?: number | null;
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
      const user = auth.currentUser;
      if (!user) return;

      // Get latest vital signs
      const { data: vitals } = await fetchCollection<VitalSign>(
        `users/${user.uid}/vitalSigns`,
        [orderBy("measuredAt", "desc"), limit(20)]
      );

      if (vitals && vitals.length > 0) {
        // We need to find the latest non-null value for each metric
        // A naive approach is to just take the latest record, but often records are partial (only weight, or only BP)
        // So we scan the last 20 records to find the latest value for each.

        const findLatest = (key: keyof VitalSign) => {
          const entry = vitals.find(v => v[key] !== undefined && v[key] !== null);
          return entry ? { value: entry[key], date: entry.measuredAt } : null;
        };

        const findTrend = (key: keyof VitalSign) => {
          const entries = vitals.filter(v => v[key] !== undefined && v[key] !== null);
          if (entries.length < 2) return undefined;
          const current = entries[0][key] as number;
          const prev = entries[1][key] as number;
          if (current > prev) return "up";
          if (current < prev) return "down";
          return "stable";
        };

        const glucose = findLatest('bloodSugar');
        const bpSystolic = findLatest('systolic');
        const bpDiastolic = findLatest('diastolic');
        const hr = findLatest('heartRate');
        const oxy = findLatest('oxygenSaturation');
        const temp = findLatest('temperature');
        const weight = findLatest('weightKg');
        const mood = findLatest('mood');
        const sleep = findLatest('sleepHours');

        setHealthData({
          glucose: {
            value: glucose?.value as number || null,
            lastUpdated: glucose?.date || null,
            trend: findTrend('bloodSugar')
          },
          bloodPressure: {
            systolic: bpSystolic?.value as number || null,
            diastolic: bpDiastolic?.value as number || null,
            lastUpdated: bpSystolic?.date || null
          },
          heartRate: {
            value: hr?.value as number || null,
            lastUpdated: hr?.date || null,
            trend: findTrend('heartRate')
          },
          spO2: {
            value: oxy?.value as number || null,
            lastUpdated: oxy?.date || null
          },
          mood: {
            value: mood?.value as number || null,
            lastUpdated: mood?.date || null
          },
          sleep: {
            value: sleep?.value as number || null,
            lastUpdated: sleep?.date || null
          },
          weight: {
            value: weight?.value as number || null,
            lastUpdated: weight?.date || null,
            trend: findTrend('weightKg')
          },
          temperature: {
            value: temp?.value as number || null,
            lastUpdated: temp?.date || null
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
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date().toISOString();
      const updateData: Partial<VitalSign> = { measuredAt: now };

      switch (type) {
        case "glucose":
          updateData.bloodSugar = value;
          break;
        case "bloodPressure":
          updateData.systolic = value;
          updateData.diastolic = secondaryValue || null;
          break;
        case "heartRate":
          updateData.heartRate = value;
          break;
        case "spO2":
          updateData.oxygenSaturation = value;
          break;
        case "temperature":
          updateData.temperature = value;
          break;
        case "weight":
          updateData.weightKg = value;
          break;
        case "mood":
          updateData.mood = value;
          break;
        case "sleep":
          updateData.sleepHours = value;
          break;
      }

      await addDocument(`users/${user.uid}/vitalSigns`, updateData);

      // If weight, also check if we need to update profile (redundant if using updateDocument properly elsewhere but good for safety)
      // Actually let's just stick to vitalSigns for tracking.

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
          onViewHistory={() => navigate("/sinais-vitais")}
        />
      ))}
    </motion.div>
  );
}
