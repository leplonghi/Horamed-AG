import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bell, Spinner as Loader2, CheckCircle, Warning as AlertTriangle, Pill, DeviceMobile, CheckCircle as CheckCircle2, Clock } from "@phosphor-icons/react";
import { differenceInSeconds } from "date-fns";
import { Button } from "@/components/ui/button";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import notificationService from "@/services/NotificationService";

interface Props {
  scheduledTime: Date;
  itemName: string;
  onCreateItem: () => Promise<boolean>;
  onNotificationReceived: () => void;
  /** When provided, alarm shows inline dose card instead of auto-advancing */
  onDoseTaken?: () => void;
  onDoseSnooze?: () => void;
}

export default function OnboardingWaiting({
  scheduledTime,
  itemName,
  onCreateItem,
  onNotificationReceived,
  onDoseTaken,
  onDoseSnooze,
}: Props) {
  const { triggerSuccess, triggerLight } = useHapticFeedback();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [creating, setCreating] = useState(true);
  const [created, setCreated] = useState(false);
  const [alarmReceived, setAlarmReceived] = useState(false);
  const [showDoseCard, setShowDoseCard] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const createItem = async () => {
      const success = await onCreateItem();
      setCreating(false);
      setCreated(success);

      if (success) {
        // Also schedule via NotificationService for reliability
        await notificationService.initialize();
        await notificationService.scheduleDoseAlarm({
          doseId: `onboarding-${Date.now()}`,
          itemId: `onboarding-item`,
          itemName: itemName,
          doseText: "1 dose",
          scheduledAt: scheduledTime,
        });

        // Start countdown
        const updateCountdown = () => {
          const diff = differenceInSeconds(scheduledTime, new Date());
          setSecondsLeft(Math.max(0, diff));
        };

        updateCountdown();
        intervalRef.current = setInterval(updateCountdown, 1000);
      }
    };

    createItem();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scheduledTime, itemName, onCreateItem]);

  // Listen for alarm events
  useEffect(() => {
    const handleAlarm = () => {
      if (onDoseTaken) {
        setShowDoseCard(true);
      } else {
        setAlarmReceived(true);
        setTimeout(() => {
          onNotificationReceived();
        }, 1500);
      }
    };

    window.addEventListener("horamed-alarm", handleAlarm as EventListener);
    return () => window.removeEventListener("horamed-alarm", handleAlarm as EventListener);
  }, [onNotificationReceived, onDoseTaken]);

  // Auto-advance if countdown reaches 0 and alarm hasn't triggered
  useEffect(() => {
    if (secondsLeft === 0 && created && !alarmReceived && !showDoseCard) {
      const timeout = setTimeout(() => {
        if (!alarmReceived && !showDoseCard) {
          if (onDoseTaken) {
            setShowDoseCard(true);
          } else {
            onNotificationReceived();
          }
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [secondsLeft, created, alarmReceived, showDoseCard, onNotificationReceived, onDoseTaken]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (creating) {
    return (
      <div className="text-center space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
        >
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
        <p className="text-lg text-muted-foreground">
          Configurando seu primeiro lembrete...
        </p>
      </div>
    );
  }

  if (!created) {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <p className="text-lg text-destructive">
          Houve um problema ao criar o lembrete.
        </p>
        <Button onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Inline dose card (absorbs OnboardingFirstDose)
  if (showDoseCard) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold text-foreground">
            🔔 Hora do remédio!
          </h1>
          <p className="text-muted-foreground">
            Esse é o lembrete que você configurou
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
              <Pill className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{itemName}</h3>
              <p className="text-muted-foreground">1 dose</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              onClick={() => { triggerSuccess(); onDoseTaken?.(); }}
              className="w-full h-16 text-lg font-semibold bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="w-6 h-6 mr-3" />
              ✓ Tomado
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => { triggerLight(); onDoseSnooze?.(); setShowDoseCard(false); }}
              className="w-full h-14 text-lg"
            >
              <Clock className="w-5 h-5 mr-2" />
              ⏰ Adiar 10 min
            </Button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground"
        >
          Para esse teste, você pode clicar em "Tomado" agora
        </motion.p>
      </div>
    );
  }

  // Alarm received without dose card (legacy fallback)
  if (alarmReceived) {
    return (
      <div className="text-center space-y-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="w-12 h-12 text-green-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-foreground">
            Alarme funcionando!
          </h2>
          <p className="text-muted-foreground mt-2">
            Seu HoraMed está configurado corretamente.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Teste do alarme
        </h1>
        <p className="text-muted-foreground">
          {secondsLeft > 0
            ? "Feche o app agora e aguarde o alarme tocar."
            : "O alarme deve tocar a qualquer momento..."}
        </p>
      </motion.div>

      {/* Countdown */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="py-8"
      >
        <div className="relative w-40 h-40 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-primary"
              strokeDasharray={440}
              strokeDashoffset={440 * (secondsLeft / 120)}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              animate={secondsLeft <= 10 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: secondsLeft <= 10 ? Infinity : 0 }}
            >
              <Bell className="w-8 h-8 text-primary mb-2" />
            </motion.div>
            <span className="text-3xl font-bold text-foreground">
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Item info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-muted/50 rounded-xl p-4"
      >
        <p className="text-sm text-muted-foreground">Seu lembrete:</p>
        <p className="text-lg font-semibold text-foreground mt-1 flex items-center justify-center gap-2">
          <Pill className="w-5 h-5 text-primary" weight="duotone" />
          {itemName}
        </p>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20"
      >
        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium flex items-center justify-center gap-2">
          <DeviceMobile className="w-4 h-4" />
          Feche o app agora
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          O alarme deve tocar mesmo com o app fechado e a tela bloqueada.
        </p>
      </motion.div>

      {/* Skip option */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDoseTaken ? setShowDoseCard(true) : onNotificationReceived()}
          className="text-muted-foreground"
        >
          Pular teste
        </Button>
      </motion.div>
    </div>
  );
}
