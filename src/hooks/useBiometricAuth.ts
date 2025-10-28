import { useState, useEffect } from "react";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const result = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable && result.biometryType !== 0);
    } catch (error) {
      setIsAvailable(false);
    }
  };

  const authenticate = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await BiometricAuth.authenticate({
        reason: "Autenticar no HoraMed",
        cancelTitle: "Cancelar",
        allowDeviceCredential: true,
        iosFallbackTitle: "Usar senha",
        androidTitle: "Autenticação biométrica",
      });
      return true;
    } catch (error) {
      console.error("Biometric auth failed:", error);
      toast({
        title: "Falha na autenticação",
        description: "Não foi possível autenticar com biometria",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setupBiometricLogin = async (email: string, password: string) => {
    const success = await authenticate();
    if (success) {
      // Get current session to store refresh token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.refresh_token) {
        localStorage.setItem("biometric_refresh_token", session.refresh_token);
        localStorage.setItem("biometric_enabled", "true");
        toast({
          title: "Biometria ativada",
          description: "Login por biometria configurado com sucesso",
        });
      }
    }
  };

  const loginWithBiometric = async () => {
    const refreshToken = localStorage.getItem("biometric_refresh_token");
    if (!refreshToken) {
      toast({
        title: "Erro",
        description: "Biometria não configurada",
        variant: "destructive",
      });
      return false;
    }

    const success = await authenticate();
    if (success) {
      // Use refresh token to restore session
      const { error } = await supabase.auth.setSession({
        access_token: refreshToken,
        refresh_token: refreshToken,
      });

      if (error) {
        // If refresh token expired, clear and ask to login again
        localStorage.removeItem("biometric_refresh_token");
        localStorage.removeItem("biometric_enabled");
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para reativar a biometria",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
      return true;
    }
    return false;
  };

  const disableBiometric = () => {
    localStorage.removeItem("biometric_refresh_token");
    localStorage.removeItem("biometric_enabled");
    toast({
      title: "Biometria desativada",
      description: "Login por biometria foi removido",
    });
  };

  const isBiometricEnabled = () => {
    return localStorage.getItem("biometric_enabled") === "true";
  };

  return {
    isAvailable,
    isLoading,
    authenticate,
    setupBiometricLogin,
    loginWithBiometric,
    disableBiometric,
    isBiometricEnabled: isBiometricEnabled(),
  };
};
