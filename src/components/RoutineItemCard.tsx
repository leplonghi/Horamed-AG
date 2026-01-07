import { useState } from "react";
import { Check, Clock, MoreHorizontal, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface RoutineItemCardProps {
  id: string;
  name: string;
  doseText?: string | null;
  category: string;
  nextTime?: string;
  stockLeft?: number;
  stockLabel?: string;
  isPending?: boolean;
  onTake?: () => void;
  onSnooze?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  medicamento: "💊",
  vitamina: "❤️",
  suplemento: "⚡",
  outro: "📦",
};

export default function RoutineItemCard({
  id,
  name,
  doseText,
  category,
  nextTime,
  stockLeft,
  stockLabel,
  isPending,
  onTake,
  onSnooze,
  onEdit,
  onDelete,
  index = 0,
}: RoutineItemCardProps) {
  const { language } = useLanguage();
  const [isTaking, setIsTaking] = useState(false);

  const handleTake = async () => {
    if (!onTake) return;
    setIsTaking(true);
    try {
      await onTake();
    } finally {
      setIsTaking(false);
    }
  };

  const lowStock = stockLeft !== undefined && stockLeft <= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn(
        "p-4 transition-all",
        isPending && "ring-2 ring-primary/30 bg-primary/5"
      )}>
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
            {CATEGORY_ICONS[category] || "📦"}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            {doseText && (
              <p className="text-sm text-muted-foreground truncate">{doseText}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {nextTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {nextTime}
                </span>
              )}
              {stockLeft !== undefined && (
                <span className={cn(
                  "flex items-center gap-1",
                  lowStock && "text-destructive font-medium"
                )}>
                  <Package className="h-3 w-3" />
                  {stockLeft} {stockLabel || (language === 'pt' ? 'unid.' : 'units')}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isPending && onTake && (
              <Button
                size="sm"
                onClick={handleTake}
                disabled={isTaking}
                className="rounded-xl font-semibold"
              >
                <Check className="h-4 w-4 mr-1" />
                {language === 'pt' ? 'Tomado' : 'Taken'}
              </Button>
            )}
            {isPending && onSnooze && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSnooze}
                className="rounded-xl"
              >
                <Clock className="h-4 w-4 mr-1" />
                {language === 'pt' ? 'Adiar' : 'Snooze'}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'Editar' : 'Edit'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'Excluir' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
