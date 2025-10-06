import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Volume2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Switch } from "@/components/ui/switch";

const ALARM_SOUNDS = [
  { id: "beep", name: "Beep Simples", url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLTgjMGHm7A7+OZUQ0PVqzn7qxaFg1Lp+LyvmohBSx+zPLTgjIFHm3A7+GZUQ0PVqzn7qxaFg1" },
  { id: "bell", name: "Sino", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
  { id: "chime", name: "Chime Suave", url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" },
  { id: "alert", name: "Alerta Forte", url: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3" },
];

export default function AlarmSettings() {
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
    toast.success("Configurações salvas!");
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success("Notificações ativadas!");
      } else {
        toast.error("Notificações negadas. Por favor, ative nas configurações do navegador.");
      }
    }
  };

  const testAlarm = () => {
    // Stop any playing test audio
    if (testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
    }

    const sound = ALARM_SOUNDS.find(s => s.id === selectedSound);
    if (!sound) return;

    const audio = new Audio(sound.url);
    audio.loop = true;
    setTestAudio(audio);

    audio.play().then(() => {
      toast.info("Teste de alarme", {
        description: `Tocando por ${duration[0]} segundos`,
        duration: duration[0] * 1000,
        action: {
          label: "Parar",
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
      toast.error("Erro ao tocar alarme. Verifique as permissões de áudio.");
    });
  };

  const stopTest = () => {
    if (testAudio) {
      testAudio.pause();
      testAudio.currentTime = 0;
      toast.success("Alarme parado");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações de Alarme</h1>
            <p className="text-muted-foreground">Personalize seus alertas de medicação</p>
          </div>
        </div>

        {/* Notification Permission */}
        {notificationPermission !== "granted" && (
          <Card className="p-6 border-warning bg-warning/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Ativar Notificações</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Para receber alertas de medicação, você precisa permitir notificações.
                </p>
                <Button onClick={requestNotificationPermission} variant="outline">
                  Permitir Notificações
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Enable/Disable Alarm */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-lg font-semibold">Alarme Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Ative ou desative todos os alarmes
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
            <Label className="text-lg font-semibold">Tipo de Toque</Label>
          </div>
          <Select value={selectedSound} onValueChange={setSelectedSound}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um som" />
            </SelectTrigger>
            <SelectContent>
              {ALARM_SOUNDS.map((sound) => (
                <SelectItem key={sound.id} value={sound.id}>
                  {sound.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Duration */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">Duração do Alarme</Label>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tempo de toque</span>
              <span className="font-semibold">{duration[0]} segundos</span>
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
            <Label className="text-lg font-semibold">Antecedência do Alerta</Label>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Alertar com</span>
              <span className="font-semibold">{alertMinutes[0]} minutos de antecedência</span>
            </div>
            <Slider
              value={alertMinutes}
              onValueChange={setAlertMinutes}
              min={0}
              max={30}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              0 = apenas no horário exato
            </p>
          </div>
        </Card>

        {/* Test Buttons */}
        <div className="grid gap-3">
          <Button onClick={testAlarm} className="w-full" size="lg" disabled={!alarmEnabled}>
            <Volume2 className="h-5 w-5 mr-2" />
            Testar Alarme
          </Button>
          <Button onClick={stopTest} variant="outline" className="w-full">
            Parar Teste
          </Button>
        </div>

        {/* Save Button */}
        <Button onClick={saveSettings} className="w-full" size="lg" variant="default">
          Salvar Configurações
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          As configurações são salvas localmente no seu dispositivo
        </p>
      </main>

      <Navigation />
    </div>
  );
}
