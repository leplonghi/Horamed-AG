
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarBlank as CalendarIcon, CaretLeft as ChevronLeft, CaretRight as ChevronRight, Plus } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedicalEvents } from '@/hooks/useMedicalEvents';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

/**
 * Calendar view for medical events
 */
const MedicalEventsCalendar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [currentDate, setCurrentDate] = useState(new Date());

    // In a real app, we would filter by date range in the API
    const { events } = useMedicalEvents();

    // Calendar logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Simple grouping of events by date
    const eventsByDate = (events || []).reduce((acc: any, event) => {
        if (!event.date?.seconds) return acc;
        const dateStr = format(safeDateParse(event.date), 'yyyy-MM-dd');
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(event);
        return acc;
    }, {});

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 w-full shadow-md">
                <div className="flex items-center justify-between gap-2 mb-2 max-w-4xl mx-auto">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/eventos-medicos')}
                            className="text-white hover:bg-white/20"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="text-xl font-bold">{t('medicalEvents.title')}</h1>
                    </div>
                </div>
            </div>

            <div className="container max-w-4xl mx-auto p-4">
                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-xl font-semibold capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm text-muted-foreground font-medium">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <div key={i} className="py-2">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {/* Padding for start of month - simplified for now, usually would calculate empty cells */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-muted/10 rounded-lg" />
                    ))}

                    {days.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayEvents = eventsByDate[dateStr] || [];
                        const hasEvent = dayEvents.length > 0;
                        const isCurrentDay = isToday(day);

                        return (
                            <button
                                key={dateStr}
                                onClick={() => {
                                    // Scroll to list or open dialog
                                    if (hasEvent) {
                                        // Could show list below or filter
                                    }
                                }}
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-colors border
                                    ${isCurrentDay ? 'bg-primary/20 border-primary text-primary font-bold' : 'bg-card border-border hover:bg-muted'}
                                    ${hasEvent ? 'border-b-4 border-b-primary/50' : ''}
                                `}
                            >
                                <span className="text-sm">{format(day, 'd')}</span>
                                {hasEvent && (
                                    <div className="flex gap-0.5 mt-1">
                                        {dayEvents.slice(0, 3).map((ev: any, i: number) => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${ev.type === 'consultation' ? 'bg-blue-500' : 'bg-teal-500'}`} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-6 justify-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Consulta</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                        <span>Exame</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span>Procedimento</span>
                    </div>
                </div>

                {/* Fab to Add */}
                <Button
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50"
                    size="icon"
                    onClick={() => navigate('/eventos-medicos/adicionar')}
                >
                    <Plus className="w-8 h-8" />
                </Button>
            </div>
        </div>
    );
};

export default MedicalEventsCalendar;
