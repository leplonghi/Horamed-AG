import { Card, CardContent } from "@/components/ui/card";
import { format, isToday } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Check, CalendarBlank as Calendar, Stethoscope, TestTube, Pill, DotsThreeOutlineVertical } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelineItem {
  id: string;
  time: string;
  type: "medication" | "appointment" | "exam" | "procedure" | "other";
  title: string;
  subtitle?: string;
  status: "pending" | "done" | "missed";
  onMarkDone?: () => void;
  onSnooze?: () => void;
  onMore?: () => void;
  location?: string;
  doctor?: string;
}

interface DayTimelineProps {
  date: Date;
  items: TimelineItem[];
  onDateChange: (date: Date) => void;
}

export default function DayTimeline({
  date,
  items,
}: DayTimelineProps) {
  const { language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  // Flats list sorted by time
  const sortedItems = [...items].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "medication":
        return <Pill className="h-6 w-6" />;
      case "appointment":
        return <Stethoscope className="h-6 w-6" />;
      case "exam":
        return <TestTube className="h-6 w-6" />;
      case "procedure":
        return <Calendar className="h-6 w-6" />;
      default:
        return <Calendar className="h-6 w-6" />;
    }
  };

  const getItemStyles = (type: string, status: string) => {
    const isDone = status === "done";

    // Base styles (Clean Blue Theme)
    const base = {
      card: "bg-card/80 backdrop-blur-sm border-0 shadow-clean-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5",
      iconBox: "bg-primary/10 text-primary",
      title: "text-foreground",
      subtitle: "text-muted-foreground",
      timeBadge: "bg-primary/10 text-primary font-extrabold"
    };

    if (type === "medication") {
      base.iconBox = "bg-primary/15 text-primary";
    } else if (type === "appointment") {
      base.iconBox = "bg-accent/15 text-accent";
      base.timeBadge = "bg-accent/10 text-accent";
    } else if (type === "exam") {
      base.iconBox = "bg-gradient-mid/15 text-gradient-mid";
      base.timeBadge = "bg-gradient-mid/10 text-gradient-mid";
    } else if (type === "procedure") {
      base.iconBox = "bg-success/15 text-success";
      base.timeBadge = "bg-success/10 text-success";
    }

    if (isDone) {
      return {
        card: "bg-muted/40 border-0 opacity-50 shadow-none",
        iconBox: "bg-muted text-muted-foreground/50",
        title: "text-muted-foreground/50 line-through",
        subtitle: "text-muted-foreground/30",
        timeBadge: "bg-slate-100 text-muted-foreground/30"
      };
    }

    if (status === "missed") {
      return {
        ...base,
        card: "bg-destructive/10 border border-destructive/20",
        iconBox: "bg-destructive/15 text-destructive",
        timeBadge: "bg-destructive/10 text-destructive"
      }
    }

    return base;
  };

  return (
    <div className="w-full space-y-3">
      {/* Header Section */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black text-blue-600/80 uppercase tracking-widest">
          {language === 'pt' ? 'ROTINA DE HOJE' : 'TODAY\'S ROUTINE'}
        </h3>
      </div>

      {/* List content */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-8 bg-card/40 rounded-3xl border border-dashed border-border text-center"
          >
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-3 text-muted-foreground">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="text-foreground font-bold mb-0.5 text-base">
              {language === 'pt' ? 'Nenhum medicamento agendado' : 'No medications scheduled'}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === 'pt' ? 'Adicione medicamentos para comeÃ§ar' : 'Add medications to get started'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedItems.map((item, index) => {
              const styles = getItemStyles(item.type, item.status);
              const isDone = item.status === "done";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    delay: index * 0.04
                  }}
                >
                  <Card 
                    className={cn("rounded-2xl overflow-hidden relative cursor-pointer", styles.card)}
                    onClick={() => item.onMore?.()}
                  >
                    <CardContent className="p-3 flex items-center gap-3.5">
                      {/* Left Icon Squircle */}
                      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors", styles.iconBox)}>
                        {getTypeIcon(item.type)}
                      </div>

                      {/* Middle Text Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={cn("text-base font-bold truncate leading-tight", styles.title)}>
                          {item.title}
                        </h4>
                        {(item.subtitle || item.location) && (
                          <p className={cn("text-xs truncate font-medium mt-0.5", styles.subtitle)}>
                            {item.subtitle || item.location}
                          </p>
                        )}
                        {item.doctor && (
                          <p className={cn("text-[10px] truncate opacity-70 mt-0.5", styles.subtitle)}>
                            {item.doctor}
                          </p>
                        )}
                      </div>

                      {/* Right Action / Time */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Time Badge - Pill Shape */}
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] tracking-wide font-black", styles.timeBadge)}>
                          {item.time}
                        </span>

                        {/* Action Button (Radio/Checkbox Hybrid) */}
                        <div className="flex items-center gap-1">
                          {isDone ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center shadow-sm"
                            >
                              <Check className="h-4 w-4 text-white" weight="bold" />
                            </motion.div>
                          ) : (
                            <>
                              {item.onMore && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    item.onMore?.();
                                  }}
                                  className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                                >
                                  <DotsThreeOutlineVertical className="h-4 w-4" weight="fill" />
                                </button>
                              )}
                              {item.onMarkDone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    item.onMarkDone?.();
                                  }}
                                  className="h-7 w-7 rounded-full border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center group focus:outline-none"
                                  aria-label="Mark as done"
                                >
                                  <div className="h-3 w-3 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

