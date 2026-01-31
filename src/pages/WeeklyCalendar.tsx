import { useState, useEffect } from "react";
import { useWeeklyDoses } from "@/hooks/useWeeklyDoses";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Pill, XCircle, SkipForward, TrendingUp, Calendar, Target } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO, isBefore } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import DoseStatusDialog from "@/components/DoseStatusDialog";
import logo from "@/assets/logo_HoraMed.png";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WeeklyCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const { activeProfile } = useUserProfiles();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const { data: doses, isLoading: loading, updateDoseStatus } = useWeeklyDoses(currentWeekStart, currentWeekEnd, activeProfile?.id);

  const [selectedDose, setSelectedDose] = useState<{ id: string; name: string, itemId: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDoseClick = (doseId: string, doseName: string, itemId: string) => {
    setSelectedDose({ id: doseId, name: doseName, itemId });
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (newStatus: 'taken' | 'missed' | 'skipped') => {
    if (!selectedDose) return;
    await updateDoseStatus({
      doseId: selectedDose.id,
      newStatus,
      itemId: selectedDose.itemId
    });
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Calculate weekly stats
  const safeDoses = doses || [];
  const totalWeekDoses = safeDoses.length;
  const takenDoses = safeDoses.filter(d => d.status === 'taken').length;
  const missedDoses = safeDoses.filter(d => d.status === 'missed').length;
  const skippedDoses = safeDoses.filter(d => d.status === 'skipped').length;
  const weeklyAdherence = totalWeekDoses > 0 ? Math.round((takenDoses / totalWeekDoses) * 100) : 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with Logo and Title */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="HoraMed" className="h-12 w-auto drop-shadow-md" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('calendar.weeklyTitle')}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {format(currentWeekStart, "d MMM", { locale: dateLocale })} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), "d MMM yyyy", { locale: dateLocale })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousWeek}
                className="hover:scale-105 transition-transform"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextWeek}
                className="hover:scale-105 transition-transform"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Weekly Stats - Enhanced */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">{t('stats.adherence')}</p>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{weeklyAdherence}%</p>
                <div className="w-full bg-primary/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all duration-500"
                    style={{ width: `${weeklyAdherence}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-success uppercase tracking-wide">{t('stats.taken')}</p>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <p className="text-3xl font-bold text-foreground">{takenDoses}</p>
                <p className="text-xs text-muted-foreground">de {totalWeekDoses} {t('medications.doses')}</p>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-destructive uppercase tracking-wide">{t('stats.missed')}</p>
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-3xl font-bold text-foreground">{missedDoses}</p>
                <p className="text-xs text-muted-foreground">{t('stats.requiresAttention')}</p>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-warning uppercase tracking-wide">{t('stats.skipped')}</p>
                  <SkipForward className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold text-foreground">{skippedDoses}</p>
                <p className="text-xs text-muted-foreground">{t('stats.intentionally')}</p>
              </div>
            </Card>
          </div>

          <Card className="p-5 shadow-lg border-primary/20 bg-gradient-to-r from-card to-primary/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{t('calendar.legend')}</h3>
                  <p className="text-xs text-muted-foreground">{t('calendar.medicationStatus')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-success/10 border-success/30 px-3 py-1.5 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-success" />
                  <span className="text-success font-medium">{t('status.taken')}</span>
                </Badge>
                <Badge variant="outline" className="bg-destructive/10 border-destructive/30 px-3 py-1.5 shadow-sm">
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-destructive" />
                  <span className="text-destructive font-medium">{t('status.missed')}</span>
                </Badge>
                <Badge variant="outline" className="bg-warning/10 border-warning/30 px-3 py-1.5 shadow-sm">
                  <SkipForward className="h-3.5 w-3.5 mr-1.5 text-warning" />
                  <span className="text-warning font-medium">{t('status.skipped')}</span>
                </Badge>
                <Badge variant="outline" className="bg-primary/10 border-primary/30 px-3 py-1.5 shadow-sm">
                  <Circle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  <span className="text-primary font-medium">{t('status.scheduled')}</span>
                </Badge>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayDoses = safeDoses.filter((dose) =>
                isSameDay(parseISO(dose.dueAt), day)
              );
              const isToday = isSameDay(day, new Date());
              const takenToday = dayDoses.filter(d => d.status === 'taken').length;
              const adherenceToday = dayDoses.length > 0 ? (takenToday / dayDoses.length) * 100 : 0;

              return (
                <Card
                  key={day.toISOString()}
                  className={`p-4 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 ${isToday
                    ? "border-primary border-2 bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                    }`}
                >
                  <div className="space-y-3">
                    {/* Day Header */}
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {format(day, "EEE", { locale: dateLocale })}
                      </p>
                      <div className={`text-3xl font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d")}
                      </div>
                      {isToday && (
                        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-[10px]">
                          {t('common.today')}
                        </Badge>
                      )}

                      {/* Progress Indicator */}
                      {dayDoses.length > 0 && (
                        <div className="space-y-1 pt-2">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                            <Target className="h-3.5 w-3.5 text-primary" />
                            <span className={takenToday === dayDoses.length ? "text-success" : "text-foreground"}>
                              {takenToday}/{dayDoses.length}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className={`rounded-full h-1.5 transition-all duration-500 ${adherenceToday === 100 ? "bg-success" : adherenceToday >= 50 ? "bg-primary" : "bg-destructive"
                                }`}
                              style={{ width: `${adherenceToday}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Doses List */}
                    <div className="space-y-2">
                      {dayDoses.length === 0 ? (
                        <div className="text-center py-4 px-2 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">{t('calendar.noDoses')}</p>
                        </div>
                      ) : (
                        dayDoses.map((dose) => (
                          <button
                            key={dose.id}
                            onClick={() => handleDoseClick(dose.id, dose.medicationName, dose.itemId)}
                            className={`w-full p-2.5 rounded-lg border text-left transition-all hover:scale-105 hover:shadow-md group ${dose.status === "taken"
                              ? "bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-sm"
                              : dose.status === "missed"
                                ? "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 shadow-sm"
                                : dose.status === "skipped"
                                  ? "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30 shadow-sm"
                                  : "bg-gradient-to-br from-primary/5 to-card border-primary/30 shadow-sm"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate leading-tight">
                                  {dose.medicationName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <p className="text-xs text-muted-foreground font-medium">
                                    {format(parseISO(dose.dueAt), "HH:mm")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {dose.status === "taken" && (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                )}
                                {dose.status === "missed" && (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                {dose.status === "skipped" && (
                                  <SkipForward className="h-4 w-4 text-warning" />
                                )}
                                {dose.status === "scheduled" && (
                                  <Circle className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <Navigation />

      {selectedDose && (
        <DoseStatusDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          doseName={selectedDose.name}
          onSelectStatus={handleUpdateStatus}
        />
      )}
    </>
  );
}