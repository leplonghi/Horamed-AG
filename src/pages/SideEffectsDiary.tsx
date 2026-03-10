import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Heartbeat as Activity, BookOpen as BookHeart, TrendUp as TrendingUp, Download, Lock, FileText, Lightning as Zap, Moon, Thermometer, Smiley as Smile } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSideEffectsLog } from "@/hooks/useSideEffectsLog";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { safeDateParse } from "@/lib/safeDateUtils";
import { SideEffectLoggerModal } from "@/components/symptoms/SideEffectLoggerModal";
import { PremiumPaywall } from "@/components/PremiumPaywall";

const SideEffectsDashboard = lazy(() =>
  import("@/components/SideEffectsDashboard").then((m) => ({ default: m.SideEffectsDashboard }))
);

const FEELING_EMOJIS = ["", "😰", "😟", "😐", "🙂", "😄"];
const FEELING_LABELS = ["", "Muito mal", "Mal", "Regular", "Bem", "Ótimo"];
const FEELING_COLORS = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-teal-500", "text-emerald-500"];
const FEELING_BG = ["", "bg-red-500/10", "bg-orange-500/10", "bg-yellow-500/10", "bg-teal-500/10", "bg-emerald-500/10"];

type ViewMode = "overview" | "chart";

export default function SideEffectsDiary() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { logs, isLoading, fetchLogs } = useSideEffectsLog();
  const { isPremium } = useSubscription();
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [view, setView] = useState<ViewMode>("overview");
  const dateLocale = language === "pt" ? ptBR : enUS;

  const recentLogs = logs.slice(0, 10);

  const avgFeeling =
    logs.length > 0
      ? Math.round(
        logs
          .filter((l) => l.overallFeeling != null)
          .reduce((s, l) => s + (l.overallFeeling || 0), 0) /
        Math.max(1, logs.filter((l) => l.overallFeeling != null).length)
      )
      : 0;

  const totalLogs = logs.length;
  const lastLog = logs[0];
  const lastLogDate = lastLog
    ? format(safeDateParse(lastLog.recordedAt), "d MMM", { locale: dateLocale })
    : null;

  const handleExport = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diario-efeitos-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-teal-500/3 to-background pb-24">
      <PremiumPaywall isOpen={showPaywall} onClose={() => setShowPaywall(false)} trigger="charts" />
      <SideEffectLoggerModal
        isOpen={isLoggerOpen}
        onClose={() => setIsLoggerOpen(false)}
        onSuccess={() => fetchLogs()}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold leading-tight">Diário de Sintomas</h1>
              <p className="text-xs text-muted-foreground">Rastreamento de bem-estar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleExport}
              title={isPremium ? "Exportar dados" : "Premium necessário"}
            >
              {!isPremium && <Lock className="h-3 w-3 absolute top-1 right-1 text-primary" />}
              <FileText className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {/* Overall Feeling */}
          <Card className={cn(
            "overflow-hidden border-0 shadow-sm",
            avgFeeling > 0 ? FEELING_BG[avgFeeling] : "bg-muted/30"
          )}>
            <CardContent className="p-4 text-center">
              <span className="text-3xl">{avgFeeling > 0 ? FEELING_EMOJIS[avgFeeling] : "—"}</span>
              <p className={cn("text-xs font-semibold mt-1", avgFeeling > 0 ? FEELING_COLORS[avgFeeling] : "text-muted-foreground")}>
                {avgFeeling > 0 ? FEELING_LABELS[avgFeeling] : "Sem dados"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sentimento geral</p>
            </CardContent>
          </Card>

          {/* Total Logs */}
          <Card className="bg-primary/5 border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="text-3xl font-bold text-primary">{totalLogs}</span>
              <p className="text-xs font-semibold text-primary mt-1">Registros</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total de logs</p>
            </CardContent>
          </Card>

          {/* Last Entry */}
          <Card className="bg-muted/30 border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="text-xl font-bold text-foreground">{lastLogDate || "—"}</span>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Último reg.</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Data</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 bg-muted/40 p-1 rounded-2xl"
        >
          <button
            onClick={() => setView("overview")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              view === "overview"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookHeart className="h-4 w-4" />
            Diário
          </button>
          <button
            onClick={() => setView("chart")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all relative",
              view === "chart"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Análise
            {!isPremium && (
              <Lock className="h-3 w-3 absolute top-1.5 right-3 text-primary" />
            )}
          </button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === "overview" ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Quick Log CTA */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsLoggerOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-left shadow-lg shadow-teal-500/20 flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-base">Como está se sentindo agora?</p>
                  <p className="text-white/80 text-sm">Registre seus sintomas em 30 segundos</p>
                </div>
              </motion.button>

              {/* Recent Logs */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : recentLogs.length > 0 ? (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground px-1">Registros Recentes</h2>
                  {recentLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Feeling emoji */}
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                              log.overallFeeling ? FEELING_BG[log.overallFeeling] : "bg-muted/50"
                            )}>
                              {log.overallFeeling ? FEELING_EMOJIS[log.overallFeeling] : "😶"}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-sm truncate">
                                  {log.items?.name || "Medicamento"}
                                </p>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {format(safeDateParse(log.recordedAt), "d MMM, HH:mm", { locale: dateLocale })}
                                </span>
                              </div>

                              {/* Metrics mini-bar */}
                              <div className="flex items-center gap-3 mt-2">
                                {log.energyLevel != null && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Zap className="h-3 w-3 text-amber-500" />
                                    <span>{log.energyLevel}/5</span>
                                  </div>
                                )}
                                {log.painLevel != null && log.painLevel > 1 && (
                                  <div className="flex items-center gap-1 text-xs text-rose-500">
                                    <Thermometer className="h-3 w-3" />
                                    <span>{log.painLevel}/5</span>
                                  </div>
                                )}
                                {log.sleepQuality != null && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Moon className="h-3 w-3 text-indigo-500" />
                                    <span>{log.sleepQuality}/5</span>
                                  </div>
                                )}
                                {log.overallFeeling != null && (
                                  <div className={cn("flex items-center gap-1 text-xs", FEELING_COLORS[log.overallFeeling])}>
                                    <Smile className="h-3 w-3" />
                                    <span>{FEELING_LABELS[log.overallFeeling]}</span>
                                  </div>
                                )}
                              </div>

                              {/* Tags */}
                              {log.sideEffectTags && log.sideEffectTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {log.sideEffectTags.slice(0, 3).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {log.sideEffectTags.length > 3 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                      +{log.sideEffectTags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Notes */}
                              {log.notes && (
                                <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">
                                  "{log.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center space-y-4"
                >
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 flex items-center justify-center mx-auto">
                    <Activity className="h-10 w-10 text-teal-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">Nenhum registro ainda</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                      Comece a rastrear como você se sente após tomar seus medicamentos. Seus médicos vão adorar!
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsLoggerOpen(true)}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 hover:opacity-90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Fazer Primeiro Registro
                  </Button>
                </motion.div>
              )}

              {/* Premium Upsell Banner (for free users) */}
              {!isPremium && logs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setShowPaywall(true)}
                  className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-teal-500/10 to-primary/5 border border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Ver gráficos de evolução</p>
                      <p className="text-xs text-muted-foreground">Análise premium mostra tendências e correlações</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-primary to-teal-500 text-white border-0">Premium</Badge>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <Suspense fallback={
                <div className="h-64 flex items-center justify-center animate-pulse bg-muted/20 rounded-3xl">
                  <Activity className="h-8 w-8 text-muted-foreground animate-spin" />
                </div>
              }>
                <SideEffectsDashboard />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsLoggerOpen(true)}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-xl shadow-teal-500/30 z-50"
        aria-label="Registrar sintoma"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}