import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { VaccineNotificationSettings } from "@/components/VaccineNotificationSettings";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Notifications() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    push_enabled: true,
    whatsapp_enabled: false,
    whatsapp_number: "",
    whatsapp_instance_id: "",
    whatsapp_api_token: "",
  });
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPreferences({
          email_enabled: data.email_enabled,
          push_enabled: data.push_enabled,
          whatsapp_enabled: data.whatsapp_enabled || false,
          whatsapp_number: data.whatsapp_number || "",
          whatsapp_instance_id: data.whatsapp_instance_id || "",
          whatsapp_api_token: data.whatsapp_api_token || "",
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!preferences.whatsapp_number || !preferences.whatsapp_instance_id || !preferences.whatsapp_api_token) {
      toast.error(t('notifPage.fillWhatsApp'));
      return;
    }

    try {
      setTestingWhatsApp(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-reminder', {
        body: {
          phoneNumber: preferences.whatsapp_number,
          message: "🧪 Teste do HoraMed!\n\nSe você recebeu esta mensagem, suas notificações por WhatsApp estão configuradas corretamente! ✅",
          instanceId: preferences.whatsapp_instance_id,
          apiToken: preferences.whatsapp_api_token,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      toast.success(t('notifPage.testSent'));
    } catch (error) {
      console.error("Error testing WhatsApp:", error);
      toast.error(t('notifPage.testError'));
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;
      toast.success(t('notifPage.prefsSaved'));
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(t('notifPage.prefsError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t('notifPage.title')}</h2>
              <p className="text-muted-foreground">{t('notifPage.subtitle')}</p>
            </div>
          </div>

          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email">{t('notifPage.email')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifPage.emailDesc')}
                </p>
              </div>
              <Switch
                id="email"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, email_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push">{t('notifPage.push')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifPage.pushDesc')}
                </p>
              </div>
              <Switch
                id="push"
                checked={preferences.push_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, push_enabled: checked })
                }
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="whatsapp">{t('notifPage.whatsapp')} (Backup)</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('notifPage.whatsappDesc')}
                  </p>
                </div>
                <Switch
                  id="whatsapp"
                  checked={preferences.whatsapp_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, whatsapp_enabled: checked })
                  }
                />
              </div>

              {preferences.whatsapp_enabled && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">{t('notifPage.whatsappNumber')}</Label>
                    <input
                      id="whatsapp_number"
                      type="tel"
                      placeholder={t('notifPage.whatsappNumberPlaceholder')}
                      className="w-full px-3 py-2 border rounded-md"
                      value={preferences.whatsapp_number}
                      onChange={(e) =>
                        setPreferences({ ...preferences, whatsapp_number: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instance_id">{t('notifPage.instanceId')}</Label>
                    <input
                      id="instance_id"
                      type="text"
                      placeholder="1234567890"
                      className="w-full px-3 py-2 border rounded-md"
                      value={preferences.whatsapp_instance_id}
                      onChange={(e) =>
                        setPreferences({ ...preferences, whatsapp_instance_id: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_token">{t('notifPage.apiToken')}</Label>
                    <input
                      id="api_token"
                      type="password"
                      placeholder="abc123xyz..."
                      className="w-full px-3 py-2 border rounded-md"
                      value={preferences.whatsapp_api_token}
                      onChange={(e) =>
                        setPreferences({ ...preferences, whatsapp_api_token: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestWhatsApp}
                    disabled={testingWhatsApp}
                    className="w-full"
                  >
                    {testingWhatsApp ? t('notifPage.testing') : t('notifPage.testWhatsApp')}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    💡 {t('common.or')}{" "}
                    <a
                      href="https://green-api.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      green-api.com
                    </a>
                  </p>
                </div>
              )}
            </div>

          </Card>

          <VaccineNotificationSettings />

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? t('notifPage.saving') : t('notifPage.save')}
          </Button>
        </div>
      </div>
      <Navigation />
    </>
  );
}