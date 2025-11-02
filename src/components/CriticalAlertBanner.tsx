import { AlertTriangle, XCircle, AlertCircle, X, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CriticalAlert } from "@/hooks/useCriticalAlerts";
import { cn } from "@/lib/utils";

interface CriticalAlertBannerProps {
  alerts: CriticalAlert[];
  onDismiss: (alertId: string) => void;
}

export default function CriticalAlertBanner({ alerts, onDismiss }: CriticalAlertBannerProps) {
  if (alerts.length === 0) return null;

  const getSeverityConfig = (severity: CriticalAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          icon: XCircle,
          gradient: "from-destructive/20 via-destructive/10 to-destructive/5",
          border: "border-destructive/40",
          text: "text-destructive",
          iconBg: "bg-gradient-to-br from-destructive/30 to-destructive/20",
          glow: "shadow-lg shadow-destructive/20",
        };
      case "urgent":
        return {
          icon: AlertTriangle,
          gradient: "from-orange-500/20 via-orange-500/10 to-orange-500/5",
          border: "border-orange-500/40",
          text: "text-orange-600 dark:text-orange-400",
          iconBg: "bg-gradient-to-br from-orange-500/30 to-orange-500/20",
          glow: "shadow-lg shadow-orange-500/20",
        };
      case "warning":
        return {
          icon: AlertCircle,
          gradient: "from-yellow-500/20 via-yellow-500/10 to-yellow-500/5",
          border: "border-yellow-500/40",
          text: "text-yellow-600 dark:text-yellow-400",
          iconBg: "bg-gradient-to-br from-yellow-500/30 to-yellow-500/20",
          glow: "shadow-lg shadow-yellow-500/20",
        };
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 animate-pulse">
          <ShieldAlert className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-destructive">
            Ações Urgentes
          </h2>
          <p className="text-sm text-muted-foreground">
            {alerts.length} {alerts.length === 1 ? 'alerta requer' : 'alertas requerem'} sua atenção
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const config = getSeverityConfig(alert.severity);
          const Icon = config.icon;

          return (
            <Card
              key={alert.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className={cn(
                "p-5 border-2 backdrop-blur-sm bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] animate-scale-in",
                config.gradient,
                config.border,
                config.glow
              )}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "p-3 rounded-xl shrink-0 transition-transform duration-300 hover:scale-110",
                  config.iconBg
                )}>
                  <Icon className={cn("h-6 w-6", config.text)} />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={cn("font-bold text-base leading-tight", config.text)}>
                      {alert.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDismiss(alert.id)}
                      className="shrink-0 h-8 w-8 hover:bg-background/50 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
