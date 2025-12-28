import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Check, Clock, AlertCircle } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks, isBefore, startOfDay } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";

interface MiniWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  doseCounts?: Record<string, { total: number; completed: number }>;
}

export default function MiniWeekCalendar({
  selectedDate,
  onDateSelect,
  doseCounts: externalDoseCounts,
}: MiniWeekCalendarProps) {
  const { language } = useLanguage();
  const { activeProfile } = useUserProfiles();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [doseCounts, setDoseCounts] = useState<Record<string, { total: number; completed: number }>>(externalDoseCounts || {});
  const [loading, setLoading] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Load dose counts for the week
  useEffect(() => {
    if (externalDoseCounts && Object.keys(externalDoseCounts).length > 0) {
      setDoseCounts(externalDoseCounts);
      return;
    }

    const loadDoseCounts = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get items for this profile
        let itemsQuery = supabase.from("items").select("id");
        if (activeProfile) itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
        const { data: items } = await itemsQuery;
        const itemIds = items?.map(i => i.id) || [];

        if (itemIds.length === 0) {
          setDoseCounts({});
          return;
        }

        const weekEnd = addDays(weekStart, 7);
        const { data: doses } = await supabase
          .from("dose_instances")
          .select("due_at, status")
          .in("item_id", itemIds)
          .gte("due_at", weekStart.toISOString())
          .lt("due_at", weekEnd.toISOString());

        const counts: Record<string, { total: number; completed: number }> = {};
        doses?.forEach(dose => {
          const key = format(new Date(dose.due_at), "yyyy-MM-dd");
          if (!counts[key]) counts[key] = { total: 0, completed: 0 };
          counts[key].total++;
          if (dose.status === "taken") counts[key].completed++;
        });

        setDoseCounts(counts);
      } catch (error) {
        console.error("Error loading dose counts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDoseCounts();
  }, [weekStart, activeProfile?.id, externalDoseCounts]);

  const goToPreviousWeek = () => setWeekStart(addWeeks(weekStart, -1));
  const goToNextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const goToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
    onDateSelect(today);
  };

  const getDayStatus = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const data = doseCounts[key];
    const isPast = isBefore(day, startOfDay(new Date()));
    const isDayToday = isToday(day);
    
    if (!data || data.total === 0) return "empty";
    if (data.completed === data.total) return "complete";
    if (data.completed > 0) return "partial";
    if (isPast && !isDayToday) return "missed";
    return "pending";
  };

  const getProgressPercent = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const data = doseCounts[key];
    if (!data || data.total === 0) return 0;
    return Math.round((data.completed / data.total) * 100);
  };

  const showTodayButton = !weekDays.some((d) => isToday(d));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/40 shadow-lg shadow-black/5"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToPreviousWeek}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="text-sm font-bold text-foreground capitalize">
                {format(weekStart, "MMMM", { locale: dateLocale })}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(weekStart, "yyyy")}
              </span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToNextWeek}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>

          <AnimatePresence>
            {showTodayButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-full shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                {language === 'pt' ? 'Hoje' : 'Today'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            const status = getDayStatus(day);
            const progress = getProgressPercent(day);
            const isPast = isBefore(day, startOfDay(new Date())) && !isDayToday;
            const key = format(day, "yyyy-MM-dd");
            const data = doseCounts[key];

            return (
              <motion.button
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "relative flex flex-col items-center py-3 px-1 rounded-2xl transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  isSelected && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30",
                  isDayToday && !isSelected && "bg-primary/10 ring-2 ring-primary/40",
                  !isSelected && !isDayToday && "hover:bg-muted/60",
                  isPast && !isSelected && "opacity-60"
                )}
              >
                {/* Day name */}
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wide mb-1",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {format(day, "EEE", { locale: dateLocale }).slice(0, 3)}
                </span>
                
                {/* Day number */}
                <span
                  className={cn(
                    "text-lg font-bold leading-none",
                    isDayToday && !isSelected && "text-primary",
                    isSelected && "text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Status indicator with progress ring */}
                <div className="relative mt-2 w-5 h-5">
                  {status !== "empty" && (
                    <>
                      {/* Background ring */}
                      <svg className="w-5 h-5 transform -rotate-90">
                        <circle
                          cx="10" cy="10" r="8"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className={cn(
                            isSelected ? "text-primary-foreground/20" : "text-muted/40"
                          )}
                        />
                        {/* Progress ring */}
                        <motion.circle
                          cx="10" cy="10" r="8"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 50.27" }}
                          animate={{ strokeDasharray: `${(progress / 100) * 50.27} 50.27` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className={cn(
                            status === "complete" && (isSelected ? "stroke-primary-foreground" : "stroke-emerald-500"),
                            status === "partial" && (isSelected ? "stroke-primary-foreground/80" : "stroke-amber-500"),
                            status === "pending" && (isSelected ? "stroke-primary-foreground/60" : "stroke-blue-500"),
                            status === "missed" && (isSelected ? "stroke-primary-foreground/50" : "stroke-destructive")
                          )}
                        />
                      </svg>
                      
                      {/* Center icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {status === "complete" && (
                          <Check className={cn(
                            "w-2.5 h-2.5",
                            isSelected ? "text-primary-foreground" : "text-emerald-500"
                          )} />
                        )}
                        {status === "partial" && (
                          <Clock className={cn(
                            "w-2 h-2",
                            isSelected ? "text-primary-foreground/80" : "text-amber-500"
                          )} />
                        )}
                        {status === "missed" && (
                          <AlertCircle className={cn(
                            "w-2 h-2",
                            isSelected ? "text-primary-foreground/60" : "text-destructive"
                          )} />
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Dose count badge */}
                {data && data.total > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 + 0.2 }}
                    className={cn(
                      "mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                      isSelected 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : status === "complete" 
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : status === "missed"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {data.completed}/{data.total}
                  </motion.div>
                )}

                {/* Today indicator dot */}
                {isDayToday && !isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full shadow-md shadow-primary/50"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend - Compact */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {language === 'pt' ? 'Completo' : 'Complete'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {language === 'pt' ? 'Parcial' : 'Partial'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {language === 'pt' ? 'Perdido' : 'Missed'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
