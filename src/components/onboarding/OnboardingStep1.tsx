import { motion } from "framer-motion";
import { User, Users, Heart, Baby } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  { value: "myself", label: "Eu mesmo", icon: User, description: "Gerenciar meus medicamentos" },
  { value: "parent", label: "Meu pai/mãe", icon: Heart, description: "Cuidar de um familiar idoso" },
  { value: "child", label: "Meu filho(a)", icon: Baby, description: "Acompanhar tratamento infantil" },
  { value: "family", label: "Toda família", icon: Users, description: "Organizar múltiplos perfis" },
];

export default function OnboardingStep1({ value, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Quem vai usar o app?
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Vamos personalizar sua experiência
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, index) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                  isSelected
                    ? "border-primary border-2 bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onChange(option.value)}
              >
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
