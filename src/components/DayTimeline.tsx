import { Card, CardContent } from "@/components/ui/card";
import { format, isToday } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Check, Calendar, Stethoscope, TestTube, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelineItem {
  id: string;
  time: string;
  type: "medication" | "appointment" | "exam";
  title: string;
  subtitle?: string;
  status: "pending" | "done" | "missed";
  onMarkDone?: () => void;
  onSnooze?: () => void;
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
      default:
        return <Calendar className="h-6 w-6" />;
    }
  };

  const getItemStyles = (type: string, status: string) => {
    const isDone = status === "done";

    // Base styles (Clean Blue Theme - Image Reference 1)
    const base = {
      card: "bg-white border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1",
      iconBox: "bg-indigo-100 text-indigo-600",
      title: "text-slate-800",
      subtitle: "text-slate-500",
      timeBadge: "bg-blue-50 text-blue-600 font-bold"
    };

    if (type === "medication") {
      base.iconBox = "bg-blue-100 text-blue-600";
    } else if (type === "appointment") {
      base.iconBox = "bg-emerald-100 text-emerald-600";
      base.timeBadge = "bg-emerald-50 text-emerald-600";
    } else if (type === "exam") {
      base.iconBox = "bg-teal-100 text-teal-600";
      base.timeBadge = "bg-teal-50 text-teal-600";
    }

    if (isDone) {
      return {
        card: "bg-slate-50 border-0 opacity-60 shadow-none",
        iconBox: "bg-slate-200 text-slate-400",
        title: "text-slate-500 line-through",
        subtitle: "text-slate-400",
        timeBadge: "bg-slate-100 text-slate-400"
      };
    }

    if (status === "missed") {
      return {
        ...base,
        card: "bg-red-50/50 border border-red-100",
        iconBox: "bg-red-100 text-red-500",
        timeBadge: "bg-red-50 text-red-500"
      }
    }

    return base;
  };

  return (
    <div className="w-full space-y-5 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between px-1 pt-2">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">
          {language === 'pt' ? 'PRÓXIMAS DOSES' : 'UPCOMING DOSES'}
        </h3>
        {/* We can put a 'See all' link here later if needed */}
      </div>

      {/* List content */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-10 bg-white/60 rounded-3xl border-2 border-dashed border-slate-200 text-center"
          >
            <div className="h-16 w-16 bg-slate-100/50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Calendar className="h-8 w-8" />
            </div>
            <p className="text-slate-600 font-semibold mb-1 text-lg">
              {language === 'pt' ? 'Tudo tranquilo!' : 'All clear!'}
            </p>
            <p className="text-slate-500">
              {language === 'pt' ? 'Nenhum medicamento agendado.' : 'No medications scheduled.'}
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
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.05
                  }}
                >
                  <Card className={cn("rounded-[1.5rem] overflow-hidden relative", styles.card)}>
                    <CardContent className="p-5 flex items-center gap-5">
                      {/* Left Icon Squircle */}
                      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors", styles.iconBox)}>
                        {getTypeIcon(item.type)}
                      </div>

                      {/* Middle Text Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={cn("text-lg font-bold truncate leading-tight mb-1", styles.title)}>
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className={cn("text-sm truncate font-medium", styles.subtitle)}>
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Right Action / Time */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        {/* Time Badge - Pill Shape */}
                        <span className={cn("px-3 py-1 rounded-full text-xs tracking-wide font-extrabold shadow-sm", styles.timeBadge)}>
                          {item.time}
                        </span>

                        {/* Action Button (Radio/Checkbox Hybrid) */}
                        {isDone ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center shadow-md shadow-blue-200"
                          >
                            <Check className="h-5 w-5 text-white stroke-[3]" />
                          </motion.div>
                        ) : (
                          item.onMarkDone ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                item.onMarkDone?.();
                              }}
                              className="h-8 w-8 rounded-full border-[3px] border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                              aria-label="Mark as done"
                            >
                              <div className="h-4 w-4 rounded-full bg-slate-300 group-hover:bg-blue-400 transition-colors" />
                            </button>
                          ) : null
                        )}
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
