import { useMemo } from "react";
import {
  IconPill as Pill,
  IconSparkles as Sparkles,
  IconHealth as Leaf,
  IconAlertTriangle as AlertTriangle,
  IconClock as Clock
} from "@/components/icons/HoramedIcons";
import StatsGridBase, { StatItem } from "@/components/shared/StatsGridBase";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicationItem {
  id: string;
  name: string;
  category: string;
  stock?: Array<{
    currentQty: number;
    unitLabel: string;
  }>;
}

interface MedicationStatsGridProps {
  items: MedicationItem[];
  onStatClick?: (filter: string) => void;
}

export default function MedicationStatsGrid({
  items,
  onStatClick
}: MedicationStatsGridProps) {
  const { language } = useLanguage();

  const stats = useMemo(() => {
    const medications = items.filter(i => i.category === 'medicamento');
    const vitamins = items.filter(i => i.category === 'vitamina');
    const supplements = items.filter(i => i.category === 'suplemento');
    const lowStock = items.filter(i => i.stock?.[0] && i.stock[0].currentQty <= 5);

    const result: StatItem[] = [
      {
        id: "total",
        label: language === 'pt' ? 'Total' : 'Total',
        value: items.length,
        icon: <Pill className="h-4 w-4" />,
        color: "bg-primary/10 text-primary",
        onClick: () => onStatClick?.("all")
      },
      {
        id: "medications",
        label: language === 'pt' ? 'Meds' : 'Meds',
        value: medications.length,
        icon: <Pill className="h-4 w-4" />,
        color: "bg-blue-500/10 text-blue-500",
        onClick: () => onStatClick?.("medicamento")
      },
      {
        id: "vitamins",
        label: language === 'pt' ? 'Vits' : 'Vits',
        value: vitamins.length,
        icon: <Sparkles className="h-4 w-4" />,
        color: "bg-emerald-500/10 text-emerald-500",
        onClick: () => onStatClick?.("vitamina")
      },
      {
        id: "low-stock",
        label: language === 'pt' ? 'Crítico' : 'Critical',
        value: lowStock.length,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: lowStock.length > 0 ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground",
        onClick: () => onStatClick?.("low-stock")
      }
    ];

    return result;
  }, [items, language, onStatClick]);

  return <StatsGridBase stats={stats} columns={4} />;
}
