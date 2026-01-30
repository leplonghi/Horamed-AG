import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { auth, addDocument, fetchCollection, orderBy, limit, where } from "@/integrations/firebase";
import { toast } from "sonner";
import { Scale, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeightRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  onSuccess?: () => void;
}

export default function WeightRegistrationModal({
  open,
  onOpenChange,
  profileId,
  onSuccess,
}: WeightRegistrationModalProps) {
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const handleSave = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      toast.error(t('weightModal.invalidWeight'));
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error(t('weightModal.notAuthenticated'));

      const weightValue = parseFloat(weight);

      // Get previous weight for comparison (fetching from vitalSigns where weightKg is not null)
      // Note: Filter by weightKg > 0 is tricky in simple Firestore if mixed with other fields.
      // Easiest is to fetch latest vitalSigns and check weight.
      // But vitalSigns contains all types.
      // We'll trust Firestore composite index or just fetch latest few.
      // Actually, fetching latest 'vitalSigns' might give us a BP reading without weight.
      // We should really filter `where("weightKg", ">", 0)` but that requires index.
      // For now, let's just add the document and skip comparison logic if too complex without index,
      // OR try to fetch with `orderBy("measuredAt")` and client-side filter for previous weight.

      const { data: recentVitals } = await fetchCollection<any>(
        `users/${user.uid}/vitalSigns`,
        [
          orderBy("measuredAt", "desc"),
          limit(10)
          // We can't easily filter by profileId AND weightKg > 0 AND ordered by date without specific index.
        ]
      );

      // Find last weight in memory
      const previousLog = recentVitals?.find((v: any) =>
        v.weightKg && (profileId ? v.profileId === profileId : !v.profileId)
      );

      // Insert new weight log
      const logEntry = {
        userId: user.uid,
        profileId: profileId || null,
        weightKg: weightValue,
        notes: notes.trim() || null,
        measuredAt: date.toISOString(),
      };

      await addDocument(`users/${user.uid}/vitalSigns`, logEntry);

      // Update profile weight if this is for a profile
      if (profileId) {
        const { updateDocument } = await import("@/integrations/firebase");
        await updateDocument(`users/${user.uid}/profiles`, profileId, {
          weightKg: weightValue
        });
      }


      // Calculate difference
      let message = t('weightModal.success');
      if (previousLog?.weightKg) {
        const diff = weightValue - previousLog.weightKg;
        if (diff > 0) {
          message = t('weightModal.successGain', { diff: diff.toFixed(1) });
        } else if (diff < 0) {
          message = t('weightModal.successLoss', { diff: diff.toFixed(1) });
        }
      }

      toast.success(message);
      setWeight("");
      setNotes("");
      setDate(new Date());
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving weight:", error);
      toast.error(t('weightModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            {t('weightModal.title')}
          </DialogTitle>
          <DialogDescription>
            {t('weightModal.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-medium">
              {t('weightModal.date')} *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: dateLocale }) : <span>{t('weightModal.selectDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight" className="text-base font-medium">
              {t('weightModal.weight')} *
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              max="500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={language === 'pt' ? "Ex: 70.5" : "E.g.: 70.5"}
              className="text-2xl h-14 text-center"
              inputMode="decimal"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">
              {t('weightModal.notes')}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('weightModal.notesPlaceholder')}
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !weight}
            className="gap-2"
          >
            <Scale className="h-4 w-4" />
            {loading ? t('weightModal.saving') : t('weightModal.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
