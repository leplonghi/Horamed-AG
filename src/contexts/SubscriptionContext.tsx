import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from '@/integrations/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '@/integrations/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { eventBus, EVENTS } from '@/lib/eventBus';

export interface Subscription {
  id: string;
  userId: string;
  planType: 'free' | 'premium' | 'premium_individual' | 'premium_family';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  startedAt: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  trialUsed: boolean;
  priceVariant: 'A' | 'B' | 'C';
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isPremium: boolean;
  isFree: boolean;
  isExpired: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number | null;
  daysLeft: number | null;
  canAddMedication: boolean;
  hasFeature: (feature: 'ocr' | 'charts' | 'unlimited_meds' | 'no_ads') => boolean;
  refresh: () => Promise<void>;
  syncWithStripe: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Cleanup previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Real-time listener using onSnapshot
      const subscriptionRef = doc(db, 'users', user.uid, 'subscription', 'current');

      const unsubscribe = onSnapshot(subscriptionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as Subscription;
          setSubscription(data);
          // Emit event for other components if needed
          eventBus.emit(EVENTS.SUBSCRIPTION_CHANGED, data);
        } else {
          setSubscription(null);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error listening to subscription:', error);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error setting up subscription listener:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);

  const syncWithStripe = async () => {
    try {
      setLoading(true);

      if (!user) return;

      // Call Firebase Cloud Function
      const syncSubscription = httpsCallable(functions, 'syncSubscription');
      const result = await syncSubscription();
      const data = result.data as any;

      if (data?.synced) {
        // onSnapshot will update the state automatically, no need to manually reload
        toast({
          title: 'Assinatura sincronizada',
          description: data.subscribed ? 'Sua assinatura Premium está ativa!' : 'Nenhuma assinatura ativa encontrada',
        });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Erro ao sincronizar',
        description: 'Não foi possível sincronizar com o Stripe',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const refresh = async () => {
    // Force sync when requested manually
    await syncWithStripe();
  };

  // Check if on trial - either explicit trial status OR trialEndsAt in the future
  const isOnTrial = (subscription?.trialEndsAt && new Date(subscription.trialEndsAt) > new Date()) ||
    (subscription?.status === 'trial');

  // Premium status - includes trial period (trial users get FULL premium features)
  const isPremium = (
    subscription?.planType === 'premium' ||
    subscription?.planType === 'premium_individual' ||
    subscription?.planType === 'premium_family' ||
    isOnTrial // Trial users are treated as premium
  ) && (subscription?.status === 'active' || subscription?.status === 'trial' || isOnTrial);

  const isFree = subscription?.planType === 'free' && !isOnTrial;

  const trialDaysLeft = subscription?.trialEndsAt && isOnTrial
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const daysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpired = subscription?.status === 'expired' || (daysLeft !== null && daysLeft <= 0 && !isOnTrial);

  // Users can add medications if premium, on trial, or within free tier limits
  const canAddMedication = isPremium || isOnTrial || (isFree && !isExpired);

  // Trial users get ALL premium features
  const hasFeature = (feature: 'ocr' | 'charts' | 'unlimited_meds' | 'no_ads') => {
    if (isPremium || isOnTrial) return true;
    if (isExpired) return false;
    return false;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isPremium,
        isFree,
        isExpired,
        isOnTrial,
        trialDaysLeft,
        daysLeft,
        canAddMedication,
        hasFeature,
        refresh,
        syncWithStripe,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
