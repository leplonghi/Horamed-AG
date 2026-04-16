import {
    IconPencil as Pencil,
    IconTrash as Trash2,
    IconClock as Clock,
    IconArchive as Package,
    IconSilverware as Utensils,
    IconCalendar as Calendar,
    IconAlertTriangle as AlertTriangle,
    IconArrowRight as BookOpen
} from "@/components/icons/HoramedIcons";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getUniqueItemColors } from "@/lib/categoryColors";
import SupplementCategoryTag, { detectSupplementCategory } from "@/components/SupplementCategoryTag";
import { safeDateParse } from "@/lib/safeDateUtils";

export interface MedicationItem {
    id: string;
    name: string;
    doseText: string | null;
    instructions?: string;
    category: string;
    withFood?: boolean;
    isActive: boolean;
    profileId: string;
    treatmentStartDate?: string;
    treatmentEndDate?: string;
    notes?: string;
    schedules: Array<{
        id: string;
        times: string[] | string;
        freqType: string;
    }>;
    stock?: Array<{
        currentQty: number;
        unitLabel: string;
    }>;
}

interface MedicationItemCardProps {
    item: MedicationItem;
    index: number;
    onEdit: (id: string) => void;
    onDelete: (id: string, name: string) => void;
}

const FREQ_LABELS: Record<string, string> = {
    daily: "Diário",
    weekly: "Semanal",
    every_other_day: "Dia sim/não",
    as_needed: "Se necessário",
    custom: "Personalizado",
};

/** Coleta TODOS os horários de todos os schedules */
function getAllTimes(schedules: MedicationItem["schedules"]): string[] {
    const all: string[] = [];
    for (const s of schedules) {
        const times = Array.isArray(s.times) ? s.times : [s.times];
        all.push(...times.filter(Boolean));
    }
    return [...new Set(all)].sort();
}

/** Calcula a próxima dose mais próxima do momento atual */
function getNextDoseTime(allTimes: string[]): string | null {
    if (allTimes.length === 0) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const t of allTimes) {
        const [h, m] = t.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m) && (h * 60 + m) > currentMinutes) return t;
    }
    return allTimes[0]; // Retorna a primeira dose do dia seguinte
}

/** Estima dias restantes de estoque */
function getDaysRemaining(currentQty: number, dosesPerDay: number): number | null {
    if (dosesPerDay <= 0 || currentQty <= 0) return null;
    return Math.floor(currentQty / dosesPerDay);
}

export function MedicationItemCard({ item, index, onEdit, onDelete }: MedicationItemCardProps) {
    const colors = getUniqueItemColors(item.name, item.category);
    const CategoryIcon = colors.icon;

    const stockInfo = item.stock?.[0];
    const allTimes = getAllTimes(item.schedules);
    const dosesPerDay = allTimes.length;
    const nextDose = getNextDoseTime(allTimes);
    const daysRemaining = stockInfo ? getDaysRemaining(stockInfo.currentQty, dosesPerDay || 1) : null;

    const lowStock = stockInfo && (daysRemaining !== null ? daysRemaining <= 7 : stockInfo.currentQty <= 5);
    const criticalStock = stockInfo && (daysRemaining !== null ? daysRemaining <= 2 : stockInfo.currentQty <= 2);
    const stockPct = daysRemaining !== null ? Math.min(100, (daysRemaining / 30) * 100) : null;

    const primarySchedule = item.schedules?.[0];
    const freqLabel = primarySchedule ? (FREQ_LABELS[primarySchedule.freqType] || primarySchedule.freqType) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="card-interactive rounded-[2rem] p-4 sm:p-5 relative group overflow-hidden border border-white/10 mb-4"
            onClick={() => onEdit(item.id)}
        >
            <div className="flex gap-4 items-start relative z-10">
                {/* Category Icon */}
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center relative shrink-0"
                    style={{
                        background: `linear-gradient(135deg, ${colors.accentFrom} 0%, ${colors.accentTo} 100%)`,
                        boxShadow: `0 8px 16px ${colors.accentFrom}30`
                    }}
                >
                    <CategoryIcon className="w-7 h-7 text-white" />
                    {criticalStock && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive border-2 border-background flex items-center justify-center animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <h3 className="text-lg font-bold text-foreground leading-tight truncate">
                                {item.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span
                                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border"
                                    style={{
                                        color: colors.accentFrom,
                                        borderColor: `${colors.accentFrom}30`,
                                        backgroundColor: `${colors.accentFrom}10`
                                    }}
                                >
                                    {item.category}
                                </span>
                                {(item.category === 'suplemento' || item.category === 'vitamina') && (
                                    <SupplementCategoryTag category={detectSupplementCategory(item.name)} size="sm" />
                                )}
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.name); }}
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                        <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 opacity-70" style={{ color: colors.accentFrom }} />
                            <span className="text-sm font-semibold text-foreground/80">
                                {item.doseText || "1 dose"}
                            </span>
                        </div>

                        {item.withFood && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
                                <Utensils className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-[10px] font-bold text-green-500 uppercase">Refeição</span>
                            </div>
                        )}

                        {freqLabel && (
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{freqLabel}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Treatment Info */}
            {(item.treatmentEndDate || item.instructions) && (
                <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2 relative z-10">
                    {item.treatmentEndDate && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                            <span>Termina em {safeDateParse(item.treatmentEndDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                    )}
                    {item.instructions && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground/90 font-medium italic leading-relaxed">
                            <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-50" />
                            <span>{item.instructions}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Row: Next Doses & Stock */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex flex-wrap gap-2">
                    {allTimes.map((t) => (
                        <div
                            key={t}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${t === nextDose
                                    ? "bg-primary text-primary-foreground shadow-glow shadow-primary/30 scale-105"
                                    : "bg-white/5 text-muted-foreground border border-white/5"
                                }`}
                        >
                            {t}
                        </div>
                    ))}
                </div>

                {stockInfo && (
                    <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground/70">
                                <span>Estoque</span>
                                <span className={criticalStock ? "text-destructive" : ""}>
                                    {stockInfo.currentQty} {stockInfo.unitLabel}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stockPct}%` }}
                                    className={`h-full rounded-full ${criticalStock ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : lowStock ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                        }`}
                                />
                            </div>
                        </div>
                        {daysRemaining !== null && (
                            <div className={`shrink-0 w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center text-[10px] font-black transition-colors ${criticalStock ? "border-destructive/30 text-destructive bg-destructive/5" : "border-primary/20 text-primary bg-primary/5"
                                }`}>
                                <span>{daysRemaining}</span>
                                <span className="text-[7px] -mt-1 opacity-60 uppercase font-bold">dias</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
