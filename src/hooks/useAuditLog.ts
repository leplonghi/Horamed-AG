import { auth, addDocument } from "@/integrations/firebase";

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
      const user = auth.currentUser;
      if (!user) return;

      // Log directly to Firestore subcollection
      await addDocument(`users/${user.uid}/audit_logs`, {
        action,
        resource,
        resourceId: resource_id, // camelCase
        metadata,
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });

    } catch (error) {
      // Silent log
      console.error("Failed to log audit action:", error);
    }
  };

  return { logAction };
};
