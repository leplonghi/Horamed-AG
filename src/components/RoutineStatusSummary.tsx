import { Flame, TrendingUp, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface RoutineStatusSummaryProps {
  streak: number;
  daysOnTrack?: number;
  lastDoseTime?: string;
  todayProgress: { taken: number; total: number };
}

export default function RoutineStatusSummary({ 
  streak, 
  daysOnTrack = 0,
  lastDoseTime,
  todayProgress 
}: RoutineStatusSummaryProps) {
  const { language } = useLanguage();

  const isOnTrack = todayProgress.total === 0 || todayProgress.taken >= todayProgress.total * 0.5;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="p-4 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'pt' ? 'Sequência' : 'Streak'}
                </p>
                <p className="font-bold text-orange-500">
                  {streak} {language === 'pt' ? 'dias' : 'days'}
                </p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              isOnTrack ? 'bg-green-500/10' : 'bg-yellow-500/10'
            }`}>
              <TrendingUp className={`h-5 w-5 ${
                isOnTrack ? 'text-green-500' : 'text-yellow-500'
              }`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'pt' ? 'Status' : 'Status'}
              </p>
              <p className={`font-bold ${isOnTrack ? 'text-green-500' : 'text-yellow-500'}`}>
                {isOnTrack 
                  ? (language === 'pt' ? 'Em dia' : 'On track')
                  : (language === 'pt' ? 'Pendente' : 'Pending')
                }
              </p>
            </div>
          </div>

          {/* Today Progress */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'pt' ? 'Hoje' : 'Today'}
              </p>
              <p className="font-bold text-foreground">
                {todayProgress.taken}/{todayProgress.total}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
