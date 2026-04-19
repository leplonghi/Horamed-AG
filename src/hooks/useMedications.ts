import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, fetchCollection, where, updateDocument } from "@/integrations/firebase";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicationDoc {
    id: string;
    name: string;
    doseText?: string | null;
    notes?: string;
    instructions?: string;
    category?: string;
    withFood?: boolean;
    isActive: boolean;
    createdAt: string;
    profileId: string;
    treatmentStartDate?: string;
    treatmentEndDate?: string;
}

interface StockDoc {
    id: string;
    itemId: string;
    unitsLeft?: number;
    currentQty?: number;
    unitLabel?: string;
}

interface ScheduleDoc {
    id: string;
    itemId: string;
    times?: string[];
    freqType?: string;
    frequencyType?: string;
}

export interface Schedule {
    id: string;
    itemId: string;
    times: string[];
    freqType: string;
}

export interface Stock {
    id: string;
    itemId: string;
    unitsLeft: number;
    unitLabel: string;
}

export interface Medication {
    id: string;
    name: string;
    doseText: string | null;
    notes?: string;
    instructions?: string;
    category: string;
    withFood: boolean;
    isActive: boolean;
    createdAt: string;
    profileId: string;
    treatmentStartDate?: string;
    treatmentEndDate?: string;
    schedules?: Schedule[];
    stock?: Stock[];
}

export function useMedications(profileId?: string) {
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["medications", profileId],
        queryFn: async () => {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");

            const medConstraints = [where("isActive", "==", true)];
            if (profileId) {
                medConstraints.push(where("profileId", "==", profileId));
            }

            // Leituras paralelas — reduz latência de 3 roundtrips sequenciais para 1
            const [
                { data: medications, error: medError },
                { data: allStocks },
                { data: allSchedules },
            ] = await Promise.all([
                fetchCollection<MedicationDoc>(`users/${user.uid}/medications`, medConstraints),
                fetchCollection<StockDoc>(`users/${user.uid}/stock`),
                fetchCollection<ScheduleDoc>(`users/${user.uid}/schedules`),
            ]);
            if (medError) throw medError;
            if (!medications || medications.length === 0) return [];

            const joinedData: Medication[] = medications.map(med => {
                const medStock = allStocks?.filter(s => s.itemId === med.id).map(s => ({
                    id: s.id,
                    itemId: s.itemId,
                    unitsLeft: s.unitsLeft || s.currentQty || 0,
                    unitLabel: s.unitLabel || "unidades"
                })) || [];

                const medSchedules = allSchedules?.filter(s => s.itemId === med.id).map(s => ({
                    id: s.id,
                    itemId: s.itemId,
                    times: s.times || [],
                    freqType: s.freqType || s.frequencyType
                })) || [];

                return {
                    id: med.id,
                    name: med.name,
                    doseText: med.doseText || null,
                    instructions: med.instructions || med.notes || "",
                    notes: med.notes || "",
                    category: med.category || "outro",
                    withFood: med.withFood || false,
                    isActive: med.isActive,
                    createdAt: med.createdAt,
                    profileId: med.profileId,
                    treatmentStartDate: med.treatmentStartDate,
                    treatmentEndDate: med.treatmentEndDate,
                    schedules: medSchedules,
                    stock: medStock
                };
            });

            return joinedData;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");

            const { error } = await updateDocument(`users/${user.uid}/medications`, id, {
                isActive: false,
                updatedAt: new Date().toISOString()
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(language === 'pt' ? "Medicamento removido" : "Medication removed");
            queryClient.invalidateQueries({ queryKey: ["medications"] });
            // Emit event to update doses/charts
            import('@/lib/eventBus').then(({ eventBus, EVENTS }) => {
                eventBus.emit(EVENTS.MEDICATION_UPDATED);
            });
        },
        onError: (error) => {
            console.error("Error deleting medication:", error);
            toast.error(language === 'pt' ? "Erro ao remover" : "Error removing");
        }
    });

    return {
        ...query,
        deleteMedication: deleteMutation.mutateAsync
    };
}
