import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, fetchCollection, where, updateDocument } from "@/integrations/firebase";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { decrementStockWithProjection } from "@/lib/stockHelpers";

export interface Dose {
    id: string;
    dueAt: string;
    status: 'scheduled' | 'taken' | 'missed' | 'skipped';
    itemId: string;
    medicationName: string;
    profileId?: string;
}

export function useWeeklyDoses(startOfWeek: Date, endOfWeek: Date, profileId?: string) {
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["weekly-doses", startOfWeek.toISOString(), endOfWeek.toISOString(), profileId],
        queryFn: async () => {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");

            // 1. Fetch Medications (to get names)
            let medConstraints = [];
            if (profileId) {
                medConstraints.push(where("profileId", "==", profileId));
            }
            const { data: medications } = await fetchCollection<any>(
                `users/${user.uid}/medications`,
                medConstraints
            );

            const medMap = new Map();
            medications?.forEach(m => medMap.set(m.id, m));

            // 2. Fetch Doses
            // Firestore filtering by date range
            const { data: doses, error } = await fetchCollection<any>(
                `users/${user.uid}/doses`,
                [
                    where("dueAt", ">=", startOfWeek.toISOString()),
                    where("dueAt", "<=", endOfWeek.toISOString())
                ]
            );

            if (error) throw error;
            if (!doses) return [];

            // 3. Join logic
            const joinedDoses: Dose[] = doses
                .map(d => {
                    const med = medMap.get(d.itemId);
                    // If profileId filter is active, filter doses by medication's profileId
                    if (profileId && med?.profileId !== profileId) return null;
                    // If medication not found (maybe deleted), skip or show unknown
                    if (!med) return null;

                    return {
                        id: d.id,
                        dueAt: d.dueAt,
                        status: d.status,
                        itemId: d.itemId,
                        medicationName: med.name,
                        profileId: med.profileId
                    };
                })
                .filter(d => d !== null) as Dose[];

            // Sort in memory
            joinedDoses.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

            return joinedDoses;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ doseId, newStatus, itemId }: { doseId: string, newStatus: 'taken' | 'missed' | 'skipped', itemId: string }) => {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");

            const updateData: any = { status: newStatus };
            if (newStatus === 'taken') {
                updateData.takenAt = new Date().toISOString();
                // Decrement stock
                await decrementStockWithProjection(itemId);
            } else {
                updateData.takenAt = null;
            }

            const { error } = await updateDocument(`users/${user.uid}/doses`, doseId, updateData);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            const statusText = variables.newStatus === 'taken' ? (language === 'pt' ? 'Tomado' : 'Taken') :
                variables.newStatus === 'missed' ? (language === 'pt' ? 'Perdido' : 'Missed') :
                    (language === 'pt' ? 'Pulado' : 'Skipped');

            toast.success(
                language === 'pt'
                    ? `Marcado como ${statusText}${variables.newStatus === 'taken' ? ' 💚' : ''}`
                    : `Marked as ${statusText}${variables.newStatus === 'taken' ? ' 💚' : ''}`
            );
            queryClient.invalidateQueries({ queryKey: ["weekly-doses"] });
        },
        onError: (error) => {
            console.error("Error updating dose status:", error);
            toast.error(language === 'pt' ? "Erro ao atualizar status" : "Error updating status");
        }
    });

    return {
        ...query,
        updateDoseStatus: updateStatusMutation.mutateAsync
    };
}
