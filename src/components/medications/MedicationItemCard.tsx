import { Pencil, Trash2, Clock, Package, Utensils, Calendar, AlertTriangle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getUniqueItemColors } from "@/lib/categoryColors";
import SupplementCategoryTag, { detectSupplementCategory } from "@/components/SupplementCategoryTag";

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

/** Formata data de término estimada */
function getEstimatedEndDate(daysLeft: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysLeft);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

export function MedicationItemCard({ item, index, onEdit, onDelete }: MedicationItemCardProps) {
    const colors = getUniqueItemColors(item.name, item.category);
    const CategoryIcon = colors.icon;

    const cardBg = `linear-gradient(145deg, ${colors.softFrom} 0%, ${colors.softTo} 100%)`;
    const iconBg = `linear-gradient(135deg, ${colors.accentFrom} 0%, ${colors.accentTo} 100%)`;
    const borderColor = `${colors.accentFrom}15`;

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

    const textPrimary = colors.textColor;
    const textSecondary = `${colors.textColor}cc`;
    const textMuted = `${colors.textColor}80`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            whileTap={{ scale: 0.985 }}
            style={{
                borderRadius: 20,
                overflow: "hidden",
                border: `1px solid ${borderColor}`,
                background: cardBg,
                cursor: "pointer",
                marginBottom: 12,
                position: "relative",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
            }}
            onClick={() => onEdit(item.id)}
        >
            <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {/* Compact Icon */}
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: iconBg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        position: "relative",
                        boxShadow: `0 4px 10px ${colors.accentFrom}25`,
                    }}>
                        <CategoryIcon style={{ width: 22, height: 22, color: "#fff" }} />
                        {criticalStock && (
                            <div style={{
                                position: "absolute",
                                top: -2, right: -2,
                                width: 14, height: 14, borderRadius: "50%",
                                background: "#ef4444", border: "2px solid #fff",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <AlertTriangle style={{ width: 8, height: 8, color: "#fff" }} />
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title & Badge Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: textPrimary, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {item.name}
                                </h3>
                                {(item.category === 'suplemento' || item.category === 'vitamina') && (
                                    <div style={{ transform: "scale(0.85)", transformOrigin: "left center" }}>
                                        <SupplementCategoryTag category={detectSupplementCategory(item.name)} size="sm" />
                                    </div>
                                )}
                            </div>
                            <div style={{
                                fontSize: 9, fontWeight: 800,
                                background: `${colors.accentFrom}15`,
                                color: colors.accentFrom,
                                padding: "1px 6px", borderRadius: 6,
                                textTransform: "uppercase",
                                border: `0.5px solid ${colors.accentFrom}20`,
                                marginLeft: 8, flexShrink: 0
                            }}>
                                {item.category}
                            </div>
                        </div>

                        {/* Dose & Indicators Row */}
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 3.5 }}>
                                <Package style={{ width: 11, height: 11, color: colors.accentFrom }} />
                                <span style={{ fontSize: 12, color: textPrimary, fontWeight: 600 }}>
                                    {item.doseText || "1 dose"}
                                </span>
                            </div>
                            {item.withFood && (
                                <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#f0fdf4", padding: "1px 6px", borderRadius: 4, border: "0.5px solid #dcfce7" }}>
                                    <Utensils style={{ width: 10, height: 10, color: "#16a34a" }} />
                                    <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>Refeição</span>
                                </div>
                            )}
                            <span style={{ color: `${textPrimary}30`, fontSize: 10 }}>•</span>
                            {freqLabel && (
                                <div style={{ display: "flex", alignItems: "center", gap: 3.5 }}>
                                    <Clock style={{ width: 11, height: 11, color: textSecondary, opacity: 0.7 }} />
                                    <span style={{ fontSize: 11, color: textSecondary, fontWeight: 500 }}>
                                        {freqLabel}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Treatment Context (Dates & Instructions) - High Density */}
                {(item.treatmentEndDate || item.instructions) && (
                    <div style={{
                        marginTop: 10, padding: "8px 10px", borderRadius: 12,
                        background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.03)",
                        display: "flex", flexDirection: "column", gap: 4
                    }}>
                        {item.treatmentEndDate && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Calendar style={{ width: 10, height: 10, color: textMuted }} />
                                <span style={{ fontSize: 10, fontWeight: 600, color: textSecondary }}>
                                    Termina em {new Date(item.treatmentEndDate).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        )}
                        {item.instructions && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                                <BookOpen style={{ width: 10, height: 10, color: textMuted, marginTop: 2 }} />
                                <p style={{ fontSize: 10.5, color: textSecondary, fontStyle: "italic", lineHeight: 1.25, fontWeight: 500 }}>
                                    {item.instructions}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Third Layer: Schedule & Stock Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: stockInfo ? "1fr 1fr" : "1fr",
                    gap: 10,
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px dashed rgba(0,0,0,0.06)"
                }}>
                    {/* Times Grid */}
                    {allTimes.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {allTimes.map((t) => (
                                    <div
                                        key={t}
                                        style={{
                                            fontSize: 10.5, fontWeight: 700,
                                            padding: "1.5px 6px", borderRadius: 6,
                                            background: t === nextDose ? colors.accentFrom : "rgba(255,255,255,0.6)",
                                            color: t === nextDose ? "#fff" : textPrimary,
                                            border: t === nextDose ? "none" : "1px solid rgba(0,0,0,0.03)"
                                        }}
                                    >
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stock Indicator - Minimalist */}
                    {stockInfo && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, fontWeight: 600 }}>
                                <span style={{ color: textSecondary }}>Qtde: {stockInfo.currentQty}</span>
                                {daysRemaining !== null && (
                                    <span style={{ color: criticalStock ? "#ef4444" : textSecondary }}>
                                        {daysRemaining}d.
                                    </span>
                                )}
                            </div>
                            <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.05)", overflow: "hidden" }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stockPct}%` }}
                                    style={{
                                        height: "100%",
                                        background: criticalStock ? "#ef4444" : lowStock ? "#f59e0b" : colors.accentFrom
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions overlayed or small bottom row? Let's use a very subtle bottom border for delete on hover/active */}
            <div style={{
                position: "absolute", top: 8, right: 8,
                display: "flex", gap: 4
            }}>
                <Button
                    variant="ghost" size="icon"
                    className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm text-red-500/50 hover:text-red-600 hover:bg-white/40"
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.name); }}
                >
                    <Trash2 style={{ width: 14, height: 14 }} />
                </Button>
            </div>
        </motion.div>
    );
}


