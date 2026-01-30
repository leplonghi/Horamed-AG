import { useState, useEffect } from "react";
import { auth, fetchCollection, setDocument } from "@/integrations/firebase";
import { useToast } from "@/hooks/use-toast";

export type ConsentPurpose = "health_data" | "notifications" | "data_sharing" | "marketing" | "analytics";

export interface Consent {
  id: string; // will be the purpose
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useConsents = () => {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConsents = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { data } = await fetchCollection<Consent>(`users/${user.uid}/consents`);
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
    // Initial load
    loadConsents();

    // Listen for auth state changes to reload
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) loadConsents();
      else setConsents([]);
    });
    return () => unsubscribe();
  }, []);

  const grantConsent = async (purpose: ConsentPurpose) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date().toISOString();
      const consentData = {
        purpose,
        granted: true,
        grantedAt: now,
        revokedAt: null,
        updatedAt: now,
        // created_at should ideally be preserved if exists, but for simplicity we assume update
      };

      await setDocument(`users/${user.uid}/consents`, purpose, consentData, true); // true = merge

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
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date().toISOString();
      const consentData = {
        purpose,
        granted: false,
        revokedAt: now,
        updatedAt: now,
      };

      await setDocument(`users/${user.uid}/consents`, purpose, consentData, true);

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
    return consent?.granted === true && consent.revokedAt === null;
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
