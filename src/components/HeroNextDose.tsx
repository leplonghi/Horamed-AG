import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Check, Clock, Plus, Sparkle as Sparkles, Pill, Bell, Confetti } from "@phosphor-icons/react";
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
    ? ['Cadastre seu medicamento', 'Configure o horário', 'Receba lembretes']
    : ['Add your medication', 'Set the schedule', 'Get reminders'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-blue-400/5 to-background shadow-[var(--shadow-glass)] relative">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl p-6" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl p-6" />

        <div className="p-5 flex flex-col items-center text-center gap-4 relative z-10">
          {/* Icon */}
          <motion.div
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
            animate={{
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
                ? 'Em 3 passos simples você nunca esquece um medicamento'
                : 'In 3 simple steps you’ll never miss a dose again'}
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.12 }}
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
            {isPt ? 'Adicionar primeiro remédio' : 'Add first medication'}
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 backdrop-blur-xl shadow-[var(--shadow-glass)] flex flex-col items-center text-center gap-3">
          <motion.div
            className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
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

  // ✅ ESTADO: Tudo certo por hoje
  if (allDoneToday || (!dose && !nextDayDose)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-3.5 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20 backdrop-blur-lg shadow-[var(--shadow-glass)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Check className="h-5 w-5 text-white" weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-blue-700 dark:text-blue-400">
                {language === 'pt' ? 'Tudo certo hoje' : 'All good today'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {nextDayDose
                  ? (language === 'pt' ? `Próxima às ${nextDayDose.time}` : `Next at ${nextDayDose.time}`)
                  : (language === 'pt' ? 'Dia concluído' : 'Day completed')
                }
              </p>
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-400/5 border-blue-500/20 backdrop-blur-lg shadow-[var(--shadow-glass)] text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Clock className="h-7 w-7 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-blue-500/70 uppercase tracking-widest font-bold mb-1">
              {language === 'pt' ? 'PRÓXIMA DOSE' : 'NEXT DOSE'}
            </p>
            <h2 className="text-xl font-bold text-foreground">{nextDayDose.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {language === 'pt' ? `Amanhã às ${nextDayDose.time}` : `Tomorrow at ${nextDayDose.time}`}
            </p>
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        layout
      >
        <Card className={cn(
          "p-4 transition-all backdrop-blur-xl shadow-[var(--shadow-glass)] relative overflow-hidden",
          isOverdue
            ? "bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500 ring-1 ring-blue-500/30"
            : isNow
              ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500 ring-1 ring-blue-500/30 shadow-glow"
              : "bg-gradient-to-br from-blue-500/15 to-blue-600/5 border-blue-500/20"
        )}>
          {/* Subtle Shine Background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md",
                isOverdue
                  ? "bg-blue-600/20 text-blue-600"
                  : isNow
                    ? "bg-blue-500/20 text-blue-500"
                    : "bg-muted text-muted-foreground"
              )}>
                {isOverdue
                  ? (language === 'pt' ? '⚠️ ATRASADA' : '⚠️ OVERDUE')
                  : isNow
                    ? (language === 'pt' ? '🔔 AGORA' : '🔔 NOW')
                    : (language === 'pt' ? 'PRÓXIMA DOSE' : 'NEXT DOSE')
                }
              </span>
              <div className="flex items-center gap-1.5 text-blue-600/70 font-bold">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {format(dueTime, "HH:mm", { locale: dateLocale })}
                </span>
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
            </div>

            <div className="space-y-2.5">
              <Button
                size="lg"
                onClick={handleTake}
                disabled={isSubmitting}
                className={cn(
                  "w-full h-14 text-base font-extrabold rounded-xl shadow-lg transition-all active:scale-[0.96] group relative overflow-hidden",
                  "flex flex-col items-center justify-center gap-0",
                  "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30",
                  isNow && "shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
                <div className="flex items-center gap-2">
                  <Check className="h-6 w-6" weight="bold" />
                  <span>{language === 'pt' ? 'Tomei agora' : 'I took it'}</span>
                </div>
              </Button>

              {onSnooze && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSnooze}
                  disabled={isSubmitting}
                  className="w-full h-9 text-xs font-semibold rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-500/5 transition-all"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
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
