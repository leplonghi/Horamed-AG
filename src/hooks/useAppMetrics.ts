import { supabase } from "@/integrations/supabase/client";

type MetricEvent = 
  | 'dose_taken'
  | 'dose_missed' 
  | 'dose_skipped'
  | 'notification_sent'
  | 'notification_failed'
  | 'notification_clicked'
  | 'trial_started'
  | 'subscription_converted'
  | 'subscription_canceled'
  | 'medication_added'
  | 'profile_created'
  | 'app_opened';

interface MetricData {
  [key: string]: string | number | boolean | null;
}

export const trackMetric = async (eventName: MetricEvent, eventData?: MetricData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('app_metrics').insert({
      user_id: user?.id || null,
      event_name: eventName,
      event_data: eventData || {},
    });
    
    console.log(`[Metric] ${eventName}`, eventData);
  } catch (error) {
    console.error('[Metric Error]', eventName, error);
  }
};

// Convenience functions
export const trackDoseTaken = (doseId: string, itemName: string, delayMinutes?: number) => 
  trackMetric('dose_taken', { dose_id: doseId, item_name: itemName, delay_minutes: delayMinutes || 0 });

export const trackDoseMissed = (doseId: string, itemName: string) => 
  trackMetric('dose_missed', { dose_id: doseId, item_name: itemName });

export const trackDoseSkipped = (doseId: string, itemName: string) => 
  trackMetric('dose_skipped', { dose_id: doseId, item_name: itemName });

export const trackNotificationSent = (doseId: string, channel: 'push' | 'local') => 
  trackMetric('notification_sent', { dose_id: doseId, channel });

export const trackNotificationFailed = (doseId: string, error: string) => 
  trackMetric('notification_failed', { dose_id: doseId, error });

export const trackNotificationClicked = (doseId: string, action: string) => 
  trackMetric('notification_clicked', { dose_id: doseId, action });

export const trackTrialStarted = () => trackMetric('trial_started');

export const trackSubscriptionConverted = (planType: string) => 
  trackMetric('subscription_converted', { plan_type: planType });

export const trackSubscriptionCanceled = () => trackMetric('subscription_canceled');

export const trackMedicationAdded = (itemName: string, category: string) => 
  trackMetric('medication_added', { item_name: itemName, category });

export const trackProfileCreated = (relationship: string) => 
  trackMetric('profile_created', { relationship });

export const trackAppOpened = () => trackMetric('app_opened');

export const useAppMetrics = () => {
  return {
    trackMetric,
    trackDoseTaken,
    trackDoseMissed,
    trackDoseSkipped,
    trackNotificationSent,
    trackNotificationFailed,
    trackNotificationClicked,
    trackTrialStarted,
    trackSubscriptionConverted,
    trackSubscriptionCanceled,
    trackMedicationAdded,
    trackProfileCreated,
    trackAppOpened,
  };
};
