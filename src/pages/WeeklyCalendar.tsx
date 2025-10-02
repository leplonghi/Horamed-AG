import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Pill } from "lucide-react";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DoseInstance {
  id: string;
  due_at: string;
  status: string;
  items: {
    name: string;
    category: string;
  };
}

interface DaySchedule {
  date: Date;
  dayName: string;
  doses: DoseInstance[];
}

const CATEGORY_COLORS = {
  medicamento: "bg-primary/10 text-primary border-primary/30",
  suplemento: "bg-accent/10 text-accent border-accent/30",
  vitamina: "bg-warning/10 text-warning border-warning/30",
  pet: "bg-secondary/10 text-secondary border-secondary/30",
};

export default function WeeklyCalendar() {
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeekSchedule();
  }, []);

  const fetchWeekSchedule = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });

      const schedulePromises = Array.from({ length: 7 }, async (_, i) => {
        const day = addDays(weekStart, i);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const { data } = await supabase
          .from("dose_instances")
          .select(`
            id,
            due_at,
            status,
            items (name, category)
          `)
          .gte("due_at", dayStart.toISOString())
          .lte("due_at", dayEnd.toISOString())
          .order("due_at", { ascending: true });

        return {
          date: day,
          dayName: format(day, "EEE", { locale: ptBR }),
          doses: data || [],
        };
      });

      const schedule = await Promise.all(schedulePromises);
      setWeekSchedule(schedule);
    } catch (error) {
      console.error("Error fetching week schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "taken":
        return "bg-success/20 border-success/50";
      case "skipped":
        return "bg-muted border-muted-foreground/30";
      case "snoozed":
        return "bg-warning/20 border-warning/50";
      default:
        return "bg-card border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando calendário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Calendar className="h-9 w-9 text-primary" />
            Calendário Semanal
          </h1>
          <p className="text-muted-foreground text-lg">
            {format(weekSchedule[0]?.date || new Date(), "d 'de' MMMM", {
              locale: ptBR,
            })}{" "}
            -{" "}
            {format(weekSchedule[6]?.date || new Date(), "d 'de' MMMM", {
              locale: ptBR,
            })}
          </p>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekSchedule.map((day, index) => {
            const isToday = format(day.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            
            return (
              <Card
                key={index}
                className={`p-4 space-y-3 transition-all hover:shadow-md ${
                  isToday ? "ring-2 ring-primary shadow-lg" : ""
                }`}
              >
                {/* Day Header */}
                <div className="text-center pb-2 border-b">
                  <p
                    className={`text-sm font-semibold uppercase ${
                      isToday ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {day.dayName}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {format(day.date, "d")}
                  </p>
                </div>

                {/* Doses */}
                <div className="space-y-2 min-h-[200px]">
                  {day.doses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center pt-4">
                      Sem doses
                    </p>
                  ) : (
                    day.doses.map((dose) => (
                      <div
                        key={dose.id}
                        className={`p-2 rounded-lg border transition-all hover:scale-105 ${getStatusColor(
                          dose.status
                        )}`}
                      >
                        <div className="flex items-start gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {format(parseISO(dose.due_at), "HH:mm")}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {dose.items.name}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] mt-1 ${
                                CATEGORY_COLORS[
                                  dose.items.category as keyof typeof CATEGORY_COLORS
                                ] || ""
                              }`}
                            >
                              {dose.items.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Legend */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Legenda
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success/50" />
              <span className="text-xs">Tomado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning/50" />
              <span className="text-xs">Adiado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span className="text-xs">Pulado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-card border-2 border-border" />
              <span className="text-xs">Pendente</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
