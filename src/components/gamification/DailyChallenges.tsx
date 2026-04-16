import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Lightning as Zap, Clock, CheckCircle as CheckCircle2, Gift, Sparkle as Sparkles, Timer } from "@phosphor-icons/react";
import { auth } from "@/integrations/firebase/client";
import { fetchCollection, where } from "@/integrations/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

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
  const { language } = useLanguage();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const t = {
    title: language === 'pt' ? 'Desafios Diários' : 'Daily Challenges',
    dailyDose: language === 'pt' ? 'Dose do Dia' : 'Daily Dose',
    dailyDoseDesc: language === 'pt' ? 'Tome sua primeira dose de hoje' : 'Take your first dose today',
    onTimeChampion: language === 'pt' ? 'Campeão da Pontualidade' : 'On-Time Champion',
    onTimeChampionDesc: language === 'pt' ? 'Tome 3 doses no horário correto' : 'Take 3 doses on time',
    perfectDay: language === 'pt' ? 'Dia Perfeito' : 'Perfect Day',
    perfectDayDesc: language === 'pt' ? 'Complete todas as doses do dia' : 'Complete all doses today',
    bonus: language === 'pt' ? 'Bônus' : 'Bonus',
    claim: language === 'pt' ? 'Resgatar' : 'Claim',
    claimed: language === 'pt' ? 'Resgatado' : 'Claimed',
    complete: language === 'pt' ? 'completos' : 'complete',
    xpEarned: language === 'pt' ? 'XP ganhos!' : 'XP earned!',
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      // Get today's doses
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = safeDateParse(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // No Firestore, filtramos diretamente por userId e intervalo de data
      const { data: doses, error } = await fetchCollection("dose_instances", [
        where("userId", "==", user.uid),
        where("dueAt", ">=", today.toISOString()),
        where("dueAt", "<", tomorrow.toISOString())
      ]);

      if (error) throw error;

      const takenDoses = doses?.filter(d => d.status === "taken") || [];
      const totalDoses = doses?.length || 0;
      const onTimeDoses = takenDoses.filter(d => 
        d.delayMinutes !== undefined && d.delayMinutes !== null && d.delayMinutes <= 15
      ).length;

      // Generate daily challenges
      const dailyChallenges: Challenge[] = [
        {
          id: "daily_dose",
          title: t.dailyDose,
          description: t.dailyDoseDesc,
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
          title: t.onTimeChampion,
          description: t.onTimeChampionDesc,
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
          title: t.perfectDay,
          description: t.perfectDayDesc,
          icon: <Sparkles className="h-5 w-5 text-teal-500" />,
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
      toast.success(`+${challenge.xpReward} ${t.xpEarned}`, {
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
          <h3 className="font-semibold">{t.title}</h3>
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
            {completedCount}/{challenges.length} {t.complete}
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
                      <Badge variant="secondary" className="text-xs">{t.bonus}</Badge>
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
                        {t.claim}
                      </>
                    )}
                  </Button>
                )}

                {challenge.claimed && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    ✓ {t.claimed}
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
