import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import StepTooltip from "./StepTooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

type FrequencyType = "daily" | "specific_days" | "weekly" | "every_x_days" | "as_needed";

interface StepFrequencyProps {
  frequency: FrequencyType;
  daysOfWeek: number[];
  intervalDays?: number;
  onFrequencyChange: (freq: FrequencyType) => void;
  onDaysChange: (days: number[]) => void;
  onIntervalChange?: (days: number) => void;
  onComplete: () => void;
}

export default function StepFrequency({ 
  frequency, 
  daysOfWeek, 
  onFrequencyChange, 
  onDaysChange,
  onComplete
}: StepFrequencyProps) {
  const { t } = useLanguage();

  const frequencyOptions = [
    {
      value: "daily" as FrequencyType,
      label: t('wizard.everyDay'),
      emoji: "📅",
      description: t('wizard.everyDayDesc'),
      tooltip: t('wizard.everyDayTooltip')
    },
    {
      value: "specific_days" as FrequencyType,
      label: t('wizard.specificDaysLabel'),
      emoji: "📆",
      description: t('wizard.specificDaysLabelDesc'),
      tooltip: t('wizard.specificDaysTooltip')
    },
    {
      value: "weekly" as FrequencyType,
      label: t('wizard.weeklyLabel'),
      emoji: "🗓️",
      description: t('wizard.weeklyLabelDesc'),
      tooltip: t('wizard.weeklyTooltip')
    },
    {
      value: "as_needed" as FrequencyType,
      label: t('wizard.asNeeded'),
      emoji: "💡",
      description: t('wizard.asNeededDesc'),
      tooltip: t('wizard.asNeededTooltip')
    }
  ];

  const weekDays = [
    { value: 0, short: t('wizard.sun'), full: t('wizard.sunday') },
    { value: 1, short: t('wizard.mon'), full: t('wizard.monday') },
    { value: 2, short: t('wizard.tue'), full: t('wizard.tuesday') },
    { value: 3, short: t('wizard.wed'), full: t('wizard.wednesday') },
    { value: 4, short: t('wizard.thu'), full: t('wizard.thursday') },
    { value: 5, short: t('wizard.fri'), full: t('wizard.friday') },
    { value: 6, short: t('wizard.sat'), full: t('wizard.saturday') }
  ];

  const quickDayPresets = [
    { label: t('wizard.weekdays'), days: [1, 2, 3, 4, 5], tooltip: t('wizard.monToFri') },
    { label: t('wizard.weekends'), days: [0, 6], tooltip: t('wizard.satSun') },
    { label: t('wizard.alternating'), days: [1, 3, 5], tooltip: t('wizard.monWedFri') },
  ];

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      onDaysChange(daysOfWeek.filter(d => d !== day));
    } else {
      onDaysChange([...daysOfWeek, day].sort());
    }
  };

  const canContinue = frequency === "daily" || 
    frequency === "as_needed" ||
    (frequency === "specific_days" && daysOfWeek.length > 0) ||
    (frequency === "weekly" && daysOfWeek.length === 1);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <StepTooltip type="info">
          {t('wizard.frequencyTip')}
        </StepTooltip>

        {/* Frequency options */}
        <div className="space-y-2">
          {frequencyOptions.map((opt) => (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    onFrequencyChange(opt.value);
                    if (opt.value === "daily" || opt.value === "as_needed") {
                      onDaysChange([]);
                    }
                  }}
                  className={cn(
                    "relative w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                    frequency === opt.value 
                      ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/30 bg-background"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
                  </div>
                  {frequency === opt.value && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}
                  <HelpCircle className="h-4 w-4 text-muted-foreground absolute top-2 right-2" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                <p className="text-xs">{opt.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Day selector for specific days */}
        {(frequency === "specific_days" || frequency === "weekly") && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-sm font-medium flex items-center gap-2">
              {frequency === "weekly" ? t('wizard.whichDayOfWeek') : t('wizard.whichDaysOfWeek')}
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {frequency === "weekly" 
                      ? t('wizard.selectOneDay')
                      : t('wizard.selectDays')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>

            {/* Quick presets for specific days */}
            {frequency === "specific_days" && (
              <div className="flex flex-wrap gap-2 mb-3">
                {quickDayPresets.map((preset) => (
                  <Tooltip key={preset.label}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onDaysChange(preset.days)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full transition-all",
                          JSON.stringify(daysOfWeek.sort()) === JSON.stringify(preset.days.sort())
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border hover:border-primary/50"
                        )}
                      >
                        {preset.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{preset.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}

            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((day) => {
                const isSelected = daysOfWeek.includes(day.value);
                
                return (
                  <Tooltip key={day.value}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          if (frequency === "weekly") {
                            onDaysChange([day.value]);
                          } else {
                            toggleDay(day.value);
                          }
                        }}
                        className={cn(
                          "flex flex-col items-center py-2.5 px-1 rounded-lg text-xs font-semibold transition-all",
                          isSelected 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "bg-background border-2 hover:border-primary/50"
                        )}
                      >
                        {day.short}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{day.full}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {daysOfWeek.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                <span className="text-xs text-muted-foreground">{t('wizard.selected')}:</span>
                <span className="text-sm font-medium text-primary">
                  {daysOfWeek.map(d => weekDays[d].full).join(", ")}
                </span>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={onComplete}
          disabled={!canContinue}
          className="w-full h-12 text-base font-semibold"
        >
          {t('wizard.continue')}
        </Button>
      </div>
    </TooltipProvider>
  );
}