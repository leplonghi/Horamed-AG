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
      // Check for valid session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Silently skip if no valid session
        return;
      }

      // Call edge function - session is automatically included
      const { error } = await supabase.functions.invoke('audit-log', {
        body: {
          action,
          resource,
          resource_id,
          metadata,
        },
      });

      if (error) {
        // Silent error logging
        console.debug("Audit log skipped:", error.message);
      }
    } catch (error) {
      // Silent error handling - não afetar a experiência do usuário
      console.debug("Audit log skipped due to error");
    }
  };

  return { logAction };
};
