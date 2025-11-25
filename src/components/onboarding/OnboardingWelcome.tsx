import { motion } from "framer-motion";
import { Heart, Bell, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/horamed-logo.png";

interface Props {
  onStart: () => void;
  onSkip: () => void;
}

const benefits = [
  { icon: Bell, text: "Lembretes inteligentes" },
  { icon: FileText, text: "Documentos organizados" },
  { icon: Users, text: "Gerenciar toda família" },
];

export default function OnboardingWelcome({ onStart, onSkip }: Props) {
  return (
    <div className="space-y-12">
      <motion.div
        className="flex justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <img src={logo} alt="HoraMed" className="h-40 w-auto" />
      </motion.div>

      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Bem-vindo ao HoraMed
          </h1>
          <p className="text-xl text-muted-foreground">
            Sua saúde no horário certo
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-4 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                className="flex items-center gap-3 w-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-foreground text-lg font-medium">
                  {benefit.text}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <motion.div
        className="space-y-4 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Button
          size="lg"
          onClick={onStart}
          className="w-full text-lg h-14 shadow-lg hover:shadow-xl transition-all"
        >
          <Heart className="h-5 w-5 mr-2" />
          Vamos começar!
        </Button>

        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Já sou usuário? Pular
        </button>
      </motion.div>
    </div>
  );
}
