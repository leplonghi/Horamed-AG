import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  weeklyXP: number;
  streak: number;
  isCurrentUser: boolean;
}

export function WeeklyLeaderboard() {
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For privacy, we simulate anonymous leaderboard data
      // In production, this would use anonymized aggregated data
      const simulatedData: LeaderboardEntry[] = [
        { rank: 1, userId: "1", nickname: "HealthHero", avatarUrl: null, weeklyXP: 850, streak: 42, isCurrentUser: false },
        { rank: 2, userId: "2", nickname: "MedMaster", avatarUrl: null, weeklyXP: 720, streak: 28, isCurrentUser: false },
        { rank: 3, userId: "3", nickname: "WellnessWin", avatarUrl: null, weeklyXP: 680, streak: 21, isCurrentUser: false },
        { rank: 4, userId: user.id, nickname: "Você", avatarUrl: null, weeklyXP: 450, streak: 7, isCurrentUser: true },
        { rank: 5, userId: "5", nickname: "CareChamp", avatarUrl: null, weeklyXP: 420, streak: 14, isCurrentUser: false },
      ];

      setLeaderboard(simulatedData);
      setCurrentUserRank(4);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10 border-primary/30";
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-300/10 to-gray-400/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/10 to-orange-600/10 border-amber-600/30";
      default:
        return "bg-card";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">{t('leaderboard.title') || 'Ranking Semanal'}</h3>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          Top 5
        </Badge>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getRankBg(entry.rank, entry.isCurrentUser)}`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>

            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={entry.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {entry.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${entry.isCurrentUser ? 'text-primary' : ''}`}>
                {entry.nickname}
                {entry.isCurrentUser && (
                  <span className="text-xs text-muted-foreground ml-2">(você)</span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  🔥 {entry.streak} dias
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-primary">{entry.weeklyXP}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </motion.div>
        ))}
      </div>

      {currentUserRank && currentUserRank > 5 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Sua posição: <span className="font-bold text-foreground">#{currentUserRank}</span>
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            Continue para subir no ranking!
          </p>
        </div>
      )}
    </Card>
  );
}
