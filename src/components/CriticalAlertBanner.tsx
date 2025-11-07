import { AlertTriangle, XCircle, AlertCircle, X, ShieldAlert, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CriticalAlert } from "@/hooks/useCriticalAlerts";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CriticalAlertBannerProps {
  alerts: CriticalAlert[];
  onDismiss: (alertId: string) => void;
}

const getActionLink = (alert: CriticalAlert): { label: string; path: string } | null => {
  switch (alert.type) {
    case "zero_stock":
      return { label: "Gerenciar Estoque", path: "/estoque" };
    case "missed_essential":
      return { label: "Ver Medicações", path: "/hoje" };
    case "duplicate_dose":
      return { label: "Ver Histórico", path: "/historico" };
    case "drug_interaction":
      return { label: "Ver Perfil", path: "/perfil" };
    default:
      return null;
  }
};

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
    <div className="space-y-1.5 animate-fade-in">
      <div className="flex items-center gap-1.5 px-0.5">
        <div className="p-1 rounded bg-gradient-to-br from-destructive/20 to-destructive/10 animate-pulse">
          <ShieldAlert className="h-3 w-3 text-destructive" />
        </div>
        <h2 className="text-xs font-bold text-destructive">
          {alerts.length} Ação{alerts.length > 1 ? 'ões' : ''} Urgente{alerts.length > 1 ? 's' : ''}
        </h2>
      </div>

      <div className="space-y-1.5">
        {alerts.map((alert, index) => {
          const config = getSeverityConfig(alert.severity);
          const Icon = config.icon;
          const actionLink = getActionLink(alert);

          return (
            <Card
              key={alert.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className={cn(
                "p-2 border backdrop-blur-sm bg-gradient-to-br transition-all duration-300 animate-fade-in",
                config.gradient,
                config.border
              )}
            >
              <div className="flex gap-2 items-start">
                <div className={cn(
                  "p-1 rounded shrink-0",
                  config.iconBg
                )}>
                  <Icon className={cn("h-3 w-3", config.text)} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn("font-semibold text-xs leading-tight", config.text)}>
                      {alert.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDismiss(alert.id)}
                      className="shrink-0 h-5 w-5 hover:bg-background/50 -mr-1 -mt-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-foreground/70 leading-snug">
                    {alert.message}
                  </p>
                  {actionLink && (
                    <Link to={actionLink.path}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2 gap-1 mt-1 border-current/20 hover:bg-background/50"
                      >
                        {actionLink.label}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
