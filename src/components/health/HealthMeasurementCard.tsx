import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Minus, History, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

interface HealthMeasurementCardProps {
  title: string;
  icon: React.ReactNode;
  unit: string;
  value?: number | null;
  secondaryValue?: number | null;
  secondaryUnit?: string;
  lastUpdated?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color: string;
  normalRange?: { min: number; max: number };
  onAddMeasurement: (value: number, secondaryValue?: number) => void;
  onViewHistory?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  secondaryPlaceholder?: string;
}

export default function HealthMeasurementCard({
  title,
  icon,
  unit,
  value,
  secondaryValue,
  secondaryUnit,
  lastUpdated,
  trend,
  trendValue,
  color,
  normalRange,
  onAddMeasurement,
  onViewHistory,
  isLoading,
  placeholder,
  secondaryPlaceholder
}: HealthMeasurementCardProps) {
  const { language } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newSecondaryValue, setNewSecondaryValue] = useState("");
  const locale = language === 'pt' ? ptBR : enUS;

  const handleSubmit = () => {
    const primary = parseFloat(newValue);
    if (isNaN(primary)) return;
    
    const secondary = secondaryPlaceholder ? parseFloat(newSecondaryValue) : undefined;
    onAddMeasurement(primary, secondary);
    setNewValue("");
    setNewSecondaryValue("");
    setIsAdding(false);
  };

  const getStatus = () => {
    if (!value || !normalRange) return "normal";
    if (value < normalRange.min) return "low";
    if (value > normalRange.max) return "high";
    return "normal";
  };

  const status = getStatus();
  const statusConfig = {
    low: { label: language === 'pt' ? 'Baixo' : 'Low', color: 'text-blue-500 bg-blue-500/10' },
    normal: { label: language === 'pt' ? 'Normal' : 'Normal', color: 'text-green-500 bg-green-500/10' },
    high: { label: language === 'pt' ? 'Alto' : 'High', color: 'text-warning bg-warning/10' }
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
        "border border-border/30 shadow-[var(--shadow-glass)]",
        "hover:shadow-[var(--shadow-glass-hover)] hover:border-border/50"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl transition-transform hover:scale-110",
                color
              )}>
                {icon}
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onViewHistory && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onViewHistory}>
                  <History className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsAdding(!isAdding)}
              >
                <Plus className={cn("h-4 w-4 transition-transform", isAdding && "rotate-45")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Current Value Display */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : value != null ? (
                <>
                  <span className="text-3xl font-bold tracking-tight">
                    {secondaryValue != null ? `${value}/${secondaryValue}` : value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {secondaryUnit || unit}
                  </span>
                </>
              ) : (
                <span className="text-lg text-muted-foreground">
                  {language === 'pt' ? 'Sem dados' : 'No data'}
                </span>
              )}
            </div>

            {value != null && normalRange && (
              <Badge className={cn("text-xs", statusConfig[status].color)}>
                {statusConfig[status].label}
              </Badge>
            )}
          </div>

          {/* Trend Indicator */}
          {trend && trendValue && (
            <div className="flex items-center gap-2 text-xs">
              <TrendIcon className={cn(
                "h-3.5 w-3.5",
                trend === "up" && "text-green-500",
                trend === "down" && "text-destructive",
                trend === "stable" && "text-muted-foreground"
              )} />
              <span className="text-muted-foreground">{trendValue}</span>
            </div>
          )}

          {/* Add Measurement Form */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={placeholder || unit}
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="flex-1"
                    />
                    {secondaryPlaceholder && (
                      <Input
                        type="number"
                        step="0.1"
                        placeholder={secondaryPlaceholder}
                        value={newSecondaryValue}
                        onChange={(e) => setNewSecondaryValue(e.target.value)}
                        className="flex-1"
                      />
                    )}
                  </div>
                  <Button 
                    onClick={handleSubmit} 
                    className="w-full"
                    disabled={!newValue || (secondaryPlaceholder && !newSecondaryValue)}
                  >
                    {language === 'pt' ? 'Registrar' : 'Record'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Action to History */}
          {onViewHistory && value != null && (
            <Button
              variant="ghost"
              className="w-full justify-between text-xs h-8 text-muted-foreground"
              onClick={onViewHistory}
            >
              {language === 'pt' ? 'Ver histórico completo' : 'View full history'}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
