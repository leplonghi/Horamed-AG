import { useState } from "react";
import { Check, Search, HelpCircle, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFilteredMedicamentos } from "@/hooks/useMedicamentosBrasileiros";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

interface StepNameProps {
  name: string;
  onNameChange: (name: string) => void;
  onComplete: () => void;
}

export default function StepName({ name, onNameChange, onComplete }: StepNameProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { medicamentos } = useFilteredMedicamentos(name, 50);

  const { isRecording, isProcessing, toggleRecording } = useVoiceInput({
    onTranscription: (text) => {
      const cleanedName = text.trim().replace(/\.$/, '');
      if (cleanedName) {
        onNameChange(cleanedName);
        setOpen(true);
      }
    }
  });

  const handleSelect = (selectedName: string) => {
    onNameChange(selectedName);
    setOpen(false);
  };

  const isValid = name.trim().length >= 2;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <StepTooltip type="tip">
          {t('stepName.tooltip')}
        </StepTooltip>

        <div className="space-y-2">
          <Label htmlFor="med-name" className="text-sm font-medium flex items-center gap-2">
            {t('stepName.title')}
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p className="text-xs">{t('stepName.hint')}</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    "flex-1 justify-between h-14 text-left font-normal text-base border-2",
                    !name && "text-muted-foreground",
                    name && "border-primary/50 bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", name ? "bg-primary/10" : "bg-muted")}>
                      <Search className={cn("h-4 w-4", name ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <span className="truncate">{name || t('stepName.placeholder')}</span>
                  </div>
                  {name && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50" align="start">
                <Command shouldFilter={false}>
                  <CommandInput placeholder={t('stepName.placeholder')} value={name} onValueChange={onNameChange} className="h-12" />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty>
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">{t('stepName.notFound')}</p>
                        {name.length >= 2 && (
                          <Button size="sm" onClick={() => setOpen(false)} className="w-full">
                            ✓ {t('stepName.use')} "{name}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {medicamentos.map((med) => (
                        <CommandItem key={med.nome} value={med.nome} onSelect={() => handleSelect(med.nome)} className="py-3 cursor-pointer">
                          <Check className={cn("mr-2 h-4 w-4", name === med.nome ? "opacity-100 text-primary" : "opacity-0")} />
                          <span className="truncate">{med.nome}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={toggleRecording}
              disabled={isProcessing}
              className={cn("h-14 w-14 flex-shrink-0 transition-all", isRecording && "animate-pulse")}
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>

          {name && !open && (
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <Check className="h-4 w-4 text-primary" />
              <p className="text-sm"><span className="font-semibold text-primary">{name}</span></p>
            </div>
          )}
        </div>

        <Button onClick={onComplete} disabled={!isValid} className="w-full h-12 text-base font-semibold">
          {t('stepName.continue')}
        </Button>
      </div>
    </TooltipProvider>
  );
}
