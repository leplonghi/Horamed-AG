import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Warning as AlertTriangle, ShoppingCart } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useStockProjection, StockProjection } from "@/hooks/useStockProjection";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

function StockAlertWidget() {
  const navigate = useNavigate();
  const { data: stockData, isLoading } = useStockProjection();
  const { language } = useLanguage();

  // Filter items that are low on stock (7 days or less)
  const criticalItems = (stockData || []).filter(
    (item: StockProjection) => item.daysRemaining !== null && item.daysRemaining <= 7
  );

  // Don't show if no critical items or loading
  if (isLoading || criticalItems.length === 0) return null;

  const mostUrgent = criticalItems[0];
  const urgencyLevel = mostUrgent.daysRemaining! <= 2 ? 'critical' : mostUrgent.daysRemaining! <= 5 ? 'warning' : 'info';

  const urgencyConfig = {
    critical: {
      bg: 'bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-xl',
      border: 'border-red-500/30 shadow-[var(--shadow-glass)]',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-700 dark:text-red-300',
    },
    warning: {
      bg: 'bg-gradient-to-br from-orange-500/20 to-orange-500/5 backdrop-blur-xl',
      border: 'border-orange-500/30 shadow-[var(--shadow-glass)]',
      icon: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-700 dark:text-orange-300',
    },
    info: {
      bg: 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 backdrop-blur-xl',
      border: 'border-yellow-500/30 shadow-[var(--shadow-glass)]',
      icon: 'text-yellow-600 dark:text-yellow-400',
      text: 'text-yellow-700 dark:text-yellow-300',
    },
  };

  const config = urgencyConfig[urgencyLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`${config.bg} ${config.border} border mb-2 hover:shadow-[var(--shadow-glass-hover)] transition-all overflow-hidden`}>
        <CardContent className="p-2.5">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg bg-background/40 backdrop-blur-sm ${config.icon}`}>
              {urgencyLevel === 'critical' ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-wider ${config.text}`}>
                {urgencyLevel === 'critical'
                  ? (language === 'pt' ? 'Estoque Crítico' : 'Critical Stock')
                  : (language === 'pt' ? 'Atenção ao Estoque' : 'Stock Attention')}
              </p>

              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                {language === 'pt'
                  ? `${mostUrgent.itemName}: ${mostUrgent.daysRemaining} dias`
                  : `${mostUrgent.itemName}: ${mostUrgent.daysRemaining} days`}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/estoque')}
              className="shrink-0 text-[10px] h-7 px-2 font-black uppercase text-blue-600 hover:bg-blue-50"
            >
              {language === 'pt' ? 'Ver' : 'View'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default memo(StockAlertWidget);