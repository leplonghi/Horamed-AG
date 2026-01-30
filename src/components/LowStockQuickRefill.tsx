import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStockProjection } from "@/hooks/useStockProjection";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import QuickRefillModal from "./QuickRefillModal";

interface LowStockQuickRefillProps {
  profileId?: string;
}

export default function LowStockQuickRefill({ profileId }: LowStockQuickRefillProps) {
  const { t, language } = useLanguage();
  const { data: stockItems, refetch } = useStockProjection(profileId);
  const [refillModal, setRefillModal] = useState<{
    open: boolean;
    stockId: string;
    itemName: string;
    itemId: string;
    currentUnits: number;
    unitLabel: string;
  } | null>(null);

  // Filter low stock items (less than 7 units or ending within 7 days)
  const lowStockItems = stockItems?.filter((item) => {
    if (item.currentQty <= 7) return true;
    if (item.projectedEndAt) {
      const daysLeft = Math.ceil(
        (new Date(item.projectedEndAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 7;
    }
    return false;
  }) || [];

  if (lowStockItems.length === 0) return null;

  const handleRefillClick = (item: typeof lowStockItems[0]) => {
    setRefillModal({
      open: true,
      stockId: item.id,
      itemName: item.itemName,
      itemId: item.itemId,
      currentUnits: item.currentQty,
      unitLabel: item.unitLabel || "unidades",
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 text-xs font-medium">
            <Package className="w-3.5 h-3.5" />
            {language === "pt" ? "Estoque Baixo" : "Low Stock"}
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {lowStockItems.slice(0, 3).map((item, i) => {
              const percent = Math.round((item.currentQty / (item.unitsTotal || 1)) * 100);
              const isCritical = item.currentQty <= 3;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                    isCritical
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-amber-500/5 border-amber-500/20"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isCritical ? "bg-destructive/15" : "bg-amber-500/15"
                    )}
                  >
                    {isCritical ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Package className="w-5 h-5 text-amber-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.itemName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          className={cn(
                            "h-full rounded-full",
                            isCritical ? "bg-destructive" : "bg-amber-500"
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isCritical ? "text-destructive" : "text-amber-600"
                        )}
                      >
                        {item.currentQty}
                      </span>
                    </div>
                  </div>

                  {/* Quick refill button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-9 px-3 rounded-xl",
                      isCritical
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-amber-600 hover:bg-amber-500/10"
                    )}
                    onClick={() => handleRefillClick(item)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {language === "pt" ? "Repor" : "Refill"}
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {lowStockItems.length > 3 && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => window.location.href = "/estoque"}
            >
              {language === "pt"
                ? `Ver mais ${lowStockItems.length - 3} itens`
                : `See ${lowStockItems.length - 3} more items`}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Refill Modal */}
      {refillModal && (
        <QuickRefillModal
          open={refillModal.open}
          onOpenChange={(open) => setRefillModal(open ? refillModal : null)}
          stockId={refillModal.stockId}
          itemName={refillModal.itemName}
          itemId={refillModal.itemId}
          currentUnits={refillModal.currentUnits}
          unitLabel={refillModal.unitLabel}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}
