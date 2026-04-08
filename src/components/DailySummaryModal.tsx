import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { safeDateParse } from "@/lib/safeDateUtils";
import { auth, db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

interface PendingDose {
  id: string;
  name: string;
}

export default function DailySummaryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDoses, setPendingDoses] = useState<PendingDose[]>([]);
  const { t, language } = useLanguage();

  useEffect(() => {
    const now = new Date();
    if (now.getHours() === 22) {
      checkPendingDoses();
    }
  }, []);

  const checkPendingDoses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = safeDateParse(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dosesSnap = await getDocs(
        query(
          collection(db, "dose_instances"),
          where("user_id", "==", user.uid),
          where("due_at", ">=", Timestamp.fromDate(today)),
          where("due_at", "<", Timestamp.fromDate(tomorrow)),
          where("status", "==", "pending")
        )
      );

      if (dosesSnap.empty) return;

      const doses = dosesSnap.docs.map(d => ({ id: d.id, ...d.data() as { item_id: string } }));
      const itemIds = [...new Set(doses.map(d => d.item_id))];

      const itemsSnap = await getDocs(
        query(collection(db, "items"), where("__name__", "in", itemIds.slice(0, 30)))
      );
      const itemMap = new Map(itemsSnap.docs.map(d => [d.id, (d.data() as { name: string }).name]));

      setPendingDoses(
        doses.map(d => ({
          id: d.id,
          name: itemMap.get(d.item_id) ?? (language === 'pt' ? "Medicamento" : "Medication"),
        }))
      );
      setIsOpen(true);
    } catch (error) {
      console.error("Error checking pending doses:", error);
    }
  };

  const updateDosesStatus = async (status: string, extra?: Record<string, unknown>) => {
    try {
      const batch = writeBatch(db);
      for (const dose of pendingDoses) {
        batch.update(doc(db, "dose_instances", dose.id), { status, ...extra });
      }
      await batch.commit();
    } catch (error) {
      console.error("Error updating doses:", error);
      throw error;
    }
  };

  const handleMarkAllTaken = async () => {
    try {
      await updateDosesStatus("taken", { taken_at: new Date().toISOString() });
      toast.success(t('dailySummary.allMarkedTaken'));
      setIsOpen(false);
    } catch {
      toast.error(t('dailySummary.errorMarking'));
    }
  };

  const handleMarkAllMissed = async () => {
    try {
      await updateDosesStatus("missed");
      toast(t('dailySummary.markedMissed'));
      setIsOpen(false);
    } catch {
      toast.error(t('dailySummary.errorMarking'));
    }
  };

  if (pendingDoses.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dailySummary.title')}</DialogTitle>
          <DialogDescription className="pt-2">
            {t('dailySummary.description', {
              count: String(pendingDoses.length),
              plural: pendingDoses.length > 1 ? 's' : ''
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {pendingDoses.slice(0, 3).map(dose => (
            <div key={dose.id} className="p-2 bg-muted rounded-lg text-sm">
              • {dose.name}
            </div>
          ))}
          {pendingDoses.length > 3 && (
            <div className="text-sm text-muted-foreground text-center">
              {t('dailySummary.andMore', { count: String(pendingDoses.length - 3) })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleMarkAllTaken} className="w-full">
            {t('dailySummary.tookAll')}
          </Button>
          <Button onClick={handleMarkAllMissed} variant="outline" className="w-full">
            {t('dailySummary.didNotTake')}
          </Button>
          <Button onClick={() => setIsOpen(false)} variant="ghost" className="w-full">
            {t('dailySummary.leaveAsIs')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
