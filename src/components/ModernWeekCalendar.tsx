import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Check,
  Clock,
  AlertCircle
} from "lucide-react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  isSameDay, 
  isToday, 
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  isPast
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

interface ModernWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  profileId?: string;
}

interface DayStats {
  total: number;
  taken: number;
  missed: number;
  pending: number;
}

export default function ModernWeekCalendar({ 
  selectedDate, 
  onDateSelect,
  profileId
}: ModernWeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));
  const [direction, setDirection] = useState(0);
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch dose stats for the week
  const { data: weekStats = {} } = useQuery({
    queryKey: ["week-dose-stats", format(weekStart, "yyyy-MM-dd"), profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const weekEnd = addDays(weekStart, 6);

      let itemsQuery = supabase.from("items").select("id").eq("user_id", user.id);
      if (profileId) {
        itemsQuery = itemsQuery.eq("profile_id", profileId);
      }

      const { data: items } = await itemsQuery;
      const itemIds = items?.map(item => item.id) || [];
      if (itemIds.length === 0) return {};

      const { data: doses } = await supabase
        .from("dose_instances")
        .select("id, due_at, status")
        .in("item_id", itemIds)
        .gte("due_at", startOfDay(weekStart).toISOString())
        .lte("due_at", endOfDay(weekEnd).toISOString());

      if (!doses) return {};

      const stats: Record<string, DayStats> = {};
      
      doses.forEach((dose) => {
        const dayKey = format(new Date(dose.due_at), "yyyy-MM-dd");
        if (!stats[dayKey]) {
          stats[dayKey] = { total: 0, taken: 0, missed: 0, pending: 0 };
        }
        stats[dayKey].total++;
        
        if (dose.status === "taken") {
          stats[dayKey].taken++;
        } else if (dose.status === "missed") {
          stats[dayKey].missed++;
        } else if (dose.status === "skipped") {
          // Count skipped as taken for progress
          stats[dayKey].taken++;
        } else {
          stats[dayKey].pending++;
        }
      });

      return stats;
    },
    staleTime: 30000,
  });

  const getDayStats = (date: Date): DayStats => {
    const key = format(date, "yyyy-MM-dd");
    return weekStats[key] || { total: 0, taken: 0, missed: 0, pending: 0 };
  };

  const goToPrevious = () => {
    setDirection(-1);
    setWeekStart(subWeeks(weekStart, 1));
  };

  const goToNext = () => {
    setDirection(1);
    setWeekStart(addWeeks(weekStart, 1));
  };

  const goToToday = () => {
    const today = new Date();
    onDateSelect(today);
    setWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  // Update weekStart when selectedDate changes externally
  useEffect(() => {
    const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    if (!isSameDay(newWeekStart, weekStart)) {
      setWeekStart(newWeekStart);
    }
  }, [selectedDate]);

  const getProgressPercentage = (stats: DayStats): number => {
    if (stats.total === 0) return 0;
    return Math.round((stats.taken / stats.total) * 100);
  };

  const getDayStatus = (date: Date, stats: DayStats): "complete" | "partial" | "missed" | "pending" | "empty" => {
    if (stats.total === 0) return "empty";
    
    const progress = getProgressPercentage(stats);
    const dayIsPast = isPast(endOfDay(date)) && !isToday(date);
    
    if (progress === 100) return "complete";
    if (dayIsPast && stats.missed > 0) return "missed";
    if (progress > 0) return "partial";
    if (dayIsPast) return "missed";
    return "pending";
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0
    })
  };

  return (
    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <motion.h4 
            key={format(weekStart, "yyyy-MM")}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold capitalize min-w-[100px] text-center"
          >
            {format(weekStart, "MMMM yyyy", { locale: dateLocale })}
          </motion.h4>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {!isToday(selectedDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-7 text-xs font-medium text-primary hover:text-primary"
            >
              {t('calendar.today')}
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    handleDateClick(date);
                    setWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
                  }
                }}
                locale={dateLocale}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Week days */}
      <div className="p-3">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={format(weekStart, "yyyy-MM-dd")}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="grid grid-cols-7 gap-1.5"
          >
            {weekDays.map((day) => {
              const stats = getDayStats(day);
              const isDayToday = isToday(day);
              const isSelected = isSameDay(day, selectedDate);
              const status = getDayStatus(day, stats);
              const progress = getProgressPercentage(stats);

              return (
                <motion.button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected && "bg-primary text-primary-foreground shadow-md",
                    !isSelected && isDayToday && "bg-primary/10 ring-2 ring-primary",
                    !isSelected && !isDayToday && "hover:bg-accent"
                  )}
                >
                  {/* Day name */}
                  <span className={cn(
                    "text-[10px] font-medium uppercase tracking-wide",
                    isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {format(day, "EEE", { locale: dateLocale }).slice(0, 3)}
                  </span>
                  
                  {/* Day number */}
                  <span className={cn(
                    "text-lg font-bold leading-tight",
                    isDayToday && !isSelected && "text-primary"
                  )}>
                    {format(day, "d")}
                  </span>

                  {/* Status indicator */}
                  {stats.total > 0 && (
                    <div className="mt-1.5 flex items-center justify-center">
                      {status === "complete" ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            "flex items-center justify-center h-4 w-4 rounded-full",
                            isSelected ? "bg-primary-foreground/20" : "bg-green-500/20"
                          )}
                        >
                          <Check className={cn(
                            "h-2.5 w-2.5",
                            isSelected ? "text-primary-foreground" : "text-green-600"
                          )} />
                        </motion.div>
                      ) : status === "missed" ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            "flex items-center justify-center h-4 w-4 rounded-full",
                            isSelected ? "bg-primary-foreground/20" : "bg-destructive/20"
                          )}
                        >
                          <AlertCircle className={cn(
                            "h-2.5 w-2.5",
                            isSelected ? "text-primary-foreground" : "text-destructive"
                          )} />
                        </motion.div>
                      ) : status === "partial" ? (
                        <div className="flex items-center gap-0.5">
                          <span className={cn(
                            "text-[10px] font-semibold",
                            isSelected ? "text-primary-foreground/80" : "text-amber-600"
                          )}>
                            {progress}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <Clock className={cn(
                            "h-3 w-3",
                            isSelected ? "text-primary-foreground/60" : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "text-[10px] font-medium",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}>
                            {stats.total}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Today indicator dot */}
                  {isDayToday && !isSelected && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Legend */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 border-t bg-muted/20 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-2 w-2 text-green-600" />
          </div>
          <span>{language === 'pt' ? 'Completo' : 'Complete'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-amber-600 font-semibold">%</span>
          <span>{language === 'pt' ? 'Parcial' : 'Partial'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{language === 'pt' ? 'Pendente' : 'Pending'}</span>
        </div>
      </div>
    </div>
  );
}
