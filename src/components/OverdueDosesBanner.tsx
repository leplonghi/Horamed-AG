import { AlertTriangle, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverdueDoses } from "@/hooks/useOverdueDoses";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function OverdueDosesBanner() {
  const { overdueDoses, markAsTaken, hasOverdue } = useOverdueDoses();

  if (!hasOverdue) return null;

  const urgencyLevel = overdueDoses.some(d => d.minutesOverdue > 60) 
    ? "critical" 
    : overdueDoses.some(d => d.minutesOverdue > 30) 
      ? "urgent" 
      : "warning";

  const getMessage = () => {
    const count = overdueDoses.length;
    const mostOverdue = overdueDoses[0];
    
    if (count === 1) {
      if (mostOverdue.minutesOverdue > 60) {
        return `⚠️ ${mostOverdue.profileName} não tomou ${mostOverdue.itemName} há mais de 1 hora!`;
      }
      return `${mostOverdue.profileName} precisa tomar ${mostOverdue.itemName}`;
    }
    return `${count} doses atrasadas precisam de atenção`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] p-3 shadow-lg",
          urgencyLevel === "critical" && "bg-destructive text-destructive-foreground animate-pulse",
          urgencyLevel === "urgent" && "bg-orange-500 text-white",
          urgencyLevel === "warning" && "bg-yellow-500 text-yellow-900"
        )}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm truncate">
                {getMessage()}
              </span>
            </div>
            
            {overdueDoses.length === 1 && (
              <Button
                size="sm"
                variant={urgencyLevel === "critical" ? "secondary" : "outline"}
                className="flex-shrink-0 gap-1"
                onClick={() => markAsTaken(overdueDoses[0].id)}
              >
                <Check className="h-4 w-4" />
                Confirmar
              </Button>
            )}
          </div>

          {overdueDoses.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {overdueDoses.slice(0, 3).map((dose) => (
                <Button
                  key={dose.id}
                  size="sm"
                  variant="secondary"
                  className="text-xs gap-1"
                  onClick={() => markAsTaken(dose.id)}
                >
                  <Clock className="h-3 w-3" />
                  {dose.itemName}
                  <span className="opacity-70">({dose.minutesOverdue}min)</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
