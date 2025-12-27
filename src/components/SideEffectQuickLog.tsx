import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useSideEffectsLog, COMMON_SIDE_EFFECTS, SideEffectInput } from "@/hooks/useSideEffectsLog";
import { toast } from "sonner";
import { Smile, Meh, Frown, Zap, Heart, Moon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface SideEffectQuickLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doseId?: string;
  itemId: string;
  itemName: string;
  profileId?: string;
}

export function SideEffectQuickLog({ 
  open, 
  onOpenChange, 
  doseId, 
  itemId, 
  itemName,
  profileId 
}: SideEffectQuickLogProps) {
  const { t, language } = useLanguage();
  const { createLog } = useSideEffectsLog();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [overallFeeling, setOverallFeeling] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [painLevel, setPainLevel] = useState<number>(3);
  const [nauseaLevel, setNauseaLevel] = useState<number>(3);
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const RATING_LABELS = {
    1: { label: language === 'pt' ? "Muito Ruim" : "Very Bad", icon: Frown, color: "text-destructive" },
    2: { label: language === 'pt' ? "Ruim" : "Bad", icon: Frown, color: "text-orange-500" },
    3: { label: "Ok", icon: Meh, color: "text-yellow-500" },
    4: { label: language === 'pt' ? "Bom" : "Good", icon: Smile, color: "text-green-500" },
    5: { label: language === 'pt' ? "Muito Bom" : "Very Good", icon: Smile, color: "text-success" },
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const input: SideEffectInput = {
        dose_id: doseId,
        item_id: itemId,
        profile_id: profileId,
        overall_feeling: overallFeeling,
        energy_level: energyLevel,
        pain_level: painLevel,
        nausea_level: nauseaLevel,
        sleep_quality: sleepQuality,
        side_effect_tags: selectedTags,
        notes: notes.trim() || undefined,
      };

      await createLog(input);
      toast.success(language === 'pt' ? "Efeitos registrados com sucesso!" : "Effects logged successfully!");
      onOpenChange(false);
      
      setOverallFeeling(3);
      setEnergyLevel(3);
      setPainLevel(3);
      setNauseaLevel(3);
      setSleepQuality(3);
      setSelectedTags([]);
      setNotes("");
    } catch (error) {
      console.error('Error creating side effect log:', error);
      toast.error(language === 'pt' ? "Erro ao registrar efeitos" : "Error logging effects");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const RatingSlider = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number[]) => void;
    icon: any;
  }) => {
    const currentRating = RATING_LABELS[value as keyof typeof RATING_LABELS];
    const IconComponent = currentRating.icon;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </Label>
          <div className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${currentRating.color}`} />
            <span className={`text-sm font-medium ${currentRating.color}`}>
              {currentRating.label}
            </span>
          </div>
        </div>
        <Slider
          value={[value]}
          onValueChange={onChange}
          min={1}
          max={5}
          step={1}
          className="py-4"
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{language === 'pt' ? 'Como você está se sentindo?' : 'How are you feeling?'}</DialogTitle>
          <DialogDescription>
            {language === 'pt' ? `Registre os efeitos após tomar ${itemName}` : `Log effects after taking ${itemName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <RatingSlider
              label={t('sideEffects.overallFeeling')}
              value={overallFeeling}
              onChange={(v) => setOverallFeeling(v[0])}
              icon={Heart}
            />
            <RatingSlider
              label={t('sideEffects.energy')}
              value={energyLevel}
              onChange={(v) => setEnergyLevel(v[0])}
              icon={Zap}
            />
            <RatingSlider
              label={t('sideEffects.pain')}
              value={painLevel}
              onChange={(v) => setPainLevel(v[0])}
              icon={Frown}
            />
            <RatingSlider
              label={t('sideEffects.nausea')}
              value={nauseaLevel}
              onChange={(v) => setNauseaLevel(v[0])}
              icon={Meh}
            />
            <RatingSlider
              label={t('sideEffects.sleep')}
              value={sleepQuality}
              onChange={(v) => setSleepQuality(v[0])}
              icon={Moon}
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'pt' ? 'Efeitos Colaterais (opcional)' : 'Side Effects (optional)'}</Label>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {COMMON_SIDE_EFFECTS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <motion.div
                      key={tag}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <Badge
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        {isSelected && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{language === 'pt' ? 'Observações (opcional)' : 'Notes (optional)'}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'pt' ? 'Descreva qualquer outro sintoma ou observação...' : 'Describe any other symptom or observation...'}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/500</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (language === 'pt' ? "Salvando..." : "Saving...") : (language === 'pt' ? "Salvar Registro" : "Save Log")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
