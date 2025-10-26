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
      localStorage.setItem("biometric_email", email);
      localStorage.setItem("biometric_enabled", "true");
      toast({
        title: "Biometria ativada",
        description: "Login por biometria configurado com sucesso",
      });
    }
  };

  const loginWithBiometric = async () => {
    const email = localStorage.getItem("biometric_email");
    if (!email) {
      toast({
        title: "Erro",
        description: "Biometria não configurada",
        variant: "destructive",
      });
      return false;
    }

    const success = await authenticate();
    if (success) {
      // Usar magic link ou session refresh
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        toast({
          title: "Erro ao autenticar",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Verifique seu email",
        description: "Enviamos um link de acesso",
      });
      return true;
    }
    return false;
  };

  const disableBiometric = () => {
    localStorage.removeItem("biometric_email");
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
