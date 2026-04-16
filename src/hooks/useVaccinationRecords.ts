import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, fetchCollection, addDocument, updateDocument, deleteDocument, where, orderBy } from "@/integrations/firebase";
import { toast } from "sonner";

export interface VaccinationRecord {
  id: string;
  userId: string;
  profileId?: string;
  documentId?: string;
  vaccineName: string;
  vaccineType?: 'adulto' | 'infantil';
  diseasePrevention?: string;
  doseNumber?: number;
  doseDescription?: string;
  applicationDate: string;
  nextDoseDate?: string;
  vaccinationLocation?: string;
  vaccinatorName?: string;
  vaccinatorRegistration?: string;
  batchNumber?: string;
  manufacturer?: string;
  expiryDate?: string;
  notes?: string;
  adverseReactions?: string;
  susCardNumber?: string;
  officialSource?: string;
  createdAt: string;
  updatedAt: string;
}

export function useVaccinationRecords(profileId?: string) {
  return useQuery({
    queryKey: ["vaccination-records", profileId],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("No user");

      const constraints = [orderBy("applicationDate", "desc")];
      if (profileId) {
        constraints.push(where("profileId", "==", profileId));
      }

      const { data, error } = await fetchCollection<VaccinationRecord>(
        `users/${user.uid}/vaccination_records`,
        constraints
      );
      if (error) throw error;
      return data;
    },
  });
}

export function useVaccinationRecordsByType(vaccineType: 'adulto' | 'infantil', profileId?: string) {
  return useQuery({
    queryKey: ["vaccination-records", vaccineType, profileId],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("No user");

      const constraints = [
        where("vaccineType", "==", vaccineType),
        orderBy("applicationDate", "desc")
      ];
      if (profileId) {
        constraints.push(where("profileId", "==", profileId));
      }

      const { data, error } = await fetchCollection<VaccinationRecord>(
        `users/${user.uid}/vaccination_records`,
        constraints
      );
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVaccinationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Partial<VaccinationRecord>) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await addDocument<VaccinationRecord>(
        `users/${user.uid}/vaccination_records`,
        { ...record, userId: user.uid }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccination-records"] });
      toast.success("Vacina registrada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao registrar vacina:", error);
      toast.error("Erro ao registrar vacina");
    },
  });
}

export function useUpdateVaccinationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...record }: Partial<VaccinationRecord> & { id: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("No user");

      const { error } = await updateDocument(
        `users/${user.uid}/vaccination_records`,
        id,
        record
      );

      if (error) throw error;
      return { id, ...record };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccination-records"] });
      toast.success("Vacina atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar vacina:", error);
      toast.error("Erro ao atualizar vacina");
    },
  });
}

export function useDeleteVaccinationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error("No user");

      const { error } = await deleteDocument(
        `users/${user.uid}/vaccination_records`,
        id
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccination-records"] });
      toast.success("Registro excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir registro:", error);
      toast.error("Erro ao excluir registro");
    },
  });
}
