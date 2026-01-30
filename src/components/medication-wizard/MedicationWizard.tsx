import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Calendar, ChevronDown, Camera, Upload, Edit3, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WizardStepIdentity } from "./WizardStepIdentity";
import { WizardStepScheduleConditional } from "./WizardStepScheduleConditional";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSubscription } from "@/hooks/useSubscription";
import { auth, functions, httpsCallable, fetchDocument, fetchCollection, addDocument, updateDocument, deleteDocument, where } from "@/integrations/firebase";
import { toast } from "sonner";
import PaywallDialog from "@/components/PaywallDialog";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import UpgradeModal from "@/components/UpgradeModal";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationScheduleEditor, { NotificationSchedule } from "@/components/notifications/NotificationScheduleEditor";


interface MedicationData {
  name: string;
  category: string;
  notes: string;
  supplementCategory?: string;
  doseText: string;
  withFood: boolean;
  frequency: "daily" | "specific_days" | "weekly";
  times: string[];
  daysOfWeek?: number[];
  continuousUse: boolean;
  startDate?: string;
  endDate?: string;
  unitsTotal: number;
  unitLabel: string;
  lowStockThreshold: number;
  notificationType: "silent" | "push" | "alarm";
  controlStock: boolean;
}

interface MedicationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItemId?: string;
}

const INITIAL_DATA: MedicationData = {
  name: "",
  category: "medicamento",
  notes: "",
  doseText: "",
  withFood: false,
  frequency: "daily",
  times: ["08:00"],
  continuousUse: false,
  unitsTotal: 30,
  unitLabel: "comprimidos",
  lowStockThreshold: 5,
  notificationType: "push",
  controlStock: false,
};

export default function MedicationWizard({ open, onOpenChange, editItemId }: MedicationWizardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeProfile } = useUserProfiles();
  const { subscription, loading: subLoading, hasFeature } = useSubscription();
  const { t } = useLanguage();

  const urlEditId = searchParams.get("edit");
  const itemIdToEdit = editItemId || urlEditId;
  const isEditing = !!itemIdToEdit;

  const prefillData = location.state?.prefillData;

  // Step 0 = seleção de método, 1 = identidade, 2 = horários
  const [currentStep, setCurrentStep] = useState(isEditing ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [showPaywall, setShowPaywall] = useState(false);
  const [medicationData, setMedicationData] = useState<MedicationData>(INITIAL_DATA);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [notificationSchedules, setNotificationSchedules] = useState<NotificationSchedule[]>([]);


  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemIdToEdit && open) {
      loadItemData(itemIdToEdit);
    }
  }, [itemIdToEdit, open]);

  useEffect(() => {
    if (prefillData) {
      setMedicationData(prev => ({
        ...prev,
        name: prefillData.name || prev.name,
        category: prefillData.category || prev.category,
        notes: prefillData.notes || prev.notes,
        doseText: prefillData.doseText || prev.doseText,
      }));
    }
  }, [prefillData]);

  // Sync notification schedules when times change
  useEffect(() => {
    if (medicationData.times.length > 0 && notificationSchedules.length === 0) {
      // Initialize schedules from times if not already set
      const initialSchedules: NotificationSchedule[] = medicationData.times.map((time, index) => ({
        id: `schedule-${Date.now()}-${index}`,
        time,
        type: medicationData.notificationType || "push",
        vibrate: true,
        sound: "default",
        enabled: true,
      }));
      setNotificationSchedules(initialSchedules);
    }
  }, [medicationData.times, medicationData.notificationType]);


  const loadItemData = async (itemId: string) => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { data: item } = await fetchDocument<any>(`users/${user.uid}/medications`, itemId);
      if (!item) throw new Error("Item not found");

      // Fetch Schedules
      const { data: schedules } = await fetchCollection<any>(
        `users/${user.uid}/schedules`,
        [where('itemId', '==', itemId)]
      );
      const schedule = schedules && schedules.length > 0 ? schedules[0] : null;

      // Fetch Stock
      const { data: stockRecords } = await fetchCollection<any>(
        `users/${user.uid}/stock`,
        [where('itemId', '==', itemId)]
      );
      const stock = stockRecords && stockRecords.length > 0 ? stockRecords[0] : null;

      const freqType = schedule?.freqType as "daily" | "specific_days" | "weekly" | undefined;
      const scheduleTimes = Array.isArray(schedule?.times)
        ? schedule.times.map((t: unknown) => String(t))
        : ["08:00"];

      setMedicationData({
        name: item.name || "",
        category: item.category || "medicamento",
        notes: item.notes || "",
        doseText: item.doseText || "",
        withFood: item.withFood || false,
        frequency: freqType || "daily",
        times: scheduleTimes,
        daysOfWeek: schedule?.daysOfWeek || [],
        continuousUse: !item.treatmentEndDate,
        startDate: item.treatmentStartDate || "",
        endDate: item.treatmentEndDate || "",
        unitsTotal: stock?.currentQty || stock?.unitsTotal || 30,
        unitLabel: stock?.unitLabel || "comprimidos",
        lowStockThreshold: 5,
        notificationType: (item.notificationType as "silent" | "push" | "alarm") || "push",
        controlStock: !!(stock?.unitsTotal),
      });

      // Load advanced notification settings from Firestore
      const { data: savedSettings } = await fetchCollection<any>(
        `users/${user.uid}/notificationSettings`,
        [where('itemId', '==', itemId)]
      );

      // Initialize notification schedules from saved settings or create defaults
      let initialSchedules: NotificationSchedule[];

      if (savedSettings && savedSettings.length > 0) {
        // Use saved advanced settings
        initialSchedules = savedSettings.map((setting, index) => ({
          id: setting.id || `schedule-${index}`,
          time: setting.time,
          type: setting.type || "push",
          vibrate: setting.vibrate !== undefined ? setting.vibrate : true,
          sound: setting.sound || "default",
          enabled: setting.enabled !== undefined ? setting.enabled : true,
          label: setting.label || undefined,
        }));
      } else {
        // Create default schedules from times
        initialSchedules = scheduleTimes.map((time, index) => ({
          id: `schedule-${index}`,
          time,
          type: (item.notificationType as "silent" | "push" | "alarm") || "push",
          vibrate: true,
          sound: "default",
          enabled: true,
        }));
      }

      setNotificationSchedules(initialSchedules);

      // Se já existir estoque, marcar controlStock como true nos dados
      if (stock?.unitsTotal) {
        setMedicationData(prev => ({ ...prev, controlStock: true }));
      }
    } catch (error) {
      console.error("Error loading item:", error);
      toast.error(t('wizard.loadError'));
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset step when opening (only for new items)
  useEffect(() => {
    if (open && !isEditing) {
      setCurrentStep(0);
      setMedicationData(INITIAL_DATA);
      setOcrPreview(null);
    }
  }, [open, isEditing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setOcrPreview(base64);
        processOCR(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processOCR = async (imageData: string) => {
    setProcessingOCR(true);
    try {
      const extractMedication = httpsCallable(functions, 'extractMedication');
      const { data }: any = await extractMedication({ image: imageData });

      if (data?.name) {
        // Create the medication immediately with extracted data and redirect to edit
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const medData = {
          userId: user.uid,
          profileId: activeProfile?.id,
          name: data.name,
          category: data.category || "medicamento",
          doseText: data.dose || null,
          isActive: true,
          notificationType: "push",
          treatmentDurationDays: data.duration_days || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const { data: newId, error: itemError } = await addDocument(`users/${user.uid}/medications`, medData);
        if (itemError) throw itemError;
        const itemId = newId as unknown as string;

        // Create default schedule
        await addDocument(`users/${user.uid}/schedules`, {
          itemId: itemId,
          userId: user.uid,
          times: ["08:00"],
          freqType: "daily",
          daysOfWeek: [],
        });

        const extractedInfo = [];
        if (data.name) extractedInfo.push(data.name);
        if (data.dose) extractedInfo.push(data.dose);

        toast.success(`${t('wizard.createdComplete')}: ${extractedInfo.join(' - ')}`);
        onOpenChange(false);
        navigate(`/adicionar?edit=${itemId}`);
      } else {
        toast.error(t('wizard.couldNotIdentify'));
        setCurrentStep(1);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error(t('wizard.imageError'));
      setCurrentStep(1);
    } finally {
      setProcessingOCR(false);
      setOcrPreview(null);
    }
  };

  const handleMethodSelect = (method: "camera" | "upload" | "manual") => {
    if (method === "manual") {
      setCurrentStep(1);
      return;
    }

    if (!hasFeature("ocr")) {
      setShowUpgradeModal(true);
      return;
    }

    if (method === "camera") {
      cameraInputRef.current?.click();
    } else if (method === "upload") {
      fileInputRef.current?.click();
    }
  };

  const updateData = (partialData: Partial<MedicationData>) => {
    setMedicationData(prev => ({ ...prev, ...partialData }));
  };

  const handleSaveSchedules = (schedules: NotificationSchedule[]) => {
    setNotificationSchedules(schedules);
    // Update times in medicationData with enabled schedules only
    const enabledTimes = schedules.filter(s => s.enabled).map(s => s.time);
    updateData({ times: enabledTimes });
    toast.success(t('scheduler.schedulesUpdated'));
  };


  const checkMedicationLimit = async (): Promise<boolean> => {
    if (isEditing) return true;
    if (subLoading) return false;

    const planType = subscription?.planType || 'free';
    const status = subscription?.status || 'active';

    if (planType === 'premium' && status === 'active') return true;

    const user = auth.currentUser;
    if (!user) return false;

    try {
      const { data: meds } = await fetchCollection(`users/${user.uid}/medications`, [
        where('isActive', '==', true),
        where('profileId', '==', activeProfile?.id || '')
      ]);

      const count = meds ? meds.length : 0;

      if (count >= 1) { // Free limit is 1? Check logic.
        setShowPaywall(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking medication limit:', error);
      return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!medicationData.name.trim()) {
        toast.error(t('wizard.enterMedName'));
        return;
      }
      const canProceed = await checkMedicationLimit();
      if (!canProceed) return;
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (medicationData.times.length === 0) {
        toast.error(t('wizard.addOneTime'));
        return;
      }
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      const treatmentEndDate = medicationData.continuousUse
        ? null
        : medicationData.endDate
          ? medicationData.endDate
          : null;

      const medData = {
        userId: user.uid,
        name: medicationData.name,
        category: medicationData.category,
        notes: medicationData.notes || null,
        doseText: medicationData.doseText || null,
        withFood: medicationData.withFood,
        treatmentStartDate: medicationData.startDate || new Date().toISOString().split('T')[0],
        treatmentEndDate: treatmentEndDate,
        notificationType: medicationData.notificationType,
        profileId: activeProfile?.id || null, // Ensure profileId is saved
        updatedAt: new Date().toISOString()
      };

      let itemId = isEditing ? itemIdToEdit : null;

      if (isEditing && itemId) {
        // Update existing item
        await updateDocument(`users/${user.uid}/medications`, itemId, medData);

        // Delete old schedules and doses
        const { data: oldSchedules } = await fetchCollection<any>(`users/${user.uid}/schedules`, [where('itemId', '==', itemId)]);
        if (oldSchedules) {
          await Promise.all(oldSchedules.map((s: any) => deleteDocument(`users/${user.uid}/schedules`, s.id)));
        }

        const { data: oldDoses } = await fetchCollection<any>(`users/${user.uid}/doses`, [
          where('itemId', '==', itemId),
          where('status', '==', 'scheduled')
        ]);
        if (oldDoses) {
          await Promise.all(oldDoses.map((d: any) => deleteDocument(`users/${user.uid}/doses`, d.id)));
        }

        // Update Stock: Delete old
        const { data: existingStock } = await fetchCollection<any>(`users/${user.uid}/stock`, [where('itemId', '==', itemId)]);
        if (existingStock) {
          await Promise.all(existingStock.map((s: any) => deleteDocument(`users/${user.uid}/stock`, s.id)));
        }

        toast.success(`${medicationData.name} ${t('wizard.updated')}`);
      } else {
        // Create new item
        const { data: newId, error: itemError } = await addDocument(`users/${user.uid}/medications`, {
          ...medData,
          isActive: true,
          createdAt: new Date().toISOString()
        });
        if (itemError) throw itemError;
        itemId = newId as unknown as string;
        toast.success(`${medicationData.name} ${t('wizard.added')}`);
      }

      if (!itemId) throw new Error("Failed to get Item ID");

      // Create new schedule
      const { data: newScheduleId } = await addDocument(`users/${user.uid}/schedules`, {
        itemId: itemId,
        userId: user.uid,
        times: medicationData.times,
        freqType: medicationData.frequency,
        daysOfWeek: medicationData.frequency === 'specific_days' ? medicationData.daysOfWeek : [],
      });

      // Save advanced notification settings if configured
      if (notificationSchedules.length > 0) {
        const settingsToSave = notificationSchedules.map(schedule => ({
          itemId: itemId,
          userId: user.uid,
          time: schedule.time,
          type: schedule.type,
          vibrate: schedule.vibrate,
          sound: schedule.sound,
          enabled: schedule.enabled,
          label: schedule.label || null,
          createdAt: new Date().toISOString(),
        }));

        // Save each notification setting
        for (const setting of settingsToSave) {
          await addDocument(`users/${user.uid}/notificationSettings`, setting);
        }
      }

      // Generate dose instances
      const doseInstances: any[] = [];
      const now = new Date();
      const scheduleTimes = medicationData.times;

      // Generate for next 7 days
      for (let day = 0; day < 7; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);

        // Filtering for specific days if needed
        if (medicationData.frequency === 'specific_days' && medicationData.daysOfWeek) {
          // daysOfWeek: 0-6 (Sun-Sat) or 1-7? Date.getDay() returns 0-6 (Sun-Sat).
          // Need to check what WizardStepScheduleConditional returns.
          // Assuming 0-6 for now.
          if (!medicationData.daysOfWeek.includes(date.getDay())) {
            continue;
          }
        }

        for (const time of scheduleTimes) {
          const [hours, minutes] = time.split(":").map(Number);
          const dueAt = new Date(date);
          dueAt.setHours(hours, minutes, 0, 0);

          if (dueAt > now) {
            doseInstances.push({
              scheduleId: newScheduleId,
              itemId: itemId,
              userId: user.uid,
              profileId: activeProfile?.id,
              dueAt: dueAt.toISOString(),
              status: "scheduled",
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      if (doseInstances.length > 0) {
        // Sequential add because no batch helper yet or just map
        await Promise.all(doseInstances.map(dose => addDocument(`users/${user.uid}/doses`, dose)));
      }

      // Create stock if enabled
      if (medicationData.controlStock) {
        await addDocument(`users/${user.uid}/stock`, {
          itemId: itemId,
          itemName: medicationData.name,
          userId: user.uid,
          unitsTotal: medicationData.unitsTotal,
          currentQty: medicationData.unitsTotal,
          unitLabel: medicationData.unitLabel,
          lastRefillAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Update advanced notification settings
      if (notificationSchedules.length > 0) {
        // Delete old notification settings
        const { data: oldSettings } = await fetchCollection<any>(
          `users/${user.uid}/notificationSettings`,
          [where('itemId', '==', itemIdToEdit)]
        );

        if (oldSettings && oldSettings.length > 0) {
          for (const setting of oldSettings) {
            await deleteDocument(`users/${user.uid}/notificationSettings`, setting.id);
          }
        }

        // Save new notification settings
        const settingsToSave = notificationSchedules.map(schedule => ({
          itemId: itemIdToEdit,
          userId: user.uid,
          time: schedule.time,
          type: schedule.type,
          vibrate: schedule.vibrate,
          sound: schedule.sound,
          enabled: schedule.enabled,
          label: schedule.label || null,
          updatedAt: new Date().toISOString(),
        }));

        for (const setting of settingsToSave) {
          await addDocument(`users/${user.uid}/notificationSettings`, setting);
        }
      }

      const remainingMedications = location.state?.remainingMedications;

      if (remainingMedications && remainingMedications.length > 0) {
        toast.success("Medicamento salvo! Preparando o próximo...");

        const nextMed = remainingMedications[0];
        const nextRemaining = remainingMedications.slice(1);

        const nextPrefill = {
          name: nextMed.drug_name,
          doseText: nextMed.dose,
          notes: nextMed.frequency ? `Frequência: ${nextMed.frequency}` : undefined,
          category: "medicamento",
          prescriptionId: prefillData?.prescriptionId
        };

        navigate('/adicionar', {
          state: {
            prefillData: nextPrefill,
            remainingMedications: nextRemaining
          },
          replace: true
        });

        setCurrentStep(1);
        // Do not reset to INITIAL_DATA completely, let the effect handle it or reset strictly only what's needed
        // Actually the effect will merge prefill into current state.
        // We should probably reset to INITIAL_DATA then let effect run.
        // But effect runs on render.
        setMedicationData(INITIAL_DATA);
      } else {
        onOpenChange(false);
        navigate('/rotina');

        setCurrentStep(1);
        setMedicationData(INITIAL_DATA);
      }

    } catch (error: any) {
      console.error('Error saving medication:', error);
      toast.error(error.message || t('wizard.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: t('wizard.step1'), icon: Sparkles },
    { number: 2, title: t('wizard.step2'), icon: Calendar },
  ];

  const methodOptions = [
    {
      id: "camera",
      icon: Camera,
      title: t('meds.scanPrescription'),
      description: t('wizard.scanDesc'),
      premium: true,
    },
    {
      id: "upload",
      icon: Upload,
      title: t('wizard.uploadImage'),
      description: t('wizard.uploadDesc'),
      premium: true,
    },
    {
      id: "manual",
      icon: Edit3,
      title: t('wizard.typeManually'),
      description: t('wizard.typeManuallyDesc'),
      premium: false,
    },
  ];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl gap-0 border-white/20 shadow-2xl bg-background/80 backdrop-blur-xl">
          <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-white/10 shrink-0 bg-background/50">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {isEditing ? t('common.edit') : currentStep === 0 ? t('meds.addMedication') : t('wizard.addItem')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {currentStep === 0
                  ? t('wizard.chooseMethod')
                  : currentStep === 1
                    ? `${t('wizard.step')} 1: ${t('wizard.step1')}`
                    : `${t('wizard.step')} 2: ${t('wizard.step2')}`}
              </DialogDescription>
            </DialogHeader>
          </div>

          {currentStep > 0 && (
            <div className="flex items-center justify-center gap-6 py-4 px-4 bg-muted/30 border-b border-white/5 shrink-0">
              {steps.map((step, index) => {
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm font-bold shadow-sm",
                          isActive
                            ? "bg-primary text-primary-foreground scale-110 shadow-primary/25"
                            : isCompleted
                              ? "bg-accent-highlight text-accent-highlight-foreground"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                      </div>
                      <span className={cn(
                        "text-sm font-medium hidden sm:block",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5 rounded-full transition-colors",
                        currentStep > step.number ? "bg-accent-highlight" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 scrollbar-hide">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="h-full"
              >
                {currentStep === 0 && (
                  <div className="space-y-4 py-2">
                    {processingOCR ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-accent-highlight/30 rounded-full blur-xl animate-pulse" />
                          <Loader2 className="w-12 h-12 animate-spin text-accent-highlight relative z-10" />
                        </div>
                        <p className="text-muted-foreground text-center font-medium animate-pulse">
                          {t('wizard.analyzingImage')}
                        </p>
                      </div>
                    ) : (
                      methodOptions.map((option, idx) => (
                        <motion.div
                          key={option.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card
                            className="group relative overflow-hidden border border-white/10 bg-gradient-to-br from-card to-muted/50 p-5 cursor-pointer hover:border-accent-highlight/50 transition-all hover:shadow-lg hover:shadow-accent-highlight/10 active:scale-[0.98]"
                            onClick={() => handleMethodSelect(option.id as "camera" | "upload" | "manual")}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            <div className="flex items-center gap-5">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
                                option.id === 'manual'
                                  ? "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white"
                                  : "bg-accent-highlight/10 text-accent-highlight-foreground/80 group-hover:bg-accent-highlight group-hover:text-accent-highlight-foreground"
                              )}>
                                <option.icon className="w-7 h-7" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                    {option.title}
                                  </h3>
                                  {option.premium && !hasFeature("ocr") && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                      Premium
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {option.description}
                                </p>
                              </div>

                              <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-accent-highlight group-hover:translate-x-1 transition-all" />
                            </div>
                          </Card>
                        </motion.div>
                      ))
                    )}

                    <div className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground/60">
                        Powered by <span className="font-semibold text-primary/80">Gemini AI</span>
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <WizardStepIdentity data={medicationData} updateData={updateData} />
                )}
                {currentStep === 2 && (
                  <WizardStepScheduleConditional
                    data={medicationData}
                    updateData={updateData}
                    onOpenAdvancedEditor={() => setShowScheduleEditor(true)}
                  />
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {currentStep > 0 && (
            <div className="grid grid-cols-2 gap-4 p-4 pb-6 sm:px-6 sm:pb-5 border-t border-white/10 bg-background/50 backdrop-blur-md shrink-0 safe-area-inset-bottom z-10">
              <Button
                variant="ghost"
                onClick={currentStep === 1 ? () => setCurrentStep(0) : handleBack}
                disabled={isSubmitting}
                className="h-12 rounded-2xl hover:bg-muted/50 text-muted-foreground font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </Button>

              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="h-12 rounded-2xl bg-accent-highlight hover:bg-accent-highlight/90 text-accent-highlight-foreground font-bold shadow-lg shadow-accent-highlight/20 hover:shadow-accent-highlight/30 hover:scale-[1.02] transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : currentStep === 2 ? (
                  <>
                    {isEditing ? t('common.save') : t('common.add')}
                    <Check className="w-5 h-5 ml-2 stroke-[3]" />
                  </>
                ) : (
                  <>
                    {t('common.next')}
                    <ArrowRight className="w-5 h-5 ml-2 stroke-[3]" />
                  </>
                )}
              </Button>
            </div>
          )}

          {currentStep === 0 && !processingOCR && (
            <div className="p-4 pb-6 sm:px-6 sm:pb-4 border-t border-white/5 bg-background/30 backdrop-blur-sm shrink-0 safe-area-inset-bottom">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full h-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors rounded-xl"
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature={t('wizard.ocrFeature')}
      />


      <PaywallDialog
        open={showPaywall}
        onOpenChange={setShowPaywall}
        triggerReason="medication_limit"
      />

      <NotificationScheduleEditor
        open={showScheduleEditor}
        onOpenChange={setShowScheduleEditor}
        schedules={notificationSchedules}
        onSave={handleSaveSchedules}
        medicationName={medicationData.name}
      />
    </>

  );
}
