import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  action: string;
  resource: string;
  resource_id?: string;
  metadata?: Record<string, any>;
}

export const useAuditLog = () => {
  const logAction = async ({
    action,
    resource,
    resource_id,
    metadata = {},
  }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Usar service role key para inserir logs (bypass RLS)
      // Nota: Isso deve ser feito via Edge Function em produção
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action,
        resource,
        resource_id,
        metadata,
        ip_address: null, // Será preenchido via Edge Function
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      // Log silencioso - não mostrar erro ao usuário
      console.error("Failed to log audit action:", error);
    }
  };

  return { logAction };
};
