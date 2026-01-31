import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import OceanBackground from "@/components/ui/OceanBackground";
import { auth, addDocument, fetchCollection, orderBy, limit, where } from "@/integrations/firebase";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
  Activity,
  Heart,
  Thermometer,
  Droplet,
  Scale,
  Wind,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VitalSign {
  id: string;
  measuredAt: string;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  temperature: number | null;
  bloodSugar: number | null;
  oxygenSaturation: number | null;
  weightKg: number | null;
  notes: string | null;
}

interface VitalCardProps {
  title: string;
  icon: React.ReactNode;
  currentValue: string | null;
  unit: string;
  lastDate: string | null;
  trend?: 'up' | 'down' | 'stable' | null;
  colorClass: string;
  inputName: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
}

function VitalCard({
  title,
  icon,
  currentValue,
  unit,
  lastDate,
  trend,
  colorClass,
  inputName,
  inputValue,
  onInputChange,
  placeholder,
  type = "number",
  step,
  min,
  max
}: VitalCardProps) {
  const { language, t } = useLanguage();

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className={cn(
      "border-2 transition-all hover:border-primary/30",
      "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={cn("p-2 rounded-lg", colorClass)}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Value */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {t('vitals.lastReading')}
            </p>
            {currentValue ? (
              <p className="text-2xl font-bold text-primary">
                {currentValue} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t('vitals.notRecorded')}
              </p>
            )}
          </div>
          {trend && currentValue && (
            <TrendIcon className={cn(
              "h-5 w-5",
              trend === 'up' ? "text-red-500" :
                trend === 'down' ? "text-green-500" :
                  "text-muted-foreground"
            )} />
          )}
        </div>

        {lastDate && (
          <p className="text-xs text-muted-foreground">
            {lastDate}
          </p>
        )}

        {/* Input for new value */}
        <div className="pt-2 border-t">
          <Label htmlFor={inputName} className="text-xs text-muted-foreground">
            {t('vitals.newReading')}
          </Label>
          <Input
            id={inputName}
            type={type}
            step={step}
            min={min}
            max={max}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className="mt-1 h-10"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SinaisVitais() {
  const { activeProfile } = useUserProfiles();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const [formData, setFormData] = useState({
    systolic: "",
    diastolic: "",
    heartRate: "",
    temperature: "",
    bloodSugar: "",
    oxygenSaturation: "",
    weightKg: "",
    notes: ""
  });

  // Fetch latest vital signs from Firebase
  const { data: latestVitals, isLoading } = useQuery({
    queryKey: ["latest-vitals", activeProfile?.id],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;

      const queryConstraints = [
        orderBy("measuredAt", "desc"),
        limit(1)
      ];

      if (activeProfile?.id) {
        queryConstraints.push(where("profileId", "==", activeProfile.id));
      }

      const { data, error } = await fetchCollection<VitalSign>(
        `users/${user.uid}/vitalSigns`,
        queryConstraints
      );

      if (error) throw error;
      return (data && data.length > 0) ? data[0] : null;
    },
    enabled: !!auth.currentUser,
  });

  // Fetch previous vitals for trend comparison
  // NOTE: Firebase limit(2) gets last 2 if ordered by date desc.
  // So we fetch 2 items, take the second one as 'previous'.
  const { data: previousVitals } = useQuery({
    queryKey: ["previous-vitals", activeProfile?.id],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;

      const queryConstraints = [
        orderBy("measuredAt", "desc"),
        limit(2)
      ];

      if (activeProfile?.id) {
        queryConstraints.push(where("profileId", "==", activeProfile.id));
      }

      const { data, error } = await fetchCollection<VitalSign>(
        `users/${user.uid}/vitalSigns`,
        queryConstraints
      );

      if (error) throw error;
      if (data && data.length > 1) {
        return data[1]; // Return the second most recent
      }
      return null;
    },
    enabled: !!auth.currentUser,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const hasAnyValue = Object.entries(formData).some(([key, value]) => {
        if (key === 'notes') return false;
        return value !== "";
      });

      if (!hasAnyValue) {
        throw new Error(t('vitals.fillOne'));
      }

      const insertData: any = {
        userId: user.uid,
        profileId: activeProfile?.id || null, // Assuming activeProfile has an ID, or null if not yet loaded?
        measuredAt: new Date().toISOString(),
      };

      if (formData.systolic) insertData.systolic = parseInt(formData.systolic);
      if (formData.diastolic) insertData.diastolic = parseInt(formData.diastolic);
      if (formData.heartRate) insertData.heartRate = parseInt(formData.heartRate);
      if (formData.temperature) insertData.temperature = parseFloat(formData.temperature);
      if (formData.bloodSugar) insertData.bloodSugar = parseInt(formData.bloodSugar);
      if (formData.oxygenSaturation) insertData.oxygenSaturation = parseInt(formData.oxygenSaturation);
      if (formData.weightKg) insertData.weightKg = parseFloat(formData.weightKg);
      if (formData.notes) insertData.notes = formData.notes;

      const { error } = await addDocument(`users/${user.uid}/vitalSigns`, insertData);
      if (error) throw error;

      // Also update latest weight in profile if provided
      if (insertData.weightKg && activeProfile?.id) {
        const { updateDocument } = await import("@/integrations/firebase");
        await updateDocument(`users/${user.uid}/profiles`, activeProfile.id, {
          weightKg: insertData.weightKg
        });
      }
    },
    onSuccess: () => {
      toast.success(t('vitals.saved'));
      setFormData({
        systolic: "",
        diastolic: "",
        heartRate: "",
        temperature: "",
        bloodSugar: "",
        oxygenSaturation: "",
        weightKg: "",
        notes: ""
      });
      queryClient.invalidateQueries({ queryKey: ["latest-vitals"] });
      queryClient.invalidateQueries({ queryKey: ["previous-vitals"] });
      // Invalidate profile cache to reflect new weight
      queryClient.invalidateQueries({ queryKey: ["userProfiles"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const getTrend = (current: number | null, previous: number | null): 'up' | 'down' | 'stable' | null => {
    if (!current || !previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return format(new Date(dateStr), language === 'pt' ? "dd/MM/yyyy 'às' HH:mm" : "MM/dd/yyyy 'at' HH:mm", { locale: dateLocale });
  };

  const updateField = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background relative">
      <OceanBackground variant="page" />
      <Header />

      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 page-container relative z-10">
        <PageHeroHeader
          icon={<Activity className="h-6 w-6 text-primary" />}
          title={t('vitals.title')}
          subtitle={t('vitals.subtitle')}
        />

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard-saude')}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {t('vitals.viewHistory')}
          </Button>
        </div>

        {/* Vital Signs Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Blood Pressure */}
          <Card className="border-2 transition-all hover:border-primary/30 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                {t('vitals.bloodPressure')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('vitals.lastReading')}
                </p>
                {latestVitals?.systolic && latestVitals?.diastolic ? (
                  <p className="text-2xl font-bold text-primary">
                    {latestVitals.systolic}/{latestVitals.diastolic}
                    <span className="text-sm font-normal text-muted-foreground"> mmHg</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t('vitals.notRecorded')}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="systolic" className="text-xs text-muted-foreground">
                    {t('vitals.systolic')}
                  </Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={formData.systolic}
                    onChange={(e) => updateField('systolic')(e.target.value)}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="diastolic" className="text-xs text-muted-foreground">
                    {language === 'pt' ? 'Diastólica' : 'Diastolic'}
                  </Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={formData.diastolic}
                    onChange={(e) => updateField('diastolic')(e.target.value)}
                    className="mt-1 h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight */}
          <VitalCard
            title={t('vitals.weight')}
            icon={<Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            currentValue={latestVitals?.weightKg?.toString() || null}
            unit="kg"
            lastDate={formatDate(latestVitals?.measuredAt || null)}
            trend={getTrend(latestVitals?.weightKg || null, previousVitals?.weightKg || null)}
            colorClass="bg-blue-100 dark:bg-blue-900/30"
            inputName="weightKg"
            inputValue={formData.weightKg}
            onInputChange={updateField('weightKg')}
            placeholder="75.5"
            step="0.1"
            min="20"
            max="300"
          />

          {/* Heart Rate */}
          <VitalCard
            title={t('vitals.heartRate')}
            icon={<Activity className="h-4 w-4 text-pink-600 dark:text-pink-400" />}
            currentValue={latestVitals?.heartRate?.toString() || null}
            unit="bpm"
            lastDate={formatDate(latestVitals?.measuredAt || null)}
            trend={getTrend(latestVitals?.heartRate || null, previousVitals?.heartRate || null)}
            colorClass="bg-pink-100 dark:bg-pink-900/30"
            inputName="heartRate"
            inputValue={formData.heartRate}
            onInputChange={updateField('heartRate')}
            placeholder="72"
            min="30"
            max="200"
          />

          {/* Blood Sugar */}
          <VitalCard
            title={t('vitals.bloodSugar')}
            icon={<Droplet className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
            currentValue={latestVitals?.bloodSugar?.toString() || null}
            unit="mg/dL"
            lastDate={formatDate(latestVitals?.measuredAt || null)}
            trend={getTrend(latestVitals?.bloodSugar || null, previousVitals?.bloodSugar || null)}
            colorClass="bg-purple-100 dark:bg-purple-900/30"
            inputName="bloodSugar"
            inputValue={formData.bloodSugar}
            onInputChange={updateField('bloodSugar')}
            placeholder="100"
            min="20"
            max="600"
          />

          {/* Temperature */}
          <VitalCard
            title={t('vitals.temperature')}
            icon={<Thermometer className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
            currentValue={latestVitals?.temperature?.toString() || null}
            unit="°C"
            lastDate={formatDate(latestVitals?.measuredAt || null)}
            trend={getTrend(latestVitals?.temperature || null, previousVitals?.temperature || null)}
            colorClass="bg-orange-100 dark:bg-orange-900/30"
            inputName="temperature"
            inputValue={formData.temperature}
            onInputChange={updateField('temperature')}
            placeholder="36.5"
            step="0.1"
            min="30"
            max="45"
          />

          {/* Oxygen Saturation */}
          <VitalCard
            title={t('vitals.oxygenSaturation')}
            icon={<Wind className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
            currentValue={latestVitals?.oxygenSaturation?.toString() || null}
            unit="%"
            lastDate={formatDate(latestVitals?.measuredAt || null)}
            trend={null}
            colorClass="bg-cyan-100 dark:bg-cyan-900/30"
            inputName="oxygenSaturation"
            inputValue={formData.oxygenSaturation}
            onInputChange={updateField('oxygenSaturation')}
            placeholder="98"
            min="70"
            max="100"
          />
        </motion.div>

        {/* Observations */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t('vitals.observations')}
            </CardTitle>
            <CardDescription>
              {t('vitals.observationsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t('vitals.observationsPlaceholder')}
              value={formData.notes}
              onChange={(e) => updateField('notes')(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full h-14 text-lg gap-2"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {t('vitals.save')}
        </Button>

        {/* Tip */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {t('vitals.tip')}
        </p>
      </main>

      <Navigation />
    </div>
  );
}
