import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Pill, Leaf, Heart, Package, Check, ChevronsUpDown, Search, Zap, Moon, Shield, Droplets, Dumbbell, Bell, Sparkles } from "lucide-react";
import { useFilteredMedicamentos } from "@/hooks/useMedicamentosBrasileiros";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotificationTypes, NotificationType } from "@/hooks/useNotificationTypes";

interface WizardStepIdentityProps {
  data: {
    name: string;
    category: string;
    notes: string;
    supplementCategory?: string;
    doseText?: string;
    withFood?: boolean;
    notificationType?: string;
  };
  updateData: (data: Partial<any>) => void;
}

export function WizardStepIdentity({ data, updateData }: WizardStepIdentityProps) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { getAllNotificationTypes } = useNotificationTypes();
  const notificationTypes = getAllNotificationTypes();

  const supplementCategories = [
    { value: "energy", label: t('wizard.energy'), icon: Zap, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30", description: t('wizard.energyDesc') },
    { value: "sleep", label: t('wizard.sleep'), icon: Moon, color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30", description: t('wizard.sleepDesc') },
    { value: "immunity", label: t('wizard.immunity'), icon: Shield, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950/30", description: t('wizard.immunityDesc') },
    { value: "performance", label: t('wizard.performance'), icon: Dumbbell, color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30", description: t('wizard.performanceDesc') },
    { value: "hydration", label: t('wizard.hydration'), icon: Droplets, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30", description: t('wizard.hydrationDesc') },
  ];

  const categories = [
    {
      value: "medicamento",
      label: t('wizard.medication'),
      icon: Pill,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      description: t('wizard.medicationDesc')
    },
    {
      value: "vitamina",
      label: t('wizard.vitamin'),
      icon: Leaf,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      description: t('wizard.vitaminDesc')
    },
    {
      value: "suplemento",
      label: t('wizard.supplement'),
      icon: Heart,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      description: t('wizard.supplementDesc')
    },
    {
      value: "outro",
      label: t('wizard.other'),
      icon: Package,
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-950/30",
      borderColor: "border-gray-200 dark:border-gray-800",
      description: t('wizard.otherDesc')
    },
  ];

  const { medicamentos, loading } = useFilteredMedicamentos(searchTerm, 50);

  const detectCategory = (medName: string): string => {
    const nameLower = medName.toLowerCase();

    if (nameLower.includes('vitamina') ||
      nameLower.includes('vit.') ||
      nameLower.includes('complexo b') ||
      nameLower.match(/\bvit\s*[abcdek]/)) {
      return 'vitamina';
    }

    if (nameLower.includes('suplemento') ||
      nameLower.includes('whey') ||
      nameLower.includes('creatina') ||
      nameLower.includes('omega') ||
      nameLower.includes('colageno') ||
      nameLower.includes('probiotico')) {
      return 'suplemento';
    }

    return 'medicamento';
  };

  const handleSelectMedication = (selectedName: string) => {
    const category = detectCategory(selectedName);
    updateData({
      name: selectedName,
      category: category
    });
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Nome do medicamento */}
      <div className="space-y-4">
        <Label className="text-lg font-bold flex items-center gap-2 text-foreground/90">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
          {t('wizard.medicationName')}
          <span className="text-destructive">*</span>
        </Label>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full h-14 px-4 text-lg justify-between text-left font-normal rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-all group",
                data.name ? "border-primary bg-primary/5 text-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Search className={cn("h-5 w-5 shrink-0 transition-colors", data.name ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                <span className="truncate">
                  {data.name || t('wizard.searchMedication')}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-3rem)] max-w-[400px] p-0 rounded-xl overflow-hidden shadow-2xl border-white/10" align="start">
            <Command shouldFilter={false} className="bg-popover/95 backdrop-blur-xl">
              <CommandInput
                placeholder={t('wizard.typeName')}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-12 text-base"
              />
              <CommandList className="max-h-[250px]">
                <CommandEmpty className="py-8 text-center text-sm flex flex-col items-center">
                  {loading ? (
                    <span className="text-muted-foreground animate-pulse">{t('wizard.searching')}</span>
                  ) : searchTerm.length < 2 ? (
                    <span className="text-muted-foreground">{t('wizard.typeAtLeast2')}</span>
                  ) : (
                    <div className="space-y-3 px-4">
                      <p className="text-muted-foreground">{t('wizard.notFoundInList')}</p>
                      <Button
                        size="sm"
                        className="w-full bg-accent-highlight text-accent-highlight-foreground hover:bg-accent-highlight/90 font-bold"
                        onClick={() => {
                          updateData({ name: searchTerm });
                          setOpen(false);
                        }}
                      >
                        {t('wizard.use')} "{searchTerm}"
                      </Button>
                    </div>
                  )}
                </CommandEmpty>
                {searchTerm.length >= 2 && (
                  <CommandGroup heading="Sugestões" className="p-2">
                    {medicamentos.map((med) => (
                      <CommandItem
                        key={med.nome}
                        value={med.nome}
                        onSelect={() => handleSelectMedication(med.nome)}
                        className="py-3 px-3 rounded-lg cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary"
                      >
                        <Check
                          className={cn(
                            "mr-3 h-4 w-4 text-primary",
                            data.name === med.nome ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate font-medium">{med.nome}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Input manual alternativo (fallback visual) */}
        {!open && (
          <p className="text-xs text-muted-foreground pl-1">
            {t('wizard.typeManuallyDesc') || 'Digite o nome para pesquisar ou criar.'}
          </p>
        )}
      </div>

      {/* Categoria */}
      <div className="space-y-4">
        <Label className="text-lg font-bold flex items-center gap-2 text-foreground/90">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
          {t('wizard.type')}
        </Label>

        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = data.category === cat.value;
            return (
              <div
                key={cat.value}
                onClick={() => updateData({ category: cat.value })}
                className={cn(
                  "relative p-4 cursor-pointer transition-all duration-300 rounded-2xl border flex flex-col gap-3 group overflow-hidden",
                  isSelected
                    ? `bg-background/80 border-${cat.color.split('-')[1]}-500 shadow-lg scale-[1.02] ring-1 ring-${cat.color.split('-')[1]}-500/20`
                    : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border/50"
                )}
              >
                {isSelected && (
                  <div className={cn("absolute inset-0 opacity-10 pointer-events-none", cat.bgColor)} />
                )}
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    isSelected ? cat.bgColor : "bg-white/10 dark:bg-white/5"
                  )}>
                    <Icon className={cn("w-5 h-5", isSelected ? cat.color : "text-muted-foreground")} />
                  </div>
                  {isSelected && (
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", cat.bgColor)}>
                      <Check className={cn("w-3 h-3 stroke-[3]", cat.color)} />
                    </div>
                  )}
                </div>
                <div>
                  <span className={cn("font-bold text-sm block mb-0.5", isSelected ? "text-foreground" : "text-muted-foreground")}>
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 leading-tight block">
                    {cat.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categoria do Suplemento - Animated reveal */}
      <div className={cn("transition-all duration-300 overflow-hidden", (data.category === 'vitamina' || data.category === 'suplemento') ? "max-h-40 opacity-100" : "max-h-0 opacity-0")}>
        <div className="space-y-3 p-4 bg-muted/20 border border-white/5 rounded-2xl">
          <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {t('wizard.whatFor')}
          </Label>

          <div className="flex flex-wrap gap-2">
            {supplementCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = data.supplementCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => updateData({
                    supplementCategory: isSelected ? undefined : cat.value
                  })}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground" : cat.color)} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dose & Food Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Dose */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-foreground/90">{t('wizard.dose') || 'Dose'}</Label>
          <Input
            placeholder={t('wizard.dosePlaceholder') || 'Ex: 1 caps'}
            value={data.doseText || ''}
            onChange={(e) => updateData({ doseText: e.target.value })}
            className="h-12 bg-background/50 border-border/50 text-base"
          />
        </div>

        {/* Tomar com comida - Card Style */}
        <div className="space-y-2">
          <Label className="hidden sm:block text-base font-semibold opacity-0">Spacer</Label>
          <div
            className={cn(
              "flex items-center justify-between p-2 pl-3 pr-3 h-12 rounded-xl border transition-all cursor-pointer",
              data.withFood
                ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/30"
                : "bg-background/50 border-border/50 hover:bg-muted/50"
            )}
            onClick={() => updateData({ withFood: !data.withFood })}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🍽️</span>
              <span className={cn("text-sm font-medium", data.withFood ? "text-orange-700 dark:text-orange-400" : "text-muted-foreground")}>
                {t('wizard.withFood') || 'Com comida'}
              </span>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
              data.withFood ? "bg-orange-500 border-orange-500" : "border-muted-foreground/30"
            )}>
              {data.withFood && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
          </div>
        </div>
      </div>

      {/* Tipo de Alerta */}
      <div className="space-y-4">
        <Label className="text-lg font-bold flex items-center gap-2 text-foreground/90">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">3</span>
          {language === 'pt' ? 'Tipo de Alerta' : 'Alert Type'}
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {notificationTypes.map((type) => {
            const isSelected = (data.notificationType || 'normal') === type.value;
            return (
              <div
                key={type.value}
                onClick={() => updateData({ notificationType: type.value })}
                className={cn(
                  "p-3 cursor-pointer transition-all rounded-xl border flex items-start gap-3 relative overflow-hidden",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent bg-muted/40 hover:bg-muted/60"
                )}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

                <div
                  className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: isSelected ? type.color : 'transparent', border: isSelected ? 'none' : '1px solid currentColor', opacity: isSelected ? 1 : 0.3 }}
                >
                  {/* Simplified icon representation using color dot for now to match logic */}
                  {!isSelected && <div className="w-2 h-2 rounded-full bg-foreground" />}
                  {isSelected && <Bell className="w-4 h-4 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-bold", isSelected ? "text-foreground" : "text-muted-foreground")}>{type.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {type.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2 pt-2">
        <Label className="text-sm font-medium flex justify-between">
          {t('wizard.notes')}
          <span className="text-xs text-muted-foreground font-normal">{data.notes.length}/200</span>
        </Label>
        <Textarea
          placeholder={t('wizard.notesPlaceholder')}
          value={data.notes}
          onChange={(e) => updateData({ notes: e.target.value.slice(0, 200) })}
          rows={2}
          className="resize-none text-sm min-h-[80px] bg-background/50 border-border/50 focus:bg-background transition-all"
        />
      </div>
    </div>
  );
}
