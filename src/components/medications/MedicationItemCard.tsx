import { Pencil, Trash2, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { getUniqueItemColors } from "@/lib/categoryColors";

export interface MedicationItem {
    id: string;
    name: string;
    doseText: string | null;
    category: string;
    withFood: boolean;
    isActive: boolean;
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

export function MedicationItemCard({ item, index, onEdit, onDelete }: MedicationItemCardProps) {
    const categoryConfig = getUniqueItemColors(item.name, item.category);
    const CategoryIcon = categoryConfig.icon;

    const getScheduleSummary = (schedule: { times: string[] | string }) => {
        if (!schedule.times || schedule.times.length === 0) return "Sem horários";
        const times = Array.isArray(schedule.times) ? schedule.times : [schedule.times];
        return times.join(", ");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
        >
            <Card className={`overflow-hidden border-l-3 ${categoryConfig.bgColor} ${categoryConfig.borderColor} border hover:shadow-md transition-all duration-200`}>
                <CardContent className="p-2.5 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Icon - smaller on mobile */}
                        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${categoryConfig.iconBg} flex-shrink-0`}>
                            <CategoryIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${categoryConfig.color}`} />
                        </div>

                        {/* Content - compact layout */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-foreground truncate">
                                        {item.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        {item.doseText && <span>{item.doseText}</span>}
                                        {item.schedules && item.schedules.length > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <Calendar className="h-3 w-3" />
                                                {getScheduleSummary(item.schedules[0])}
                                            </span>
                                        )}
                                        {item.stock && item.stock.length > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <Package className="h-3 w-3" />
                                                {item.stock[0].currentQty}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions - compact */}
                                <div className="flex gap-0 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg hover:bg-primary/10"
                                        onClick={() => onEdit(item.id)}
                                    >
                                        <Pencil className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg hover:bg-destructive/10"
                                        onClick={() => onDelete(item.id, item.name)}
                                    >
                                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
