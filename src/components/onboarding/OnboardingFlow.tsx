import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { auth, addDocument, updateDocument, fetchCollection, setDocument } from "@/integrations/firebase";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { trackNotificationEvent, NotificationEvents } from "@/hooks/useNotificationMetrics";
import { toast } from "sonner";
import notificationService from "@/services/NotificationService";
import { useOnboarding } from "@/contexts/OnboardingContext";

// Step components
import OnboardingWelcomeNew from "./steps/OnboardingWelcomeNew";
import OnboardingFirstItem from "./steps/OnboardingFirstItem";
import OnboardingSetTime from "./steps/OnboardingSetTime";
import OnboardingWaiting from "./steps/OnboardingWaiting";
import OnboardingCelebration from "./steps/OnboardingCelebration";

const TOTAL_STEPS = 5;

export interface OnboardingData {
  itemName: string;
  scheduledTime: Date;
  doseId: string | null;
  itemId: string | null;
  notificationPermission: boolean;
}

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { completeOnboarding: markOnboardingComplete } = useOnboarding();
  const { triggerLight, triggerSuccess, triggerHeavy } = useHapticFeedback();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    itemName: "",
    scheduledTime: new Date(Date.now() + 2 * 60 * 1000), // +2 minutes
    doseId: null,
    itemId: null,
    notificationPermission: false,
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      triggerLight();
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, triggerLight]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      triggerLight();
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, triggerLight]);

  // Inline permission request when leaving SetTime step (step 2)
  const handleSetTimeNext = useCallback(async () => {
    try {
      const result = await Notification.requestPermission();
      updateData({ notificationPermission: result === 'granted' });
    } catch {
      // Browser doesn't support notifications or already denied — continue anyway
    }
    handleNext();
  }, [handleNext, updateData]);

  const createFirstItem = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      // Create the item
      // Create the item
      const { data: itemData, error: itemError } = await addDocument(`users/${user.uid}/medications`, {
        userId: user.uid,
        name: data.itemName,
        doseText: "1 dose",
        isActive: true,
        category: "medicamento",
        createdAt: new Date().toISOString()
      });

      if (itemError || !itemData?.id) throw itemError || new Error("Failed to create medication");

      // Create schedule
      const timeString = data.scheduledTime.toTimeString().slice(0, 5);
      const { data: scheduleData } = await addDocument(`users/${user.uid}/schedules`, {
        itemId: itemData.id,
        freqType: "daily",
        times: [timeString],
        isActive: true
      });

      // Create dose instance for today
      const { data: doseData, error: doseError } = await addDocument("dose_instances", {
        itemId: itemData.id,
        scheduleId: scheduleData?.id || itemData.id,
        dueAt: data.scheduledTime.toISOString(),
        status: "scheduled",
      });

      if (doseError || !doseData?.id) throw doseError || new Error("Failed to create dose");

      updateData({
        itemId: itemData.id,
        doseId: doseData.id
      });

      // Schedule notification via unified NotificationService
      await notificationService.initialize();
      const result = await notificationService.scheduleDoseAlarm({
        doseId: doseData.id,
        itemId: itemData.id,
        itemName: data.itemName,
        doseText: "1 dose",
        scheduledAt: data.scheduledTime,
      });

      // Track first notification scheduled
      await trackNotificationEvent(NotificationEvents.FIRST_NOTIFICATION_SENT, {
        item_name: data.itemName,
        scheduled_at: data.scheduledTime.toISOString(),
        method: result.method,
      });

      // Log telemetry
      await addDocument(`users/${user.uid}/appMetrics`, {
        eventName: "first_alarm_scheduled",
        eventData: {
          method: result.method,
          success: result.success,
          notificationId: result.notificationId,
        },
        createdAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error("Error creating first item:", error);
      toast.error("Erro ao criar medicamento. Tente novamente.");
      return false;
    }
  };

  const handleDoseTaken = async () => {
    if (!data.doseId) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDocument("dose_instances", data.doseId, {
        status: "taken",
        takenAt: new Date().toISOString()
      });

      triggerSuccess();

      // Track event
      await addDocument(`users/${user.uid}/appMetrics`, {
        eventName: "first_dose_confirmed",
        eventData: { onboarding: true },
        createdAt: new Date().toISOString()
      });

      handleNext();
    } catch (error) {
      console.error("Error marking dose:", error);
    }
  };

  const handleDoseSnooze = async () => {
    if (!data.doseId) return;

    const user = auth.currentUser;
    if (!user) return;

    const newTime = new Date(Date.now() + 10 * 60 * 1000);

    await updateDocument("dose_instances", data.doseId, {
      dueAt: newTime.toISOString(),
      delayMinutes: 10,
    });

    updateData({ scheduledTime: newTime });
    toast.info("Lembrete adiado em 10 minutos");
  };

  const completeOnboarding = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Track completion
      await addDocument(`users/${user.uid}/appMetrics`, {
        eventName: "onboarding_completed",
        eventData: {
          version: "v2_flow",
          item_created: !!data.itemId,
        },
        createdAt: new Date().toISOString()
      });

      await markOnboardingComplete();
      triggerHeavy();
      navigate("/hoje");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      navigate("/hoje");
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    navigate("/hoje");
  };

  // Track onboarding started
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      addDocument(`users/${user.uid}/appMetrics`, {
        eventName: "onboarding_started",
        eventData: { version: "v2_flow" },
        createdAt: new Date().toISOString()
      }).catch(console.error);
    }
  }, []);

  const progressValue = currentStep > 0 ? (currentStep / (TOTAL_STEPS - 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar - show from step 2 onwards */}
      {currentStep >= 2 && currentStep < TOTAL_STEPS - 1 && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <Progress value={progressValue} className="h-1.5" />
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <OnboardingWelcomeNew onNext={handleNext} onSkip={handleSkip} />
              )}
              {currentStep === 1 && (
                <OnboardingFirstItem
                  value={data.itemName}
                  onChange={(name) => updateData({ itemName: name })}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 2 && (
                <OnboardingSetTime
                  value={data.scheduledTime}
                  onChange={(time) => updateData({ scheduledTime: time })}
                  onNext={handleSetTimeNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <OnboardingWaiting
                  scheduledTime={data.scheduledTime}
                  itemName={data.itemName}
                  onCreateItem={createFirstItem}
                  onNotificationReceived={handleNext}
                  onDoseTaken={handleDoseTaken}
                  onDoseSnooze={handleDoseSnooze}
                />
              )}
              {currentStep === 4 && (
                <OnboardingCelebration onComplete={completeOnboarding} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
