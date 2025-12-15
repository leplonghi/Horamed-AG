import { Badge } from "@/components/ui/badge";
import { Zap, Moon, Shield, Droplets, Dumbbell, LucideIcon } from "lucide-react";

export type SupplementCategoryType = "energy" | "sleep" | "immunity" | "performance" | "hydration";

interface SupplementTagProps {
  type: SupplementCategoryType;
}

interface TagConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const TAG_CONFIG: Record<SupplementCategoryType, TagConfig> = {
  energy: { label: "Energia", icon: Zap, className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800" },
  sleep: { label: "Sono", icon: Moon, className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800" },
  immunity: { label: "Imunidade", icon: Shield, className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" },
  performance: { label: "Performance", icon: Dumbbell, className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800" },
  hydration: { label: "Hidratação", icon: Droplets, className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" }
};

export default function SupplementTag({ type }: SupplementTagProps) {
  const config = TAG_CONFIG[type];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
