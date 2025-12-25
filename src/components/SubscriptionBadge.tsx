import { Crown, Clock, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionBadge() {
  const { isPremium, isFree, daysLeft, loading } = useSubscription();
  
  if (loading) return null;
  
  if (isPremium) {
    return (
      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/90">
        <Crown className="h-3 w-3 text-yellow-300 fill-yellow-300" />
      </div>
    );
  }
  
  if (isFree && daysLeft !== null) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="hidden sm:inline">{daysLeft > 0 ? `${daysLeft}d` : 'Exp'}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
      <span className="text-[10px] font-medium text-muted-foreground">F</span>
    </div>
  );
}