import { memo } from "react";
import { Users, Warning, CheckCircle } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/hooks/useUserProfiles";

interface FamilyPulseWidgetProps {
  profiles: UserProfile[];
  activeProfileId?: string;
  onSwitchProfile: (profile: UserProfile) => void;
  className?: string;
}

export function FamilyPulseWidget({ 
  profiles, 
  activeProfileId, 
  onSwitchProfile,
  className 
}: FamilyPulseWidgetProps) {
  // Filter out the active profile
  const dependents = profiles.filter(p => p.id !== activeProfileId);

  if (dependents.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 px-1">
        <Users size={18} className="text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">Monitoramento Familiar</h3>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {dependents.map((profile) => (
          <Card 
            key={profile.id}
            onClick={() => onSwitchProfile(profile)}
            className={cn(
              "flex items-center gap-3 p-2.5 min-w-[160px] shrink-0",
              "bg-white/40 dark:bg-white/5 border-white/20 backdrop-blur-md cursor-pointer transition-all",
              "hover:bg-white/60 dark:hover:bg-white/10"
            )}
          >
            <div className="relative">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-10 h-10 rounded-full object-cover border border-white/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {profile.name.charAt(0)}
                </div>
              )}
              {/* Status indicator (Mocked for now as we'd need to fetch their daily stats separately) */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <CheckCircle size={10} weight="fill" className="text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                Tudo em dia
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default memo(FamilyPulseWidget);
