import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Check, Clock, Plus, Sparkle as Sparkles, Pill, Bell, Confetti, DotsThreeOutlineVertical } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dose, safeParseDoseDate } from "@/types";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";

interface HeroNextDoseProps {
  dose?: Dose | null;
  nextDayDose?: {
    time: string;
    name: string;
  } | null;
  onTake: (doseId: string, itemId: string, itemName: string) => void;
  onSnooze?: (doseId: string, itemName: string) => void;
  onMore?: (dose: Dose) => void;
  allDoneToday?: boolean;
  hasMedications?: boolean;
}

// ─── New User Onboarding Empty State ────────────────────────────────────────
function NewUserEmptyState({ language }: { language: string }) {
  const navigate = useNavigate();
  const isPt = language === 'pt';
  const { shouldReduceEffects } = useDeviceCapability();

  const steps = isPt
    ? ['Monte sua rotina', 'Configure o horário', 'Receba lembretes']
    : ['Set up your routine', 'Set the schedule', 'Get reminders'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: shouldReduceEffects ? 1 : 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: shouldReduceEffects ? 0 : 0.5, ease: 'easeOut' }}
    >
      <Card className={cn(
        "overflow-hidden border border-blue-500/20 shadow-[var(--shadow-glass)] relative",
        shouldReduceEffects ? "bg-card" : "bg-gradient-to-br from-blue-500/5 via-blue-400/5 to-background"
      )}>
        {/* Animated Background Blobs */}
        {!shouldReduceEffects && (
          <>
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl p-6" />
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl p-6" />
          </>
        )}

        <div className="p-5 flex flex-col items-center text-center gap-4 relative z-10">
          {/* Icon */}
          <motion.div
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
            animate={shouldReduceEffects ? {} : {
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-7 w-7 text-white" weight="duotone" />
          </motion.div>

          {/* Headline */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              {isPt ? 'Bem-vindo ao HoraMed!' : 'Welcome to HoraMed!'}
              <Confetti className="h-5 w-5 text-blue-500" weight="duotone" />
            </h2>
            <p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
              {isPt
                ? 'Potencialize sua saúde em 3 passos simples'
                : 'Optimize your health routine in 3 simple steps'}
            </p>
          </div>

          {/* 3 Steps */}
          {(() => {
            const stepIcons = [Pill, Clock, Bell];
            const stepColors = [
              'from-blue-400 to-blue-500',
              'from-blue-500 to-blue-600',
              'from-blue-600 to-indigo-600',
            ];
            return (
              <div className="flex items-start gap-4 w-full max-w-xs my-1">
                {steps.map((step, i) => {
                  const Icon = stepIcons[i];
                  return (
                    <motion.div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-2"
                      initial={{ opacity: 0, y: shouldReduceEffects ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: shouldReduceEffects ? 0 : 0.15 + i * 0.12 }}
                    >
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stepColors[i]} flex items-center justify-center shadow-md shadow-blue-500/10`}>
                        <Icon className="h-5 w-5 text-white" weight="duotone" />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium text-center leading-tight whitespace-pre-wrap">{step}</p>
                    </motion.div>
                  );
                })}
              </div>
            );
          })()}

          {/* CTA */}
          <Button
            onClick={() => navigate('/adicionar-medicamento')}
            className="w-full max-w-xs h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all duration-200"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" weight="bold" />
            {isPt ? 'Começar minha rotina' : 'Start my routine'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Countdown Timer Hook ────────────────────────────────────────
function useCountdown(targetDate: Date | null): string | null {
  const [display, setDisplay] = useState<string | null>(null);
  const intervalRef = useState<ReturnType<typeof setInterval> | null>(null)[1];

  useEffect(() => {
    if (!targetDate) {
      setDisplay(null);
      return;
    }

    const update = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setDisplay(null);
        return;
      }
      const totalMinutes = Math.floor(diff / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        setDisplay(`${hours}h ${minutes}m`);
      } else if (totalMinutes > 0) {
        setDisplay(`${minutes}m ${seconds}s`);
      } else {
        setDisplay(`${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [targetDate]);

  return display;
}

function HeroNextDose({ dose, nextDayDose, onTake, onSnooze, onMore, allDoneToday, hasMedications = true }: HeroNextDoseProps) {

  const { language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticTaken, setOptimisticTaken] = useState(false);
  const { shouldReduceEffects } = useDeviceCapability();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time ticking every minute to update the Hero state
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 60); // Check every minute
    return () => clearInterval(timer);
  }, []);

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

  // Countdown timer — shows live time remaining until dose
  const doseDate = dose ? safeParseDoseDate(dose) : null;
  const countdown = useCountdown(shouldReduceEffects ? null : doseDate);

  // Show success state immediately after optimistic update - REFORÇO POSITIVO
  if (optimisticTaken) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: shouldReduceEffects ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: shouldReduceEffects ? 0 : 0.4 }}
      >
        <Card className={cn(
          "p-6 border-blue-500/30 backdrop-blur-xl shadow-[var(--shadow-glass)] flex flex-col items-center text-center gap-3",
          shouldReduceEffects ? "bg-card" : "bg-gradient-to-br from-blue-500/10 to-blue-600/5"
        )}>
          <motion.div
            className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30"
            initial={shouldReduceEffects ? { scale: 1 } : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={shouldReduceEffects ? undefined : { type: "spring", stiffness: 260, damping: 20 }}
          >
            <Check className="h-8 w-8 text-white" weight="bold" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {language === 'pt' ? 'Feito! ✓' : 'Done! ✓'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {language === 'pt' ? 'Dose registrada com sucesso' : 'Dose recorded successfully'}
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  // 🆕 ESTADO: Novo usuário sem medicamentos — Empty state educacional
  if (!hasMedications && !allDoneToday && !dose) {
    return <NewUserEmptyState language={language} />;
  }

  // ✅ ESTADO: Tudo certo por hoje — strip compacta
  if (allDoneToday || (!dose && !nextDayDose)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/8 border border-blue-500/15 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" weight="bold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 leading-tight">
              {language === 'pt' ? 'Tudo certo hoje ✓' : 'All good today ✓'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {nextDayDose
                ? (language === 'pt' ? `Próxima às ${nextDayDose.time}` : `Next at ${nextDayDose.time}`)
                : (language === 'pt' ? 'Dia concluído' : 'Day completed')
              }
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // 📅 ESTADO: Próxima dose amanhã — strip compacta
  if (!dose && nextDayDose) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 border border-border/30 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{nextDayDose.name}</p>
            <p className="text-xs text-muted-foreground">
              {language === 'pt' ? `Amanhã às ${nextDayDose.time}` : `Tomorrow at ${nextDayDose.time}`}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-1 rounded-md whitespace-nowrap">
            {language === 'pt' ? 'AMANHÃ' : 'TOMORROW'}
          </span>
        </div>
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
    const minutesUntil = Math.round((dueTime.getTime() - currentTime.getTime()) / (1000 * 60));
    const isNow = minutesUntil <= 15 && minutesUntil >= -30;
    const isOverdue = minutesUntil < -5;
    // Card is "calm" (compact) when dose is more than 60min away and not overdue
    const isCalm = minutesUntil > 60 && !isOverdue;

    // ─── COMPACT STRIP: dose is calm (>60min away) ────────────────────────────
    if (isCalm) {
      return (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceEffects ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          layout={!shouldReduceEffects}
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/8 border border-blue-500/15 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{dose.items?.name || "Medicamento"}</p>
              <p className="text-xs text-muted-foreground">
                {format(dueTime, "HH:mm", { locale: dateLocale })} — {dose.items?.dose_text || (language === 'pt' ? 'Próxima dose' : 'Next dose')}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleTake}
              disabled={isSubmitting}
              className="h-8 px-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
            >
              <Check className="h-3.5 w-3.5 mr-1" weight="bold" />
              {language === 'pt' ? 'Tomei' : 'Took it'}
            </Button>
          </div>
        </motion.div>
      );
    }

    // ─── FULL HERO CARD: urgent or overdue ────────────────────────────────────
    return (
      <motion.div
        initial={{ opacity: 0, y: shouldReduceEffects ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        layout={!shouldReduceEffects}
      >
        <Card className={cn(
          "p-4 transition-all backdrop-blur-xl shadow-[var(--shadow-glass)] relative overflow-hidden",
          shouldReduceEffects ? "bg-card border-blue-500/50" : (isOverdue
            ? "bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500 ring-1 ring-blue-500/30"
            : "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500 ring-1 ring-blue-500/30 shadow-glow")
        )}>
          {!shouldReduceEffects && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
          )}

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md",
                isOverdue ? "bg-blue-600/20 text-blue-600" : "bg-blue-500/20 text-blue-500"
              )}>
                {isOverdue
                  ? (language === 'pt' ? '⚠️ ATRASADA' : '⚠️ OVERDUE')
                  : (language === 'pt' ? '🔔 AGORA' : '🔔 NOW')
                }
              </span>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 text-blue-600/70 font-bold mr-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {format(dueTime, "HH:mm", { locale: dateLocale })}
                  </span>
                </div>
                {onMore && (
                  <button
                    onClick={() => onMore(dose)}
                    className="p-1 rounded-md hover:bg-slate-100/50 transition-colors text-slate-400"
                  >
                    <DotsThreeOutlineVertical className="h-4 w-4" weight="fill" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-center py-1">
              <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                {dose.items?.name || "Medicamento"}
              </h2>
              {dose.items?.dose_text && (
                <p className="text-base text-muted-foreground font-medium mt-0.5">
                  {dose.items?.dose_text}
                </p>
              )}
              {countdown && (
                <motion.span
                  key={countdown}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  className="inline-block text-xs font-mono text-blue-500/70 tabular-nums mt-2"
                  aria-live="off"
                  aria-label="tempo restante"
                >
                  em {countdown}
                </motion.span>
              )}
            </div>

            <div className="space-y-2.5">
              <Button
                size="lg"
                onClick={handleTake}
                disabled={isSubmitting}
                className={cn(
                  "w-full h-14 text-base font-extrabold rounded-xl shadow-lg transition-all active:scale-[0.96] group relative overflow-hidden",
                  "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30",
                  "shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-300">
                  <Check className="w-5 h-5" weight="bold" />
                  {language === 'pt' ? 'TOMAR AGORA' : 'TAKE NOW'}
                </span>
              </Button>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSnooze}
                  disabled={isSubmitting}
                  className="flex-1 h-11 text-xs font-bold rounded-xl border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 transition-all"
                >
                  {language === 'pt' ? 'Adiar' : 'Snooze'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMore && onMore(dose)}
                  className="h-11 px-4 text-xs font-bold rounded-xl text-muted-foreground hover:bg-slate-100/50"
                >
                  {language === 'pt' ? 'Detalhes' : 'Details'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return null;
}

export default memo(HeroNextDose);