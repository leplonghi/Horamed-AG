import { IconCrown, IconHistory as IconClock, IconSparkles, IconPlansPremium, IconPlansFree } from '@/components/icons/HoramedIcons';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionBadge() {
  const { isPremium, isFree, isOnTrial, trialDaysLeft, daysLeft, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) return null;

  // Trial badge with countdown
  if (isOnTrial && trialDaysLeft !== null) {
    const isUrgent = trialDaysLeft <= 2;
    return (
      <button
        type="button"
        className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-full cursor-pointer transition-colors ${isUrgent
          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 animate-pulse"
          : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        onClick={() => navigate("/planos")}
      >
        <IconSparkles size={14} />
        <span className="hidden md:inline text-xs font-medium">Trial {trialDaysLeft}d</span>
      </button>
    );
  }

  if (isPremium) {
    return (
      <button
        type="button"
        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer border border-blue-500/20"
        onClick={() => navigate("/planos")}
      >
        <IconPlansPremium size={14} className="text-blue-500" />
        <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">PRO</span>
      </button>
    );
  }

  if (isFree && daysLeft !== null) {
    return (
      <button
        type="button"
        className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        onClick={() => navigate("/planos")}
      >
        <IconPlansFree size={14} />
        <span className="hidden md:inline">{daysLeft > 0 ? `${daysLeft}d` : 'Expirado'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
      onClick={() => navigate("/planos")}
    >
      <IconPlansFree size={14} />
      <span className="hidden md:inline text-xs font-medium">Premium</span>
    </button>
  );
}
