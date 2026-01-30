import { useState, useEffect } from 'react';
import { useAuth, fetchCollection, setDocument, updateDocument, deleteDocument, where, orderBy, fetchDocument } from '@/integrations/firebase';

export interface SideEffectLog {
  id: string;
  userId: string; // user_id
  profileId: string | null; // profile_id
  doseId: string | null; // dose_id
  itemId: string | null; // item_id
  recordedAt: string; // recorded_at
  overallFeeling: number | null; // overall_feeling
  energyLevel: number | null; // energy_level
  painLevel: number | null; // pain_level
  nauseaLevel: number | null; // nausea_level
  sleepQuality: number | null; // sleep_quality
  sideEffectTags: string[]; // side_effect_tags
  notes: string | null;
  createdAt: string; // created_at
  // Denormalized/Fetched data
  items?: {
    name: string;
    doseText: string | null; // dose_text
  };
}

export interface SideEffectInput {
  doseId?: string; // dose_id
  itemId: string; // item_id
  profileId?: string; // profile_id
  overallFeeling?: number; // overall_feeling
  energyLevel?: number; // energy_level
  painLevel?: number; // pain_level
  nauseaLevel?: number; // nausea_level
  sleepQuality?: number; // sleep_quality
  sideEffectTags?: string[]; // side_effect_tags
  notes?: string;
}

export const COMMON_SIDE_EFFECTS = [
  'Dor de cabeça',
  'Náusea',
  'Tontura',
  'Sonolência',
  'Insônia',
  'Boca seca',
  'Diarreia',
  'Constipação',
  'Fadiga',
  'Ansiedade',
  'Perda de apetite',
  'Aumento de apetite',
  'Tremores',
  'Suor excessivo',
  'Palpitações',
];

export function useSideEffectsLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SideEffectLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async (itemId?: string, startDate?: Date, endDate?: Date) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const constraints: any[] = [orderBy('recordedAt', 'desc')]; // Using any to avoid complicated union type matching issues quickly


      if (itemId) {
        constraints.push(where('itemId', '==', itemId));
      }

      if (startDate) {
        constraints.push(where('recordedAt', '>=', startDate.toISOString()));
      }

      if (endDate) {
        constraints.push(where('recordedAt', '<=', endDate.toISOString()));
      }

      const { data: logsData, error } = await fetchCollection<any>(
        `users/${user.uid}/sideEffects`,
        constraints
      );

      if (error) throw error;

      // Need to fetch item details manually since we don't have joins
      // Optimization: Fetch unique items
      const uniqueItemIds = [...new Set((logsData || []).map(l => l.itemId).filter(Boolean))];
      const itemsMap: Record<string, any> = {};

      await Promise.all(uniqueItemIds.map(async (id) => {
        const { data } = await fetchDocument(`users/${user.uid}/medications`, id);
        if (data) itemsMap[id] = data;
      }));

      const enrichedLogs = (logsData || []).map(log => ({
        id: log.id,
        userId: log.userId,
        profileId: log.profileId,
        doseId: log.doseId,
        itemId: log.itemId,
        recordedAt: log.recordedAt,
        overallFeeling: log.overallFeeling,
        energyLevel: log.energyLevel,
        painLevel: log.painLevel,
        nauseaLevel: log.nauseaLevel,
        sleepQuality: log.sleepQuality,
        sideEffectTags: log.sideEffectTags || [],
        notes: log.notes,
        createdAt: log.createdAt,
        items: log.itemId && itemsMap[log.itemId] ? {
          name: itemsMap[log.itemId].name,
          doseText: itemsMap[log.itemId].doseText || null
        } : undefined
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching side effects logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createLog = async (input: SideEffectInput) => {
    if (!user) throw new Error('User not authenticated');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newLog = {
      id,
      userId: user.uid,
      profileId: input.profileId || null,
      doseId: input.doseId || null,
      itemId: input.itemId,
      overallFeeling: input.overallFeeling || null,
      energyLevel: input.energyLevel || null,
      painLevel: input.painLevel || null,
      nauseaLevel: input.nauseaLevel || null,
      sleepQuality: input.sleepQuality || null,
      sideEffectTags: input.sideEffectTags || [],
      notes: input.notes || null,
      recordedAt: now,
      createdAt: now
    };

    const { error } = await setDocument(
      `users/${user.uid}/sideEffects`,
      id,
      newLog
    );

    if (error) throw error;
    return newLog;
  };

  const updateLog = async (logId: string, updates: Partial<SideEffectInput>) => {
    if (!user) throw new Error('User not authenticated');

    // Convert input camelCase to match Firestore
    const firestoreUpdates: any = { ...updates };
    // Mapped fields already match if input is typed correctly

    const { error } = await updateDocument(
      `users/${user.uid}/sideEffects`,
      logId,
      firestoreUpdates
    );

    if (error) throw error;
    return { id: logId, ...updates };
  };

  const deleteLog = async (logId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await deleteDocument(
      `users/${user.uid}/sideEffects`,
      logId
    );

    if (error) throw error;
  };

  const getCorrelationData = async (itemId: string, metric: keyof SideEffectLog) => {
    if (!user) return [];

    // Map metric name if necessary (it matches interface so logic is fine)
    // metric passed is camelCase

    const { data, error } = await fetchCollection<any>(
      `users/${user.uid}/sideEffects`,
      [
        where('itemId', '==', itemId),
        where(metric as string, '!=', null),
        orderBy(metric as string),
        orderBy('recordedAt', 'asc') // Firestore requires composite index for inequality
      ]
    );
    // Note: If inequality on metric, sort must start with metric. 
    // If just checking not-null, sometimes standard queries work but safest is simple fetch and filter in memory if volume is low.

    // Fallback: simple query by itemId and filter in memory
    const { data: allLogs } = await fetchCollection<any>(
      `users/${user.uid}/sideEffects`,
      [
        where('itemId', '==', itemId),
        orderBy('recordedAt', 'asc')
      ]
    );

    if (!allLogs) return [];

    return allLogs
      .filter(log => log[metric] != null)
      .map(log => ({
        recordedAt: log.recordedAt, // mapped to camelCase
        [metric]: log[metric]
      }));
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  return {
    logs,
    isLoading,
    fetchLogs,
    createLog,
    updateLog,
    deleteLog,
    getCorrelationData,
  };
}
