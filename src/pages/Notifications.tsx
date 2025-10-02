import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

export default function Notifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    push_enabled: true,
    whatsapp_enabled: false,
    whatsapp_number: "",
  });

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
          whatsapp_enabled: data.whatsapp_enabled,
          whatsapp_number: data.whatsapp_number || "",
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
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
      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erro ao salvar preferências");
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
              <h2 className="text-2xl font-bold text-foreground">Notificações</h2>
              <p className="text-muted-foreground">Gerencie como deseja receber lembretes</p>
            </div>
          </div>

          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email">E-mail</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações por e-mail
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
                <Label htmlFor="push">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações no navegador
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
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber lembretes via WhatsApp
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
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-number">Número do WhatsApp</Label>
                  <Input
                    id="whatsapp-number"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={preferences.whatsapp_number}
                    onChange={(e) =>
                      setPreferences({ ...preferences, whatsapp_number: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </Card>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Salvando..." : "Salvar preferências"}
          </Button>
        </div>
      </div>
      <Navigation />
    </>
  );
}
