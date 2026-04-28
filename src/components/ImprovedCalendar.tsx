import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight, CalendarBlank as CalendarIcon, Clock, Pill } from "@phosphor-icons/react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  isSameDay, 
  isToday, 
  addWeeks, 
  startOfMonth, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval,
  subWeeks,
  subMonths,
  addMonths,
  startOfDay,
  endOfDay
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";
import { getAuth } from "firebase/auth";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where, orderBy, limit as firestoreLimit } from "firebase/firestore";

interface ImprovedCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  eventCounts?: Record<string, number>;
  profileId?: string;
}

type ViewMode = "day" | "week" | "month";

interface DosePreview {
  time: string;
  medication: string;
  status: string;
}

export default function ImprovedCalendar({ 
  selectedDate, 
  onDateSelect,
  eventCounts = {},
  profileId
}: ImprovedCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));
  const [monthDate, setMonthDate] = useState(selectedDate);
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventCount = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return eventCounts[key] || 0;
  };

  const goToPrevious = () => {
    if (viewMode === "day") {
      const newDate = addDays(selectedDate, -1);
      onDateSelect(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else if (viewMode === "week") {
      setWeekStart(subWeeks(weekStart, 1));
    } else {
      setMonthDate(subMonths(monthDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "day") {
      const newDate = addDays(selectedDate, 1);
      onDateSelect(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else if (viewMode === "week") {
      setWeekStart(addWeeks(weekStart, 1));
    } else {
      setMonthDate(addMonths(monthDate, 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    onDateSelect(today);
    setWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
    setMonthDate(today);
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    setWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
    setMonthDate(date);
  };

  // Hook to fetch dose previews for a specific date
  const useDosePreview = (date: Date) => {
    return useQuery({
      queryKey: ["dose-preview", format(date, "yyyy-MM-dd"), profileId],
      queryFn: async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return [];

        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        try {
          // Get items for the profile
          const itemsConstraints: any[] = [where("userId", "==", user.uid)];
          if (profileId) {
            itemsConstraints.push(where("profileId", "==", profileId));
          }

          const itemsQuery = query(
            collection(db, "items"),
            ...itemsConstraints
          );
          
          const itemsSnapshot = await getDocs(itemsQuery);
          const itemsMap = new Map<string, string>();
          itemsSnapshot.forEach(doc => {
            itemsMap.set(doc.id, doc.data().name || t('common.medication'));
          });

          const itemIds = Array.from(itemsMap.keys());
          if (itemIds.length === 0) return [];

          // Get doses for the day
          const dosesQuery = query(
            collection(db, "doses"),
            where("userId", "==", user.uid),
            where("itemId", "in", itemIds),
            where("dueAt", ">=", dayStart.toISOString()),
            where("dueAt", "<=", dayEnd.toISOString()),
            orderBy("dueAt", "asc"),
            firestoreLimit(5)
          );

          const dosesSnapshot = await getDocs(dosesQuery);
          const doses: DosePreview[] = [];

          dosesSnapshot.forEach(doc => {
            const data = doc.data();
            doses.push({
              time: format(safeDateParse(data.dueAt), "HH:mm"),
              medication: itemsMap.get(data.itemId) || t('common.medication'),
              status: data.status
            });
          });

          return doses;
        } catch (error) {
          console.error("Error fetching dose preview:", error);
          return [];
        }
      },
      enabled: eventCounts[format(date, "yyyy-MM-dd")] > 0,
      staleTime: 30000, // Cache for 30 seconds
    });
  };

  // Component for dose preview
  const DosePreviewCard = ({ date }: { date: Date }) => {
    const { data: doses, isLoading } = useDosePreview(date);
    const count = getEventCount(date);

    if (count === 0) return null;

    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="absolute inset-0 cursor-pointer z-10" />
        </HoverCardTrigger>
        <HoverCardContent className="w-64 p-3 backdrop-blur-xl bg-background/80 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-200" side="top" align="center">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {format(date, t('calendar.dateFormatLong'), { locale: dateLocale })}
              </h4>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {count} {count === 1 ? t('calendar.event') : t('calendar.events')}
              </span>
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ) : doses && doses.length > 0 ? (
              <div className="space-y-1.5">
                {doses.map((dose, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-xs transition-colors",
                      dose.status === "taken" && "bg-success/10 text-success border border-success/20",
                      dose.status === "scheduled" && "bg-primary/10 text-primary border border-primary/20",
                      dose.status === "missed" && "bg-destructive/10 text-destructive border border-destructive/20"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="font-bold">{dose.time}</span>
                    <Pill className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate flex-1">{dose.medication}</span>
                  </div>
                ))}
                {count > 5 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1 font-medium">
                    +{count - 5} {t('calendar.more')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {t('calendar.clickForDetails')}
              </p>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderHeader = () => {
    let headerText = "";
    if (viewMode === "day") {
      headerText = format(selectedDate, t('calendar.dateFormatLong'), { locale: dateLocale });
    } else if (viewMode === "week") {
      headerText = format(weekStart, t('calendar.weekFormat'), { locale: dateLocale });
    } else {
      headerText = format(monthDate, t('calendar.monthFormat'), { locale: dateLocale });
    }

    return (
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1 bg-accent/50 p-1 rounded-xl backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8 hover:bg-background/80 transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-bold min-w-[120px] text-center capitalize tracking-tight">
            {headerText}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8 hover:bg-background/80 transition-all active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          {!isToday(selectedDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 text-xs font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {t('calendar.today')}
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl animate-in fade-in zoom-in-95" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) handleDateClick(date);
                }}
                locale={dateLocale}
                className={cn("p-3 pointer-events-auto rounded-2xl bg-background/95 backdrop-blur-xl")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const count = getEventCount(selectedDate);
    const isDayToday = isToday(selectedDate);

    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div 
          className={cn(
            "relative flex flex-col items-center justify-center",
            "w-36 h-36 rounded-[2.5rem] transition-all duration-500 shadow-xl",
            isDayToday 
              ? "bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground scale-105" 
              : "bg-gradient-to-br from-accent to-accent/50 border border-primary/5"
          )}
        >
          <span className={cn(
            "text-xs font-bold uppercase tracking-widest opacity-80 mb-1",
            isDayToday ? "text-primary-foreground" : "text-muted-foreground"
          )}>
            {format(selectedDate, t('calendar.dayNameFormat'), { locale: dateLocale })}
          </span>
          <span className="text-6xl font-black tracking-tighter">
            {format(selectedDate, "d")}
          </span>
          {count > 0 && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <div className={cn(
                "px-4 py-1.5 rounded-2xl text-xs font-bold shadow-lg animate-bounce-subtle",
                isDayToday ? "bg-white text-primary" : "bg-primary text-primary-foreground"
              )}>
                {count} {count === 1 ? t('calendar.event') : t('calendar.events')}
              </div>
            </div>
          )}
        </div>
        <p className="mt-8 text-sm font-semibold text-muted-foreground/80 lowercase tracking-wide">
          {isDayToday ? t('calendar.today') : format(selectedDate, t('calendar.dateFormatLong'), { locale: dateLocale })}
        </p>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const count = getEventCount(day);
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div key={day.toISOString()} className="relative group">
              <button
                onClick={() => handleDateClick(day)}
                className={cn(
                  "w-full flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300",
                  "hover:bg-accent/80 hover:scale-105 active:scale-95",
                  isSelected 
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 z-0" 
                    : "bg-background border border-accent/50",
                  isDayToday && !isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tight opacity-70 mb-1",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {format(day, t('calendar.shortDayNameFormat'), { locale: dateLocale })}
                </span>
                <span className={cn(
                  "text-xl font-black",
                  isDayToday && !isSelected && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {count > 0 && (
                  <div className={cn(
                    "mt-2 h-1.5 w-1.5 rounded-full",
                    isSelected 
                      ? "bg-white animate-pulse" 
                      : "bg-primary"
                  )} />
                )}
              </button>
              <DosePreviewCard date={day} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const weekdays = t('calendar.weekdays').split(',');
    return (
      <div className="space-y-3">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((day) => (
            <div key={day} className="text-center text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest pb-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
            const count = getEventCount(day);
            const isCurrentMonth = day.getMonth() === monthDate.getMonth();
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div key={day.toISOString()} className="relative group">
                <button
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "w-full aspect-square p-2 rounded-xl transition-all duration-300 flex items-center justify-center relative",
                    "hover:bg-accent/80 hover:scale-110 active:scale-95",
                    isSelected 
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg z-0" 
                      : "bg-background border border-accent/30",
                    isDayToday && !isSelected && "ring-2 ring-primary ring-inset",
                    !isCurrentMonth && "opacity-20 grayscale-[0.8]"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    isDayToday && !isSelected && "text-primary"
                  )}>
                    {format(day, "d")}
                  </span>
                  {count > 0 && (
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      <div className={cn(
                        "h-1 w-1 rounded-full",
                        isSelected ? "bg-white" : "bg-primary"
                      )} />
                    </div>
                  )}
                </button>
                <DosePreviewCard date={day} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-b from-background to-accent/20 shadow-none">
      <CardContent className="p-3 space-y-4">
        {renderHeader()}

        <Tabs 
          value={viewMode} 
          onValueChange={(v) => setViewMode(v as ViewMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-accent/30 p-1 rounded-xl h-9">
            <TabsTrigger 
              value="day" 
              className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              {t('calendar.day')}
            </TabsTrigger>
            <TabsTrigger 
              value="week" 
              className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              {t('calendar.week')}
            </TabsTrigger>
            <TabsTrigger 
              value="month" 
              className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              {t('calendar.month')}
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 min-h-[160px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            {viewMode === "day" && renderDayView()}
            {viewMode === "week" && renderWeekView()}
            {viewMode === "month" && renderMonthView()}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

