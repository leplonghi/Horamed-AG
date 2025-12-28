import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface QuickRefillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockId: string;
  itemName: string;
  itemId: string;
  currentUnits: number;
  unitLabel?: string;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [10, 20, 30, 60, 90];

export default function QuickRefillModal({
  open,
  onOpenChange,
  stockId,
  itemName,
  itemId,
  currentUnits,
  unitLabel = "unidades",
  onSuccess,
}: QuickRefillModalProps) {
  const { t, language } = useLanguage();
  const [amount, setAmount] = useState<number>(30);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuickSelect = (value: number) => {
    setAmount(value);
    setCustomAmount("");
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  const handleRefill = async () => {
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      const newTotal = currentUnits + amount;

      // Update stock
      const { error } = await supabase
        .from("stock")
        .update({
          units_left: newTotal,
          last_refill_at: new Date().toISOString(),
        })
        .eq("id", stockId);

      if (error) throw error;

      // Add to consumption history
      const { data: stockData } = await supabase
        .from("stock")
        .select("consumption_history")
        .eq("id", stockId)
        .single();

      const history = [
        ...((stockData?.consumption_history as any[]) || []),
        {
          date: new Date().toISOString(),
          amount: amount,
          reason: "refill",
        },
      ];

      await supabase
        .from("stock")
        .update({ consumption_history: history })
        .eq("id", stockId);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        onSuccess?.();
        toast.success(
          language === "pt"
            ? `+${amount} ${unitLabel} adicionados ao estoque`
            : `+${amount} ${unitLabel} added to stock`
        );
      }, 800);
    } catch (error) {
      console.error("Error refilling stock:", error);
      toast.error(
        language === "pt" ? "Erro ao atualizar estoque" : "Error updating stock"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyOnline = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("affiliate-click", {
        body: { medication_id: itemId, medication_name: itemName },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening buy link:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {language === "pt" ? "Repor Estoque" : "Refill Stock"}
          </DialogTitle>
        </DialogHeader>

        {showSuccess ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <p className="text-lg font-medium text-success">
              {language === "pt" ? "Estoque atualizado!" : "Stock updated!"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Item info */}
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="font-medium truncate">{itemName}</p>
              <p className="text-sm text-muted-foreground">
                {language === "pt" ? "Estoque atual:" : "Current stock:"}{" "}
                <span className="font-semibold text-foreground">
                  {currentUnits} {unitLabel}
                </span>
              </p>
            </div>

            {/* Quick amounts */}
            <div>
              <p className="text-sm font-medium mb-3">
                {language === "pt" ? "Quantidade comprada:" : "Amount purchased:"}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {QUICK_AMOUNTS.map((qty) => (
                  <motion.button
                    key={qty}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickSelect(qty)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-semibold transition-all",
                      amount === qty && !customAmount
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {qty}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder={language === "pt" ? "Outro valor..." : "Other amount..."}
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {unitLabel}
                </span>
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
              <span className="text-sm">
                {language === "pt" ? "Novo total:" : "New total:"}
              </span>
              <span className="font-bold text-lg text-primary">
                {currentUnits + amount} {unitLabel}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleBuyOnline}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {language === "pt" ? "Comprar" : "Buy"}
              </Button>
              <Button
                className="flex-1"
                onClick={handleRefill}
                disabled={isSubmitting || amount <= 0}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {language === "pt" ? "Adicionar" : "Add"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
