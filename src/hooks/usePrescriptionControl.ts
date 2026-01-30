import { useQuery } from "@tanstack/react-query";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { differenceInDays, parseISO, isAfter, isBefore } from "date-fns";

export interface PrescriptionStatus {
  id: string;
  title: string;
  issuedAt: string | null;
  expiresAt: string | null;
  status: 'valid' | 'expiring_soon' | 'expired';
  daysUntilExpiry: number;
  medications: any[];
  isDuplicate: boolean;
  duplicateOf?: string;
  isPurchased: boolean;
}

export function usePrescriptionControl(profileId?: string) {
  return useQuery({
    queryKey: ["prescription-control", profileId],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];

      const now = new Date();

      // In Firebase, we simply query for documents with type "prescription" or "receita"
      // Assuming 'documents' subcollection has a 'type' field.

      const docsRef = collection(db, 'users', user.uid, 'documents');

      // Note: Firestore requires composite index for query on (type, profileId, createdAt).
      // We will query by type and filter profileId in memory if needed to avoid index issues for now, or use simple query.
      let q = query(docsRef, where("category", "==", "receita"));

      if (profileId) {
        // If we have an index, we can add this. 
        q = query(docsRef, where("category", "==", "receita"), where("profileId", "==", profileId));
      }

      const snap = await getDocs(q);
      const prescriptions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort manually by createdAt DESC
      prescriptions.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const statusList: PrescriptionStatus[] = [];
      const medicationMap = new Map<string, string[]>(); // medication name -> prescription IDs

      for (const prescription of prescriptions) {
        // Adapt fields from Supabase (issued_at) to Firebase (issuedAt) or keep flexible
        const issuedAt = (prescription as any).issuedAt || (prescription as any).issued_at;
        const expiresAt = (prescription as any).expiresAt || (prescription as any).expires_at;
        // meta might be flattened or kept as map
        const meta = (prescription as any).meta || {};
        const medications = meta.medications || (prescription as any).medications || [];
        const isPurchased = meta.isPurchased === true || (prescription as any).isPurchased === true;

        let status: 'valid' | 'expiring_soon' | 'expired' = 'valid';
        let daysUntilExpiry = Infinity;

        if (expiresAt) {
          const expiryDate = parseISO(expiresAt);
          daysUntilExpiry = differenceInDays(expiryDate, now);

          if (isBefore(expiryDate, now)) {
            status = 'expired';
          } else if (daysUntilExpiry <= 7) {
            status = 'expiring_soon';
          }
        }

        // Verificar duplicatas baseado nos medicamentos
        let isDuplicate = false;
        let duplicateOf: string | undefined;

        for (const med of medications) {
          const medName = (med.name || '').toLowerCase().trim();
          if (medName) {
            const existingPrescriptions = medicationMap.get(medName) || [];
            if (existingPrescriptions.length > 0) {
              isDuplicate = true;
              duplicateOf = existingPrescriptions[0];
            }
            existingPrescriptions.push(prescription.id);
            medicationMap.set(medName, existingPrescriptions);
          }
        }

        statusList.push({
          id: prescription.id,
          title: prescription.title || "Receita sem título",
          issuedAt,
          expiresAt,
          status,
          daysUntilExpiry,
          medications,
          isDuplicate,
          duplicateOf,
          isPurchased
        });
      }

      return statusList;
    },
    enabled: !!auth.currentUser
  });
}

export function useExpiredPrescriptions(profileId?: string) {
  return useQuery({
    queryKey: ["expired-prescriptions", profileId],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];

      const now = new Date();

      const docsRef = collection(db, 'users', user.uid, 'documents');

      // Query prescriptions
      let q = query(docsRef, where("category", "==", "receita"));
      if (profileId) {
        q = query(docsRef, where("category", "==", "receita"), where("profileId", "==", profileId));
      }

      const snap = await getDocs(q);
      const prescriptions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter locally
      const expired = prescriptions.filter((p: any) => {
        const expiresAt = p.expiresAt || p.expires_at;
        if (!expiresAt) return false;

        const isPurchased = p.isPurchased === true || p.meta?.isPurchased === true;
        const isExpired = isBefore(parseISO(expiresAt), now);
        return isExpired && !isPurchased;
      });

      // Sort by expiresAt ASC
      expired.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

      return expired.map(p => ({
        id: p.id,
        title: p.title || "Receita sem título",
        expiresAt: p.expiresAt || p.expires_at,
        medications: p.medications || p.meta?.medications || [],
        daysExpired: Math.abs(differenceInDays(parseISO(p.expiresAt || p.expires_at), now))
      }));
    },
    enabled: !!auth.currentUser
  });
}
