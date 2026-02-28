import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Check, Clock, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dose, safeParseDoseDate } from "@/types";

interface HeroNextDoseProps {
  dose?: Dose | null;
  nextDayDose?: {
    time: string;
    name: string;
  } | null;
  onTake: (doseId: string, itemId: string, itemName: string) => void;
  onSnooze?: (doseId: string, itemName: string) => void;
  allDoneToday?: boolean;
  hasMedications?: boolean;
}

// ─── New User Onboarding Empty State ────────────────────────────────────────
function NewUserEmptyState({ language }: { language: string }) {
  const navigate = useNavigate();
  const isPt = language === 'pt';

  const steps = isPt
    ? ['Cadastre seu medicamento', 'Configure o hor\u00e1rio', 'Receba lembretes']
    : ['Add your medication', 'Set the schedule', 'Get reminders'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-teal-500/5 to-background shadow-[var(--shadow-glass)]">
        {/* Accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-teal-400 to-emerald-500" />
        <div className="p-6 flex flex-col items-center text-center gap-5">
          {/* Icon */}
          <motion.div
            className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/25"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>

          {/* Headline */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              {isPt ? 'Bem-vindo ao HoraMed! \ud83c\udf89' : 'Welcome to HoraMed! \ud83c\udf89'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
              {isPt
                ? 'Em 3 passos simples voc\u00ea nunca esquece um medicamento'
                : 'In 3 simple steps you\u2019ll never miss a dose again'}
            </p>
          </div>

          {/* 3 Steps */}
          <div className="flex items-start gap-3 w-full max-w-xs">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.12 }}
              >
                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center border border-primary/25">
                  {i + 1}
                </div>
                <p className="text-[11px] text-muted-foreground text-center leading-tight">{step}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={() => navigate('/adicionar-medicamento')}
            className="w-full max-w-xs bg-gradient-to-r from-primary to-teal-500 text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isPt ? 'Adicionar primeiro medicamento' : 'Add first medication'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function HeroNextDose({ dose, nextDayDose, onTake, onSnooze, allDoneToday, hasMedications = true }: HeroNextDoseProps) {

  const { language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticTaken, setOptimisticTaken] = useState(false);

  const handleTake = useCallback(async () => {
    if (!dose || isSubmitting || optimisticTaken) return;

    // Optimistic update - instant feedback
    setIsSubmitting(true);
    setOptimisticTaken(true);

    try {
      await onTake(dose.id, dose.item_id, dose.items?.name || "Medicamento");
    } catch {
      // Rollback on error
      setOptimisticTaken(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [dose, isSubmitting, optimisticTaken, onTake]);

  const handleSnooze = useCallback(() => {
    if (!dose || !onSnooze || isSubmitting) return;
    onSnooze(dose.id, dose.items?.name || "Medicamento");
  }, [dose, onSnooze, isSubmitting]);

  // Show success state immediately after optimistic update - REFORÇO POSITIVO
  if (optimisticTaken) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="p-10 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/40 backdrop-blur-xl shadow-[var(--shadow-glass)]">
          <div className="flex flex-col items-center text-center gap-4">
            <motion.div
              className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            >
              <Check className="h-10 w-10 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {language === 'pt' ? 'Boa! ✓' : 'Done! ✓'}
              </h2>
              <p className="text-base text-muted-foreground mt-1">
                {language === 'pt' ? 'Dose registrada com sucesso' : 'Dose recorded successfully'}
              </p>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // 🆕 ESTADO: Novo usuário sem medicamentos — Empty state educacional
  if (!hasMedications && !allDoneToday && !dose) {
    return <NewUserEmptyState language={language} />;
  }

  // ✅ ESTADO: Tudo certo por hoje
  if (allDoneToday || (!dose && !nextDayDose)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="p-5 bg-gradient-to-br from-green-500/15 to-emerald-500/5 border-green-500/30 backdrop-blur-lg shadow-[var(--shadow-glass)]">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
                {language === 'pt' ? 'Tudo certo por hoje' : 'All good for today'}
              </h2>
              {nextDayDose ? (
                <p className="text-sm text-muted-foreground">
                  {language === 'pt'
                    ? `Próxima às ${nextDayDose.time}`
                    : `Next at ${nextDayDose.time}`
                  }
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {language === 'pt' ? 'Dia concluído' : 'Day completed'}
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // 📅 ESTADO: Próxima dose amanhã (sem doses hoje)
  if (!dose && nextDayDose) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="p-8 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30 backdrop-blur-lg shadow-[var(--shadow-glass)]">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center">
              <Clock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                {language === 'pt' ? 'PRÓXIMA DOSE' : 'NEXT DOSE'}
              </p>
              <h2 className="text-2xl font-bold text-foreground">{nextDayDose.name}</h2>
              <p className="text-base text-muted-foreground mt-1">
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

  // 💊 ESTADO: Dose pendente - AÇÃO PRINCIPAL
  if (dose) {
    const dueTime = safeParseDoseDate(dose);

    // Se a data é inválida, não renderiza o card (evita crash)
    if (!dueTime) {
      return null;
    }

    const now = new Date();
    const minutesUntil = Math.round((dueTime.getTime() - now.getTime()) / (1000 * 60));
    const isNow = minutesUntil <= 15 && minutesUntil >= -30;
    const isOverdue = minutesUntil < -5;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className={cn(
          "p-6 transition-all backdrop-blur-xl shadow-[var(--shadow-glass)]",
          isOverdue
            ? "bg-gradient-to-br from-destructive/20 to-orange-500/10 border-destructive/40 ring-2 ring-destructive/30"
            : isNow
              ? "bg-gradient-to-br from-primary/20 to-primary/10 border-primary ring-2 ring-primary/30 shadow-glow"
              : "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30"
        )}>
          <div className="space-y-5">
            {/* Header com status e horário */}
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full",
                isOverdue
                  ? "bg-destructive/20 text-destructive"
                  : isNow
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}>
                {isOverdue
                  ? (language === 'pt' ? '⚠️ ATRASADA' : '⚠️ OVERDUE')
                  : isNow
                    ? (language === 'pt' ? '🔔 AGORA' : '🔔 NOW')
                    : (language === 'pt' ? 'PRÓXIMA DOSE' : 'NEXT DOSE')
                }
              </span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {format(dueTime, "HH:mm", { locale: dateLocale })}
                </span>
              </div>
            </div>

            {/* Nome do medicamento - Grande e claro */}
            <div className="text-center py-2">
              <h2 className="text-3xl font-bold text-foreground leading-tight">
                {dose.items?.name || "Medicamento"}
              </h2>
              {dose.items?.dose_text && (
                <p className="text-lg text-muted-foreground mt-1">
                  {dose.items?.dose_text}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                onClick={handleTake}
                disabled={isSubmitting}
                className={cn(
                  "w-full h-20 text-xl font-bold rounded-2xl shadow-lg transition-all active:scale-[0.97] group relative overflow-hidden",
                  "flex flex-col items-center justify-center gap-1",
                  isOverdue
                    ? "bg-destructive hover:bg-destructive/90 shadow-destructive/30 animate-[pulse_2s_infinite]"
                    : "bg-primary hover:bg-primary/90 shadow-primary/30",
                  isNow && !isOverdue && "shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                )}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                <div className="flex items-center gap-2 relative z-20">
                  <Check className="h-7 w-7" />
                  <span>{language === 'pt' ? 'Tomei agora' : 'I took it'}</span>
                </div>
                <span className="text-xs font-normal opacity-80 relative z-20">
                  {language === 'pt' ? 'Toque para confirmar' : 'Tap to confirm'}
                </span>
              </Button>

              {/* Botão secundário: Adiar - mais discreto */}
              {onSnooze && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleSnooze}
                  disabled={isSubmitting}
                  className="w-full h-11 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'Lembrar depois (+15 min)' : 'Remind me later (+15 min)'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return null;
}

// Memoizado para evitar re-render desnecessário
export default memo(HeroNextDose);
