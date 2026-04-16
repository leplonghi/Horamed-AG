import { useAuth } from "@/contexts/AuthContext";
import { fetchCollection, addDocument, orderBy, limit, query, where, Timestamp } from "@/integrations/firebase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface RewardHistoryItem {
    id?: string;
    title: string;
    description?: string;
    date: Date | Timestamp;
    value: string;
    type: "positive" | "negative";
}

export function useRewardHistory() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: history = [], isLoading } = useQuery({
        queryKey: ["reward-history", user?.uid],
        queryFn: async () => {
            if (!user) return [];
            try {
                const { data } = await fetchCollection<RewardHistoryItem>(
                    `users/${user.uid}/reward_history`,
                    [orderBy("date", "desc"), limit(20)]
                );
                return data || [];
            } catch (error) {
                console.error("Error fetching reward history:", error);
                return [];
            }
        },
        enabled: !!user,
    });

    const addRewardLog = useMutation({
        mutationFn: async (item: Omit<RewardHistoryItem, 'id'>) => {
            if (!user) throw new Error("User not authenticated");
            const logItem = {
                ...item,
                date: item.date instanceof Date ? Timestamp.fromDate(item.date) : item.date,
            };
            return addDocument(`users/${user.uid}/reward_history`, logItem);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reward-history", user?.uid] });
        },
    });

    return {
        history,
        isLoading,
        logReward: addRewardLog.mutate,
    };
}

/**
 * Utility to log rewards from non-component contexts if needed.
 * Note: Components should use the hook above.
 */
export async function logRewardEntry(userId: string, item: Omit<RewardHistoryItem, 'id'>) {
    try {
        await addDocument(`users/${userId}/reward_history`, {
            ...item,
            date: item.date instanceof Date ? Timestamp.fromDate(item.date) : item.date,
        });
    } catch (error) {
        console.error("Error logging reward entry:", error);
    }
}
