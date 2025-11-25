import { motion } from "framer-motion";
import { Pill, AlertCircle, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  { value: "1-2", label: "1-2 itens", icon: Pill, description: "Uso básico", badge: "" },
  { value: "3-5", label: "3-5 itens", icon: Pill, description: "Uso moderado", badge: "" },
  { value: "6+", label: "6+ itens", icon: AlertCircle, description: "Uso complexo", badge: "Premium recomendado" },
];

export default function OnboardingStep2({ value, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Quantos remédios você toma?
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Isso nos ajuda a configurar melhor o app
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option, index) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          const isPremium = option.value === "6+";

          return (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all hover:scale-105 relative ${
                  isSelected
                    ? "border-primary border-2 bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onChange(option.value)}
              >
                {isPremium && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500">
                      <Crown className="h-3 w-3" />
                      Premium
                    </Badge>
                  </div>
                )}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`p-4 rounded-full ${
                      isSelected ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                    {option.badge && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                        {option.badge}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
