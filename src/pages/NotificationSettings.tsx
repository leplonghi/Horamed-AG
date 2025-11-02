import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Smartphone, Watch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { scheduleNotificationsForNextDay } = useMedicationAlarm();
  const [settings, setSettings] = useState({
    pushEnabled: true,
    localEnabled: true,
    wearableSync: true,
    sound: "beep",
    vibration: true,
    alertMinutes: [15, 5, 0], // Alert 15min before, 5min before, and at time
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings({
          pushEnabled: data.push_enabled ?? true,
          localEnabled: true,
          wearableSync: true,
          sound: "beep",
          vibration: true,
          alertMinutes: [15, 5, 0],
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const checkPermissions = async () => {
    if (Capacitor.isNativePlatform()) {
      // Check local notifications
      const localPerm = await LocalNotifications.checkPermissions();
      if (localPerm.display !== 'granted') {
        toast.info("Configure as permissões de notificação para receber alertas");
      }

      // Check push notifications
      const pushPerm = await PushNotifications.checkPermissions();
      if (pushPerm.receive !== 'granted') {
        toast.info("Configure as notificações push para alertas mesmo com app fechado");
      }
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive === 'granted') {
          await PushNotifications.register();
          toast.success("Notificações push ativadas!");
          setSettings({ ...settings, pushEnabled: true });
        } else {
          toast.error("Permissão negada. Ative nas configurações do dispositivo.");
        }
      } else {
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            toast.success("Notificações web ativadas!");
            setSettings({ ...settings, pushEnabled: true });
          }
        }
      }
    } catch (error) {
      console.error("Error enabling push:", error);
      toast.error("Erro ao ativar notificações push");
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          push_enabled: settings.pushEnabled,
          email_enabled: false,
        });

      if (error) throw error;

      // Schedule notifications for next 24 hours
      await scheduleNotificationsForNextDay();

      toast.success("Configurações salvas! Notificações agendadas para as próximas 24 horas.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 pt-20 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Notificações</h1>
            <p className="text-muted-foreground">
              Configure alertas para seus remédios
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Notificações Push
              </CardTitle>
              <CardDescription>
                Receba alertas mesmo com o app fechado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-enabled">Ativar notificações push</Label>
                <Switch
                  id="push-enabled"
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnablePushNotifications();
                    } else {
                      setSettings({ ...settings, pushEnabled: false });
                    }
                  }}
                />
              </div>

              {!settings.pushEnabled && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Dica:</strong> Ative as notificações push para
                    receber lembretes mesmo quando o app estiver fechado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Watch className="h-5 w-5" />
                Sincronização com Wearables
              </CardTitle>
              <CardDescription>
                Notificações aparecem no Apple Watch, Galaxy Watch, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="wearable-sync">Sincronizar com wearable</Label>
                <Switch
                  id="wearable-sync"
                  checked={settings.wearableSync}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, wearableSync: checked })
                  }
                />
              </div>

              {settings.wearableSync && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    ⌚ Suas notificações aparecerão automaticamente no seu
                    smartwatch quando conectado ao smartphone.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Horários de Alerta
              </CardTitle>
              <CardDescription>
                Escolha quando ser alertado antes da dose
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alertar com antecedência de:</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked disabled />
                    <span className="text-sm">15 minutos antes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked disabled />
                    <span className="text-sm">5 minutos antes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked disabled />
                    <span className="text-sm">Na hora exata</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="vibration">Vibração</Label>
                <Switch
                  id="vibration"
                  checked={settings.vibration}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, vibration: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSaveSettings} 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>

          <Card className="bg-muted">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <strong>💡 Sobre as notificações:</strong>
                <br />
                • As notificações são programadas automaticamente para as
                próximas 24 horas
                <br />
                • Funcionam mesmo com o app fechado
                <br />
                • Aparecem automaticamente no seu smartwatch
                <br />• Reprogramadas diariamente de forma automática
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Navigation />
    </div>
  );
}
