import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Clock, Plus, X, Bell, BellOff, Volume2, Vibrate, Trash2,
    Sun, Moon, Sunrise, Sunset, Edit3, Check, AlertCircle, Copy, Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export interface NotificationSchedule {
    id: string;
    time: string;
    type: "silent" | "push" | "alarm";
    vibrate: boolean;
    sound: string;
    enabled: boolean;
    label?: string;
}

interface NotificationScheduleEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    schedules: NotificationSchedule[];
    onSave: (schedules: NotificationSchedule[]) => void;
    medicationName?: string;
}

export default function NotificationScheduleEditor({
    open,
    onOpenChange,
    schedules: initialSchedules,
    onSave,
    medicationName
}: NotificationScheduleEditorProps) {
    const { t, language } = useLanguage();
    const [schedules, setSchedules] = useState<NotificationSchedule[]>(initialSchedules);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddTime, setShowAddTime] = useState(false);
    const [newTime, setNewTime] = useState("");

    const QUICK_TIMES = [
        { label: t('time.morning'), time: "08:00", icon: Sunrise, color: "text-orange-500" },
        { label: t('time.lunch'), time: "12:00", icon: Sun, color: "text-yellow-500" },
        { label: t('time.afternoon'), time: "18:00", icon: Sunset, color: "text-purple-500" },
        { label: t('time.night'), time: "22:00", icon: Moon, color: "text-blue-500" },
    ];

    const SOUND_OPTIONS = [
        { value: "default", label: t('sound.default') },
        { value: "gentle", label: t('sound.gentle') },
        { value: "alert", label: t('sound.alert') },
        { value: "urgent", label: t('sound.urgent') },
    ];

    const SCHEDULE_TEMPLATES = [
        {
            label: language === 'pt' ? '3x ao dia' : '3x a day',
            times: ["08:00", "14:00", "20:00"],
            icon: Sun
        },
        {
            label: language === 'pt' ? 'Antes das refeições' : 'Before meals',
            times: ["07:30", "12:30", "19:30"],
            icon: Sunrise
        },
        {
            label: language === 'pt' ? 'Manhã e Noite' : 'Morning & Night',
            times: ["08:00", "22:00"],
            icon: Moon
        },
    ];

    const getTimeIcon = (time: string) => {
        const hour = parseInt(time.split(":")[0]);
        if (hour >= 5 && hour < 12) return Sunrise;
        if (hour >= 12 && hour < 17) return Sun;
        if (hour >= 17 && hour < 21) return Sunset;
        return Moon;
    };

    const duplicateSchedule = (schedule: NotificationSchedule) => {
        const newSchedule: NotificationSchedule = {
            ...schedule,
            id: `schedule-${Date.now()}`,
            time: schedule.time, // User will need to change this
        };
        setSchedules([...schedules, newSchedule].sort((a, b) => a.time.localeCompare(b.time)));
        setEditingId(newSchedule.id);
        toast.success(language === 'pt' ? 'Horário duplicado! Altere o horário.' : 'Schedule duplicated! Change the time.');
    };

    const applyTemplate = (template: typeof SCHEDULE_TEMPLATES[0]) => {
        const newSchedules: NotificationSchedule[] = template.times.map((time, index) => ({
            id: `schedule-${Date.now()}-${index}`,
            time,
            type: "push",
            vibrate: true,
            sound: "default",
            enabled: true,
        }));
        setSchedules(newSchedules);
        toast.success(language === 'pt' ? 'Template aplicado!' : 'Template applied!');
    };


    const playSound = (soundName: string) => {
        // In a real scenario, these would point to different files in public/sounds/
        const soundFile = "sounds/notification.mp3";

        try {
            const audio = new Audio(`/${soundFile}`);
            audio.play().catch(err => {
                console.error("Error playing sound preview:", err);
                toast.error(language === 'pt' ? 'Erro ao reproduzir som' : 'Error playing sound');
            });
            toast.info(language === 'pt' ? 'Reproduzindo som...' : 'Playing sound...');
        } catch (error) {
            console.error("Audio error:", error);
        }
    };

    const addSchedule = (time: string) => {
        if (schedules.some(s => s.time === time)) {
            toast.error(t('scheduler.timeExists'));
            return;
        }

        const newSchedule: NotificationSchedule = {
            id: `schedule-${Date.now()}`,
            time,
            type: "push",
            vibrate: true,
            sound: "default",
            enabled: true,
        };

        setSchedules([...schedules, newSchedule].sort((a, b) => a.time.localeCompare(b.time)));
        setShowAddTime(false);
        setNewTime("");
        toast.success(t('scheduler.timeAdded'));
    };

    const removeSchedule = (id: string) => {
        if (schedules.length === 1) {
            toast.error(t('scheduler.keepOneTime'));
            return;
        }
        setSchedules(schedules.filter(s => s.id !== id));
        toast.success(t('scheduler.timeRemoved'));
    };

    const updateSchedule = (id: string, updates: Partial<NotificationSchedule>) => {
        setSchedules(schedules.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleSave = () => {
        if (schedules.length === 0) {
            toast.error(t('scheduler.addOneTime'));
            return;
        }
        onSave(schedules);
        onOpenChange(false);
        toast.success(t('scheduler.schedulesSaved'));
    };

    const getNotificationTypeIcon = (type: string) => {
        switch (type) {
            case 'silent': return BellOff;
            case 'alarm': return Volume2;
            default: return Bell;
        }
    };

    const getNotificationTypeLabel = (type: string) => {
        switch (type) {
            case 'silent': return language === 'pt' ? 'Silencioso' : 'Silent';
            case 'alarm': return language === 'pt' ? 'Alarme' : 'Alarm';
            default: return language === 'pt' ? 'Notificação' : 'Notification';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-br from-background to-muted/20">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Clock className="h-6 w-6 text-primary" />
                            </div>
                            {t('scheduler.manageAlarms')}
                        </DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {medicationName && (
                                <span className="font-semibold text-foreground">{medicationName}</span>
                            )}
                            {' - ' + t('scheduler.configureIndividual')}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Templates */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                            {language === 'pt' ? 'Templates Rápidos' : 'Quick Templates'}
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {SCHEDULE_TEMPLATES.map((template) => {
                                const Icon = template.icon;
                                return (
                                    <Button
                                        key={template.label}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyTemplate(template)}
                                        className="flex-col h-auto py-3 gap-1.5 rounded-xl hover:scale-105 hover:border-primary/50 transition-all"
                                    >
                                        <Icon className="w-5 h-5 text-primary" />
                                        <span className="text-xs font-bold">{template.label}</span>
                                        <span className="text-[10px] opacity-70">{template.times.length} {language === 'pt' ? 'horários' : 'times'}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Add Times */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                            {t('scheduler.quickAdd')}
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                            {QUICK_TIMES.map((qt) => {
                                const isAdded = schedules.some(s => s.time === qt.time);
                                const Icon = qt.icon;
                                return (
                                    <Button
                                        key={qt.time}
                                        variant={isAdded ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => !isAdded && addSchedule(qt.time)}
                                        disabled={isAdded}
                                        className={cn(
                                            "flex-col h-auto py-3 gap-1.5 rounded-xl transition-all",
                                            isAdded ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:border-primary/50"
                                        )}
                                    >
                                        <Icon className={cn("w-5 h-5", !isAdded && qt.color)} />
                                        <span className="text-xs font-bold">{qt.label}</span>
                                        <span className="text-[10px] opacity-70">{qt.time}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Time Input */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-px bg-border flex-1" />
                            <span className="text-xs text-muted-foreground font-medium uppercase">
                                {language === 'pt' ? 'ou' : 'or'}
                            </span>
                            <div className="h-px bg-border flex-1" />
                        </div>

                        {showAddTime ? (
                            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in">
                                <Input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="flex-1 h-12 text-lg font-bold text-center"
                                    autoFocus
                                />
                                <Button
                                    onClick={() => newTime && addSchedule(newTime)}
                                    disabled={!newTime}
                                    className="h-12 w-12 rounded-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowAddTime(false);
                                        setNewTime("");
                                    }}
                                    className="h-12 w-12 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setShowAddTime(true)}
                                className="w-full h-12 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('scheduler.customTime')}
                            </Button>
                        )}
                    </div>

                    {/* Schedule List */}
                    <div className="space-y-3 pt-4">
                        <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            {t('scheduler.configuredTimes')} ({schedules.length})
                        </Label>

                        <AnimatePresence mode="popLayout">
                            {schedules.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">
                                        {t('scheduler.noTimes')}
                                    </p>
                                </motion.div>
                            ) : (
                                schedules.map((schedule, index) => {
                                    const TimeIcon = getTimeIcon(schedule.time);
                                    const NotifIcon = getNotificationTypeIcon(schedule.type);
                                    const isEditing = editingId === schedule.id;

                                    return (
                                        <motion.div
                                            key={schedule.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className={cn(
                                                "p-4 transition-all duration-300 border-2",
                                                !schedule.enabled && "opacity-60 bg-muted/20",
                                                isEditing && "ring-2 ring-primary/50 border-primary/50"
                                            )}>
                                                <div className="space-y-4">
                                                    {/* Header */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-primary/10 rounded-lg">
                                                            <TimeIcon className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            {isEditing ? (
                                                                <Input
                                                                    type="time"
                                                                    value={schedule.time}
                                                                    onChange={(e) => updateSchedule(schedule.id, { time: e.target.value })}
                                                                    className="text-2xl font-bold tracking-tight h-10 w-32 p-1"
                                                                />
                                                            ) : (
                                                                <p className="text-2xl font-bold tracking-tight">{schedule.time}</p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <NotifIcon className="w-3 h-3 mr-1" />
                                                                    {getNotificationTypeLabel(schedule.type)}
                                                                </Badge>
                                                                {schedule.vibrate && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        <Vibrate className="w-3 h-3 mr-1" />
                                                                        {language === 'pt' ? 'Vibrar' : 'Vibrate'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={schedule.enabled}
                                                                onCheckedChange={(checked) => updateSchedule(schedule.id, { enabled: checked })}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => duplicateSchedule(schedule)}
                                                                className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                                                                title={language === 'pt' ? 'Duplicar horário' : 'Duplicate schedule'}
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setEditingId(isEditing ? null : schedule.id)}
                                                                className="h-9 w-9"
                                                            >
                                                                {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeSchedule(schedule.id)}
                                                                className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Settings */}
                                                    <AnimatePresence>
                                                        {isEditing && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="space-y-4 pt-4 border-t border-border/50"
                                                            >
                                                                {/* Notification Type */}
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                                                        {language === 'pt' ? 'Tipo de Notificação' : 'Notification Type'}
                                                                    </Label>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {[
                                                                            { id: 'silent', icon: BellOff, label: language === 'pt' ? 'Silencioso' : 'Silent' },
                                                                            { id: 'push', icon: Bell, label: language === 'pt' ? 'Notificação' : 'Push' },
                                                                            { id: 'alarm', icon: Volume2, label: language === 'pt' ? 'Alarme' : 'Alarm' },
                                                                        ].map((type) => {
                                                                            const isSelected = schedule.type === type.id;
                                                                            const Icon = type.icon;
                                                                            return (
                                                                                <button
                                                                                    key={type.id}
                                                                                    onClick={() => updateSchedule(schedule.id, { type: type.id as any })}
                                                                                    className={cn(
                                                                                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                                                                        isSelected
                                                                                            ? "border-primary bg-primary/10 text-primary"
                                                                                            : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                                                                                    )}
                                                                                >
                                                                                    <Icon className="w-5 h-5" />
                                                                                    <span className="text-xs font-bold">{type.label}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {/* Sound Selection */}
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                                                        {language === 'pt' ? 'Som' : 'Sound'}
                                                                    </Label>
                                                                    <div className="flex gap-2">
                                                                        <Select
                                                                            value={schedule.sound}
                                                                            onValueChange={(value) => updateSchedule(schedule.id, { sound: value })}
                                                                        >
                                                                            <SelectTrigger className="h-11 flex-1">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {SOUND_OPTIONS.map((opt) => (
                                                                                    <SelectItem key={opt.value} value={opt.value}>
                                                                                        {opt.label}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="h-11 w-11 shrink-0"
                                                                            onClick={() => playSound(schedule.sound || 'default')}
                                                                            title={language === 'pt' ? 'Ouvir som' : 'Preview sound'}
                                                                        >
                                                                            <Play className="w-4 h-4 text-primary" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Vibration Toggle */}
                                                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                                                    <div className="flex items-center gap-3">
                                                                        <Vibrate className="w-5 h-5 text-muted-foreground" />
                                                                        <div>
                                                                            <p className="text-sm font-bold">
                                                                                {language === 'pt' ? 'Vibração' : 'Vibration'}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {language === 'pt' ? 'Vibrar ao notificar' : 'Vibrate on notification'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Switch
                                                                        checked={schedule.vibrate}
                                                                        onCheckedChange={(checked) => updateSchedule(schedule.id, { vibrate: checked })}
                                                                    />
                                                                </div>

                                                                {/* Optional Label */}
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                                                        {language === 'pt' ? 'Rótulo (Opcional)' : 'Label (Optional)'}
                                                                    </Label>
                                                                    <Input
                                                                        value={schedule.label || ""}
                                                                        onChange={(e) => updateSchedule(schedule.id, { label: e.target.value })}
                                                                        placeholder={language === 'pt' ? 'Ex: Após café da manhã' : 'E.g., After breakfast'}
                                                                        className="h-11"
                                                                    />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 bg-muted/20 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-12 rounded-xl"
                    >
                        {language === 'pt' ? 'Cancelar' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={schedules.length === 0}
                        className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        {language === 'pt' ? 'Salvar Alterações' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
