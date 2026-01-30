import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Plus, X, Clock, Sun, Moon, Sunrise, Sunset, Bell, BellOff, Volume2, Check,
  Calendar, RefreshCw, Package, AlertTriangle, CheckCircle2, HelpCircle, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConditionalWizardStep } from "./ConditionalWizardStep";
import { AnimatePresence } from "framer-motion";

interface WizardData {
  frequency: "daily" | "specific_days" | "weekly";
  times: string[];
  daysOfWeek?: number[];
  continuousUse: boolean;
  startDate?: string;
  endDate?: string;
  notificationType?: "silent" | "push" | "alarm";
  controlStock: boolean;
  unitsTotal: number;
  unitLabel: string;
  lowStockThreshold: number;
}


interface WizardStepScheduleConditionalProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onOpenAdvancedEditor?: () => void;
}


const WEEK_DAYS_PT = [
  { value: 0, label: "D", fullLabel: "Dom" },
  { value: 1, label: "S", fullLabel: "Seg" },
  { value: 2, label: "T", fullLabel: "Ter" },
  { value: 3, label: "Q", fullLabel: "Qua" },
  { value: 4, label: "Q", fullLabel: "Qui" },
  { value: 5, label: "S", fullLabel: "Sex" },
  { value: 6, label: "S", fullLabel: "Sáb" },
];

const WEEK_DAYS_EN = [
  { value: 0, label: "S", fullLabel: "Sun" },
  { value: 1, label: "M", fullLabel: "Mon" },
  { value: 2, label: "T", fullLabel: "Tue" },
  { value: 3, label: "W", fullLabel: "Wed" },
  { value: 4, label: "T", fullLabel: "Thu" },
  { value: 5, label: "F", fullLabel: "Fri" },
  { value: 6, label: "S", fullLabel: "Sat" },
];


export function WizardStepScheduleConditional({ data, updateData, onOpenAdvancedEditor }: WizardStepScheduleConditionalProps) {
  const { t, language } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(1);

  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState("");

  const WEEK_DAYS = language === 'pt' ? WEEK_DAYS_PT : WEEK_DAYS_EN;

  const QUICK_TIMES = [
    { label: t('wizard.morning'), time: "08:00", icon: Sunrise, color: "text-orange-500" },
    { label: t('wizard.lunch'), time: "12:00", icon: Sun, color: "text-yellow-500" },
    { label: t('wizard.afternoon'), time: "18:00", icon: Sunset, color: "text-purple-500" },
    { label: t('wizard.night'), time: "22:00", icon: Moon, color: "text-blue-500" },
  ];

  const FREQUENCY_OPTIONS = [
    { value: "daily", label: t('wizard.daily'), description: t('wizard.dailyDesc'), emoji: "📅" },
    { value: "specific_days", label: t('wizard.specificDays'), description: t('wizard.specificDaysDesc'), emoji: "📆" },
    { value: "weekly", label: t('wizard.weekly'), description: t('wizard.weeklyDesc'), emoji: "🔄" },
  ];

  const unitOptions = [
    { value: "comprimidos", label: t('wizard.pills'), emoji: "💊" },
    { value: "cápsulas", label: t('wizard.capsules'), emoji: "💊" },
    { value: "gotas", label: t('wizard.drops'), emoji: "💧" },
    { value: "ml", label: t('wizard.ml'), emoji: "🧪" },
    { value: "unidades", label: t('wizard.units'), emoji: "📦" },
  ];

  // Step completion checks
  const isStep1Complete = data.continuousUse || (!data.continuousUse && data.startDate && data.endDate);
  const isStep2Complete = data.frequency !== undefined;
  const isStep3Complete = data.times.length > 0;
  const isStep4Complete = data.notificationType !== undefined;
  const isStep5Complete = !data.controlStock || (data.controlStock && data.unitsTotal > 0);

  // Summaries for collapsed steps
  const step1Summary = data.continuousUse
    ? t('wizard.continuousUse')
    : data.startDate && data.endDate
      ? `${new Date(data.startDate).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' })} → ${new Date(data.endDate).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' })}`
      : '';

  const step2Summary = FREQUENCY_OPTIONS.find(f => f.value === data.frequency)?.label || '';

  const step3Summary = data.times.length > 0
    ? data.times.join(', ')
    : '';

  const step4Summary = {
    silent: t('wizard.silent') || 'Silencioso',
    push: t('wizard.push') || 'Notificação',
    alarm: t('wizard.alarm') || 'Alarme',
  }[data.notificationType || 'push'];

  const step5Summary = data.controlStock
    ? `${data.unitsTotal} ${data.unitLabel}`
    : language === 'pt' ? 'Não controlar' : 'Not tracking';

  // Handlers
  const addQuickTime = (time: string) => {
    if (!data.times.includes(time)) {
      updateData({ times: [...data.times, time].sort() });
    }
  };

  const removeTime = (time: string) => {
    if (data.times.length > 1) {
      updateData({ times: data.times.filter((t) => t !== time) });
    }
  };

  const addCustomTime = () => {
    if (customTime && !data.times.includes(customTime)) {
      updateData({ times: [...data.times, customTime].sort() });
      setCustomTime("");
      setShowCustomTime(false);
    }
  };

  const toggleDay = (day: number) => {
    const currentDays = data.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    updateData({ daysOfWeek: newDays });
  };

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 5 && hour < 12) return Sunrise;
    if (hour >= 12 && hour < 17) return Sun;
    if (hour >= 17 && hour < 21) return Sunset;
    return Moon;
  };

  // Stock calculations
  const dosesPerDay = data.times.length || 1;
  const daysRemaining = data.unitsTotal > 0 ? Math.floor(data.unitsTotal / dosesPerDay) : 0;
  const percentRemaining = data.unitsTotal > 0 ? Math.min(100, (data.unitsTotal / (data.lowStockThreshold * 3)) * 100) : 0;
  const isLowStock = data.unitsTotal <= data.lowStockThreshold;

  const handleStepToggle = (stepNumber: number) => {
    setActiveStep(activeStep === stepNumber ? 0 : stepNumber);
  };

  const advanceToNextStep = (currentStep: number) => {
    setActiveStep(currentStep + 1);
  };

  return (
    <div className="space-y-6 pb-2">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6 px-1">
        {[1, 2, 3, 4, 5].map((step) => {
          const isComplete =
            step === 1 ? isStep1Complete :
              step === 2 ? isStep2Complete :
                step === 3 ? isStep3Complete :
                  step === 4 ? isStep4Complete :
                    isStep5Complete;

          const isVisible =
            step === 1 ? true :
              step === 2 ? isStep1Complete :
                step === 3 ? isStep1Complete && isStep2Complete :
                  step === 4 ? isStep1Complete && isStep2Complete && isStep3Complete :
                    isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete;

          return (
            <div
              key={step}
              className={cn(
                "h-2 rounded-full flex-1 transition-all duration-500 relative overflow-hidden",
                isComplete
                  ? "bg-accent-highlight shadow-[0_0_10px_rgba(var(--accent-highlight-rgb),0.5)]"
                  : isVisible
                    ? "bg-accent-highlight/30"
                    : "bg-muted/40"
              )}
            >
              {isComplete && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="sync">
        {/* Step 1: Treatment Duration */}
        <ConditionalWizardStep
          stepNumber={1}
          title={t('wizard.treatmentDuration') || 'Duração do Tratamento'}
          description={language === 'pt' ? 'Defina se é uso contínuo ou por período específico' : 'Set if continuous use or for a specific period'}
          helpText={language === 'pt' ? 'Uso contínuo é para medicamentos de uso permanente. Temporário é para tratamentos com data de término.' : 'Continuous is for permanent medications. Temporary is for treatments with an end date.'}
          icon={<Calendar className="h-4 w-4" />}
          isComplete={!!isStep1Complete}
          isVisible={true}
          isActive={activeStep === 1}
          summary={step1Summary}
          onToggle={() => handleStepToggle(1)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Temporary */}
              <button
                type="button"
                onClick={() => {
                  updateData({ continuousUse: false, startDate: new Date().toISOString().split('T')[0] });
                }}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 group",
                  !data.continuousUse
                    ? "border-accent-highlight bg-accent-highlight/5 shadow-lg shadow-accent-highlight/5 ring-1 ring-accent-highlight/20"
                    : "border-border/50 bg-background/50 hover:bg-muted/50 hover:border-primary/20"
                )}
              >
                <div className={cn(
                  "p-3 rounded-full transition-colors",
                  !data.continuousUse ? "bg-accent-highlight/20 text-accent-highlight-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className={cn("font-bold text-sm mb-0.5", !data.continuousUse ? "text-foreground" : "text-muted-foreground")}>{t('wizard.temporary') || 'Temporário'}</p>
                  <p className="text-[10px] text-muted-foreground/80">{t('wizard.temporaryDesc') || 'Por período'}</p>
                </div>
              </button>

              {/* Continuous */}
              <button
                type="button"
                onClick={() => {
                  updateData({ continuousUse: true });
                  advanceToNextStep(1);
                }}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 group",
                  data.continuousUse
                    ? "border-accent-highlight bg-accent-highlight/5 shadow-lg shadow-accent-highlight/5 ring-1 ring-accent-highlight/20"
                    : "border-border/50 bg-background/50 hover:bg-muted/50 hover:border-primary/20"
                )}
              >
                <div className={cn(
                  "p-3 rounded-full transition-colors",
                  data.continuousUse ? "bg-accent-highlight/20 text-accent-highlight-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className={cn("font-bold text-sm mb-0.5", data.continuousUse ? "text-foreground" : "text-muted-foreground")}>{t('wizard.continuousUse')}</p>
                  <p className="text-[10px] text-muted-foreground/80">{t('wizard.noEndDate')}</p>
                </div>
              </button>
            </div>

            {!data.continuousUse && (
              <div className="space-y-4 p-5 bg-muted/20 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t('wizard.start')}</Label>
                    <Input
                      type="date"
                      value={data.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => updateData({ startDate: e.target.value })}
                      className="h-12 bg-background border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t('wizard.end')}</Label>
                    <Input
                      type="date"
                      value={data.endDate || ""}
                      onChange={(e) => {
                        updateData({ endDate: e.target.value });
                        if (e.target.value) advanceToNextStep(1);
                      }}
                      className="h-12 bg-background border-border/50"
                    />
                  </div>
                </div>
                {data.startDate && data.endDate && (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full bg-accent-highlight text-accent-highlight-foreground hover:bg-accent-highlight/90 font-bold h-10 rounded-xl"
                    onClick={() => advanceToNextStep(1)}
                  >
                    {language === 'pt' ? 'Continuar' : 'Continue'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </ConditionalWizardStep>

        {/* Step 2: Frequency */}
        <ConditionalWizardStep
          stepNumber={2}
          title={t('wizard.frequency')}
          description={language === 'pt' ? 'Escolha com que frequência tomar este medicamento' : 'Choose how often to take this medication'}
          helpText={language === 'pt' ? 'Diário significa todos os dias. Dias específicos permite escolher quais dias da semana.' : 'Daily means every day. Specific days lets you choose which days of the week.'}
          icon={<RefreshCw className="h-4 w-4" />}
          isComplete={!!isStep2Complete}
          isVisible={!!isStep1Complete}
          isActive={activeStep === 2}
          summary={step2Summary}
          onToggle={() => handleStepToggle(2)}
        >
          <div className="space-y-3">
            {FREQUENCY_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  updateData({ frequency: opt.value as any });
                  if (opt.value !== "specific_days") {
                    advanceToNextStep(2);
                  }
                }}
                className={cn(
                  "relative p-4 cursor-pointer transition-all duration-300 rounded-xl border flex items-center gap-4 group overflow-hidden",
                  data.frequency === opt.value
                    ? "border-accent-highlight/50 bg-accent-highlight/5 ring-1 ring-accent-highlight/20"
                    : "border-transparent bg-muted/30 hover:bg-muted/50 hover:border-primary/20"
                )}
              >
                {data.frequency === opt.value && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-highlight" />}

                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-bold", data.frequency === opt.value ? "text-foreground" : "text-muted-foreground")}>{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground/80">{opt.description}</p>
                </div>
                {data.frequency === opt.value && (
                  <div className="w-5 h-5 rounded-full bg-accent-highlight flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent-highlight-foreground" strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}

            {/* Days of week selector */}
            {data.frequency === "specific_days" && (
              <div className="space-y-4 mt-4 p-4 bg-muted/20 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <Label className="text-sm font-bold block text-center mb-2">{t('wizard.whichDays')}</Label>
                <div className="flex gap-2 justify-center flex-wrap">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = (data.daysOfWeek || []).includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          "w-11 h-11 rounded-full font-bold text-sm transition-all shadow-sm active:scale-90",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-primary/25 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                            : "bg-background border border-border/50 hover:bg-muted text-muted-foreground"
                        )}
                        title={day.fullLabel}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                {(data.daysOfWeek?.length || 0) > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full mt-2 bg-accent-highlight text-accent-highlight-foreground hover:bg-accent-highlight/90 font-bold h-10 rounded-xl"
                    onClick={() => advanceToNextStep(2)}
                  >
                    {language === 'pt' ? 'Continuar' : 'Continue'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </ConditionalWizardStep>

        {/* Step 3: Times */}
        <ConditionalWizardStep
          stepNumber={3}
          title={t('wizard.times')}
          description={language === 'pt' ? 'Defina os horários para tomar o medicamento' : 'Set the times to take the medication'}
          helpText={language === 'pt' ? 'Adicione quantos horários forem necessários. Você pode usar os horários rápidos ou adicionar um personalizado.' : 'Add as many times as needed. You can use quick times or add a custom one.'}
          icon={<Clock className="h-4 w-4" />}
          isComplete={isStep3Complete}
          isVisible={isStep1Complete && isStep2Complete}
          isActive={activeStep === 3}
          summary={step3Summary}
          onToggle={() => handleStepToggle(3)}
        >
          <div className="space-y-5">
            {/* Selected times */}
            {data.times.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in-95 duration-300">
                {data.times.map((time) => {
                  const TimeIcon = getTimeIcon(time);
                  return (
                    <div
                      key={time}
                      className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-primary/10 border border-primary/20 rounded-full group"
                    >
                      <TimeIcon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-bold text-primary">{time}</span>
                      <button
                        type="button"
                        onClick={() => removeTime(time)}
                        className="p-1 hover:bg-destructive/20 rounded-full transition-colors ml-1"
                        disabled={data.times.length === 1}
                      >
                        <X className="w-3 h-3 text-primary/50 hover:text-destructive transition-colors" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick times */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide pl-1">{t('wizard.quickAdd') || 'Adição Rápida'}</Label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_TIMES.map((qt) => {
                  const isAdded = data.times.includes(qt.time);
                  const Icon = qt.icon;
                  return (
                    <Button
                      key={qt.time}
                      type="button"
                      variant={isAdded ? "default" : "outline"}
                      size="sm"
                      onClick={() => addQuickTime(qt.time)}
                      disabled={isAdded}
                      className={cn(
                        "flex-col h-auto py-3 gap-1.5 px-1 rounded-xl transition-all",
                        isAdded ? "opacity-50" : "hover:scale-105 hover:bg-accent/50 hover:border-primary/30"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", !isAdded && qt.color)} />
                      <span className="text-[10px] font-bold">{qt.label}</span>
                      <span className="text-[9px] opacity-70 bg-muted/50 px-1.5 rounded-full">{qt.time}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Custom time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px bg-border/50 flex-1" />
                <span className="text-xs text-muted-foreground font-medium uppercase">{t('common.or')}</span>
                <div className="h-px bg-border/50 flex-1" />
              </div>

              {showCustomTime ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in">
                  <Input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="flex-1 h-12 text-lg text-center font-bold tracking-widest bg-background border-primary/50 shadow-sm"
                    autoFocus
                  />
                  <Button type="button" onClick={addCustomTime} disabled={!customTime} className="h-12 w-12 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                    <Plus className="w-6 h-6" />
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowCustomTime(false)} className="h-12 w-12 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomTime(true)}
                  className="w-full h-12 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all rounded-xl"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {t('wizard.otherTime')}
                </Button>
              )}
            </div>

            {/* Advanced Editor Button */}
            {onOpenAdvancedEditor && data.times.length > 0 && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onOpenAdvancedEditor}
                  className="w-full h-12 border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-primary font-bold rounded-xl transition-all group"
                >
                  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  {language === 'pt' ? 'Gerenciar Alarmes Avançados' : 'Manage Advanced Alarms'}
                </Button>
              </div>
            )}

            {data.times.length > 0 && (
              <Button
                type="button"
                size="sm"
                className="w-full bg-accent-highlight text-accent-highlight-foreground hover:bg-accent-highlight/90 font-bold h-11 rounded-xl mt-2"
                onClick={() => advanceToNextStep(3)}
              >
                {language === 'pt' ? 'Continuar' : 'Continue'}
              </Button>
            )}

          </div>
        </ConditionalWizardStep>

        {/* Step 4: Notification Type */}
        <ConditionalWizardStep
          stepNumber={4}
          title={t('wizard.notificationType') || 'Tipo de Alerta'}
          description={language === 'pt' ? 'Como você quer ser lembrado?' : 'How do you want to be reminded?'}
          helpText={language === 'pt' ? 'Silencioso não faz som. Notificação toca o som padrão. Alarme toca um som alto e persistente.' : 'Silent makes no sound. Notification plays the default sound. Alarm plays a loud, persistent sound.'}
          icon={<Bell className="h-4 w-4" />}
          isComplete={isStep4Complete}
          isVisible={isStep1Complete && isStep2Complete && isStep3Complete}
          isActive={activeStep === 4}
          summary={step4Summary}
          onToggle={() => handleStepToggle(4)}
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'silent', icon: BellOff, label: t('wizard.silent') || 'Silencioso', desc: t('wizard.silentDesc') || 'Sem som' },
              { id: 'push', icon: Bell, label: t('wizard.push') || 'Notificação', desc: t('wizard.pushDesc') || 'Som padrão' },
              { id: 'alarm', icon: Volume2, label: t('wizard.alarm') || 'Alarme', desc: t('wizard.alarmDesc') || 'Som alto' },
            ].map((type) => {
              const isSelected = (data.notificationType || 'push') === type.id || (!data.notificationType && type.id === 'push');
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    updateData({ notificationType: type.id as any });
                    advanceToNextStep(4);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-3 p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                    isSelected
                      ? "border-accent-highlight bg-accent-highlight/5 shadow-lg shadow-accent-highlight/5 ring-1 ring-accent-highlight/20"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/20"
                  )}
                >
                  {isSelected && <div className="absolute top-0 right-0 p-1.5"><div className="w-1.5 h-1.5 rounded-full bg-accent-highlight shadow-sm shadow-accent-highlight" /></div>}

                  <div className={cn(
                    "p-3 rounded-full transition-colors",
                    isSelected ? "bg-accent-highlight/20 text-accent-highlight-foreground" : "bg-background text-muted-foreground group-hover:text-primary"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center w-full">
                    <p className={cn("font-bold text-xs mb-0.5", isSelected ? "text-foreground" : "text-muted-foreground")}>{type.label}</p>
                    <p className="text-[9px] text-muted-foreground/70 truncate w-full">{type.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </ConditionalWizardStep>

        {/* Step 5: Stock Control */}
        <ConditionalWizardStep
          stepNumber={5}
          title={language === 'pt' ? 'Controle de Estoque' : 'Stock Control'}
          description={language === 'pt' ? 'Receba alertas quando estiver acabando' : 'Get alerts when running low'}
          helpText={language === 'pt' ? 'Ative para receber lembretes de reposição antes de acabar seu medicamento.' : 'Enable to receive refill reminders before your medication runs out.'}
          icon={<Package className="h-4 w-4" />}
          isComplete={isStep5Complete}
          isVisible={isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete}
          isActive={activeStep === 5}
          summary={step5Summary}
          onToggle={() => handleStepToggle(5)}
        >
          <div className="space-y-5">
            {/* Enable/Disable Toggle */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl border transition-all",
              data.controlStock ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", data.controlStock ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{language === 'pt' ? 'Controlar estoque' : 'Track stock'}</p>
                  <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Receber alertas de reposição' : 'Receive refill alerts'}</p>
                </div>
              </div>
              <Switch
                checked={data.controlStock}
                onCheckedChange={(checked) => updateData({ controlStock: checked })}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {data.controlStock && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 px-1">
                {/* Quantity input */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{t('wizard.howMany')}</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        value={data.unitsTotal || ""}
                        onChange={(e) => updateData({ unitsTotal: parseInt(e.target.value) || 0 })}
                        className="text-3xl h-16 text-center font-bold bg-background border-border/50 shadow-sm rounded-xl focus-visible:ring-primary"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">total</span>
                    </div>

                    <Select value={data.unitLabel} onValueChange={(value) => updateData({ unitLabel: value })}>
                      <SelectTrigger className="h-16 w-36 rounded-xl border-border/50 bg-background shadow-sm text-base font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <span className="text-lg">{opt.emoji}</span>
                              <span className="text-sm font-medium">{opt.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Low stock threshold */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    {t('wizard.alertWhenRemaining')}
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
                    <Input
                      type="number"
                      min="1"
                      value={data.lowStockThreshold}
                      onChange={(e) => updateData({ lowStockThreshold: parseInt(e.target.value) || 5 })}
                      className="w-20 h-10 text-center text-lg font-bold bg-background border-border"
                    />
                    <span className="text-sm font-medium text-foreground">{data.unitLabel}</span>
                    <div className="h-4 w-px bg-border mx-2" />
                    <span className="text-xs text-muted-foreground flex-1 leading-tight">
                      {language === 'pt' ? 'Avisaremos quando atingir este nível.' : 'We\'ll notify you at this level.'}
                    </span>
                  </div>
                </div>

                {/* Stock preview */}
                {data.unitsTotal > 0 && (
                  <Card className={cn(
                    "p-4 space-y-3 overflow-hidden relative",
                    isLowStock
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-green-500/30 bg-green-500/5"
                  )}>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                        isLowStock ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                      )}>
                        {isLowStock ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className={cn("text-sm font-bold", isLowStock ? "text-destructive" : "text-green-700 dark:text-green-400")}>
                          {isLowStock ? t('wizard.lowStock') : t('wizard.stockOk')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.unitsTotal} {data.unitLabel} • ~{daysRemaining} {t('progress.days')}
                        </p>
                      </div>
                    </div>

                    <div className="relative pt-2">
                      <Progress
                        value={percentRemaining}
                        className={cn(
                          "h-2.5 bg-background/50",
                          isLowStock ? "[&>div]:bg-destructive" : "[&>div]:bg-green-500"
                        )}
                      />
                    </div>

                    {/* Background decoration */}
                    <div className={cn(
                      "absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-xl",
                      isLowStock ? "bg-destructive" : "bg-green-500"
                    )} />
                  </Card>
                )}
              </div>
            )}
          </div>
        </ConditionalWizardStep>
      </AnimatePresence>

      {/* Completion message */}
      {isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete && isStep5Complete && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl text-green-700 dark:text-green-400 animate-in fade-in slide-in-from-bottom-4 shadow-sm mt-4">
          <div className="p-2 bg-green-500/20 rounded-full shrink-0">
            <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">
              {language === 'pt' ? 'Tudo pronto!' : 'All set!'}
            </p>
            <p className="text-xs opacity-90">
              {language === 'pt' ? 'Clique em salvar para concluir.' : 'Click save to complete.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
