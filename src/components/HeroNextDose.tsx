import { format, formatDistanceToNow, addDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Check, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface HeroNextDoseProps {
  dose?: {
    id: string;
    item_id: string;
    due_at: string;
    status: string;
    items: {
      name: string;
      dose_text: string | null;
    };
  } | null;
  nextDayDose?: {
    time: string;
    name: string;
  } | null;
  onTake: (doseId: string, itemId: string, itemName: string) => void;
  allDoneToday?: boolean;
}

export default function HeroNextDose({ dose, nextDayDose, onTake, allDoneToday }: HeroNextDoseProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  // All doses done for today
  if (allDoneToday || (!dose && !nextDayDose)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-green-600 dark:text-green-400">
                {language === 'pt' ? 'Hoje está tudo certo! 👍' : 'All done for today! 👍'}
              </h2>
              {nextDayDose ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'pt' 
                    ? `Próxima dose amanhã às ${nextDayDose.time} - ${nextDayDose.name}`
                    : `Next dose tomorrow at ${nextDayDose.time} - ${nextDayDose.name}`
                  }
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'pt' 
                    ? 'Você está em dia com sua rotina de saúde.'
                    : 'You are up to date with your health routine.'
                  }
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // No dose pending but show next day
  if (!dose && nextDayDose) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                {language === 'pt' ? 'PRÓXIMA DOSE' : 'NEXT DOSE'}
              </p>
              <h2 className="text-xl font-bold">{nextDayDose.name}</h2>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' 
                  ? `Amanhã às ${nextDayDose.time}`
                  : `Tomorrow at ${nextDayDose.time}`
                }
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Has a pending dose
  if (dose) {
    const dueTime = new Date(dose.due_at);
    const now = new Date();
    const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / (1000 * 60));
    const isNow = minutesUntil <= 15 && minutesUntil >= -30;
    const isOverdue = minutesUntil < -5;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn(
          "p-6 transition-all",
          isOverdue 
            ? "bg-gradient-to-br from-destructive/10 to-orange-500/5 border-destructive/30 ring-2 ring-destructive/20"
            : isNow 
              ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 ring-2 ring-primary/20 shadow-lg"
              : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
        )}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-xs uppercase tracking-wide font-bold",
                isOverdue ? "text-destructive" : "text-primary"
              )}>
                {isOverdue 
                  ? (language === 'pt' ? '⚠️ DOSE ATRASADA' : '⚠️ OVERDUE DOSE')
                  : isNow 
                    ? (language === 'pt' ? '🔔 AGORA' : '🔔 NOW')
                    : (language === 'pt' ? 'PRÓXIMA DOSE' : 'NEXT DOSE')
                }
              </p>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {format(dueTime, "HH:mm", { locale: dateLocale })}
                </span>
              </div>
            </div>

            {/* Medication Name */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {dose.items.name}
              </h2>
              {dose.items.dose_text && (
                <p className="text-sm text-muted-foreground mt-1">
                  {dose.items.dose_text}
                </p>
              )}
            </div>

            {/* CTA Button */}
            <Button 
              size="lg" 
              onClick={() => onTake(dose.id, dose.item_id, dose.items.name)}
              className={cn(
                "w-full h-14 text-lg font-bold rounded-xl",
                isOverdue 
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              <Check className="h-5 w-5 mr-2" />
              {language === 'pt' ? 'MARCAR COMO TOMADO' : 'MARK AS TAKEN'}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return null;
}
