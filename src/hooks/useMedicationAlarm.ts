import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { functions } from "@/integrations/firebase/client"; // For functions if needed
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { useResilientReminders } from "./useResilientReminders";

interface DoseInstance {
  id: string;
  scheduledTime: string; // camelCase
  status: string;
  medicationId: string; // camelCase
  medicationName?: string; // Manually populated
  doseText?: string;
}

interface AlarmSettings {
  enabled: boolean;
  sound: string;
  duration: number;
  alertMinutes: number;
}

const ALARM_SOUNDS = [
  { id: "beep", name: "Beep Simples", url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLTgjMGHm7A7+OZUQ0PVqzn7qxaFg1Lp+LyvmohBSx+zPLTgjIFHm3A7+GZUQ0PVqzn7qxaFg1" },
  { id: "bell", name: "Sino", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
  { id: "chime", name: "Chime Suave", url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" },
  { id: "alert", name: "Alerta Forte", url: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3" },
];

export const useMedicationAlarm = () => {
  const notifiedDoses = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { scheduleReminder, getNotificationStats } = useResilientReminders();
  const [settings, setSettings] = useState<AlarmSettings>({
    enabled: true,
    sound: "beep",
    duration: 30,
    alertMinutes: 5,
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("alarmSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Initialize audio for alarm
  useEffect(() => {
    const sound = ALARM_SOUNDS.find(s => s.id === settings.sound);
    if (sound) {
      audioRef.current = new Audio(sound.url);
      audioRef.current.loop = true;
    }
  }, [settings.sound]);

  // Request notification permission
  useEffect(() => {
    const requestPermissions = async () => {
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        try {
          const permResult = await LocalNotifications.requestPermissions();
          if (permResult.display === "granted") {
            toast.success("Notificações nativas ativadas! Você será alertado sobre seus remédios.");
          }
        } catch (error) {
          console.error("Error requesting native notifications:", error);
        }
      } else {
        // Fallback to web notifications
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              toast.success("Notificações ativadas! Você será alertado sobre seus remédios.");
            }
          });
        }
      }
    };

    requestPermissions();
  }, []);

  // Check for upcoming doses every 3 minutes to reduce load
  useEffect(() => {
    if (!settings.enabled) return;

    const checkUpcomingDoses = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const now = new Date();
        const alertWindow = new Date(now.getTime() + (settings.alertMinutes + 5) * 60000);
        const nowIso = now.toISOString();
        const alertWindowIso = alertWindow.toISOString();

        // Query Doses
        const dosesRef = collection(db, 'users', user.uid, 'doses');
        const dosesQuery = query(
          dosesRef,
          where('status', '==', 'scheduled'),
          where('scheduledTime', '>=', nowIso),
          where('scheduledTime', '<=', alertWindowIso),
          orderBy('scheduledTime'),
          limit(20) // Safety limit
        );

        const dosesSnap = await getDocs(dosesQuery);

        if (!dosesSnap.empty) {
          // Manually join with medication Names if possible or trust them to be embedded?
          // Best practice in NoSQL is embedding 'name' in dose at creation time.
          // Let's assume they are embedded as 'medicationName' or similar. 
          // If not, we might need to fetch them.

          // For now, let's assume we can fetch associated medications efficiently or they are cached.
          // To be safe, let's fetch active medications once and map them, or just fetch needed ones.
          // Ideally, the dose object should have { medicationName: "...", ... }

          // FETCH helper
          const fetchMedName = async (medId: string) => {
            // Basic implementation: check cache or fetch doc
            try {
              const docSnap = await getDocs(query(collection(db, 'users', user.uid, 'medications'), where('id', '==', medId), limit(1)));
              if (!docSnap.empty) return docSnap.docs[0].data().name;
            } catch (e) { console.error(e); }
            return "Medicamento";
          };

          const dosesToProcess: DoseInstance[] = await Promise.all(dosesSnap.docs.map(async (d) => {
            const data = d.data();
            let name = data.medicationName;
            if (!name && data.medicationId) {
              name = await fetchMedName(data.medicationId);
            }
            return {
              id: d.id,
              scheduledTime: data.scheduledTime,
              status: data.status,
              medicationId: data.medicationId,
              medicationName: name,
              doseText: data.doseText
            };
          }));

          dosesToProcess.forEach((dose: DoseInstance) => {
            const doseKey = `${dose.id}-${dose.scheduledTime}`;

            // Only notify if we haven't notified about this dose yet
            if (!notifiedDoses.current.has(doseKey)) {
              const dueTime = new Date(dose.scheduledTime);
              const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / 60000);

              // Trigger alarm based on settings
              if (minutesUntil <= settings.alertMinutes && minutesUntil >= 0) {
                playAlarm();
                showNotification(dose, minutesUntil);
                notifiedDoses.current.add(doseKey);
              }
            }
          });
        }
      } catch (error) {
        console.error("Error checking doses:", error);
      }
    };

    checkUpcomingDoses();
    const interval = setInterval(checkUpcomingDoses, 180000); // Check every 3 minutes

    return () => clearInterval(interval);
  }, [settings]);

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing alarm:", error);
        toast.error("Erro ao tocar alarme. Toque na tela para ativar o áudio.");
      });

      // Stop alarm after configured duration
      setTimeout(() => {
        stopAlarm();
      }, settings.duration * 1000);
    }
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const showNotification = async (dose: DoseInstance, minutesUntil: number) => {
    const title = minutesUntil === 0
      ? "⏰ Hora do remédio!"
      : `⏰ Remédio em ${minutesUntil} minutos`;

    const body = `${dose.medicationName}${dose.doseText ? ` - ${dose.doseText}` : ""}`;

    // Use resilient reminder system with automatic fallback
    const success = await scheduleReminder({
      doseId: dose.id,
      itemId: dose.medicationId,
      title,
      body,
      scheduledAt: new Date(Date.now() + 100), // Schedule immediately
    });

    if (!success) {
      console.error("Failed to schedule notification with fallback");
    }

    // Send push notification for wearables and background delivery
    try {
      const user = auth.currentUser;
      if (user) {
        // Using Firebase Callable Function
        const sendDoseNotification = httpsCallable(functions, 'sendDoseNotification');
        await sendDoseNotification({
          doseId: dose.id,
          userId: user.uid,
          title,
          body,
          scheduledAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }

    // Also show toast notification
    toast.info(title, {
      description: body,
      duration: 30000,
      action: {
        label: "Parar alarme",
        onClick: stopAlarm,
      },
    });
  };

  const scheduleNotificationsForNextDay = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const scheduleDoseNotifications = httpsCallable(functions, 'scheduleDoseNotifications');
      await scheduleDoseNotifications();

      console.log('Scheduled notifications for next 24 hours');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  return { stopAlarm, getNotificationStats, scheduleNotificationsForNextDay };
};
