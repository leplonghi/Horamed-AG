import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Gift,
  Sparkles,
  Timer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  type: 'daily' | 'streak' | 'bonus';
}

export function DailyChallenges() {
  const { t } = useLanguage();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's doses
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: doses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", today.toISOString())
        .lt("due_at", tomorrow.toISOString());

      const takenDoses = doses?.filter(d => d.status === "taken") || [];
      const totalDoses = doses?.length || 0;
      const onTimeDoses = takenDoses.filter(d => 
        d.delay_minutes !== null && d.delay_minutes <= 15
      ).length;

      // Generate daily challenges
      const dailyChallenges: Challenge[] = [
        {
          id: "daily_dose",
          title: "Dose do Dia",
          description: "Tome sua primeira dose de hoje",
          icon: <Target className="h-5 w-5 text-blue-500" />,
          current: Math.min(takenDoses.length, 1),
          target: 1,
          xpReward: 20,
          completed: takenDoses.length >= 1,
          claimed: false,
          type: 'daily'
        },
        {
          id: "on_time_champion",
          title: "Campeão da Pontualidade",
          description: "Tome 3 doses no horário correto",
          icon: <Clock className="h-5 w-5 text-green-500" />,
          current: onTimeDoses,
          target: 3,
          xpReward: 50,
          completed: onTimeDoses >= 3,
          claimed: false,
          type: 'daily'
        },
        {
          id: "perfect_day",
          title: "Dia Perfeito",
          description: "Complete todas as doses do dia",
          icon: <Sparkles className="h-5 w-5 text-purple-500" />,
          current: takenDoses.length,
          target: Math.max(totalDoses, 1),
          xpReward: 100,
          completed: totalDoses > 0 && takenDoses.length === totalDoses,
          claimed: false,
          type: 'bonus'
        },
      ];

      setChallenges(dailyChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (challengeId: string) => {
    setClaimingId(challengeId);
    
    // Simulate claiming animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setChallenges(prev => 
      prev.map(c => 
        c.id === challengeId ? { ...c, claimed: true } : c
      )
    );
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      toast.success(`+${challenge.xpReward} XP ganhos!`, {
        icon: "🎉",
      });
    }
    
    setClaimingId(null);
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const completedCount = challenges.filter(c => c.completed).length;
  const totalXP = challenges.reduce((acc, c) => acc + (c.completed ? c.xpReward : 0), 0);

  return (
    <Card className="p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">{t('challenges.title') || 'Desafios Diários'}</h3>
        </div>
        <Badge variant="outline" className="gap-1">
          <Timer className="h-3 w-3" />
          {getTimeRemaining()}
        </Badge>
      </div>

      {/* Progress Summary */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {completedCount}/{challenges.length} completos
          </span>
          <span className="text-sm text-primary font-bold">
            +{totalXP} XP
          </span>
        </div>
        <Progress value={(completedCount / challenges.length) * 100} className="h-2" />
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        <AnimatePresence>
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border transition-all ${
                challenge.claimed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : challenge.completed 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'bg-card'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  challenge.completed ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {challenge.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    challenge.icon
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{challenge.title}</p>
                    {challenge.type === 'bonus' && (
                      <Badge variant="secondary" className="text-xs">Bônus</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{challenge.description}</p>
                  
                  {!challenge.completed && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{challenge.current}/{challenge.target}</span>
                        <span className="text-primary">+{challenge.xpReward} XP</span>
                      </div>
                      <Progress 
                        value={(challenge.current / challenge.target) * 100} 
                        className="h-1.5" 
                      />
                    </div>
                  )}
                </div>

                {challenge.completed && !challenge.claimed && (
                  <Button
                    size="sm"
                    onClick={() => claimReward(challenge.id)}
                    disabled={claimingId === challenge.id}
                    className="shrink-0 gap-1"
                  >
                    {claimingId === challenge.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Gift className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <>
                        <Gift className="h-4 w-4" />
                        Resgatar
                      </>
                    )}
                  </Button>
                )}

                {challenge.claimed && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    ✓ Resgatado
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
