import { useState } from "react";
import { Plus, Trash2, Clock, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StepTimesProps {
  times: string[];
  onTimesChange: (times: string[]) => void;
  onComplete: () => void;
}

const quickPresets = [
  { 
    label: "1x ao dia", 
    times: ["08:00"],
    description: "Pela manhã",
    emoji: "🌅"
  },
  { 
    label: "2x ao dia", 
    times: ["08:00", "20:00"],
    description: "Manhã e noite",
    emoji: "🌅🌙"
  },
  { 
    label: "3x ao dia", 
    times: ["08:00", "14:00", "20:00"],
    description: "Manhã, tarde, noite",
    emoji: "🌅☀️🌙"
  },
  { 
    label: "4x ao dia", 
    times: ["08:00", "12:00", "16:00", "20:00"],
    description: "A cada 4 horas",
    emoji: "⏰"
  },
];

const intervalPresets = [
  { hours: 6, label: "6 em 6h", times: ["06:00", "12:00", "18:00", "00:00"] },
  { hours: 8, label: "8 em 8h", times: ["08:00", "16:00", "00:00"] },
  { hours: 12, label: "12 em 12h", times: ["08:00", "20:00"] },
];

export default function StepTimes({ times, onTimesChange, onComplete }: StepTimesProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [showIntervals, setShowIntervals] = useState(false);

  const addTime = () => {
    onTimesChange([...times, "12:00"]);
  };

  const removeTime = (index: number) => {
    onTimesChange(times.filter((_, i) => i !== index));
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    onTimesChange(newTimes);
  };

  const selectPreset = (presetTimes: string[]) => {
    onTimesChange([...presetTimes]);
    setShowCustom(false);
    setShowIntervals(false);
  };

  const isPresetSelected = (presetTimes: string[]) => {
    return JSON.stringify([...times].sort()) === JSON.stringify([...presetTimes].sort());
  };

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 5 && hour < 12) return "🌅";
    if (hour >= 12 && hour < 18) return "☀️";
    if (hour >= 18 && hour < 21) return "🌆";
    return "🌙";
  };

  const getTimePeriod = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 5 && hour < 12) return "Manhã";
    if (hour >= 12 && hour < 18) return "Tarde";
    if (hour >= 18 && hour < 21) return "Noite";
    return "Madrugada";
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <StepTooltip type="tip">
          Escolha quantas vezes ao dia você toma este medicamento. Você pode usar uma opção rápida ou personalizar os horários.
        </StepTooltip>

        {/* Quick presets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            Opções rápidas
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Clique para definir os horários automaticamente</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {quickPresets.map((preset) => (
              <Tooltip key={preset.label}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => selectPreset(preset.times)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 text-left transition-all",
                      isPresetSelected(preset.times)
                        ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30 bg-background hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{preset.emoji}</span>
                      <div>
                        <p className="font-semibold text-sm">{preset.label}</p>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      </div>
                    </div>
                    {isPresetSelected(preset.times) && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Horários: {preset.times.join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Interval presets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            Intervalos fixos
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Para medicamentos que precisam de intervalo regular</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {intervalPresets.map((preset) => (
              <Tooltip key={preset.label}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => selectPreset(preset.times)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all text-center",
                      isPresetSelected(preset.times)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-background border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {preset.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Horários: {preset.times.join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Custom times toggle - MORE PROMINENT */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">ou</span>
          </div>
        </div>

        <Button 
          type="button"
          variant={showCustom ? "default" : "outline"}
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            "w-full h-12 transition-all",
            showCustom 
              ? "bg-primary text-primary-foreground" 
              : "border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
          )}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          <span className="font-semibold">Personalizar horários</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 ml-2 opacity-70" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Defina horários específicos manualmente</p>
            </TooltipContent>
          </Tooltip>
        </Button>

        {/* Custom time inputs */}
        {showCustom && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-sm font-medium">Seus horários personalizados</Label>
            <div className="space-y-2">
              {times.map((time, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-background rounded-lg border">
                  <span className="text-xl">{getTimeIcon(time)}</span>
                  <div className="flex-1">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      className="border-0 p-0 h-8 text-lg font-medium"
                    />
                    <p className="text-xs text-muted-foreground">{getTimePeriod(time)}</p>
                  </div>
                  {times.length > 1 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTime(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Remover este horário</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTime}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar outro horário
            </Button>
          </div>
        )}

        {/* Summary */}
        <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
          <span className="text-sm font-medium w-full mb-1">Resumo dos horários:</span>
          {[...times].sort().map((time, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {getTimeIcon(time)} {time}
            </span>
          ))}
        </div>

        <Button 
          onClick={onComplete}
          disabled={times.length === 0}
          className="w-full h-12 text-base font-semibold"
        >
          Continuar
        </Button>
      </div>
    </TooltipProvider>
  );
}
