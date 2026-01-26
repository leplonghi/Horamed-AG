import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Sparkles, 
  Clock, 
  Package, 
  TrendingUp,
  Calendar,
  Heart,
  Lightbulb,
  ChevronRight,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClaraProactiveCardProps {
  overdueDoses?: number;
  lowStockItems?: string[];
  currentStreak?: number;
  todayProgress?: { taken: number; total: number };
  onOpenClara?: () => void;
  onActionClick?: (action: string) => void;
  className?: string;
}

type InsightType = "greeting" | "motivation" | "reminder" | "tip" | "celebration" | "alert";

interface ClaraInsight {
  id: string;
  type: InsightType;
  message: string;
  subtext?: string;
  action?: {
    label: string;
    route?: string;
    handler?: () => void;
  };
  icon: typeof Sparkles;
  priority: number;
}

function ClaraProactiveCard({
  overdueDoses = 0,
  lowStockItems = [],
  currentStreak = 0,
  todayProgress = { taken: 0, total: 0 },
  onOpenClara,
  onActionClick,
  className
}: ClaraProactiveCardProps) {
  const { language } = useLanguage();
  
  // Generate single highest priority insight - no rotation needed
  const currentInsight = useMemo<ClaraInsight | null>(() => {
    const hour = new Date().getHours();
    const progressPercent = todayProgress.total > 0 
      ? (todayProgress.taken / todayProgress.total) * 100 
      : 0;

    // Priority 1: Overdue doses alert
    if (overdueDoses > 0) {
      const plural = overdueDoses > 1;
      return {
        id: "overdue",
        type: "alert",
        message: language === 'pt' 
          ? `Você tem ${overdueDoses} dose${plural ? 's' : ''} atrasada${plural ? 's' : ''}!`
          : `You have ${overdueDoses} overdue dose${plural ? 's' : ''}!`,
        subtext: language === 'pt' 
          ? "Vamos colocar sua rotina em dia?" 
          : "Let's catch up on your routine?",
        action: {
          label: language === 'pt' ? "Ver doses" : "View doses",
          handler: () => onActionClick?.("overdue")
        },
        icon: Clock,
        priority: 1
      };
    }

    // Priority 2: Low stock warning
    if (lowStockItems.length > 0) {
      const itemName = lowStockItems[0];
      const moreCount = lowStockItems.length - 1;
      return {
        id: "low_stock",
        type: "reminder",
        message: language === 'pt' 
          ? `${itemName} está acabando${moreCount > 0 ? ` (+${moreCount})` : ''}`
          : `${itemName} is running low${moreCount > 0 ? ` (+${moreCount})` : ''}`,
        subtext: language === 'pt' 
          ? "Quer que eu te lembre de comprar?" 
          : "Want me to remind you to buy more?",
        action: {
          label: language === 'pt' ? "Ver estoque" : "View stock",
          route: "/medicamentos?tab=estoque"
        },
        icon: Package,
        priority: 2
      };
    }

    // Priority 3: Celebration for streaks
    if (currentStreak >= 7 && currentStreak % 7 === 0) {
      return {
        id: "streak_celebration",
        type: "celebration",
        message: language === 'pt' 
          ? `🔥 Incrível! ${currentStreak} dias seguidos!`
          : `🔥 Amazing! ${currentStreak} days in a row!`,
        subtext: language === 'pt' 
          ? "Você está arrasando na sua rotina!" 
          : "You're crushing your routine!",
        icon: Sparkles,
        priority: 3
      };
    }

    // Priority 4: Progress encouragement
    if (todayProgress.total > 0 && progressPercent >= 50 && progressPercent < 100) {
      return {
        id: "progress",
        type: "motivation",
        message: language === 'pt' 
          ? `Já completou ${Math.round(progressPercent)}% do dia!`
          : `Already ${Math.round(progressPercent)}% done for today!`,
        subtext: language === 'pt' 
          ? "Continue assim, está quase lá!" 
          : "Keep going, you're almost there!",
        icon: TrendingUp,
        priority: 4
      };
    }

    // Priority 5: Contextual greetings (simplified)
    if (hour < 10) {
      return {
        id: "morning",
        type: "greeting",
        message: language === 'pt' ? "Bom dia! Pronta para começar?" : "Good morning! Ready to start?",
        subtext: language === 'pt' ? "Estou aqui se precisar de ajuda!" : "I'm here if you need help!",
        icon: Heart,
        priority: 5
      };
    } else if (hour >= 20) {
      return {
        id: "night",
        type: "greeting",
        message: language === 'pt' ? "Boa noite! Última checagem do dia?" : "Good evening! Final check?",
        subtext: language === 'pt' ? "Garanta que tomou tudo antes de dormir." : "Make sure you've taken everything.",
        icon: Calendar,
        priority: 5
      };
    }
    
    // Default - don't show card
    return null;
  }, [overdueDoses, lowStockItems, currentStreak, todayProgress.taken, todayProgress.total, language, onActionClick]);

  if (!currentInsight) return null;

  const getTypeColors = (type: InsightType) => {
    switch (type) {
      case "alert":
        return "bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/30 text-destructive";
      case "reminder":
        return "bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-600 dark:text-amber-400";
      case "celebration":
        return "bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/30 text-green-600 dark:text-green-400";
      case "motivation":
        return "bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-blue-500/30 text-blue-600 dark:text-blue-400";
      default:
        return "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30 text-primary";
    }
  };

  const Icon = currentInsight.icon;
  const colors = getTypeColors(currentInsight.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative", className)}
    >
      <Card 
        className={cn(
          "p-3 cursor-pointer transition-all border backdrop-blur-xl",
          "hover:shadow-[var(--shadow-glass-hover)] shadow-[var(--shadow-glass)]",
          colors
        )}
        onClick={() => {
          if (currentInsight.action?.handler) {
            currentInsight.action.handler();
          } else if (currentInsight.action?.route) {
            onActionClick?.(currentInsight.action.route);
          } else {
            onOpenClara?.();
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            colors.split(' ')[0]
          )}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-semibold text-sm">Clara</span>
            </div>
            
            <p className="text-sm font-medium leading-tight">
              {currentInsight.message}
            </p>
            
            {currentInsight.subtext && (
              <p className="text-xs opacity-80 mt-0.5 leading-tight">
                {currentInsight.subtext}
              </p>
            )}
          </div>

          {currentInsight.action && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-7 px-2 text-xs hover:bg-white/50"
              onClick={(e) => {
                e.stopPropagation();
                if (currentInsight.action?.handler) {
                  currentInsight.action.handler();
                } else if (currentInsight.action?.route) {
                  onActionClick?.(currentInsight.action.route);
                }
              }}
            >
              {currentInsight.action.label}
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default memo(ClaraProactiveCard);