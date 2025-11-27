import { Badge } from "@/components/ui/badge";
import { Zap, Moon, Shield, Droplets } from "lucide-react";

interface SupplementTagProps {
  type: "energy" | "sleep" | "immunity" | "performance" | "hydration";
}

const TAG_CONFIG = {
  energy: { label: "Energia", icon: Zap, className: "bg-performance-bg text-performance border-performance-border" },
  sleep: { label: "Sono", icon: Moon, className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800" },
  immunity: { label: "Imunidade", icon: Shield, className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" },
  performance: { label: "Performance", icon: Zap, className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800" },
  hydration: { label: "Hidratação", icon: Droplets, className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" }
};

export default function SupplementTag({ type }: SupplementTagProps) {
  const config = TAG_CONFIG[type];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
