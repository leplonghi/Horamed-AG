import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown, Bell, AlertTriangle, CheckCircle,
  FileText, Scale, Users, Gift
} from "lucide-react";
import SmartInsightsBase, { Insight } from "@/components/shared/SmartInsightsBase";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useTranslation } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { auth, fetchCollection, fetchDocument, limit, where } from "@/integrations/firebase";

export default function SmartProfileInsights() {
  const navigate = useNavigate();
  const { isPremium, daysLeft } = useSubscription();
  const { profiles } = useUserProfiles();
  const { t } = useTranslation();
  const user = auth.currentUser;

  // Check if user has vital signs records (Firebase)
  const { data: hasVitalSigns } = useQuery({
    queryKey: ["profile-vitals-check", user?.uid],
    queryFn: async () => {
      if (!user) return false;
      // Check if any vitalSigns exist
      const { data } = await fetchCollection(`users/${user.uid}/vitalSigns`, [limit(1)]);
      return data && data.length > 0;
    },
    enabled: !!user
  });

  // Check notification preferences (Firebase)
  const { data: notificationsEnabled } = useQuery({
    queryKey: ["profile-notifications-check", user?.uid],
    queryFn: async () => {
      if (!user) return true; // Default to true if check fails to avoid annoying user if not critical

      // Logic: check if we have explicit disabled setting.
      // Assuming we migrate references to users/{uid}/settings/notifications

      const { data } = await fetchDocument<any>(`users/${user.uid}/settings`, 'notifications');

      if (data) {
        return data.pushEnabled !== false; // Default true unless explicitly false
      }

      // Fallback: check browser permission
      if ('Notification' in window) {
        return Notification.permission === 'granted';
      }

      return false;
    },
    enabled: !!user
  });

  // Check referral stats (Firebase)
  const { data: referralCount = 0 } = useQuery({
    queryKey: ["profile-referral-count", user?.uid],
    queryFn: async () => {
      if (!user) return 0;

      const { data } = await fetchCollection<any>(
        `users/${user.uid}/referrals`,
        [where('status', '==', 'active')]
      );

      return data ? data.length : 0;
    },
    enabled: !!user
  });

  const insights = useMemo(() => {
    const result: Insight[] = [];

    // Trial expiring soon
    if (!isPremium && daysLeft !== null && daysLeft > 0 && daysLeft <= 3) {
      result.push({
        id: "trial-expiring",
        type: "warning",
        icon: <Crown className="h-5 w-5" />,
        title: t('profile.trialExpiringSoon'),
        description: `${daysLeft} ${t('profile.daysRemaining')}`,
        action: {
          label: t('common.upgrade'),
          onClick: () => navigate('/planos')
        }
      });
    }

    // Trial expired
    if (!isPremium && daysLeft !== null && daysLeft <= 0) {
      result.push({
        id: "trial-expired",
        type: "urgent",
        icon: <AlertTriangle className="h-5 w-5" />,
        title: t('profile.freeTrialExpired'),
        description: t('profile.upgradeToUnlock'),
        action: {
          label: t('common.upgrade'),
          onClick: () => navigate('/planos')
        }
      });
    }

    // Notifications not enabled
    if (!notificationsEnabled) {
      result.push({
        id: "notifications-disabled",
        type: "warning",
        icon: <Bell className="h-5 w-5" />,
        title: t('profile.notificationsDisabled'),
        description: t('profile.enableNotificationsDesc'),
        action: {
          label: t('profile.enable'),
          onClick: () => navigate('/notificacoes/config')
        }
      });
    }

    // No vitals records
    if (hasVitalSigns === false) {
      result.push({
        id: "no-vitals",
        type: "info",
        icon: <Scale className="h-5 w-5" />,
        title: t('profile.trackYourWeight'),
        description: t('profile.trackYourWeightDesc'),
        action: {
          label: t('common.start'),
          onClick: () => navigate('/sinais-vitais')
        }
      });
    }

    // Single profile - suggest adding family
    if (profiles.length === 1 && isPremium) {
      result.push({
        id: "add-family",
        type: "info",
        icon: <Users className="h-5 w-5" />,
        title: t('profile.addFamilyProfiles'),
        description: t('profile.addFamilyProfilesDesc'),
        action: {
          label: t('common.add'),
          onClick: () => navigate('/perfil/criar')
        }
      });
    }

    // Referral success
    if (referralCount > 0) {
      result.push({
        id: "referral-success",
        type: "success",
        icon: <Gift className="h-5 w-5" />,
        title: t('profile.referralSuccess', { count: String(referralCount) }),
        description: t('profile.referralSuccessDesc'),
        action: {
          label: t('common.view'),
          onClick: () => navigate('/recompensas')
        }
      });
    }

    // All good!
    if (result.length === 0) {
      result.push({
        id: "all-good",
        type: "success",
        icon: <CheckCircle className="h-5 w-5" />,
        title: t('profile.allConfigured'),
        description: t('profile.allConfiguredDesc')
      });
    }

    return result.slice(0, 2);
  }, [isPremium, daysLeft, notificationsEnabled, hasVitalSigns, profiles, referralCount, navigate, t]);

  if (insights.length === 0) return null;

  return <SmartInsightsBase insights={insights} />;
}
