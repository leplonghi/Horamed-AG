import { useState, useEffect, useCallback } from 'react';
import { useAuth, fetchCollection, where, orderBy, updateDocument } from '@/integrations/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';

export interface MedicationInteraction {
  id: string;
  drugA: string; // drug_a -> drugA
  drugB: string; // drug_b -> drugB
  severity: 'low' | 'moderate' | 'high' | 'contraindicated';
  description: string;
  recommendation: string | null;
  mechanism: string | null;
  itemAName: string; // item_a_name -> itemAName
  itemBName: string; // item_b_name -> itemBName
  itemAId: string; // item_a_id -> itemAId
  itemBId: string; // item_b_id -> itemBId
}

export interface InteractionAlert {
  id: string;
  interactionId: string; // interaction_id
  itemAId: string; // item_a_id
  itemBId: string; // item_b_id
  severity: string;
  acknowledgedAt: string | null; // acknowledged_at
  dismissedAt: string | null; // dismissed_at
  createdAt: string; // created_at
}

export function useMedicationInteractions(profileId?: string) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<MedicationInteraction[]>([]);
  const [alerts, setAlerts] = useState<InteractionAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInteractions = useCallback(async (newMedication?: string) => {
    if (!user) return { interactions: [], hasCritical: false }; // changed has_critical to hasCritical

    setLoading(true);
    setError(null);

    try {
      const checkInteractionsFn = httpsCallable(functions, 'checkInteractions');
      const result = await checkInteractionsFn({
        profileId,
        newMedication,
      });

      const data = result.data as any;

      setInteractions(data.interactions || []);
      return data;
    } catch (err: any) {
      console.error('Error checking interactions:', err);
      setError(err.message);
      return { interactions: [], hasCritical: false };
    } finally {
      setLoading(false);
    }
  }, [user, profileId]);

  const loadAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const constraints = [
        where('dismissedAt', '==', null), // dismissed_at -> dismissedAt
        orderBy('createdAt', 'desc') // created_at -> createdAt
      ];

      if (profileId) {
        constraints.push(where('profileId', '==', profileId));
      }

      // In Firestore: users/{userId}/interactionAlerts
      const { data, error: queryError } = await fetchCollection(
        `users/${user.uid}/interactionAlerts`,
        constraints
      );

      if (queryError) throw queryError;
      setAlerts((data || []) as InteractionAlert[]);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
    }
  }, [user, profileId]);

  const dismissAlert = useCallback(async (alertId: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await updateDocument(
        `users/${user.uid}/interactionAlerts`,
        alertId,
        { dismissedAt: new Date().toISOString() }
      );

      if (updateError) throw updateError;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err: any) {
      console.error('Error dismissing alert:', err);
    }
  }, [user]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const { error: updateError } = await updateDocument(
        `users/${user.uid}/interactionAlerts`,
        alertId,
        { acknowledgedAt: now }
      );

      if (updateError) throw updateError;

      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, acknowledgedAt: now } : a
      ));
    } catch (err: any) {
      console.error('Error acknowledging alert:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkInteractions();
      loadAlerts();
    }
  }, [user, profileId, checkInteractions, loadAlerts]);

  return {
    interactions,
    alerts,
    loading,
    error,
    checkInteractions,
    dismissAlert,
    acknowledgeAlert,
    hasCritical: interactions.some(i => i.severity === 'contraindicated' || i.severity === 'high'),
    hasWarnings: interactions.length > 0,
  };
}