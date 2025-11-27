import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
interface SimpleAdherenceSummaryProps {
  taken: number;
  total: number;
  period?: string;
}
export default function SimpleAdherenceSummary({
  taken,
  total,
  period = "Este mês"
}: SimpleAdherenceSummaryProps) {
  const percentage = total > 0 ? Math.round(taken / total * 100) : 0;
  const getColor = () => {
    if (percentage >= 90) return "text-green-600 dark:text-green-400";
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };
  const getMessage = () => {
    if (percentage >= 90) return "Excelente compromisso!";
    if (percentage >= 70) return "Bom progresso!";
    return "Continue tentando!";
  };
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }}>
      <Card className="bg-gradient-to-br from-primary/5 to-background border-2 border-primary/20">
        <CardContent className="p-5 px-0 py-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 mt-px">
              <p className="text-muted-foreground mb-1 text-lg font-bold">{period}</p>
              <p className="text-2xl font-bold text-foreground py-[5px]">
                Você tomou {taken} de {total} doses
              </p>
              <p className={`text-sm font-medium mt-1 ${getColor()}`}>
                {getMessage()}
              </p>
            </div>
            <div className="items-center justify-start flex flex-row">
              <div className={`text-4xl font-bold ${getColor()}`}>
                {percentage}%
              </div>
              <TrendingUp className={`h-5 w-5 mt-1 ${getColor()}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>;
}