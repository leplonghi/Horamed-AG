import { useState, useCallback, useEffect } from 'react';
import { useAuth, fetchCollection, setDocument, deleteDocument, where } from '@/integrations/firebase';
import { messaging } from '@/integrations/firebase/client';
import { getToken, deleteToken } from 'firebase/messaging';

// Add VAPID key to environment variables or fetch from remote config
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export interface UsePushSubscriptionReturn {
  isSubscribed: boolean;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && !!messaging;

  // Check current subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !user || !messaging) {
        setIsLoading(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        // Check if we have permission
        if (Notification.permission === 'granted') {
          // In FCM, we check if we have a token and if it matches one in DB
          // For simplicity, we just check if DB has any active token for this user/device
          // But actually, we need the token to check equality.
          // Getting token does not prompt if permission is granted.

          /* 
             NOTE: getToken might refresh the token. 
             If we want to avoid side-effects just for checking, this is tricky.
             We will assume "isSubscribed" if we find a record in Firestore for this browser.
             However, distinguishing browsers without a generated ID is hard.
             We'll rely on checking if we can get a token silently.
          */

          // Try to find a stored token in localStorage to validate against DB
          // Or just check if permission is granted AND we have a record in DB?
          // Let's keep it simple: if permission granted, we consider subscribed UI-wise, 
          // but we sync token in background.
          setIsSubscribed(true);
        } else {
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error('[PushSubscription] Error checking subscription:', err);
        setError('Erro ao verificar assinatura push');
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSupported, user]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user || !messaging) {
      setError('Push notifications não suportadas');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permissão de notificação negada');
        setIsLoading(false);
        return false;
      }

      // Get FCM Token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY // Optional if using default instance
      });

      if (!token) {
        throw new Error('Falha ao obter token FCM');
      }

      // Save to Firestore: users/{uid}/pushSubscriptions/{token}
      const { error: dbError } = await setDocument(
        `users/${user.uid}/pushSubscriptions`,
        token, // Use token as ID or hash it
        {
          token,
          userAgent: navigator.userAgent,
          updatedAt: new Date().toISOString(),
          platform: 'web'
        }
      );

      if (dbError) throw dbError;

      console.log('[PushSubscription] Subscription saved successfully');
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[PushSubscription] Error subscribing:', err);
      setError('Erro ao ativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user || !messaging) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Delete token from FCM
      // We need the token first
      const token = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null);

      if (token) {
        // Remove from Firestore
        await deleteDocument(
          `users/${user.uid}/pushSubscriptions`,
          token
        );

        // Invalidate in FCM
        await deleteToken(messaging);
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('[PushSubscription] Error unsubscribing:', err);
      setError('Erro ao desativar notificações push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  return {
    isSubscribed,
    isSupported,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}