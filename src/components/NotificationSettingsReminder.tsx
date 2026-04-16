import { useState, useEffect } from 'react';
import { Bell, Gear as Settings, X } from "@phosphor-icons/react";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

const REMINDER_INTERVAL_DAYS = 7; // Show reminder every 7 days
const STORAGE_KEY = 'notification_settings_reminder';

interface ReminderState {
  lastDismissed: string | null;
  configured: boolean;
}

export function NotificationSettingsReminder() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const t = {
    title: language === 'pt' ? 'Configure seus alarmes' : 'Set up your alarms',
    description: language === 'pt'
      ? 'Ajuste suas notificações para nunca perder um medicamento'
      : 'Adjust your notifications to never miss a medication',
    configure: language === 'pt' ? 'Configurar' : 'Configure',
    later: language === 'pt' ? 'Depois' : 'Later',
  };

  useEffect(() => {
    checkShouldShow();
  }, []);

  const checkShouldShow = async () => {
    try {
      // First check local storage for speed
      const stored = localStorage.getItem(STORAGE_KEY);
      const localState: ReminderState | null = stored ? JSON.parse(stored) : null;

      // If locally configured, don't show (failsafe)
      if (localState?.configured) return;

      // Check remote profile
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const profileQuery = query(
          collection(db, "users", user.uid, "profiles"),
          where("id", "==", "default")
        );
        const snapshot = await getDocs(profileQuery);
        const flags = (snapshot.docs[0]?.data()?.tutorialFlags as Record<string, any>) || {};

        // If remotely configured, sync local and return
        if (flags["remindersConfigured"]) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...localState, configured: true }));
          return;
        }

        // Check remote dismissal time if available
        if (flags["remindersLastDismissed"]) {
          const daysSinceDismissed = (Date.now() - safeDateParse(flags["remindersLastDismissed"]).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < REMINDER_INTERVAL_DAYS) {
            return; // Too soon
          }
        }
      }

      // If we got here, check local timing or first use logic
      if (!localState) {
        // First time - show after 1 day of use
        const firstUse = localStorage.getItem('app_first_use');
        if (!firstUse) {
          localStorage.setItem('app_first_use', new Date().toISOString());
          return;
        }
        const daysSinceFirst = (Date.now() - safeDateParse(firstUse).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceFirst >= 1) {
          setShow(true);
        }
        return;
      }

      // If user marked as configured, don't show (checked above but good for types)
      if (localState.configured) return;

      // Check if enough time has passed since last dismissal (local check)
      if (localState.lastDismissed) {
        const daysSinceDismissed = (Date.now() - safeDateParse(localState.lastDismissed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed >= REMINDER_INTERVAL_DAYS) {
          setShow(true);
        }
      } else {
        // If state exists but no dismissal, show
        setShow(true);
      }
    } catch (e) {
      console.error("Error checking reminder status", e);
    }
  };

  const updateRemoteFlag = async (updates: Record<string, any>) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const profileQuery = query(
        collection(db, "users", user.uid, "profiles"),
        where("id", "==", "default")
      );
      const snapshot = await getDocs(profileQuery);
      const currentFlags = (snapshot.docs[0]?.data()?.tutorialFlags as Record<string, any>) || {};

      // Convert snake_case keys to camelCase
      const formattedUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        formattedUpdates[camelKey] = value;
      }

      await updateDoc(doc(db, "users", user.uid, "profiles", "default"), {
        tutorialFlags: { ...currentFlags, ...formattedUpdates }
      });
    } catch (e) {
      console.error("Error updating remote flags", e);
    }
  }

  const handleDismiss = () => {
    const now = new Date().toISOString();
    const state: ReminderState = {
      lastDismissed: now,
      configured: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setShow(false);
    updateRemoteFlag({ reminders_last_dismissed: now });
  };

  const handleConfigure = () => {
    const now = new Date().toISOString();
    const state: ReminderState = {
      lastDismissed: now,
      configured: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setShow(false);
    updateRemoteFlag({ reminders_configured: true });
    navigate('/alarmes');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Bell className="h-5 w-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  {t.title}
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t.description}
                </p>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleConfigure}>
                    {t.configure}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    {t.later}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}