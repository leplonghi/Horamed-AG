import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ConsentPurpose = "health_data" | "notifications" | "data_sharing" | "marketing" | "analytics";

export interface Consent {
  id: string;
  user_id: string;
  purpose: ConsentPurpose;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useConsents = () => {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConsents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("consents")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setConsents(data || []);
    } catch (error: any) {
      console.error("Error loading consents:", error);
      toast({
        title: "Erro ao carregar consentimentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsents();
  }, []);

  const grantConsent = async (purpose: ConsentPurpose) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("consents")
        .upsert({
          user_id: user.id,
          purpose,
          granted: true,
          granted_at: new Date().toISOString(),
          revoked_at: null,
        }, {
          onConflict: "user_id,purpose",
        });

      if (error) throw error;

      await loadConsents();
      
      toast({
        title: "Consentimento concedido",
        description: "Suas preferências foram atualizadas",
      });
    } catch (error: any) {
      console.error("Error granting consent:", error);
      toast({
        title: "Erro ao conceder consentimento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const revokeConsent = async (purpose: ConsentPurpose) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("consents")
        .upsert({
          user_id: user.id,
          purpose,
          granted: false,
          revoked_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,purpose",
        });

      if (error) throw error;

      await loadConsents();
      
      toast({
        title: "Consentimento revogado",
        description: "Suas preferências foram atualizadas",
      });
    } catch (error: any) {
      console.error("Error revoking consent:", error);
      toast({
        title: "Erro ao revogar consentimento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const hasConsent = (purpose: ConsentPurpose): boolean => {
    const consent = consents.find(c => c.purpose === purpose);
    return consent?.granted === true && consent.revoked_at === null;
  };

  return {
    consents,
    loading,
    grantConsent,
    revokeConsent,
    hasConsent,
    refresh: loadConsents,
  };
};
