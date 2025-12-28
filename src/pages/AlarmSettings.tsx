import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Volume2, Clock, AlertCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Switch } from "@/components/ui/switch";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import NotificationMetrics from "@/components/NotificationMetrics";
import { useLanguage } from "@/contexts/LanguageContext";

const ALARM_SOUNDS = [
  { id: "beep", nameKey: "beepSimple", url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLTgjMGHm7A7+OZUQ0PVqzn7qxaFg1Lp+LyvmohBSx+zPLTgjIFHm3A7+GZUQ0PVqzn7qxaFg1" },
  { id: "bell", nameKey: "bell", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
  { id: "chime", nameKey: "chimeSoft", url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" },
  { id: "alert", nameKey: "alertStrong", url: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3" },
];

const SOUND_NAMES: Record<string, Record<string, string>> = {
  pt: {
    beepSimple: "Beep Simples",
    bell: "Sino",
    chimeSoft: "Chime Suave",
    alertStrong: "Alerta Forte",
  },
  en: {
    beepSimple: "Simple Beep",
    bell: "Bell",
    chimeSoft: "Soft Chime",
    alertStrong: "Strong Alert",
  }
};

export default function AlarmSettings() {
  const { t, language } = useLanguage();
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState("beep");
  const [duration, setDuration] = useState([30]);
  const [alertMinutes, setAlertMinutes] = useState([5]);
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem("alarmSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setAlarmEnabled(settings.enabled ?? true);
      setSelectedSound(settings.sound ?? "beep");
      setDuration([settings.duration ?? 30]);
      setAlertMinutes([settings.alertMinutes ?? 5]);
    }

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      enabled: alarmEnabled,
      sound: selectedSound,
      duration: duration[0],
      alertMinutes: alertMinutes[0],
    };
    localStorage.setItem("alarmSettings", JSON.stringify(settings));
    toast.success(t('alarm.saved'));
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success(t('alarm.notifEnabled'));
      } else {
        toast.error(t('alarm.notifDenied'));
      }
    }
  };

  const testAlarm = async () => {
    // Stop any playing test audio
    if (testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
    }

    // Test native notification if on mobile
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: t('alarm.testTitle'),
              body: t('alarm.testBody'),
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + 100) },
              sound: undefined,
            },
          ],
        });
        toast.success(t('alarm.testSent'));
      } catch (error) {
        console.error("Error testing notification:", error);
        toast.error(t('alarm.testError'));
      }
    }

    const sound = ALARM_SOUNDS.find(s => s.id === selectedSound);
    if (!sound) return;

    const audio = new Audio(sound.url);
    audio.loop = true;
    setTestAudio(audio);

    audio.play().then(() => {
      toast.info(t('alarm.testPlaying'), {
        description: t('alarm.playingFor', { seconds: duration[0].toString() }),
        duration: duration[0] * 1000,
        action: {
          label: t('alarm.stop'),
          onClick: () => {
            audio.pause();
            audio.currentTime = 0;
          },
        },
      });

      // Stop after duration
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, duration[0] * 1000);
    }).catch((error) => {
      console.error("Error playing alarm:", error);
      toast.error(t('alarm.playError'));
    });
  };

  const stopTest = () => {
    if (testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
      toast.success(t('alarm.stopped'));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('alarm.title')}</h1>
            <p className="text-muted-foreground">{t('alarm.subtitle')}</p>
          </div>
        </div>

        {/* Notification Permission */}
        {notificationPermission !== "granted" && (
          <Card className="p-6 border-warning bg-warning/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">{t('alarm.permRequired')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('alarm.permDesc')}
                </p>
                <Button onClick={requestNotificationPermission} variant="outline">
                  {t('alarm.allowNotif')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Enable/Disable Alarm */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-lg font-semibold">{t('alarm.enableAlarm')}</Label>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' ? 'Ative ou desative todos os alarmes' : 'Enable or disable all alarms'}
              </p>
            </div>
            <Switch
              checked={alarmEnabled}
              onCheckedChange={setAlarmEnabled}
            />
          </div>
        </Card>

        {/* Sound Selection */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">{t('alarm.sound')}</Label>
          </div>
          <Select value={selectedSound} onValueChange={setSelectedSound}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'pt' ? 'Selecione um som' : 'Select a sound'} />
            </SelectTrigger>
            <SelectContent>
              {ALARM_SOUNDS.map((sound) => (
                <SelectItem key={sound.id} value={sound.id}>
                  {SOUND_NAMES[language]?.[sound.nameKey] || SOUND_NAMES.en[sound.nameKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Duration */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">{t('alarm.duration')}</Label>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{language === 'pt' ? 'Tempo de toque' : 'Ring time'}</span>
              <span className="font-semibold">{t('alarm.durationSeconds', { seconds: duration[0].toString() })}</span>
            </div>
            <Slider
              value={duration}
              onValueChange={setDuration}
              min={10}
              max={120}
              step={5}
            />
          </div>
        </Card>

        {/* Alert Time */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">{t('alarm.alertBefore')}</Label>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{language === 'pt' ? 'Alertar com' : 'Alert with'}</span>
              <span className="font-semibold">{t('alarm.alertMinutes', { minutes: alertMinutes[0].toString() })}</span>
            </div>
            <Slider
              value={alertMinutes}
              onValueChange={setAlertMinutes}
              min={0}
              max={30}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              {language === 'pt' ? '0 = apenas no horário exato' : '0 = only at exact time'}
            </p>
          </div>
        </Card>

        {/* Test Buttons */}
        <div className="grid gap-3">
          <Button onClick={testAlarm} className="w-full" size="lg" disabled={!alarmEnabled}>
            <Volume2 className="h-5 w-5 mr-2" />
            {t('alarm.testAlarm')}
          </Button>
          <Button onClick={stopTest} variant="outline" className="w-full">
            {t('alarm.stopTest')}
          </Button>
        </div>

        {/* Notification Metrics */}
        <NotificationMetrics />

        {/* Save Button */}
        <Button onClick={saveSettings} className="w-full" size="lg" variant="default">
          {t('alarm.saveSettings')}
        </Button>

        {Capacitor.isNativePlatform() && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  ✅ {t('alarm.nativeNotif')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('alarm.nativeDesc')}
                </p>
              </div>
            </div>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {language === 'pt' ? 'As configurações são salvas localmente no seu dispositivo' : 'Settings are saved locally on your device'}
        </p>
      </main>

      <Navigation />
    </div>
  );
}