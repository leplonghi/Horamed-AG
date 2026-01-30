import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, fetchCollection, where, updateDocument } from "@/integrations/firebase";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

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
    category: string;
    withFood: boolean;
    isActive: boolean;
    createdAt: string;
    profileId: string;
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

            let medConstraints = [where("isActive", "==", true)];
            if (profileId) {
                medConstraints.push(where("profileId", "==", profileId));
            }

            const { data: medications, error: medError } = await fetchCollection<any>(
                `users/${user.uid}/medications`,
                medConstraints
            );
            if (medError) throw medError;
            if (!medications || medications.length === 0) return [];

            const { data: allStocks } = await fetchCollection<any>(`users/${user.uid}/stock`);
            const { data: allSchedules } = await fetchCollection<any>(`users/${user.uid}/schedules`);

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
                    doseText: med.doseText || med.instructions,
                    category: med.category || "outro",
                    withFood: med.withFood || false,
                    isActive: med.isActive,
                    createdAt: med.createdAt,
                    profileId: med.profileId,
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
