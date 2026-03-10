import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Locale } from "date-fns";
import { safeParseDoseDate } from "@/types";
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight, CalendarBlank as CalendarIcon, Sparkle as Sparkles, TrendUp as TrendingUp, Minus, TrendDown as TrendingDown } from "@phosphor-icons/react";
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

const DayCard = ({
  day,
  stats,
  isSelected,
  isDayToday,
  dateLocale,
  onClick,
}: {
  day: Date;
  stats: DayStats;
  isSelected: boolean;
  isDayToday: boolean;
  dateLocale: Locale;
  onClick: () => void;
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex flex-col items-center justify-center py-3 px-1 rounded-[1.2rem] transition-all duration-300 min-w-[3rem] w-full",
        isSelected
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          : "bg-transparent text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {/* Day Name */}
      <span className={cn(
        "text-[11px] font-medium mb-1 uppercase tracking-wide",
        isSelected ? "text-primary-foreground/80" : "text-slate-400"
      )}>
        {format(day, "EEE", { locale: dateLocale }).slice(0, 3)}
      </span>

      {/* Day Number */}
      <span className={cn(
        "text-xl leading-none",
        isSelected ? "text-white font-bold" : "text-slate-700 dark:text-slate-200 font-semibold",
        isDayToday && !isSelected && "text-primary font-bold"
      )}>
        {format(day, "d")}
      </span>

      {/* Tiny dot for events */}
      <div className="h-1.5 mt-1">
        {stats.total > 0 && (
          <div className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors mx-auto",
            isSelected
              ? "bg-white"
              : stats.total === stats.taken
                ? "bg-green-500"
                : "bg-blue-300"
          )} />
        )}
      </div>
    </motion.button>
  );
};

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
        const doseDate = safeParseDoseDate(dose as any);
        if (!doseDate) return;

        const dayKey = format(doseDate, "yyyy-MM-dd");
        if (!stats[dayKey]) {
          stats[dayKey] = { total: 0, taken: 0, missed: 0, pending: 0 };
        }
        stats[dayKey].total++;

        if (dose.status === "taken") {
          stats[dayKey].taken++;
        } else if (dose.status === "missed") {
          stats[dayKey].missed++;
        } else if (dose.status === "skipped") {
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

  useEffect(() => {
    const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    if (!isSameDay(newWeekStart, weekStart)) {
      setWeekStart(newWeekStart);
    }
  }, [selectedDate]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="bg-white rounded-[1.5rem] shadow-sm mb-4">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-1">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={goToPrevious} className="h-8 w-8 rounded-full hover:bg-slate-100">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </Button>

          <span className="text-sm font-semibold capitalize min-w-[100px] text-center text-slate-700">
            {format(weekStart, "MMMM yyyy", { locale: dateLocale })}
          </span>

          <Button variant="ghost" size="icon" onClick={goToNext} className="h-8 w-8 rounded-full hover:bg-slate-100">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Calendar Picker Trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500">
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

          {!isToday(selectedDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-full"
            >
              {t('calendar.today')}
            </Button>
          )}
        </div>
      </div>

      {/* Week Grid */}
      <div className="px-3 pb-3">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={format(weekStart, "yyyy-MM-dd")}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="grid grid-cols-7 gap-1"
          >
            {weekDays.map((day) => {
              const stats = getDayStats(day);
              const isDayToday = isToday(day);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <DayCard
                  key={day.toISOString()}
                  day={day}
                  stats={stats}
                  isSelected={isSelected}
                  isDayToday={isDayToday}
                  dateLocale={dateLocale}
                  onClick={() => handleDateClick(day)}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
